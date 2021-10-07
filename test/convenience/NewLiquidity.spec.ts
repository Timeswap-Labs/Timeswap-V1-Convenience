import { ethers, waffle } from 'hardhat'
import { mulDivUp, now, shiftUp } from '../shared/Helper'
import { expect } from '../shared/Expect'
import { newLiquidityFixture, constructorFixture, Fixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { NewLiquidityParams, NewLiquidityParamsUint } from '../types'
import { ERC20__factory, CollateralizedDebt__factory, TimeswapPair__factory } from '../../typechain'
import { Uint112, Uint256 } from '@timeswap-labs/timeswap-v1-sdk-core'
import { Uint } from '@timeswap-labs/timeswap-v1-sdk-core/dist/uint/uint'
import * as LiquidityMath from '../libraries/LiquidityMath'

const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

function check(num: Uint, bit: bigint) {
  return num.toBigInt() < 1n << bit
}



const MAXUINT112: bigint = 2n ** 112n

describe('New Liquidity', () => {
  async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 31536000n
    signers = await ethers.getSigners()

    const constructor = await constructorFixture(1n << 112n, 1n << 112n, maturity, signers[0])

    return constructor
  }

  const verifyYAndZIncrease = ({ assetIn, debtIn, collateralIn }: NewLiquidityParamsUint, currentTime: bigint) => {
    // const ct = BigInt(Math.floor(Date.now() / 1000))

    const yIncrease = new Uint256(debtIn)
      .sub(assetIn)
      .shiftLeft(32)
      .div(maturity - currentTime)

    const denominator = new Uint256(maturity - currentTime).mul(yIncrease).add(new Uint256(assetIn).shiftLeft(33))
    const zIncrease = new Uint256(collateralIn).mul(assetIn).shiftLeft(32).div(denominator)

    return { yIncrease, zIncrease }
  }

  function filterSuccessNewLiquidity(newLiquidityParams: NewLiquidityParamsUint, currentTime: bigint) {
    if (
      newLiquidityParams.assetIn.toBigInt() >= newLiquidityParams.debtIn.toBigInt() ||
      newLiquidityParams.assetIn.toBigInt() === 0n ||
      newLiquidityParams.debtIn.toBigInt() === 0n ||
      newLiquidityParams.collateralIn.toBigInt() === 0n
    ) {
      return false
    }

    const { yIncrease, zIncrease } = verifyYAndZIncrease(newLiquidityParams, currentTime)

    if (
      yIncrease.toBigInt() === 0n ||
      zIncrease.toBigInt() === 0n ||
      !check(yIncrease, 112n) ||
      !check(zIncrease, 112n)
    ) {
      return false
    }

    return true
  }

  it('Succeeded', async () => {
    const { maturity } = await loadFixture(fixture)
    let currentTime = await now()


    await fc.assert(
      fc.asyncProperty(
        fc
          .record({ assetIn: fc.bigUintN(112), debtIn: fc.bigUintN(112), collateralIn: fc.bigUintN(112) })
          .map(({ assetIn, debtIn, collateralIn }) => {
            return {
              assetIn: new Uint112(assetIn),
              debtIn: new Uint112(debtIn),
              collateralIn: new Uint112(collateralIn),
            }
          })
          .filter((x) => filterSuccessNewLiquidity(x, currentTime)),
        async (data) => {
          const success = async () => {
            const constructor = await loadFixture(fixture)
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], {
              assetIn: data.assetIn.toBigInt(),
              debtIn: data.debtIn.toBigInt(),
              collateralIn: data.collateralIn.toBigInt(),
            })
            return newLiquidity
          }

          const result = await loadFixture(success)
          const newCurrentTime = await now()
          const liquidityBalance = LiquidityMath.liquidityCalculate(data.assetIn.toBigInt(), newCurrentTime,maturity)
          const { debt, collateral } = LiquidityMath.debtCollateralCalculate(data, newCurrentTime,maturity)
          // console.log(data)
          // console.log(liquidityBalance)
          // console.log((maturity - currentTime))

          // expect((await result.assetToken.balanceOf(signers[0].address)).toBigInt()).equalBigInt(
          //   (1n << 150n) - data.assetIn
          // )
          // expect((await result.collateralToken.balanceOf(signers[0].address)).toBigInt()).equalBigInt(
          //   (1n << 150n) - data.collateralIn
          // )
          const natives = await result.convenience.getNatives(
            result.assetToken.address,
            result.collateralToken.address,
            maturity
          )

          const liquidityToken = ERC20__factory.connect(natives.liquidity, ethers.provider)
          const liquidityBalanceContract = (await liquidityToken.balanceOf(signers[0].address)).toBigInt()
          // console.log(liquidityBalanceContract)
          expect(liquidityBalanceContract).equalBigInt(liquidityBalance)

          const collateralizedDebtContract = CollateralizedDebt__factory.connect(
            natives.collateralizedDebt,
            ethers.provider
          )
          const collateralizedDebtToken = await collateralizedDebtContract.dueOf(0)

          const collateralBalanceContract = collateralizedDebtToken.collateral.toBigInt()
          const debtBalanceContract = collateralizedDebtToken.debt.toBigInt()
          const pairContract = TimeswapPair__factory.connect(
            await result.convenience.factoryContract.getPair(result.assetToken.address, result.collateralToken.address),
            ethers.provider
          )
          const reserves = await pairContract.totalReserves(result.maturity)
          const reservesAsset = reserves.asset.toBigInt()
          const reservesCollateral = reserves.collateral.toBigInt()

          expect(reservesAsset).equalBigInt(data.assetIn.toBigInt())
          expect(reservesCollateral).equalBigInt(collateral)
          expect((await pairContract.totalDebtCreated(result.maturity)).toBigInt()).equalBigInt(debt)

          const constantProduct = await pairContract.constantProduct(result.maturity)
          const { yIncrease, zIncrease } = verifyYAndZIncrease(data, newCurrentTime)

          expect(constantProduct.x.toBigInt()).equalBigInt(data.assetIn.toBigInt())
          expect(constantProduct.y.toBigInt()).equalBigInt(yIncrease.toBigInt())
          expect(constantProduct.z.toBigInt()).equalBigInt(zIncrease.toBigInt())
          expect(collateralBalanceContract).equalBigInt(collateral)
          expect(debtBalanceContract).equalBigInt(debt)
        }
      )
    )
  }).timeout(600000)
})
