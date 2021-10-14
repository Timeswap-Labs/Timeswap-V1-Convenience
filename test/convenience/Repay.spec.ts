import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftUp, mulDivUp, advanceTimeAndBlock, setTime } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import * as BorrowMath from '../libraries/BorrowMath'
import {
  newLiquidityFixture,
  constructorFixture,
  Fixture,
  addLiquidityFixture,
  borrowGivenPercentFixture,
  repayFixture,
  repayETHAssetFixture,
  repayETHCollateralFixture,
  newLiquidityETHAssetFixture,
  newLiquidityETHCollateralFixture,
  borrowGivenPercentETHAssetFixture,
  borrowGivenPercentETHCollateralFixture,
} from '../shared/Fixtures'

import * as fc from 'fast-check'
import { AddLiquidityParams, NewLiquidityParams } from '../types'
import { CollateralizedDebt__factory, ERC20__factory } from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'
import * as BorrowFilter from '../filters/Borrow'
// import { Uint112, Uint256, Uint40 } from '@timeswap-labs/timeswap-v1-sdk-core'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n

describe('Repay', () => {
  async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 31536000n
    signers = await ethers.getSigners()

    const constructor = await constructorFixture(1n << 150n, 1n << 150n, maturity, signers[0])

    return constructor
  }

  it('Succeeded', async () => {
    const { maturity } = await loadFixture(fixture)
    let currentTime = await now()

    await fc.assert(
      fc.asyncProperty(
        fc
          .record({
            newLiquidityParams: fc
              .record({
                assetIn: fc.bigUintN(112),
                debtIn: fc.bigUintN(112),
                collateralIn: fc.bigUintN(112),
              })
              .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n, maturity)),
            borrowGivenPercentParams: fc.record({
              assetOut: fc.bigUintN(112),
              percent: fc.bigUint(1n << 32n),
              maxDebt: fc.bigUintN(112),
              maxCollateral: fc.bigUintN(112),
            })
          })
          .filter((x) =>
            BorrowFilter.borrowGivenPercentSuccess(x, currentTime + 5_000n, currentTime + 10_000n, maturity)
          )
          .noShrink(),
        async (data) => {
          const repayData = {
            ids : [0n,1n],
            maxAssetsIn: [data.newLiquidityParams.debtIn,data.borrowGivenPercentParams.maxDebt]
          }
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            //console.log(.*)
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], data.newLiquidityParams)
            await setTime(Number(currentTime + 10000n))
            const borrowGivenPercent = await borrowGivenPercentFixture(
              newLiquidity,
              signers[0],
              data.borrowGivenPercentParams
            )
            const repay = await repayFixture(borrowGivenPercent,signers[0],repayData)
            return repay
          }
          await loadFixture(success)
        }
        
      ),{ skipAllAfterTimeLimit: 50000, numRuns: 10 }
    )
  }).timeout(600000)
})

describe('Repay ETHAsset', () => {
  async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 31536000n
    signers = await ethers.getSigners()

    const constructor = await constructorFixture(1n << 150n, 1n << 150n, maturity, signers[0])

    return constructor
  }

  it('Succeeded', async () => {
    const { maturity } = await loadFixture(fixture)
    let currentTime = await now()

    await fc.assert(
      fc.asyncProperty(
        fc
          .record({
            newLiquidityParams: fc
              .record({
                assetIn: fc.bigUintN(112),
                debtIn: fc.bigUintN(112),
                collateralIn: fc.bigUintN(112),
              })
              .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n, maturity)),
            borrowGivenPercentParams: fc.record({
              assetOut: fc.bigUintN(112),
              percent: fc.bigUint(1n << 32n),
              maxDebt: fc.bigUintN(112),
              maxCollateral: fc.bigUintN(112),
            })
          })
          .filter((x) =>
            BorrowFilter.borrowGivenPercentSuccess(x, currentTime + 5_000n, currentTime + 10_000n, maturity)
          ).filter((x)=> (x.newLiquidityParams.debtIn + x.borrowGivenPercentParams.maxDebt <MAXUINT112) )
          .noShrink(),
        async (data) => {
          const repayData = {
            ids : [0n,1n],
            maxAssetsIn: [data.newLiquidityParams.debtIn,data.borrowGivenPercentParams.maxDebt]
          }
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            const newLiquidity = await newLiquidityETHAssetFixture(constructor, signers[0], data.newLiquidityParams)
            await setTime(Number(currentTime + 10000n))
            const borrowGivenPercent = await borrowGivenPercentETHAssetFixture(
              newLiquidity,
              signers[0],
              data.borrowGivenPercentParams
            )
            const repay = await repayETHAssetFixture(borrowGivenPercent,signers[0],repayData)
            return repay
          }
          await loadFixture(success)
        }
      ),{ skipAllAfterTimeLimit: 50000, numRuns: 10 }
    )
  }).timeout(600000)
})

describe('Repay ETHCollateral', () => {
  async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 31536000n
    signers = await ethers.getSigners()

    const constructor = await constructorFixture(1n << 150n, 1n << 150n, maturity, signers[0])

    return constructor
  }

  it('Succeeded', async () => {
    const { maturity } = await loadFixture(fixture)
    let currentTime = await now()

    await fc.assert(
      fc.asyncProperty(
        fc
          .record({
            newLiquidityParams: fc
              .record({
                assetIn: fc.bigUintN(112),
                debtIn: fc.bigUintN(112),
                collateralIn: fc.bigUintN(112),
              })
              .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n, maturity)),
            borrowGivenPercentParams: fc.record({
              assetOut: fc.bigUintN(112),
              percent: fc.bigUint(1n << 32n),
              maxDebt: fc.bigUintN(112),
              maxCollateral: fc.bigUintN(112),
            })
          })
          .filter((x) =>
            BorrowFilter.borrowGivenPercentSuccess(x, currentTime + 5_000n, currentTime + 10_000n, maturity)
          )
          .noShrink(),
        async (data) => {
          const repayData = {
            ids : [0n,1n],
            maxAssetsIn: [data.newLiquidityParams.debtIn,data.borrowGivenPercentParams.maxDebt]
          }
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            //console.log(.*)
            const newLiquidity = await newLiquidityETHCollateralFixture(constructor, signers[0], data.newLiquidityParams)
            await setTime(Number(currentTime + 10000n))
            const borrowGivenPercent = await borrowGivenPercentETHCollateralFixture(
              newLiquidity,
              signers[0],
              data.borrowGivenPercentParams
            )
            const repay = await repayETHCollateralFixture(borrowGivenPercent,signers[0],repayData)
            return borrowGivenPercent
          }
          await loadFixture(success)

        }
      ),{ skipAllAfterTimeLimit: 50000, numRuns: 10 }
    )
  }).timeout(600000)
})
