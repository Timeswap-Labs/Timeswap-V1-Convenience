const { expect } = require("chai")
const { web3 } = require("hardhat")
const { advanceTimeAndBlock, now, getTimestamp } = require("./Helper.js")

const TimeswapFactory = artifacts.require("TimeswapFactory")
const TimeswapPool = artifacts.require("TimeswapPool")
const Insurance = artifacts.require("Insurance")
const Bond = artifacts.require("Bond")
const CollateralizedDebt = artifacts.require("CollateralizedDebt")
const TestToken = artifacts.require("TestToken")

const TimeswapConvenience = artifacts.require("TimeswapConvenience")

const transactionFee = 30
const protocolFee = 30

const base = 10000
const deadlineDuration = 600 * 3
const duration = 86400
const year = 31556926

let accounts
let timeswapFactory
let timeswapPool
let insurance
let bond
let collateralizedDebt

let feeTo
let feeToSetter
let receiver

const decimals1 = 8
const decimals2 = 18

let testToken1
let testToken2

let maturity
let deadline

let parameter

let pool

let timestamp

let timeswapConvenience

const div = (x, y) => {
    const z = x / y
    return Math.floor(z)
}

const divUp = (x, y) => {
    const z = x / y
    return Math.ceil(z)
}

const deploy = async () => {
    accounts = await web3.eth.getAccounts()

    timeswapPool = await TimeswapPool.new()
    insurance = await Insurance.new()
    bond = await Bond.new()
    collateralizedDebt = await CollateralizedDebt.new()

    feeTo = accounts[1]
    feeToSetter = accounts[2]

    timeswapFactory = await TimeswapFactory.new(
        feeTo,
        feeToSetter,
        timeswapPool.address,
        insurance.address,
        bond.address,
        collateralizedDebt.address,
        transactionFee,
        protocolFee
    )

    testToken1 = await TestToken.new(decimals1)
    testToken2 = await TestToken.new(decimals2)

    maturity = await now() + duration
    deadline = await now() + deadlineDuration

    parameter = {
        asset: testToken1.address,
        collateral: testToken2.address,
        maturity: maturity
    }

    await timeswapFactory.createPool(testToken1.address, testToken2.address, maturity)

    timeswapConvenience = await TimeswapConvenience.new(timeswapFactory.address)
}


const deployAndMint = async (assetIn, collateralPaid, collateralLocked) => {
    await deploy()

    receiver = accounts[3]

    await mintToken(assetIn, collateralPaid + collateralLocked)

    await approve(0, assetIn, collateralPaid + collateralLocked)

    const transaction = await timeswapConvenience.methods["mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"](
        parameter,
        receiver,
        assetIn,
        collateralPaid,
        collateralLocked,
        deadline,
        { from: receiver }
    )

    timestamp = await getTimestamp(transaction.receipt.blockHash)

    pool = await TimeswapPool.at(await timeswapFactory.getPool(testToken1.address, testToken2.address, maturity))
}


describe("constructor", () => {
    describe("success case", () => {
        before(async () => {
            await deploy()
        })

        it("Should be a proper address", async () => {
            expect(timeswapConvenience.address).to.be.properAddress
        })

        it("Should have a correct factory", async () => {
            const result = await timeswapConvenience.factory()

            expect(result).to.equal(timeswapFactory.address)
        })
    })
})

const mintToken = async (token1Amount, token2Amount) => {
    if (token1Amount > 0) await testToken1.mint(receiver, token1Amount)
    if (token2Amount > 0) await testToken2.mint(receiver, token2Amount)
}

const approve = async (liquidityAmount, token1Amount, token2Amount) => {
    if (liquidityAmount > 0) await pool.approve(timeswapConvenience.address, liquidityAmount, { from: receiver })
    if (token1Amount > 0) await testToken1.approve(timeswapConvenience.address, token1Amount, { from: receiver })
    if (token2Amount > 0) await testToken2.approve(timeswapConvenience.address, token2Amount, { from: receiver })
}


