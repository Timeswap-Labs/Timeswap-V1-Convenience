import { ethers, waffle } from 'hardhat'
import { mulDivUp, now, setTime, shiftUp } from '../shared/Helper'
import { expect } from '../shared/Expect'
import {
  newLiquidityFixture,
  constructorFixture,
  Fixture,
  newLiquidityETHCollateralFixture,
  newLiquidityETHAssetFixture,
} from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { NewLiquidityParams } from '../types'
import { ERC20__factory, CollateralizedDebt__factory } from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'
import * as LiquidityMath from '../libraries/LiquidityMath'

const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n

async function fixture(): Promise<Fixture> {
  maturity = (await now()) + 31536000n
  signers = await ethers.getSigners()

  const constructor = await constructorFixture(1n << 112n, 1n << 112n, maturity, signers[0])

  return constructor
}

describe('New Liquidity', () => {
  it('Succeeded', async () => {
    const { maturity } = await loadFixture(fixture)
    let currentTime = await now()

    await fc.assert(
      fc.asyncProperty(
        fc
          .record({ assetIn: fc.bigUintN(112), debtIn: fc.bigUintN(112), collateralIn: fc.bigUintN(112) })
          .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n, maturity)),
        async (data) => {
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], data)
            return newLiquidity
          }

          const result = await loadFixture(success)
          const newCurrentTime = currentTime + 5_000n
          const liquidityBalance = LiquidityMath.liquidityCalculateNewLiquidity(data.assetIn, newCurrentTime, maturity)
          const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = LiquidityMath.getYandZIncreaseNewLiquidity(
            data.assetIn,
            data.debtIn,
            data.collateralIn,
            newCurrentTime,
            maturity
          )
          const debt = LiquidityMath.getDebtAddLiquidity(
            { x: data.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity },
            maturity,
            newCurrentTime
          )
          const collateral = LiquidityMath.getCollateralAddLiquidity(
            { x: data.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity },
            maturity,
            newCurrentTime
          )
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

          expect(collateralBalanceContract).equalBigInt(collateral)
          expect(debtBalanceContract).equalBigInt(debt)
        }
      )
    )
  }).timeout(600000)
})

describe('New Liquidity ETH Asset', () => {
  it('Succeeded', async () => {
    const { maturity } = await loadFixture(fixture)
    let currentTime = await now()

    await fc.assert(
      fc.asyncProperty(
        fc
          .record({ assetIn: fc.bigUintN(112), debtIn: fc.bigUintN(112), collateralIn: fc.bigUintN(112) })
          .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n, maturity)),
        async (data) => {
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            const newLiquidity = await newLiquidityETHAssetFixture(constructor, signers[0], data)
            return newLiquidity
          }

          const result = await loadFixture(success)
          // console.log(data, (await ethers.provider.getBalance(signers[0].address)).toString())
          const newCurrentTime = currentTime + 5_000n
          const liquidityBalance = LiquidityMath.liquidityCalculateNewLiquidity(data.assetIn, newCurrentTime, maturity)
          const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = LiquidityMath.getYandZIncreaseNewLiquidity(
            data.assetIn,
            data.debtIn,
            data.collateralIn,
            newCurrentTime,
            maturity
          )
          const debt = LiquidityMath.getDebtAddLiquidity(
            { x: data.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity },
            maturity,
            newCurrentTime
          )
          const collateral = LiquidityMath.getCollateralAddLiquidity(
            { x: data.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity },
            maturity,
            newCurrentTime
          )
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
            result.convenience.wethContract.address,
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

          expect(collateralBalanceContract).equalBigInt(collateral)
          expect(debtBalanceContract).equalBigInt(debt)
        }
      )
    )
  }).timeout(600000)
})

describe('New Liquidity ETH Collateral', () => {
  it('Succeeded', async () => {
    const { maturity } = await loadFixture(fixture)
    let currentTime = await now()

    await fc.assert(
      fc.asyncProperty(
        fc
          .record({ assetIn: fc.bigUintN(112), debtIn: fc.bigUintN(112), collateralIn: fc.bigUintN(112) })
          .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n, maturity)),
        async (data) => {
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            const newLiquidity = await newLiquidityETHCollateralFixture(constructor, signers[0], data)
            return newLiquidity
          }

          const result = await loadFixture(success)
          const newCurrentTime = currentTime + 5_000n
          const liquidityBalance = LiquidityMath.liquidityCalculateNewLiquidity(data.assetIn, newCurrentTime, maturity)
          const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = LiquidityMath.getYandZIncreaseNewLiquidity(
            data.assetIn,
            data.debtIn,
            data.collateralIn,
            newCurrentTime,
            maturity
          )
          const debt = LiquidityMath.getDebtAddLiquidity(
            { x: data.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity },
            maturity,
            newCurrentTime
          )
          const collateral = LiquidityMath.getCollateralAddLiquidity(
            { x: data.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity },
            maturity,
            newCurrentTime
          )
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
            result.convenience.wethContract.address,
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

          expect(collateralBalanceContract).equalBigInt(collateral)
          expect(debtBalanceContract).equalBigInt(debt)
        }
      )
    )
  }).timeout(600000)
})
