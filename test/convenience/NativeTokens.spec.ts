// import { ethers, waffle } from 'hardhat'
// import { mulDivUp, now, setTime, shiftRightUp } from '../shared/Helper'
// import { expect } from '../shared/Expect'
// import {
//   newLiquidityFixture,
//   constructorFixture,
//   Fixture,
//   newLiquidityETHCollateralFixture,
//   newLiquidityETHAssetFixture,
// } from '../shared/Fixtures'
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
// import * as fc from 'fast-check'
// import { NewLiquidityParams } from '../types'
// import { ERC20__factory, CollateralizedDebt__factory, TestToken, IERC20__factory, IERC20Metadata__factory } from '../../typechain'
// import * as LiquidityFilter from '../filters/Liquidity'
// import * as LiquidityMath from '../libraries/LiquidityMath'
// import { Convenience } from '../shared/Convenience'

// const { loadFixture } = waffle

// let maturity = 0n
// let signers: SignerWithAddress[] = []

// const MAXUINT112: bigint = 2n ** 112n

// async function fixture(): Promise<Fixture> {
//   maturity = (await now()) + 31536000n
//   signers = await ethers.getSigners()

//   const constructor = await constructorFixture(1n << 112n, 1n << 112n, maturity, signers[0])

//   return constructor
// }

// describe('New Liquidity', () => {
//   it('Succeeded', async () => {
//     const { maturity, assetToken, collateralToken,convenience } = await loadFixture(fixture)
//     let currentTime = await now()

//     await fc.assert(
//       fc.asyncProperty(
//         fc
//           .record({ assetIn: fc.bigUintN(112), debtIn: fc.bigUintN(112), collateralIn: fc.bigUintN(112) })
//           .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n, maturity)),
//         async (data) => {
//           const success = async () => {
//             const constructor = await loadFixture(fixture)
//             await setTime(Number(currentTime + 5000n))
//             const newLiquidity = await newLiquidityFixture(constructor, signers[0], data)
//             return newLiquidity
//           }
          
//           await newLiquidityProperties(data, currentTime+5000n, success, assetToken.address, convenience.wethContract.address)

//           checkLiquidity(success)
//           checkInsurance(success)
//           checkBond(success)
          

//         }
//       ),
//       { skipAllAfterTimeLimit: 50000, numRuns: 10 }
//     )
//   }).timeout(600000)

// })

// async function newLiquidityProperties(
//   data: {
//     assetIn: bigint
//     debtIn: bigint
//     collateralIn: bigint
//   },
//   currentTime: bigint,
//   success: () => Promise<{
//     convenience: Convenience
//     assetToken: TestToken
//     collateralToken: TestToken
//     maturity: bigint
//   }>,
//   assetAddress: string,
//   collateralAddress: string
// ) {
//   const result = await loadFixture(success)
//   const newCurrentTime = currentTime + 5_000n
//   const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = LiquidityMath.getYandZIncreaseNewLiquidity(
//     newLiquidityParams.assetIn,
//     newLiquidityParams.debtIn,
//     newLiquidityParams.collateralIn,
//     currentTimeNL,
//     maturity
//   )
//   const state = { x: newLiquidityParams.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity }
//   const liquidityBalance = LiquidityMath.liquidityCalculateNewLiquidity(state, newCurrentTime, maturity)
//   const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = LiquidityMath.getYandZIncreaseNewLiquidity(
//     data.assetIn,
//     data.debtIn,
//     data.collateralIn,
//     newCurrentTime,
//     maturity
//   )
//   const debt = LiquidityMath.getDebtAddLiquidity(
//     { x: data.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity },
//     maturity,
//     newCurrentTime
//   )
//   const collateral = LiquidityMath.getCollateralAddLiquidity(
//     { x: data.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity },
//     maturity,
//     newCurrentTime
//   )
//   // //console.log(.*)
//   // //console.log(.*)
//   // //console.log(.*)

//   // expect((await result.assetToken.balanceOf(signers[0].address)).toBigInt()).equalBigInt(
//   //   (1n << 150n) - data.assetIn
//   // )
//   // expect((await result.collateralToken.balanceOf(signers[0].address)).toBigInt()).equalBigInt(
//   //   (1n << 150n) - data.collateralIn
//   // )
//   const natives = await result.convenience.getNatives(assetAddress, collateralAddress, maturity)

//   const liquidityToken = ERC20__factory.connect(natives.liquidity, ethers.provider)
//   const liquidityBalanceContract = (await liquidityToken.balanceOf(signers[0].address)).toBigInt()
//   // //console.log(.*)
//   expect(liquidityBalanceContract).equalBigInt(liquidityBalance)

//   const collateralizedDebtContract = CollateralizedDebt__factory.connect(natives.collateralizedDebt, ethers.provider)
//   const collateralizedDebtToken = await collateralizedDebtContract.dueOf(0)

//   const collateralBalanceContract = collateralizedDebtToken.collateral.toBigInt()
//   const debtBalanceContract = collateralizedDebtToken.debt.toBigInt()

//   expect(collateralBalanceContract).equalBigInt(collateral)
//   expect(debtBalanceContract).equalBigInt(debt)
// }

// const checkLiquidity=async(success: () => Promise<{
//   convenience: Convenience
//   assetToken: TestToken
//   collateralToken: TestToken
//   maturity: bigint
// }>)=>{
//   const result = await loadFixture(success)

//   const natives=await (result.convenience.getNatives(result.assetToken.address,result.collateralToken.address,maturity))
//   const liquidityToken = await IERC20Metadata__factory.connect(natives.liquidity, ethers.provider)
//   // console.log(await liquidityToken.name())
//   // console.log(await liquidityToken.decimals())
//   // console.log(await liquidityToken.symbol())
// }
// const checkInsurance=async(success: () => Promise<{
//   convenience: Convenience
//   assetToken: TestToken
//   collateralToken: TestToken
//   maturity: bigint
// }>)=>{
//   const result = await loadFixture(success)

//   const natives=await (result.convenience.getNatives(result.assetToken.address,result.collateralToken.address,maturity))

//   const insuranceToken = await IERC20Metadata__factory.connect(natives.insurance, ethers.provider)
//   // console.log(await insuranceToken.name())
//   // console.log(await insuranceToken.decimals())
//   // console.log(await insuranceToken.symbol())
// }
// const checkBond=async(success: () => Promise<{
//   convenience: Convenience
//   assetToken: TestToken
//   collateralToken: TestToken
//   maturity: bigint
// }>)=>{
//   const result = await loadFixture(success)

//   const natives=await (result.convenience.getNatives(result.assetToken.address,result.collateralToken.address,maturity))

//   const bondToken = await IERC20Metadata__factory.connect(natives.bond, ethers.provider)
//   // console.log(await bondToken.name())
//   // console.log(await bondToken.decimals())
//   // console.log(await bondToken.symbol())
// }