describe("mint", () => {
    describe("mint initial", () => {
        const assetIn = 100
        const bondIncrease = 20
        const insuranceIncrease = 1100
        const collateralIn = 240

        const bondReceived = 220
        const insuranceReceived = 100

        const liquidityBurn = 1000
        const liquidityReceived = 99
        const liquidityFeeTo = 1

        const bondTotalSupply = 240
        const insuranceTotalSupply = 1200
        const liquidityTotalSupply = 1100

        describe("success case", () => {
            before(async () => {
                await deployAndMint(assetIn, bondIncrease, bondReceived)
            })

            it("Shoulde be a proper address", () => {
                expect(pool.address).to.be.properAddress
            })

            it("Should have a correct maturity", async () => {
                const resultHex = await pool.maturity()
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(maturity)
            })

            it("Should have a correct factory", async () => {
                const result = await pool.factory()

                expect(result).to.equal(timeswapFactory.address)
            })

            it("Should have a correct asset", async () => {
                const result = await pool.asset()

                expect(result).to.equal(testToken1.address)
            })

            it("Should have a correct collateral", async () => {
                const result = await pool.collateral()

                expect(result).to.equal(testToken2.address)
            })

            it("Should have a correct transaction fee", async () => {
                const resultHex = await pool.transactionFee()
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(transactionFee)
            })

            it("Should have a correct protocol fee", async () => {
                const resultHex = await pool.protocolFee()
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(protocolFee)
            })

            it("Should have a correct decimals", async () => {
                const decimalsHex = await testToken1.decimals()
                const decimals = web3.utils.hexToNumber(decimalsHex)

                const resultHex = await pool.decimals()
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(decimals)
            })

            it("Should have receiver have correct amount of liquidity tokens", async () => {
                const resultHex = await pool.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(liquidityReceived)
            })

            it("Should have receiver have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())

                const resultHex = await bondERC20.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(bondReceived)
            })

            it("Should have receiver have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultHex = await insuranceERC20.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(insuranceReceived)
            })

            it("Should have receiver have a correct collateralized debt token", async () => {
                const debtRequired = divUp((liquidityReceived * (base + protocolFee)), base) + 1000
                
                const collateralizedDebtERC721 = await CollateralizedDebt.at(await pool.collateralizedDebt())

                const tokenId = await collateralizedDebtERC721.totalSupply()
                const result = await collateralizedDebtERC721.ownerOf(tokenId)
                const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(tokenId)
                const resultDebt = web3.utils.hexToNumber(resultHex.debt)
                const resultCollateral = web3.utils.hexToNumber(resultHex.collateral)

                expect(result).to.equal(receiver)
                expect(resultDebt).to.equal(insuranceIncrease)
                expect(resultCollateral).to.equal(bondReceived)
            })

            it("Should have pool have a correct assets reserve and balance", async () => {
                const resultHex = await testToken1.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.assetReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)

                expect(result).to.equal(assetIn)
                expect(resultReserve).to.equal(assetIn)
            })

            it("Should have pool have correct collateral reserve and balance", async () => {
                const resultHex = await testToken2.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.collateralReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)

                expect(result).to.equal(collateralIn)
                expect(resultReserve).to.equal(collateralIn)
            })

            it("Should have pool have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())

                const resultHex = await bondERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(bondIncrease)
            })
            
            it("Should have pool have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultHex = await insuranceERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(insuranceIncrease)
            })

            it("Should burn 1000 liquidity tokens", async () => {
                const zero = "0x0000000000000000000000000000000000000000"

                const resultHex = await pool.balanceOf(zero)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(liquidityBurn)
            })

            it("Should have feeTo receive correct amount of liquidity tokens", async () => {
                const resultHex = await pool.balanceOf(feeTo)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(liquidityFeeTo)
            })

            it("Should have a correct invariance", async () => {
                const resultHex = await pool.invariance()
                const result = web3.utils.hexToNumber(resultHex)

                const invariance = assetIn * bondIncrease * div(insuranceIncrease * year, maturity - timestamp)

                expect(result).to.equal(invariance)
            })

            it("Should have the correct bond total supply", async () => {
                const bondERC20 = await Bond.at(await pool.bond())

                const resultHex = await bondERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(bondTotalSupply)
            })

            it("Should have the correct insurance total supply", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultHex = await insuranceERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(insuranceTotalSupply)
            })

            it("Should have the correct liquidity total supply", async () => {
                const resultHex = await pool.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(liquidityTotalSupply)
            })
        })
        
        describe("fail case", async () => {
            beforeEach(async () => {
                await deploy()
            })

            it("Should revert if the pool already exist", async () => {
                await mintToken(assetIn, collateralIn)

                await approve(0, assetIn, collateralIn)

                timeswapConvenience.methods["mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    bondIncrease,
                    bondReceived,
                    deadline,
                    { from: receiver }
                )

                await mintToken(assetIn, collateralIn)

                await approve(0, assetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    bondIncrease,
                    bondReceived,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })


            it("Should revert if no asset input amount", async () => {
                const wrongAssetIn = 0

                await mintToken(wrongAssetIn, collateralIn)

                await approve(0, wrongAssetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"](
                    parameter,
                    receiver,
                    wrongAssetIn,
                    bondIncrease,
                    bondReceived,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if no collateral input amount", async () => {
                const wrongCollateralPaid = 0

                await mintToken(assetIn, bondReceived)

                await approve(0, assetIn, bondReceived)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    wrongCollateralPaid,
                    bondReceived,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if there is no output amount", async () => {
                const wrongCollateralLocked = 0

                await mintToken(assetIn, bondIncrease)

                await approve(0, assetIn, bondIncrease)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    bondIncrease,
                    wrongCollateralLocked,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if pool matured", async () => {
                await advanceTimeAndBlock(duration)

                await mintToken(assetIn, collateralIn)

                await approve(0, assetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    bondIncrease,
                    bondReceived,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if pool already exist or have liquidity", async () => {
                await mintToken(assetIn, collateralIn)

                await approve(0, assetIn, collateralIn)

                await timeswapConvenience.methods["mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    bondIncrease,
                    bondReceived,
                    deadline,
                    { from: receiver }
                )

                await mintToken(assetIn, collateralIn)

                await approve(0, assetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    bondIncrease,
                    bondReceived,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if not enough asset", async () => {
                const wrongAssetIn = assetIn - 1

                await mintToken(wrongAssetIn, collateralIn)

                await approve(0, wrongAssetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    bondIncrease,
                    bondReceived,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if not enough collateral", async () => {
                const wrongCollateralIn = collateralIn - 1

                await mintToken(assetIn, wrongCollateralIn)

                await approve(0, assetIn, wrongCollateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    bondIncrease,
                    bondReceived,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if wrong deadline", async () => {
                const wrongDeadline = deadline - deadlineDuration

                await mintToken(assetIn, collateralIn)

                await approve(0, assetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    bondIncrease,
                    bondReceived,
                    wrongDeadline,
                    { from: receiver }
                )).to.be.reverted
            })
        })
    })


    describe("mint proportional", () => {
        const assetReserve = 100
        const bondReserve = 20
        const insuranceReserve = 1100
        const collateralReserve = 240
        const feeToBalance = 1

        let rateReserve
        
        const assetIn = 10
        const bondIncrease = 2
        const insuranceIncrease = 110
        const bondReceived = 22
        const insuranceReceived = 10
        const collateralIn = 24

        const liquidityReceived = 109
        const liquidityFeeTo = 1

        const bondTotalSupplyBefore = 240
        const insuranceTotalSupplyBefore = 1200
        const liquidityTotalSupplyBefore = 1100

        const safeMint = {
            maxDebt: divUp(110 * 11, 10),
            maxCollateralPaid: divUp(2 * 11, 10),
            maxCollateralLocked: divUp(22 * 11, 10)
        }

        describe("success case", () => {
            before(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)

                receiver = accounts[4]

                rateReserve = divUp(divUp(web3.utils.hexToNumber(await pool.invariance()), assetReserve), bondReserve)

                await mintToken(assetIn, collateralIn)

                await approve(0, assetIn, collateralIn)

                await timeswapConvenience.methods["mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    safeMint,
                    deadline,
                    { from: receiver }
                )
            })

            it("Should have receiver have correct amount of liquidity tokens", async () => {
                const resultHex = await pool.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(liquidityReceived)
            })

            it("Should have receiver have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())

                const resultHex = await bondERC20.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(bondReceived)
            })
            
            it("Should have receiver have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultHex = await insuranceERC20.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(assetIn)
            })

            it("Should have receiver have a correct collateralized debt token", async () => {
                const collateralizedDebtERC721 = await CollateralizedDebt.at(await pool.collateralizedDebt())

                const tokenId = await collateralizedDebtERC721.totalSupply()
                const result = await collateralizedDebtERC721.ownerOf(tokenId)
                const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(tokenId)
                const resultDebt = web3.utils.hexToNumber(resultHex.debt)
                const resultCollateral = web3.utils.hexToNumber(resultHex.collateral)

                expect(result).to.equal(receiver)
                expect(resultDebt).to.equal(insuranceIncrease)
                expect(resultCollateral).to.equal(bondReceived)
            })

            it("Should have pool have a correct assets", async () => {
                const resultHex = await testToken1.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.assetReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)

                const assetBalance = assetReserve + assetIn

                expect(result).to.equal(assetBalance)
                expect(resultReserve).to.equal(assetBalance)
            })

            it("Should have pool have correct collateral", async () => {
                const resultHex = await testToken2.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.collateralReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)

                const collateralBalance = collateralReserve + collateralIn

                expect(result).to.equal(collateralBalance)
                expect(resultReserve).to.equal(collateralBalance)
            })

            it("Should have pool have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())

                const resultHex = await bondERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)

                const bondBalance = bondReserve + bondIncrease

                expect(result).to.equal(bondBalance)
            })

            it("Should have pool have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultHex = await insuranceERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)

                const insuranceBalance = insuranceReserve + insuranceIncrease

                expect(result).to.equal(insuranceBalance)
            })

            it("Should have factory receive correct amount of liquidity tokens", async () => {
                const resultHex = await pool.balanceOf(feeTo)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(feeToBalance + liquidityFeeTo)
            })

            it("Should have a correct invariance", async () => {
                const resultHex = await pool.invariance()
                const result = web3.utils.hexToNumber(resultHex)

                const rateIncrease = divUp(rateReserve * (liquidityReceived + liquidityFeeTo), 1100)

                const invariance = (assetReserve + assetIn)
                    * (bondReserve + bondIncrease)
                    * (rateReserve + rateIncrease)

                expect(result).to.equal(invariance)
            })

            it("Should have the correct ratio on its asset reserves", async () => {
                const totalSupply = await pool.totalSupply()
                const ratioLiquidity = totalSupply / (liquidityReceived + liquidityFeeTo)
                
                const resultAssetHex = await testToken1.balanceOf(pool.address)
                const resultAsset = web3.utils.hexToNumber(resultAssetHex)
                const ratioAsset = resultAsset / assetIn

                expect(ratioLiquidity).to.gte(ratioAsset)
            })

            it("Should have the correct ratio on its bond reserves", async () => {
                const totalSupply = await pool.totalSupply()
                const ratioLiquidity = totalSupply / (liquidityReceived + liquidityFeeTo)
                
                const bondERC20 = await Bond.at(await pool.bond())

                const resultBondHex = await bondERC20.balanceOf(pool.address)
                const resultBond = web3.utils.hexToNumber(resultBondHex)
                const ratioBond = resultBond / bondIncrease

                expect(ratioLiquidity).to.gte(ratioBond)
            })

            it("Should have the correct ratio on its insurance reserves", async () => {
                const totalSupply = await pool.totalSupply()
                const ratioLiquidity = totalSupply / (liquidityReceived + liquidityFeeTo)
                
                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultInsuranceHex = await insuranceERC20.balanceOf(pool.address)
                const resultInsurance = web3.utils.hexToNumber(resultInsuranceHex)
                const ratioInsurance = resultInsurance / insuranceIncrease

                expect(ratioLiquidity).to.gte(ratioInsurance)
            })

            it("Should have the correct bond total supply", async () => {
                const bondERC20 = await Bond.at(await pool.bond())

                const resultHex = await bondERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)

                const bondTotalSupply = bondTotalSupplyBefore + bondIncrease + bondReceived

                expect(result).to.equal(bondTotalSupply)
            })

            it("Should have the correct insurance total supply", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultHex = await insuranceERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)

                const insuranceTotalSupply = insuranceTotalSupplyBefore + insuranceIncrease + insuranceReceived

                expect(result).to.equal(insuranceTotalSupply)
            })

            it("Should have the correct liquidity total supply", async () => {
                const resultHex = await pool.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)

                const liquidityTotalSupply = liquidityTotalSupplyBefore + liquidityReceived + liquidityFeeTo

                expect(result).to.equal(liquidityTotalSupply)
            })
        })

        describe("fail case", async () => {
            beforeEach(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)

                receiver = accounts[4]
            })

            it("Should revert if the pool does not exist", async () => {
                const wrongToken = await TestToken.new(0)

                const wrongParameter = {
                    asset: wrongToken.address,
                    collateral: testToken2.address,
                    maturity: maturity
                }

                await mintToken(assetIn, collateralIn)

                await approve(0, assetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"](
                    wrongParameter,
                    receiver,
                    assetIn,
                    safeMint,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if no asset input amount", async () => {
                const wrongAssetIn = 0

                await mintToken(wrongAssetIn, collateralIn)

                await approve(0, wrongAssetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    wrongAssetIn,
                    safeMint,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if no collateral input amount", async () => {
                const wrongCollateralIn = 0

                await mintToken(assetIn, wrongCollateralIn)

                await approve(0, assetIn, wrongCollateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    safeMint,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if pool matured", async () => {
                await advanceTimeAndBlock(duration)

                await mintToken(assetIn, collateralIn)

                await approve(0, assetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    safeMint,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if not enoght asset", async () => {
                const wrongAssetIn = assetIn - 1

                await mintToken(wrongAssetIn, collateralIn)

                await approve(0, wrongAssetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    safeMint,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if not enough collateral", async () => {
                const wrongCollateralIn = collateralIn - 1

                await mintToken(assetIn, wrongCollateralIn)

                await approve(0, assetIn, wrongCollateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    safeMint,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if reached maxDebt", async () => {
                const wrongSafeMint = {
                    maxDebt: 110 - 1,
                    maxCollateralPaid: divUp(2 * 11, 10),
                    maxCollateralLocked: divUp(22 * 11, 10)
                }

                await mintToken(assetIn, collateralIn)

                await approve(0, assetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    wrongSafeMint,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if reached maxCollateralPaid", async () => {
                const wrongSafeMint = {
                    maxDebt: divUp(110 * 11, 10),
                    maxCollateralPaid: 2 - 1,
                    maxCollateralLocked: divUp(22 * 11, 10)
                }

                await mintToken(assetIn, collateralIn)

                await approve(0, assetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    wrongSafeMint,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if reached maxCollateralLocked", async () => {
                const wrongSafeMint = {
                    maxDebt: divUp(110 * 11, 10),
                    maxCollateralPaid: divUp(2 * 11, 10),
                    maxCollateralLocked: 22 - 1
                }

                await mintToken(assetIn, collateralIn)

                await approve(0, assetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    wrongSafeMint,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if wrong deadline", async () => {
                const wrongDeadline = deadline - deadlineDuration

                await mintToken(assetIn, collateralIn)

                await approve(0, assetIn, collateralIn)

                await expect(timeswapConvenience.methods["mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    assetIn,
                    safeMint,
                    wrongDeadline,
                    { from: receiver }
                )).to.be.reverted
            })
        })
    })
})



describe("burn", () => {
    const assetReserve = 100
    const bondReserve = 20
    const insuranceReserve = 1100
    const collateralReserve = 240
    
    let rateReserve

    const liquidityIn = 90
    const bondReceived = 1
    const insuranceReceived = 90

    const bondTotalSupplyBefore = 240
    const insuranceTotalSupplyBefore = 1200
    const liquidityTotalSupplyBefore = 1100

    const collateralIn = 1
    const assetMax = 8
    const assetReceived = 8

    const safeBurn = {
        minAsset : div(8, 9, 10),
        minBond : div(1 * 9, 10),
        minInsurance : div(90 * 9, 10)
    }

    describe("burn before maturity", () => {
        describe("success case", () => {
            before(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)

                await mintToken(0, collateralIn)

                await approve(liquidityIn, 0, collateralIn)

                const owner = accounts[3]
                receiver = accounts[4]

                rateReserve = div(div(web3.utils.hexToNumber(await pool.invariance()), assetReserve), bondReserve)

                await timeswapConvenience.methods["burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    liquidityIn,
                    collateralIn,
                    safeBurn,
                    deadline,
                    { from: owner }
                )
            })

            it("Should have receiver have correct amount of asset", async () => {
                const resultHex = await testToken1.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(assetReceived)
            })

            it("Should have receiver have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())

                const resultHex = await bondERC20.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(bondReceived)
            })

            it("Should have receiver have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultHex = await insuranceERC20.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(insuranceReceived)
            })

            it("Should have receiver have a correct collateralized debt token", async () => {
                const collateralizedDebtERC721 = await CollateralizedDebt.at(await pool.collateralizedDebt())

                const tokenId = await collateralizedDebtERC721.totalSupply()
                const result = await collateralizedDebtERC721.ownerOf(tokenId)
                const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(tokenId)
                const resultDebt = web3.utils.hexToNumber(resultHex.debt)
                const resultCollateral = web3.utils.hexToNumber(resultHex.collateral)

                expect(result).to.equal(receiver)
                expect(resultDebt).to.equal(assetReceived)
                expect(resultCollateral).to.equal(collateralIn)
            })

            it("Should have pool have a correct assets", async () => {
                const resultHex = await testToken1.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.assetReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)

                const assetBalance = assetReserve - assetReceived

                expect(result).to.equal(assetBalance)
                expect(resultReserve).to.equal(assetBalance)
            })

            it("Should have pool have correct collateral", async () => {
                const resultHex = await testToken2.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.collateralReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)

                const collateralBalance = collateralReserve + collateralIn

                expect(result).to.equal(collateralBalance)
                expect(resultReserve).to.equal(collateralBalance)
            })

            it("Should have pool have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())

                const resultHex = await bondERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)

                const bondBalance = bondReserve - bondReceived

                expect(result).to.equal(bondBalance)
            })

            it("Should have pool have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultHex = await insuranceERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)

                const insuranceBalance = insuranceReserve - insuranceReceived

                expect(result).to.equal(insuranceBalance)
            })

            it("Should have a correct invariance", async () => {
                const resultHex = await pool.invariance()
                const result = web3.utils.hexToNumber(resultHex)

                const rateDecrease = div(rateReserve * liquidityIn, liquidityTotalSupplyBefore)

                    const invariance = (assetReserve - assetMax)
                        * (bondReserve - bondReceived)
                        * (rateReserve - rateDecrease)

                expect(result).to.equal(invariance)
            })

            it("Should have the correct ratio on its bond reserves", async () => {
                const resultLiquidityHex = await pool.balanceOf(receiver)
                const resultLiquidity = web3.utils.hexToNumber(resultLiquidityHex)
                const ratioLiquidity = resultLiquidity / liquidityIn

                const bondERC20 = await Bond.at(await pool.bond())

                const resultBondHex = await bondERC20.balanceOf(pool.address)
                const resultBond = web3.utils.hexToNumber(resultBondHex)
                const ratioBond = resultBond / bondReceived

                expect(ratioLiquidity).to.lte(ratioBond)
            })

            it("Should have the correct ratio on its insurance reserves", async () => {
                const resultLiquidityHex = await pool.balanceOf(receiver)
                const resultLiquidity = web3.utils.hexToNumber(resultLiquidityHex)
                const ratioLiquidity = resultLiquidity / liquidityIn

                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultInsuranceHex = await insuranceERC20.balanceOf(pool.address)
                const resultInsurance = web3.utils.hexToNumber(resultInsuranceHex)
                const ratioInsurance = resultInsurance / insuranceReceived

                expect(ratioLiquidity).to.lte(ratioInsurance)
            })

            it("Should have the correct bond total supply", async () => {
                const bondERC20 = await Bond.at(await pool.bond())

                const resultHex = await bondERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(bondTotalSupplyBefore)
            })

            it("Should have the correct insurance total supply", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultHex = await insuranceERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(insuranceTotalSupplyBefore)
            })

            it("Should have the correct liquidity total supply", async () => {
                const resultHex = await pool.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)

                const liquidityTotalSupply = liquidityTotalSupplyBefore - liquidityIn

                expect(result).to.equal(liquidityTotalSupply)
            })
        })

        describe("fail case", () => {
            beforeEach(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)

                rateReserve = div(div(web3.utils.hexToNumber(await pool.invariance()), assetReserve), bondReserve)
            })

            it("Should revert if the pool does not exist", async () => {
                const wrongToken = await TestToken.new(0)

                const wrongParameter = {
                    asset: wrongToken.address,
                    collateral: testToken2.address,
                    maturity: maturity
                }

                await mintToken(0, collateralIn)

                await approve(liquidityIn, 0, collateralIn)

                const owner = accounts[3]
                receiver = accounts[4]

                await expect(timeswapConvenience.methods["burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"](
                    wrongParameter,
                    receiver,
                    liquidityIn,
                    collateralIn,
                    safeBurn,
                    deadline,
                    { from: owner }
                )).to.be.reverted
            })

            it("Should revert if no liquidity input amount", async () => {
                const wrongLiquidityIn = 0

                await mintToken(0, collateralIn)

                await approve(wrongLiquidityIn, 0, collateralIn)

                const owner = accounts[3]
                receiver = accounts[4]

                await expect(timeswapConvenience.methods["burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    wrongLiquidityIn,
                    collateralIn,
                    safeBurn,
                    deadline,
                    { from: owner }
                )).to.be.reverted
            })

            it("Should revert if pool matured", async () => {
                await advanceTimeAndBlock(duration)

                await mintToken(0, collateralIn)

                await approve(liquidityIn, 0, collateralIn)

                const owner = accounts[3]
                receiver = accounts[4]

                await expect(timeswapConvenience.methods["burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    liquidityIn,
                    collateralIn,
                    safeBurn,
                    deadline,
                    { from: owner }
                )).to.be.reverted
            })

            it("Should revert if not enought liquidity tokens", async () => {
                const wrongLiquidityIn = 2001

                await mintToken(0, collateralIn)

                await approve(wrongLiquidityIn, 0, collateralIn)

                const owner = accounts[3]
                receiver = accounts[4]

                await expect(timeswapConvenience.methods["burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    wrongLiquidityIn,
                    collateralIn,
                    safeBurn,
                    deadline,
                    { from: owner }
                )).to.be.reverted
            })

            it("Should revert if dipped minAsset", async () => {
                const wrongSafeBurn = {
                    minAsset : 8 + 1,
                    minBond : div(1 * 9, 10),
                    minInsurance : div(90 * 9, 10)
                }

                await mintToken(0, collateralIn)

                await approve(liquidityIn, 0, collateralIn)

                const owner = accounts[3]
                receiver = accounts[4]

                await expect(timeswapConvenience.methods["burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    liquidityIn,
                    collateralIn,
                    wrongSafeBurn,
                    deadline,
                    { from: owner }
                )).to.be.reverted
            })

            it("Should revert if dipped minInsurance", async () => {
                const wrongSafeBurn = {
                    minAsset : div(8 * 9, 10),
                    minBond : 9 + 1,
                    minInsurance : div(90 * 9, 10)
                }

                await mintToken(0, collateralIn)

                await approve(liquidityIn, 0, collateralIn)

                const owner = accounts[3]
                receiver = accounts[4]

                await expect(timeswapConvenience.methods["burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    liquidityIn,
                    collateralIn,
                    wrongSafeBurn,
                    deadline,
                    { from: owner }
                )).to.be.reverted
            })

            it("Should revert if dipped minBond", async () => {
                const wrongSafeBurn = {
                    minAsset : div(8 * 9, 10),
                    minBond : div(1 * 9, 10),
                    minInsurance : 90 + 1
                }

                await mintToken(0, collateralIn)

                await approve(liquidityIn, 0, collateralIn)

                const owner = accounts[3]
                receiver = accounts[4]

                await expect(timeswapConvenience.methods["burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    liquidityIn,
                    collateralIn,
                    wrongSafeBurn,
                    deadline,
                    { from: owner }
                )).to.be.reverted
            })

            it("Should revert if wrong deadline", async () => {
                const wrongDeadline = deadline - deadlineDuration

                await mintToken(0, collateralIn)

                await approve(liquidityIn, 0, collateralIn)

                const owner = accounts[3]
                receiver = accounts[4]

                await expect(timeswapConvenience.methods["burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    liquidityIn,
                    collateralIn,
                    safeBurn,
                    wrongDeadline,
                    { from: owner }
                )).to.be.reverted
            })
        })
    })

    describe("burn after maturity", () => {
        describe("success case", () => {
            before(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)

                await advanceTimeAndBlock(duration)

                await approve(liquidityIn, 0, 0)

                const owner = accounts[3]
                receiver = accounts[4]

                await timeswapConvenience.methods["burn((address,address,uint256),address,uint256)"](
                    parameter,
                    receiver,
                    liquidityIn,
                    { from: owner }
                )
            })

            it("Should have receiver have correct amount of asset", async () => {
                const resultHex = await testToken1.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(0)
            })

            it("Should have receiver have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())

                const resultHex = await bondERC20.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(bondReceived)
            })

            it("Should have receiver have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultHex = await insuranceERC20.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(insuranceReceived)
            })

            it("Should have pool have a correct assets", async () => {
                const resultHex = await testToken1.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.assetReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)

                expect(result).to.equal(assetReserve)
                expect(resultReserve).to.equal(assetReserve)
            })

            it("Should have pool have correct collateral", async () => {
                const resultHex = await testToken2.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.collateralReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)

                expect(result).to.equal(collateralReserve)
                expect(resultReserve).to.equal(collateralReserve)
            })

            it("Should have pool have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())

                const resultHex = await bondERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)

                const bondBalance = bondReserve - bondReceived

                expect(result).to.equal(bondBalance)
            })

            it("Should have pool have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultHex = await insuranceERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)

                const insuranceBalance = insuranceReserve - insuranceReceived

                expect(result).to.equal(insuranceBalance)
            })

            it("Should have the correct ratio on its bond reserves", async () => {
                const resultLiquidityHex = await pool.balanceOf(receiver)
                const resultLiquidity = web3.utils.hexToNumber(resultLiquidityHex)
                const ratioLiquidity = resultLiquidity / liquidityIn

                const bondERC20 = await Bond.at(await pool.bond())

                const resultBondHex = await bondERC20.balanceOf(pool.address)
                const resultBond = web3.utils.hexToNumber(resultBondHex)
                const ratioBond = resultBond / bondReceived

                expect(ratioLiquidity).to.lte(ratioBond)
            })

            it("Should have the correct ratio on its insurance reserves", async () => {
                const resultLiquidityHex = await pool.balanceOf(receiver)
                const resultLiquidity = web3.utils.hexToNumber(resultLiquidityHex)
                const ratioLiquidity = resultLiquidity / liquidityIn

                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultInsuranceHex = await insuranceERC20.balanceOf(pool.address)
                const resultInsurance = web3.utils.hexToNumber(resultInsuranceHex)
                const ratioInsurance = resultInsurance / insuranceReceived

                expect(ratioLiquidity).to.lte(ratioInsurance)
            })

            it("Should have the correct bond total supply", async () => {
                const bondERC20 = await Bond.at(await pool.bond())

                const resultHex = await bondERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(bondTotalSupplyBefore)
            })

            it("Should have the correct insurance total supply", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())

                const resultHex = await insuranceERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(insuranceTotalSupplyBefore)
            })

            it("Should have the correct liquidity total supply", async () => {
                const resultHex = await pool.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)

                const liquidityTotalSupply = liquidityTotalSupplyBefore - liquidityIn

                expect(result).to.equal(liquidityTotalSupply)
            })
        })

        describe("fail case", () => {
            beforeEach(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)
            })

            it("Should revert if the pool does not exist", async () => {
                const wrongToken = await TestToken.new(0)

                const wrongParameter = {
                    asset: wrongToken.address,
                    collateral: testToken2.address,
                    maturity: maturity
                }

                await advanceTimeAndBlock(duration)

                await approve(liquidityIn, 0, 0)

                const owner = accounts[3]
                receiver = accounts[4]

                await expect(timeswapConvenience.methods["burn((address,address,uint256),address,uint256)"](
                    wrongParameter,
                    receiver,
                    liquidityIn,
                    { from: owner }
                )).to.be.reverted
            })

            it("Should reverit if no liquidity input amount", async () => {
                const wrongLiquidityIn = 0

                await advanceTimeAndBlock(duration)

                const owner = accounts[3]
                receiver = accounts[4]

                await expect(timeswapConvenience.methods["burn((address,address,uint256),address,uint256)"](
                    parameter,
                    receiver,
                    wrongLiquidityIn,
                    { from: owner }
                )).to.be.reverted
            })

            it("Should revert if pool not matured", async () => {
                await approve(liquidityIn, 0, 0)

                const owner = accounts[3]
                receiver = accounts[4]

                await expect(timeswapConvenience.methods["burn((address,address,uint256),address,uint256)"](
                    parameter,
                    receiver,
                    liquidityIn,
                    { from: owner }
                )).to.be.reverted
            })

            it("Should revert if not enough liquidity tokens", async () => {
                const wrongLiquidityIn = 2001

                await advanceTimeAndBlock(duration)

                await approve(liquidityIn, 0, 0)

                const owner = accounts[3]
                receiver = accounts[4]

                await expect(timeswapConvenience.methods["burn((address,address,uint256),address,uint256)"](
                    parameter,
                    receiver,
                    wrongLiquidityIn,
                    { from: owner }
                )).to.be.reverted
            })
        })
    })
})

