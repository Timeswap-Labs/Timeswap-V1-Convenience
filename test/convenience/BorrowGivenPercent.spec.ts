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
  newLiquidityETHAssetFixture,
  borrowGivenPercentETHAssetFixture,
  newLiquidityETHCollateralFixture,
  borrowGivenPercentETHCollateralFixture,
} from '../shared/Fixtures'

import * as fc from 'fast-check'
import { LiquidityGivenAssetParams, NewLiquidityParams } from '../types'
import { CollateralizedDebt__factory, ERC20__factory, TestToken } from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Convenience } from '../shared/Convenience'
import { FEE, PROTOCOL_FEE } from '../shared/Constants'
import { borrowGivenPercentTestCases as testCases } from '../test-cases/index'

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

describe('Borrow Given Percent', () => {
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

      await borrowGivenPercentProperties(
        testCase,
        currentTime,
        borrowGivenPercent,
        assetToken.address,
        collateralToken.address
      )
    })
  })
})

describe('Borrow Given Percent ETH Asset', () => {
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

      await borrowGivenPercentProperties(
        testCase,
        currentTime,
        borrowGivenPercent,
        convenience.wethContract.address,
        collateralToken.address
      )
    })
  })
})

describe('Borrow Given Percent ETH Collateral', () => {
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

      await borrowGivenPercentProperties(
        testCase,
        currentTime,
        borrowGivenPercent,
        assetToken.address,
        convenience.wethContract.address
      )
    })
  })
})

async function borrowGivenPercentProperties(
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

  const debt = BorrowMath.getDebt(delState, maturity, currentTime + 10_000n)
  const collateral = BorrowMath.getCollateral(state, delState, maturity, currentTime + 10_000n)

  const natives = await result.convenience.getNatives(assetAddress, collateralAddress, maturity)
  const cdToken = CollateralizedDebt__factory.connect(natives.collateralizedDebt, ethers.provider)

  const cdTokenBalance = await cdToken.dueOf(1)
  const debtContract = cdTokenBalance.debt.toBigInt()
  const collateralContract = cdTokenBalance.collateral.toBigInt()

  expect(debtContract).equalBigInt(debt)
  expect(collateralContract).equalBigInt(collateral)
}
