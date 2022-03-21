import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftRightUp, mulDivUp, advanceTimeAndBlock, setTime } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import * as BorrowMath from '../libraries/BorrowMath'
import {
  newLiquidityFixture,
  constructorFixture,
  Fixture,
  liquidityGivenAssetFixture,
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
import { LiquidityGivenAssetParams, NewLiquidityParams } from '../types'
import { CollateralizedDebt__factory, ERC20__factory, TestToken } from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'
import {repayTestCases as testCases} from '../test-cases/index'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Convenience } from '../shared/Convenience'
import { FEE, PROTOCOL_FEE } from '../shared/Constants'

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



describe('Repay', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityFixture(constructorFixture, signers[0], testCase.newLiquidityParams)
      await setTime(Number(currentTime + 10000n))
      const borrowGivenPercent = await borrowGivenPercentFixture(
        newLiquidity,
        signers[0],
        testCase.borrowGivenPercentParams
      )
      const repayParams = {
        ids: [0n, 1n],
        maxAssetsIn: [testCase.newLiquidityParams.debtIn, testCase.borrowGivenPercentParams.maxDebt],
      }
      const repay = await repayFixture(borrowGivenPercent, signers[0], repayParams)

      await repayProperties(testCase, repayParams, currentTime, repay, assetToken.address, collateralToken.address)
    })
  })
})

describe('Repay ETH Asset', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, convenience, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityETHAssetFixture(
        constructorFixture,
        signers[0],
        testCase.newLiquidityParams
      )
      await setTime(Number(currentTime + 10000n))
      const borrowGivenPercent = await borrowGivenPercentETHAssetFixture(
        newLiquidity,
        signers[0],
        testCase.borrowGivenPercentParams
      )
      const repayParams = {
        ids: [0n, 1n],
        maxAssetsIn: [testCase.newLiquidityParams.debtIn, testCase.borrowGivenPercentParams.maxDebt],
      }
      const repay = await repayETHAssetFixture(borrowGivenPercent, signers[0], repayParams)

      await repayProperties(
        testCase,
        repayParams,
        currentTime,
        repay,
        convenience.wethContract.address,
        collateralToken.address
      )
    })
  })
})

describe('Repay ETH Collateral', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, convenience, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityETHCollateralFixture(
        constructorFixture,
        signers[0],
        testCase.newLiquidityParams
      )
      await setTime(Number(currentTime + 10000n))
      const borrowGivenPercent = await borrowGivenPercentETHCollateralFixture(
        newLiquidity,
        signers[0],
        testCase.borrowGivenPercentParams
      )
      const repayParams = {
        ids: [0n, 1n],
        maxAssetsIn: [testCase.newLiquidityParams.debtIn, testCase.borrowGivenPercentParams.maxDebt],
      }
      const repay = await repayETHCollateralFixture(borrowGivenPercent, signers[0], repayParams)

      await repayProperties(
        testCase,
        repayParams,
        currentTime,
        repay,
        assetToken.address,
        convenience.wethContract.address
      )
    })
  })
})


async function repayProperties(
  data: {
    newLiquidityParams: {
      assetIn: bigint
      debtIn: bigint
      collateralIn: bigint
    }
    borrowGivenPercentParams: {
      assetOut: bigint
      percent: bigint
      maxDebt: bigint
      maxCollateral: bigint
    }
  },
  repayData: {
    ids: bigint[]
    maxAssetsIn: bigint[]
  },
  currentTime: bigint,
  fixture: {
    convenience: Convenience
    assetToken: TestToken
    collateralToken: TestToken
    maturity: bigint
  },
  assetAddress: string,
  collateralAddress: string
) {
  const neededTime = (await now()) + 100n

  const result = fixture

  let [xIncreaseNewLiquidity, yIncreaseNewLiquidity, zIncreaseNewLiquidity] = [0n, 0n, 0n]
  const maybeNewLiq = LiquidityMath.getNewLiquidityParams(
    data.newLiquidityParams.assetIn,
    data.newLiquidityParams.debtIn,
    data.newLiquidityParams.collateralIn,
    currentTime + 5_000n,
    maturity
  )
  if (maybeNewLiq !== false) {
    xIncreaseNewLiquidity = maybeNewLiq.xIncreaseNewLiquidity
    yIncreaseNewLiquidity = maybeNewLiq.yIncreaseNewLiquidity
    zIncreaseNewLiquidity = maybeNewLiq.zIncreaseNewLiquidity
  }

  const state = {
    x: xIncreaseNewLiquidity,
    y: yIncreaseNewLiquidity,
    z: zIncreaseNewLiquidity,
  }
  const {
    xDecrease: xDecreaseBorrowGivenPercent,
    yIncrease: yIncreaseBorrowGivenPercent,
    zIncrease: zIncreaseBorrowGivenPercent,
  } = BorrowMath.getBorrowGivenPercentParams(
    state,
    PROTOCOL_FEE,
    FEE,
    data.borrowGivenPercentParams.assetOut,
    maturity,
    currentTime + 10_000n,
    data.borrowGivenPercentParams.percent
  )

  const delState = {
    x: xDecreaseBorrowGivenPercent,
    y: yIncreaseBorrowGivenPercent,
    z: zIncreaseBorrowGivenPercent,
  }

  const debt =
    BorrowMath.getDebt(delState, maturity, currentTime + 10_000n) -
    BigInt(repayData.maxAssetsIn.reduce((a, b) => a + b, 0n))
  const collateral = BorrowMath.getCollateral(state, delState, maturity, currentTime + 10_000n)

  const natives = await result.convenience.getNatives(assetAddress, collateralAddress, maturity)
  const cdToken = CollateralizedDebt__factory.connect(natives.collateralizedDebt, ethers.provider)

  const cdTokenBalance = await cdToken.dueOf(1)
  const debtContract = cdTokenBalance.debt.toBigInt()
  const collateralContract = cdTokenBalance.collateral.toBigInt()

  expect(debtContract).equalBigInt(0n)
  expect(collateralContract).equalBigInt(0n)
}
