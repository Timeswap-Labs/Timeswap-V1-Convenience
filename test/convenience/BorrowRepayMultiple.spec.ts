import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftRightUp, mulDivUp, advanceTimeAndBlock, setTime } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import * as BorrowMath from '../libraries/BorrowMath'
import {
  newLiquidityFixture,
  constructorFixture,
  Fixture,
  addLiquidityFixture,
  borrowGivenDebtFixture,
  borrowGivenDebtETHCollateralFixture,
  newLiquidityETHCollateralFixture,
  borrowGivenDebtETHAssetFixture,
  newLiquidityETHAssetFixture,
  repayFixture,
} from '../shared/Fixtures'

import * as fc from 'fast-check'
import { AddLiquidityParams, NewLiquidityParams } from '../types'
import { CollateralizedDebt__factory, ERC20__factory, TestToken } from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'
import * as BorrowFilter from '../filters/Borrow'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Convenience } from '../shared/Convenience'
import { kMaxLength } from 'buffer'

const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n

async function fixture(): Promise<Fixture> {
  maturity = (await now()) + 31536000n
  signers = await ethers.getSigners()

  const constructor = await constructorFixture(1n << 150n, 1n << 150n, maturity, signers[0])

  return constructor
}

describe('Borrow Given Debt', () => {
  it('Succeeded', async () => {
    const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
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
            borrowGivenDebtParamsList: fc.array(fc.record({
              assetOut: fc.bigUintN(30),
              debtIn: fc.bigUintN(112),
              maxCollateral: fc.bigUintN(112),
            }),{minLength: 5, maxLength:10})
          })
          .filter((x) => BorrowFilter.borrowGivenMultipleDebtSuccess(x, currentTime + 5_000n, currentTime + 10_000n, maturity))
          .noShrink(),
        async (data) => {
          const repayData = {
            ids : [0n,1n],
            maxAssetsIn: [data.newLiquidityParams.debtIn]
          }
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], data.newLiquidityParams)
            await setTime(Number(currentTime + 10000n))
            let currentFixture = newLiquidity
            for(let i =0;i<data.borrowGivenDebtParamsList.length;i++){
              await setTime(Number(currentTime + ((5000n)*BigInt(i+3))))
              currentFixture = await  borrowGivenDebtFixture(currentFixture, signers[0], data.borrowGivenDebtParamsList[i])
            }
            const repay = await repayFixture(currentFixture,signers[0],repayData)
            return repay
          }

          // await borrowGivenDebtProperties(data, currentTime, success, assetToken.address, collateralToken.address)
        }
      ),
      { skipAllAfterTimeLimit: 50000, numRuns: 10 }
    )
  }).timeout(600000)


})

async function borrowGivenDebtProperties(
  data: {
    newLiquidityParams: {
      assetIn: bigint
      debtIn: bigint
      collateralIn: bigint
    }
    borrowGivenDebtParams: {
      assetOut: bigint
      debtIn: bigint
      maxCollateral: bigint
    }
  },
  currentTime: bigint,
  success: () => Promise<{
    convenience: Convenience
    assetToken: TestToken
    collateralToken: TestToken
    maturity: bigint
  }>,
  assetAddress: string,
  collateralAddress: string
) {
  //console.log(.*)
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
  const { yIncreaseBorrowGivenDebt, zIncreaseBorrowGivenDebt } = BorrowMath.getYandZIncreaseBorrowGivenDebt(
    state,
    data.borrowGivenDebtParams.assetOut,
    result.maturity,
    currentTime + 10_000n,
    data.borrowGivenDebtParams.debtIn
  )

  const delState = {
    x: data.borrowGivenDebtParams.assetOut,
    y: yIncreaseBorrowGivenDebt,
    z: zIncreaseBorrowGivenDebt,
  }

  const debt = BorrowMath.getDebt(delState, maturity, currentTime + 10_000n)
  const collateral = BorrowMath.getCollateral(state, delState, maturity, currentTime + 10_000n)
  //console.log(.*)

  const natives = await result.convenience.getNatives(assetAddress, collateralAddress, maturity)
  const cdToken = CollateralizedDebt__factory.connect(natives.collateralizedDebt, ethers.provider)

  const cdTokenBalance = await cdToken.dueOf(1)
  const debtContract = cdTokenBalance.debt.toBigInt()
  const collateralContract = cdTokenBalance.collateral.toBigInt()

  expect(debtContract).equalBigInt(debt)
  expect(collateralContract).equalBigInt(collateral)
}
