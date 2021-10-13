import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftUp, mulDivUp, advanceTimeAndBlock, setTime, objectMap, UToBObj } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import * as BorrowMath from '../libraries/BorrowMath'
import {
  newLiquidityFixture,
  constructorFixture,
  Fixture,
  addLiquidityFixture,
  borrowGivenPercentFixture,
} from '../shared/Fixtures'

import * as fc from 'fast-check'
import { AddLiquidityParams, NewLiquidityParams } from '../types'
import { CollateralizedDebt__factory, ERC20__factory } from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'
import * as BorrowFilter from '../filters/Borrow'
import { Uint112, Uint256, Uint40 } from '@timeswap-labs/timeswap-v1-sdk-core'
import { addLiquidityParamsUToB, newLiquidityParamsUToB } from '../types/transformers/Liquidity'
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
            }),
          })
          .filter((x) =>
            BorrowFilter.borrowGivenPercentSuccess(x, currentTime + 5_000n, currentTime + 10_000n, maturity)
          )
          .noShrink(),
        async (data) => {
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            console.log('CT 1', await now())
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], data.newLiquidityParams)
            await setTime(Number(currentTime + 10000n))
            const borrowGivenPercent = await borrowGivenPercentFixture(
              newLiquidity,
              signers[0],
              data.borrowGivenPercentParams
            )
            return borrowGivenPercent
          }
          console.log(data)
          // Trying things
          const neededTime = (await now()) + 100n
          // providers.

          const result = await loadFixture(success)
          // currentTime = await now()

          const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = LiquidityMath.getYandZIncreaseNewLiquidity(
            data.newLiquidityParams.assetIn,
            data.newLiquidityParams.debtIn,
            data.newLiquidityParams.collateralIn,
            currentTime + 5_000n,
            maturity
          )

          const state = {
            x: data.newLiquidityParams.assetIn,
            y: yIncreaseNewLiquidity,
            z: zIncreaseNewLiquidity,
          }
          const { yIncreaseBorrowGivenPercent, zIncreaseBorrowGivenPercent } =
            BorrowMath.getYandZIncreaseBorrowGivenPercent(
              state,
              data.borrowGivenPercentParams.assetOut,
              data.borrowGivenPercentParams.percent
            )

          const delState = {
            x: data.borrowGivenPercentParams.assetOut,
            y: yIncreaseBorrowGivenPercent,
            z: zIncreaseBorrowGivenPercent,
          }

          const debt = BorrowMath.getDebt(delState, maturity, currentTime + 10_000n)
          const collateral = BorrowMath.getCollateral(state, delState, maturity, currentTime + 10_000n)
          console.log('TS', currentTime + 10_000n)

          const cdToken = CollateralizedDebt__factory.connect(
            (await result.convenience.getNatives(result.assetToken.address, result.collateralToken.address, maturity))
              .collateralizedDebt,
            ethers.provider
          )

          const cdTokenBalance = await cdToken.dueOf(1)
          const debtContract = cdTokenBalance.debt
          const collateralContract = cdTokenBalance.collateral

          // expect(debtContract).equalBigInt(debt)
          // expect(collateralContract).equalBigInt(collateral)
        }
      )
    )
  }).timeout(600000)
})