describe("lend", () => {
    const assetReserve = 100
    const bondReserve = 20
    const insuranceReserve = 1100
    const collateralReserve = 240
    
    let rateReserve

    const assetIn = 20
    
    let bondDecrease
    let rateDecrease

    let bondMint

    let insurananceDecrease
    let insuranceMint
    
    let invariance

    const bondTotalSupplyBefore = 240
    const insuranceTotalSupplyBefore = 1200

    describe("lend given bond received", () => {
        const bondReceived = 20
        let insuranceReceived
        
        const calculateBondDecrease = () => {
            bondDecrease = divUp(bondReceived * assetReserve, div(rateReserve * (maturity - timestamp), year) + assetReserve)
        }
    
        const calculate = () => {
            const bondBalanceAdjusted = bondReserve * base - (bondDecrease * (base + transactionFee))
            const rateBalanceAdjusted = divUp(divUp(invariance * base * base, assetReserve + assetIn), bondBalanceAdjusted)
            rateDecrease = div(rateReserve * base - rateBalanceAdjusted, base + transactionFee)
    
            bondMint = div(div(bondDecrease * rateReserve, assetReserve) * (maturity - timestamp), year)
            
            insuranceDecrease = div(rateDecrease * (maturity - timestamp), year)
            insuranceMint = div(rateDecrease * (assetReserve + assetIn), rateReserve)
            insuranceReceived = insuranceDecrease + insuranceMint
        }
    
        const safeLend = () => {
            return {
                minBond: div(bondReceived * 9, 10),
                minInsurance: div(insuranceReceived * 9, 10)
            }
        }
        
        describe("success case", () => {
            before(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)

                receiver = accounts[4]

                invariance = web3.utils.hexToNumber(await pool.invariance())

                rateReserve = divUp(divUp(invariance, assetReserve), bondReserve)

                calculateBondDecrease()

                calculate()

                await mintToken(assetIn, 0)

                await approve(0, assetIn, 0)

                await timeswapConvenience.lend(
                    parameter,
                    receiver,
                    assetIn,
                    true,
                    bondReceived,
                    safeLend(),
                    deadline,
                    { from: receiver }
                )
            })

            it("Should have receiver have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())
    
                const resultHex = await bondERC20.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)
    
                const bondReceived = bondDecrease + bondMint
    
                expect(result).to.equal(bondReceived)
            })

            it("Should have receiver have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())
    
                const resultHex = await insuranceERC20.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)
    
                const insuranceReceived = insuranceDecrease + insuranceMint
    
                expect(result).to.equal(insuranceReceived)
            })

            it("Should have pool have a correct assets reserve and balance", async () => {
                const resultHex = await testToken1.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.assetReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)
    
                const assetBalance = assetReserve + assetIn
    
                expect(result).to.equal(assetBalance)
                expect(resultReserve).to.equal(assetBalance)
            })
    
            it("Should have pool have correct collateral reserve and balance", async () => {
                const resultHex = await testToken2.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.collateralReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)
    
                expect(result).to.equal(collateralReserve)
                expect(resultReserve).to.equal(collateralReserve)
            })

            it("Should have pool have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())
    
                const resultHex = await bondERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
    
                const bondBalance = bondReserve - bondDecrease
    
                expect(result).to.equal(bondBalance)
            })
    
            it("Should have pool have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())
    
                const resultHex = await insuranceERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
    
                const insuranceBalance = insuranceReserve - insuranceDecrease
    
                expect(result).to.equal(insuranceBalance)
            })

            it("Should have the correct bond total supply", async () => {
                const bondERC20 = await Bond.at(await pool.bond())
    
                const resultHex = await bondERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)
    
                const bondTotalSupply = bondTotalSupplyBefore + bondMint
    
                expect(result).to.equal(bondTotalSupply)
            })
    
            it("Should have the correct insurance total supply", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())
    
                const resultHex = await insuranceERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)
    
                const insuranceTotalSupply = insuranceTotalSupplyBefore + insuranceMint
    
                expect(result).to.equal(insuranceTotalSupply)
            })
        })

        describe("fail case", () => {
            beforeEach(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)

                receiver = accounts[4]

                invariance = web3.utils.hexToNumber(await pool.invariance())

                rateReserve = divUp(divUp(invariance, assetReserve), bondReserve)

                calculateBondDecrease()

                calculate()
            })

            it("Should revert if no asset input amount", async () => {
                const wrongAssetIn = 0

                await expect(timeswapConvenience.lend(
                    parameter,
                    receiver,
                    wrongAssetIn,
                    true,
                    bondReceived,
                    safeLend(),
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if reached minBond", async () => {
                const wrongSafeLend = {
                    minBond: bondReceived + 4,
                    minInsurance: div(insuranceReceived * 9, 10)
                }
                
                await mintToken(assetIn, 0)

                await approve(0, assetIn, 0)

                await expect(timeswapConvenience.lend(
                    parameter,
                    receiver,
                    assetIn,
                    true,
                    bondReceived,
                    wrongSafeLend,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if reached minBond", async () => {
                const wrongSafeLend = {
                    minBond: div(bondReceived * 9, 10),
                    minInsurance: insuranceReceived + 1
                }
                
                await mintToken(assetIn, 0)

                await approve(0, assetIn, 0)

                await expect(timeswapConvenience.lend(
                    parameter,
                    receiver,
                    assetIn,
                    true,
                    bondReceived,
                    wrongSafeLend,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if pool matured", async () => {
                await advanceTimeAndBlock(duration)
    
                await mintToken(assetIn, 0)

                await approve(0, assetIn, 0)

                await expect(timeswapConvenience.lend(
                    parameter,
                    receiver,
                    assetIn,
                    true,
                    bondReceived,
                    safeLend(),
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })
        })
    })

    describe("lend given insurance received", () => {
        const insuranceReceived = 80
        let bondReceived
        
        const calculateRateDecrease = () => {
            rateDecrease = divUp(insuranceReceived * rateReserve, div(rateReserve * (maturity - timestamp), year) + assetReserve + assetIn) 
        }
    
        const calculate = () => {
            const rateBalanceAdjusted = rateReserve * base - (rateDecrease * (base + transactionFee))
            const bondBalanceAdjusted = divUp(divUp(invariance * base * base, assetReserve + assetIn), rateBalanceAdjusted)
            bondDecrease = div(bondReserve * base - bondBalanceAdjusted, base + transactionFee)

            bondMint = div(div(bondDecrease * rateReserve, assetReserve) * (maturity - timestamp), year)
            bondReceived = bondDecrease + bondMint
            
            insuranceDecrease = div(rateDecrease * (maturity - timestamp), year)
            insuranceMint = div(rateDecrease * (assetReserve + assetIn), rateReserve)
        }
    
        const safeLend = () => {
            return {
                minBond: div(bondReceived * 9, 10),
                minInsurance: div(insuranceReceived * 9, 10)
            }
        }
        
        describe("success case", () => {
            before(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)

                receiver = accounts[4]

                invariance = web3.utils.hexToNumber(await pool.invariance())

                rateReserve = divUp(divUp(invariance, assetReserve), bondReserve)

                calculateRateDecrease()

                calculate()

                await mintToken(assetIn, 0)

                await approve(0, assetIn, 0)

                await timeswapConvenience.lend(
                    parameter,
                    receiver,
                    assetIn,
                    false,
                    insuranceReceived,
                    safeLend(),
                    deadline,
                    { from: receiver }
                )
            })

            it("Should have receiver have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())
    
                const resultHex = await bondERC20.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)
    
                const bondReceived = bondDecrease + bondMint
    
                expect(result).to.equal(bondReceived)
            })

            it("Should have receiver have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())
    
                const resultHex = await insuranceERC20.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)
    
                const insuranceReceived = insuranceDecrease + insuranceMint
    
                expect(result).to.equal(insuranceReceived)
            })

            it("Should have pool have a correct assets reserve and balance", async () => {
                const resultHex = await testToken1.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.assetReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)
    
                const assetBalance = assetReserve + assetIn
    
                expect(result).to.equal(assetBalance)
                expect(resultReserve).to.equal(assetBalance)
            })
    
            it("Should have pool have correct collateral reserve and balance", async () => {
                const resultHex = await testToken2.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.collateralReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)
    
                expect(result).to.equal(collateralReserve)
                expect(resultReserve).to.equal(collateralReserve)
            })

            it("Should have pool have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())
    
                const resultHex = await bondERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
    
                const bondBalance = bondReserve - bondDecrease
    
                expect(result).to.equal(bondBalance)
            })
    
            it("Should have pool have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())
    
                const resultHex = await insuranceERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
    
                const insuranceBalance = insuranceReserve - insuranceDecrease
    
                expect(result).to.equal(insuranceBalance)
            })

            it("Should have the correct bond total supply", async () => {
                const bondERC20 = await Bond.at(await pool.bond())
    
                const resultHex = await bondERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)
    
                const bondTotalSupply = bondTotalSupplyBefore + bondMint
    
                expect(result).to.equal(bondTotalSupply)
            })
    
            it("Should have the correct insurance total supply", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())
    
                const resultHex = await insuranceERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)
    
                const insuranceTotalSupply = insuranceTotalSupplyBefore + insuranceMint
    
                expect(result).to.equal(insuranceTotalSupply)
            })
        })

        describe("fail case", () => {
            beforeEach(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)

                receiver = accounts[4]

                invariance = web3.utils.hexToNumber(await pool.invariance())

                rateReserve = divUp(divUp(invariance, assetReserve), bondReserve)

                calculateRateDecrease()

                calculate()
            })

            it("Should revert if no asset input amount", async () => {
                const wrongAssetIn = 0

                await expect(timeswapConvenience.lend(
                    parameter,
                    receiver,
                    wrongAssetIn,
                    false,
                    insuranceReceived,
                    safeLend(),
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if reached minBond", async () => {
                const wrongSafeLend = {
                    minBond: bondReceived + 4,
                    minInsurance: div(insuranceReceived * 9, 10)
                }
                
                await mintToken(assetIn, 0)

                await approve(0, assetIn, 0)

                await expect(timeswapConvenience.lend(
                    parameter,
                    receiver,
                    assetIn,
                    false,
                    insuranceReceived,
                    wrongSafeLend,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if reached minBond", async () => {
                const wrongSafeLend = {
                    minBond: div(bondReceived * 9, 10),
                    minInsurance: insuranceReceived + 1
                }
                
                await mintToken(assetIn, 0)

                await approve(0, assetIn, 0)

                await expect(timeswapConvenience.lend(
                    parameter,
                    receiver,
                    assetIn,
                    false,
                    insuranceReceived,
                    wrongSafeLend,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if pool matured", async () => {
                await advanceTimeAndBlock(duration)
    
                await mintToken(assetIn, 0)

                await approve(0, assetIn, 0)

                await expect(timeswapConvenience.lend(
                    parameter,
                    receiver,
                    assetIn,
                    false,
                    insuranceReceived,
                    safeLend(),
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })
        })
    })
})

describe("borrow", () => {
    const assetReserve = 100
    const bondReserve = 20
    const insuranceReserve = 1100
    const collateralReserve = 240
    
    let rateReserve

    const assetReceived = 20
    let bondIncrease
    let rateIncrease

    let insuranceIncrease
    
    let invariance

    const bondTotalSupplyBefore = 240
    const insuranceTotalSupplyBefore = 1200

    describe("borrow given collateral locked", () => {
        let collateralLocked = 30
        let debtRequired
        let interestRequired
        
        const calculateBondIncrease = () => {
            const bondMax = div(assetReceived * bondReserve, assetReserve - assetReceived)
            const bondMaxUp = divUp(assetReceived * bondReserve, assetReserve - assetReceived)
            const collateralAdditionalUp = collateralLocked - bondMax
            const collateralAdditional = collateralLocked - bondMaxUp
            bondIncrease = div(collateralAdditional * bondMax, divUp(divUp(bondMaxUp * rateReserve, assetReserve) * (maturity - timestamp), year) + collateralAdditionalUp)
        }

        const calculate = () => {
            const bondBalanceAdjusted = bondReserve * base + (bondIncrease * (base - transactionFee))
            const rateBalanceAdjusted = divUp(divUp(invariance * base * base, assetReserve - assetReceived), bondBalanceAdjusted)
            rateIncrease = divUp(rateBalanceAdjusted - (rateReserve * base), base - transactionFee)
    
            insuranceIncrease = divUp(rateIncrease * (maturity - timestamp), year)
    
            const rateMax = div(assetReceived * rateReserve, assetReserve - assetReceived)
            const rateMaxUp = divUp(assetReceived * rateReserve, assetReserve - assetReceived)
            debtRequired = divUp(rateMaxUp * rateIncrease, rateMax - rateIncrease)
            debtRequired = divUp(debtRequired * (maturity - timestamp), year)
            interestRequired = debtRequired
            debtRequired += assetReceived
        }

        const calculateCollateralLocked = () => {
            const bondMax = div(assetReceived * bondReserve, assetReserve - assetReceived)
            const bondMaxUp = divUp(assetReceived * bondReserve, assetReserve - assetReceived)
    
            collateralLocked = divUp(bondMaxUp * bondIncrease, bondMax - bondIncrease)
            collateralLocked = divUp(collateralLocked * rateReserve, assetReserve)
            collateralLocked = divUp(collateralLocked * (maturity - timestamp), year)
            collateralLocked += bondMaxUp
            collateralLocked --
        }

        let safeBorrow

        describe("success case", () => {
            before(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)

                receiver = accounts[4]

                invariance = web3.utils.hexToNumber(await pool.invariance())

                rateReserve = div(div(invariance, assetReserve), bondReserve)

                calculateBondIncrease()

                calculate()

                await mintToken(0, divUp(collateralLocked * 11, 10))

                await approve(0, 0, divUp(collateralLocked * 11, 10))

                safeBorrow = {
                    maxCollateralLocked: divUp(collateralLocked * 11, 10),
                    maxInterestRequired: divUp(interestRequired * 11, 10)
                }

                await timeswapConvenience.borrow(
                    parameter,
                    receiver,
                    assetReceived,
                    true,
                    collateralLocked,
                    safeBorrow,
                    deadline,
                    { from: receiver }
                )

                calculateCollateralLocked()
            })

            it("Should have receiver have correct amount of asset", async () => {
                const resultHex = await testToken1.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)
    
                expect(result).to.equal(assetReceived)
            })
    
            it("Should have receiver have a correct collateralized debt token", async () => {
                const collateralizedDebtERC721 = await CollateralizedDebt.at(await pool.collateralizedDebt())
    
                const tokenId = await collateralizedDebtERC721.totalSupply()
                const result = await collateralizedDebtERC721.ownerOf(tokenId)
                const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(tokenId)
                const resultDebt = web3.utils.hexToNumber(resultHex.debt)
                const resultCollateral = web3.utils.hexToNumber(resultHex.collateral)
    
                expect(result).to.equal(receiver)
                expect(resultDebt).to.equal(debtRequired)
                expect(resultCollateral).to.equal(collateralLocked)
            })
    
            it("Should have pool have a correct assets", async () => {
                const resultHex = await testToken1.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.assetReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)
    
                const assetBalance = assetReserve - assetReceived
    
                expect(result).to.equal(assetBalance)
                expect(resultReserve).to.equal(assetBalance)
            })
    
            it("Should have pool have correct collateral", async () => {
                const resultHex = await testToken2.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.collateralReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)
    
                const collateralBalance = collateralReserve + collateralLocked
    
                expect(result).to.equal(collateralBalance)
                expect(resultReserve).to.equal(collateralBalance)
            })
    
            it("Should have pool have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())
    
                const resultHex = await bondERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
    
                const bondBalance = bondReserve + bondIncrease
    
                expect(result).to.equal(bondBalance)
            })
    
            it("Should have pool have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())
    
                const resultHex = await insuranceERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
    
                const insuranceBalance = insuranceReserve + insuranceIncrease
    
                expect(result).to.equal(insuranceBalance)
            })
    
            it("Should have the correct bond total supply", async () => {
                const bondERC20 = await Bond.at(await pool.bond())
    
                const resultHex = await bondERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)
    
                const bondTotalSupply = bondTotalSupplyBefore + bondIncrease
    
                expect(result).to.equal(bondTotalSupply)
            })
    
            it("Should have the correct insurance total supply", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())
    
                const resultHex = await insuranceERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)
    
                const insuranceTotalSupply = insuranceTotalSupplyBefore + insuranceIncrease
    
                expect(result).to.equal(insuranceTotalSupply)
            })
        })

        describe("fail case", () => {
            before(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)

                receiver = accounts[4]

                invariance = web3.utils.hexToNumber(await pool.invariance())

                rateReserve = div(div(invariance, assetReserve), bondReserve)

                calculateBondIncrease()

                calculate()

                await mintToken(0, divUp(collateralLocked * 11, 10))

                await approve(0, 0, divUp(collateralLocked * 11, 10))

                safeBorrow = {
                    maxCollateralLocked: divUp(collateralLocked * 11, 10),
                    maxInterestRequired: divUp(interestRequired * 11, 10)
                }

                await timeswapConvenience.borrow(
                    parameter,
                    receiver,
                    assetReceived,
                    true,
                    collateralLocked,
                    safeBorrow,
                    deadline,
                    { from: receiver }
                )

                calculateCollateralLocked()
            })

            it("Should revert if no asset output amount", async () => {
                const wrongAssetReceived = 0
    
                await expect(timeswapConvenience.borrow(
                    parameter,
                    receiver,
                    wrongAssetReceived,
                    true,
                    collateralLocked,
                    safeBorrow,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })
    
            it("Should revert if not enough collateral amount", async () => {
                const wrongCollateralLocked = collateralLocked - 1
    
                await mintToken(0, divUp(collateralLocked * 11, 10))

                await approve(0, 0, divUp(collateralLocked * 11, 10))

                await expect(timeswapConvenience.borrow(
                    parameter,
                    receiver,
                    assetReceived,
                    true,
                    wrongCollateralLocked,
                    safeBorrow,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if reached max collateral locked", async () => {
                const wrongSafeBorrow = {
                    maxCollateralLocked: collateralLocked - 1,
                    maxInterestRequired: divUp(interestRequired * 11, 10)
                }
    
                await mintToken(0, divUp(collateralLocked * 11, 10))

                await approve(0, 0, divUp(collateralLocked * 11, 10))

                await expect(timeswapConvenience.borrow(
                    parameter,
                    receiver,
                    assetReceived,
                    true,
                    collateralLocked,
                    wrongSafeBorrow,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if not enough collateral amount", async () => {
                const wrongSafeBorrow = {
                    maxCollateralLocked: divUp(collateralLocked * 11, 10),
                    maxInterestRequired: interestRequired -1
                }
    
                await mintToken(0, divUp(collateralLocked * 11, 10))

                await approve(0, 0, divUp(collateralLocked * 11, 10))

                await expect(timeswapConvenience.borrow(
                    parameter,
                    receiver,
                    assetReceived,
                    true,
                    collateralLocked,
                    wrongSafeBorrow,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })
    
            it("Should revert if pool matured", async () => {
                await advanceTimeAndBlock(duration)
    
                await mintToken(0, divUp(collateralLocked * 11, 10))

                await approve(0, 0, divUp(collateralLocked * 11, 10))

                await expect(timeswapConvenience.borrow(
                    parameter,
                    receiver,
                    assetReceived,
                    true,
                    collateralLocked,
                    safeBorrow,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })
        })
    })

    describe("borrow given interest required", () => {
        let interestRequired = 78
        let collateralLocked
        let debtRequired
        
        const calculateRateIncrease = () => {
            const rateMax = div(assetReceived * rateReserve, assetReserve - assetReceived)
            const rateMaxUp = divUp(assetReceived * rateReserve, assetReserve - assetReceived)
            rateIncrease = div(interestRequired * rateMax, divUp(rateMaxUp * (maturity - timestamp), year) + interestRequired)
        }

        const calculate = () => {
            const rateBalanceAdjusted = rateReserve * base + (rateIncrease * (base - transactionFee))
            const bondBalanceAdjusted = divUp(divUp(invariance * base * base, assetReserve - assetReceived), rateBalanceAdjusted)
            bondIncrease = divUp(bondBalanceAdjusted - (bondReserve * base), base - transactionFee)
    
            const bondMax = div(assetReceived * bondReserve, assetReserve - assetReceived)
            const bondMaxUp = divUp(assetReceived * bondReserve, assetReserve - assetReceived)
    
            collateralLocked = divUp(bondMaxUp * bondIncrease, bondMax - bondIncrease)
            collateralLocked = divUp(collateralLocked * rateReserve, assetReserve)
            collateralLocked = divUp(collateralLocked * (maturity - timestamp), year)
            collateralLocked += bondMaxUp
            collateralLocked --
    
            insuranceIncrease = divUp(rateIncrease * (maturity - timestamp), year)
        }

        const calculateInterestRequired = () => {
            const rateMax = div(assetReceived * rateReserve, assetReserve - assetReceived)
            const rateMaxUp = divUp(assetReceived * rateReserve, assetReserve - assetReceived)
            debtRequired = divUp(rateMaxUp * rateIncrease, rateMax - rateIncrease)
            debtRequired = divUp(debtRequired * (maturity - timestamp), year)
            interestRequired = debtRequired
            debtRequired += assetReceived
        }

        let safeBorrow
        
        describe("success case", () => {
            before(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)

                receiver = accounts[4]
                
                rateReserve = web3.utils.hexToNumber(await pool.rateReserve())
                
                invariance = assetReserve * bondReserve * rateReserve

                calculateRateIncrease()

                calculate()

                await mintToken(0, divUp(collateralLocked * 11, 10))

                await approve(0, 0, divUp(collateralLocked * 11, 10))

                safeBorrow = {
                    maxCollateralLocked: divUp(collateralLocked * 11, 10),
                    maxInterestRequired: divUp(interestRequired * 11, 10)
                }

                await timeswapConvenience.borrow(
                    parameter,
                    receiver,
                    assetReceived,
                    false,
                    interestRequired,
                    safeBorrow,
                    deadline,
                    { from: receiver }
                )

                calculateInterestRequired()
            })

            it("Should have receiver have correct amount of asset", async () => {
                const resultHex = await testToken1.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)
    
                expect(result).to.equal(assetReceived)
            })
    
            it("Should have receiver have a correct collateralized debt token", async () => {
                const collateralizedDebtERC721 = await CollateralizedDebt.at(await pool.collateralizedDebt())
    
                const tokenId = await collateralizedDebtERC721.totalSupply()
                const result = await collateralizedDebtERC721.ownerOf(tokenId)
                const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(tokenId)
                const resultDebt = web3.utils.hexToNumber(resultHex.debt)
                const resultCollateral = web3.utils.hexToNumber(resultHex.collateral)
    
                expect(result).to.equal(receiver)
                expect(resultDebt).to.equal(debtRequired)
                expect(resultCollateral).to.equal(collateralLocked)
            })
    
            it("Should have pool have a correct assets", async () => {
                const resultHex = await testToken1.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.assetReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)
    
                const assetBalance = assetReserve - assetReceived
    
                expect(result).to.equal(assetBalance)
                expect(resultReserve).to.equal(assetBalance)
            })
    
            it("Should have pool have correct collateral", async () => {
                const resultHex = await testToken2.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.collateralReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)
    
                const collateralBalance = collateralReserve + collateralLocked
    
                expect(result).to.equal(collateralBalance)
                expect(resultReserve).to.equal(collateralBalance)
            })
    
            it("Should have pool have correct amount of bond tokens", async () => {
                const bondERC20 = await Bond.at(await pool.bond())
    
                const resultHex = await bondERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
    
                const bondBalance = bondReserve + bondIncrease
    
                expect(result).to.equal(bondBalance)
            })
    
            it("Should have pool have correct amount of insurance tokens", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())
    
                const resultHex = await insuranceERC20.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
    
                const insuranceBalance = insuranceReserve + insuranceIncrease
    
                expect(result).to.equal(insuranceBalance)
            })
    
            it("Should have the correct bond total supply", async () => {
                const bondERC20 = await Bond.at(await pool.bond())
    
                const resultHex = await bondERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)
    
                const bondTotalSupply = bondTotalSupplyBefore + bondIncrease
    
                expect(result).to.equal(bondTotalSupply)
            })
    
            it("Should have the correct insurance total supply", async () => {
                const insuranceERC20 = await Insurance.at(await pool.insurance())
    
                const resultHex = await insuranceERC20.totalSupply()
                const result = web3.utils.hexToNumber(resultHex)
    
                const insuranceTotalSupply = insuranceTotalSupplyBefore + insuranceIncrease
    
                expect(result).to.equal(insuranceTotalSupply)
            })
        })

        describe("fail case", () => {
            beforeEach(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)

                receiver = accounts[4]
                
                rateReserve = web3.utils.hexToNumber(await pool.rateReserve())
                
                invariance = rateReserve * assetReserve * bondReserve

                calculateRateIncrease()

                calculate()

                safeBorrow = {
                    maxCollateralLocked: divUp(collateralLocked * 11, 10),
                    maxInterestRequired: divUp(interestRequired * 11, 10)
                }
            })

            it("Should revert if no asset output amount", async () => {
                const wrongAssetReceived = 0
    
                await expect(timeswapConvenience.borrow(
                    parameter,
                    receiver,
                    wrongAssetReceived,
                    false,
                    interestRequired,
                    safeBorrow,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if reached max collateral locked", async () => {
                const wrongSafeBorrow = {
                    maxCollateralLocked: collateralLocked - 1,
                    maxInterestRequired: divUp(interestRequired * 11, 10)
                }
    
                await mintToken(0, divUp(collateralLocked * 11, 10))

                await approve(0, 0, divUp(collateralLocked * 11, 10))

                await expect(timeswapConvenience.borrow(
                    parameter,
                    receiver,
                    assetReceived,
                    false,
                    interestRequired,
                    wrongSafeBorrow,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })

            it("Should revert if not enough collateral amount", async () => {
                const wrongSafeBorrow = {
                    maxCollateralLocked: divUp(collateralLocked * 11, 10),
                    maxInterestRequired: interestRequired -1
                }
    
                await mintToken(0, divUp(collateralLocked * 11, 10))

                await approve(0, 0, divUp(collateralLocked * 11, 10))

                await expect(timeswapConvenience.borrow(
                    parameter,
                    receiver,
                    assetReceived,
                    false,
                    interestRequired,
                    wrongSafeBorrow,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })
    
            it("Should revert if pool matured", async () => {
                await advanceTimeAndBlock(duration)
    
                await mintToken(0, divUp(collateralLocked * 11, 10))

                await approve(0, 0, divUp(collateralLocked * 11, 10))

                await expect(timeswapConvenience.borrow(
                    parameter,
                    receiver,
                    assetReceived,
                    false,
                    interestRequired,
                    safeBorrow,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })
        })
    })
})

describe("pay", () => {
    const assetReserve = 100
    const bondReserve = 20
    const insuranceReserve = 1100
    const collateralReserve = 240

    const assetIn = 1000
    const collateralReceived = 200

    const tokenId = 1
    const tokenDebt = 1100
    const tokenCollateral = 220
    
    describe("pay single", () => {
        describe("success case", () => {
            before(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)
    
                await mintToken(assetIn, 0)

                await approve(0, assetIn, 0)

                await timeswapConvenience.methods["pay((address,address,uint256),uint256,uint256,uint256)"](
                    parameter,
                    tokenId,
                    assetIn,
                    deadline,
                    { from: receiver }
                )
            })

            it("Should have receiver have correct amount of collateral", async () => {
                const resultHex = await testToken2.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(collateralReceived)
            })

            it("Should have receiver have a correct collateralized debt token", async () => {
                const collateralizedDebtERC721 = await CollateralizedDebt.at(await pool.collateralizedDebt())

                const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(tokenId)
                const resultDebt = web3.utils.hexToNumber(resultHex.debt)
                const resultCollateral = web3.utils.hexToNumber(resultHex.collateral)

                const debtRemaining = tokenDebt - assetIn
                const collateralRemaining = tokenCollateral - collateralReceived

                expect(resultDebt).to.equal(debtRemaining)
                expect(resultCollateral).to.equal(collateralRemaining)
            })

            it("Should have pool have a correct assets", async () => {
                const resultHex = await testToken1.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.assetReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)

                const assetBalance = assetReserve + assetIn

                expect(result).to.equal(assetBalance)
                expect(resultReserve).to.equal(assetBalance)
            })

            it("Should have pool have correct collateral", async () => {
                const resultHex = await testToken2.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.collateralReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)

                const collateralBalance = collateralReserve - collateralReceived

                expect(result).to.equal(collateralBalance)
                expect(resultReserve).to.equal(collateralBalance)
            })
        })

        describe("fail case", () => {
            beforeEach(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)
            })

            it("Should revert if there is no asset input", async () => {
                const wrongAssetIn = 0
    
                await expect(timeswapConvenience.methods["pay((address,address,uint256),uint256,uint256,uint256)"](
                    parameter,
                    tokenId,
                    wrongAssetIn,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })
    
            it("Should revert if debt is already paid fully", async () => {
                const wrongAssetIn = 1
                
                await mintToken(tokenDebt, 0)

                await approve(0, tokenDebt, 0)

                await timeswapConvenience.methods["pay((address,address,uint256),uint256,uint256,uint256)"](
                    parameter,
                    tokenId,
                    tokenDebt,
                    deadline,
                    { from: receiver }
                )
    
                await mintToken(wrongAssetIn, 0)

                await approve(0, wrongAssetIn, 0)

                await expect(timeswapConvenience.methods["pay((address,address,uint256),uint256,uint256,uint256)"](
                    parameter,
                    tokenId,
                    wrongAssetIn,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })
    
            it("Should revert if pool already matured", async () => {
                await advanceTimeAndBlock(duration)
    
                await mintToken(assetIn, 0)

                await approve(0, assetIn, 0)

                await expect(timeswapConvenience.methods["pay((address,address,uint256),uint256,uint256,uint256)"](
                    parameter,
                    tokenId,
                    assetIn,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })
        })
    })

    describe("pay multiple", () => {
        const assetInMint = 10
        const bondIncrease = 2
        const insuranceIncrease = 110
        const bondReceived = 22
        const insuranceReceived = 10
        const collateralIn = 24

        const assetsIn = [1000, 50]
        const collateralsReceived = [200, 10]

        const tokenIds = [1, 2]
        const tokenDebt2 = 110
        const tokenCollaterals2 = 22

        describe("success case", () => {
            before(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)
    
                await mintToken(assetInMint, collateralIn)

                await approve(0, assetInMint, collateralIn)

                const safeMint = {
                    maxDebt: divUp(110 * 11, 10),
                    maxCollateralPaid: divUp(2 * 11, 10),
                    maxCollateralLocked: divUp(22 * 11, 10)
                }

                await timeswapConvenience.methods["mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    assetInMint,
                    safeMint,
                    deadline,
                    { from: receiver }
                )

                await mintToken(assetsIn[0] + assetsIn[1], 0)

                await approve(0, assetsIn[0] + assetsIn[1], 0)

                await timeswapConvenience.methods["pay((address,address,uint256),uint256[],uint256[],uint256)"](
                    parameter,
                    tokenIds,
                    assetsIn,
                    deadline,
                    { from: receiver }
                )
            })

            it("Should have receiver have correct amount of collateral", async () => {
                const resultHex = await testToken2.balanceOf(receiver)
                const result = web3.utils.hexToNumber(resultHex)

                expect(result).to.equal(collateralsReceived[0] + collateralsReceived[1])
            })

            it("Should have receiver have a correct collateralized debt token", async () => {
                const collateralizedDebtERC721 = await CollateralizedDebt.at(await pool.collateralizedDebt())

                const resultHex1 = await collateralizedDebtERC721.collateralizedDebtOf(tokenIds[0])
                const resultDebt1 = web3.utils.hexToNumber(resultHex1.debt)
                const resultCollateral1 = web3.utils.hexToNumber(resultHex1.collateral)

                const resultHex2 = await collateralizedDebtERC721.collateralizedDebtOf(tokenIds[1])
                const resultDebt2 = web3.utils.hexToNumber(resultHex2.debt)
                const resultCollateral2 = web3.utils.hexToNumber(resultHex2.collateral)

                const debtRemaining1 = tokenDebt - assetsIn[0]
                const collateralRemaining1 = tokenCollateral - collateralsReceived[0]

                const debtRemaining2 = tokenDebt2 - assetsIn[1]
                const collateralRemaining2 = tokenCollaterals2 - collateralsReceived[1]

                expect(resultDebt1).to.equal(debtRemaining1)
                expect(resultCollateral1).to.equal(collateralRemaining1)

                expect(resultDebt2).to.equal(debtRemaining2)
                expect(resultCollateral2).to.equal(collateralRemaining2)
            })

            it("Should have pool have a correct assets", async () => {
                const resultHex = await testToken1.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.assetReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)

                const assetBalance = assetReserve + + assetInMint + assetsIn[0] + assetsIn[1]

                expect(result).to.equal(assetBalance)
                expect(resultReserve).to.equal(assetBalance)
            })

            it("Should have pool have correct collateral", async () => {
                const resultHex = await testToken2.balanceOf(pool.address)
                const result = web3.utils.hexToNumber(resultHex)
                const resultReserveHex = await pool.collateralReserve()
                const resultReserve = web3.utils.hexToNumber(resultReserveHex)

                const collateralBalance = collateralReserve + collateralIn - collateralsReceived[0] - collateralsReceived[1]

                expect(result).to.equal(collateralBalance)
                expect(resultReserve).to.equal(collateralBalance)
            })
        })

        describe("fail case", () => {
            beforeEach(async () => {
                await deployAndMint(assetReserve, bondReserve, collateralReserve - bondReserve)
    
                await mintToken(assetInMint, collateralIn)

                await approve(0, assetInMint, collateralIn)

                const safeMint = {
                    maxDebt: divUp(110 * 11, 10),
                    maxCollateralPaid: divUp(2 * 11, 10),
                    maxCollateralLocked: divUp(22 * 11, 10)
                }

                await timeswapConvenience.methods["mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"](
                    parameter,
                    receiver,
                    assetInMint,
                    safeMint,
                    deadline,
                    { from: receiver }
                )

                await mintToken(assetsIn[0] + assetsIn[1], 0)

                await approve(0, assetsIn[0] + assetsIn[1], 0)

                await timeswapConvenience.methods["pay((address,address,uint256),uint256[],uint256[],uint256)"](
                    parameter,
                    tokenIds,
                    assetsIn,
                    deadline,
                    { from: receiver }
                )
            })

            it("Should revert if there is no asset input", async () => {
                const wrongAssetsIn = [0, 0]
    
                await expect(timeswapConvenience.methods["pay((address,address,uint256),uint256[],uint256[],uint256)"](
                    parameter,
                    tokenIds,
                    wrongAssetsIn,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })
    
            it("Should revert if debt is already paid fully", async () => {
                const wrongAssetsIn = [1, 1]
                
                await mintToken(tokenDebt + tokenDebt2, 0)

                await approve(0, tokenDebt + tokenDebt2, 0)

                await timeswapConvenience.methods["pay((address,address,uint256),uint256[],uint256[],uint256)"](
                    parameter,
                    tokenIds,
                    [tokenDebt, tokenDebt2],
                    deadline,
                    { from: receiver }
                )
    
                await mintToken(2, 0)

                await approve(0, 2, 0)

                await expect(timeswapConvenience.methods["pay((address,address,uint256),uint256[],uint256[],uint256)"](
                    parameter,
                    tokenIds,
                    wrongAssetsIn,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })
    
            it("Should revert if pool already matured", async () => {
                await advanceTimeAndBlock(duration)
    
                await mintToken(assetsIn[0] + assetsIn[1], 0)

                await approve(0, assetsIn[0] + assetsIn[1], 0)

                await expect(timeswapConvenience.methods["pay((address,address,uint256),uint256[],uint256[],uint256)"](
                    parameter,
                    tokenIds,
                    assetsIn,
                    deadline,
                    { from: receiver }
                )).to.be.reverted
            })
        })
    })
})