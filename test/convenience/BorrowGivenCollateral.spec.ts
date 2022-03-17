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
  borrowGivenCollateralFixture,
  borrowGivenCollateralETHAssetFixture,
  newLiquidityETHAssetFixture,
  borrowGivenCollateralETHCollateralFixture,
  newLiquidityETHCollateralFixture,
} from '../shared/Fixtures'

import * as fc from 'fast-check'
import { LiquidityGivenAssetParams, NewLiquidityParams } from '../types'
import { CollateralizedDebt__factory, ERC20__factory, TestToken } from '../../typechain'
// import * as LiquidityFilter from '../filters/Liquidity'
// import * as BorrowFilter from '../filters/Borrow'
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

const testCases = [
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    borrowGivenCollateralParams: {
      assetOut: 1000n,
      collateralIn: 90n,
      maxDebt: 2000n,
    },
  },
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    borrowGivenCollateralParams: {
      assetOut: 2000n,
      collateralIn: 190n,
      maxDebt: 3000n,
    },
  },
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    borrowGivenCollateralParams: {
      assetOut: 5000n,
      collateralIn: 920n,
      maxDebt: 10000n,
    },
  },
]

describe('Borrow Given Collateral', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityFixture(constructorFixture, signers[0], testCase.newLiquidityParams)
      await setTime(Number(currentTime + 10000n))
      const borrow = await borrowGivenCollateralFixture(newLiquidity, signers[0], testCase.borrowGivenCollateralParams)

      await borrowGivenCollateralProperties(testCase, currentTime, borrow, assetToken.address, collateralToken.address)
    })
  })
})

describe('Borrow Given Collateral ETH Asset', () => {
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
      const borrow = await borrowGivenCollateralETHAssetFixture(
        newLiquidity,
        signers[0],
        testCase.borrowGivenCollateralParams
      )

      await borrowGivenCollateralProperties(
        testCase,
        currentTime,
        borrow,
        convenience.wethContract.address,
        collateralToken.address
      )
    })
  })
})

describe('Borrow Given Collateral ETH Collateral', () => {
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
      const borrow = await borrowGivenCollateralETHCollateralFixture(
        newLiquidity,
        signers[0],
        testCase.borrowGivenCollateralParams
      )

      await borrowGivenCollateralProperties(
        testCase,
        currentTime,
        borrow,
        assetToken.address,
        convenience.wethContract.address
      )
    })
  })
})

async function borrowGivenCollateralProperties(
  data: {
    newLiquidityParams: {
      assetIn: bigint
      debtIn: bigint
      collateralIn: bigint
    }
    borrowGivenCollateralParams: {
      assetOut: bigint
      collateralIn: bigint
      maxDebt: bigint
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

  // const result = await loadFixture(success)
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
  const { xDecrease, yIncrease, zIncrease } = BorrowMath.getBorrowGivenCollateralParams(
    state,
    PROTOCOL_FEE,
    FEE,
    data.borrowGivenCollateralParams.assetOut,
    result.maturity,
    currentTime + 10_000n,
    data.borrowGivenCollateralParams.collateralIn
  )

  const delState = {
    x: xDecrease,
    y: yIncrease,
    z: zIncrease,
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

  console.log(data.borrowGivenCollateralParams.collateralIn)
  console.log(collateral)
  expect(data.borrowGivenCollateralParams.collateralIn).gteBigInt(collateral)
}
