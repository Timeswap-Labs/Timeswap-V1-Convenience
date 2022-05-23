import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftRightUp, mulDivUp, advanceTimeAndBlock, setTime, divUp } from '../../shared/Helper'
import { expect } from '../../shared/Expect'
import * as LiquidityMath from '../../libraries/LiquidityMath'
import * as LendMath from '../../libraries/LendMath'
import * as BorrowMath from '../../libraries/BorrowMath'
import {
  newLiquidityFixture,
  constructorFixture,
  Fixture,
  lendGivenPercentFixture,
  lendGivenPercentETHAssetFixture,
  lendGivenPercentETHCollateralFixture,
  newLiquidityETHAssetFixture,
  newLiquidityETHCollateralFixture,
  lendMathGivenPercentFixture,
  borrowMathGivenPercentFixture,
} from '../../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { LendGivenPercentParams, NewLiquidityParams } from '../../types'
import {
  BondInterest__factory,
  BondPrincipal__factory,
  ERC20__factory,
  InsuranceInterest__factory,
  InsurancePrincipal__factory,
  TestToken,
} from '../../../typechain'
import * as LiquidityFilter from '../../filters/Liquidity'
import { Convenience } from '../../shared/Convenience'
import { FEE, PROTOCOL_FEE } from '../../shared/Constants'
import { lendGivenPercentTestCases, yMinLendTestCases as lendTestCases } from '../../test-cases/index'
import { yMinBorrowTestCases as borrowTestCases } from '../../test-cases/index'

const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n

async function fixture(): Promise<Fixture> {
  maturity = (await now()) + 3153600000n
  signers = await ethers.getSigners()

  const constructor = await constructorFixture(1n << 255n, 1n << 255n, maturity, signers[0])

  return constructor
}

describe('YMin Math Lend', () => {
  async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 3153600000n
    signers = await ethers.getSigners()

    const constructor = await constructorFixture(1n << 255n, 1n << 255n, maturity, signers[0])

    return constructor
  }
  lendTestCases.forEach((testCase, index) => {
    it('Succeeded', async () => {
      const { maturity } = await loadFixture(fixture)
      let currentTime = await now()

      const success = async () => {
        const constructor = await loadFixture(fixture)
        await setTime(Number(currentTime + 5000n))
        const newLiquidity = await newLiquidityFixture(constructor, signers[0], testCase.newLiquidityParams)
        await setTime(Number(currentTime + 10000n))
        const lendGivenBond = await lendMathGivenPercentFixture(
          newLiquidity,
          signers[0],
          testCase.lendGivenPercentParams
        )
        return lendGivenBond
      }

      const [xIncrease, yDecrease, zDecrease] = (await loadFixture(success)).map((x) => x.toBigInt())


      await lendMathGivenPercentProperties(testCase, currentTime, maturity, yDecrease, zDecrease)
    }).timeout(100000)
  })
})
describe('YMin Math Borrow', () => {
    async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 3156n
    signers = await ethers.getSigners()

    const constructor = await constructorFixture(1n << 255n, 1n << 255n, maturity, signers[0])

    return constructor
  }
  borrowTestCases.forEach((testCase, index) => {
    it('Succeeded', async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const success = async () => {
        const constructor = await loadFixture(fixture)
        await setTime(Number(currentTime + 50n))
        const newLiquidity = await newLiquidityFixture(constructor, signers[0], testCase.newLiquidityParams)
        await setTime(Number(currentTime + 100n))
        const borrowGivenPercent = await borrowMathGivenPercentFixture(
          newLiquidity,
          signers[0],
          testCase.borrowGivenPercentParams
        )
        return borrowGivenPercent
      }
      const [xDecrease, yIncrease, zIncrease] = (await loadFixture(success)).map((x) => x.toBigInt())
      await borrowMathGivenPercentProperties(testCase, currentTime, maturity, yIncrease, zIncrease)
    }).timeout(600000)
  })
})


async function lendMathGivenPercentProperties(
  data: {
    newLiquidityParams: {
      assetIn: bigint
      debtIn: bigint
      collateralIn: bigint
    }
    lendGivenPercentParams: {
      assetIn: bigint
      percent: bigint
      minBond: bigint
      minInsurance: bigint
    }
  },
  currentTime: bigint,
  maturity: bigint,
  yDecrease: bigint,
  zDecrease: bigint
) {
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
  const lendGivenPercentParamsFromConv = LendMath.getLendGivenPercentParams(
    state,
    maturity,
    currentTime + 10_000n,

    FEE,
    PROTOCOL_FEE,

    data.lendGivenPercentParams.assetIn,
    data.lendGivenPercentParams.percent
  )
  const yMin = (lendGivenPercentParamsFromConv.xIncrease*state.y/(state.x+lendGivenPercentParamsFromConv.xIncrease))>>4n
  expect(yDecrease).gteBigInt(yMin)
  expect(yDecrease).equalBigInt(lendGivenPercentParamsFromConv.yDecrease)
  expect(zDecrease).equalBigInt(lendGivenPercentParamsFromConv.zDecrease)
}

async function borrowMathGivenPercentProperties(
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
  maturity: bigint,
  yIncrease: bigint,
  zIncrease: bigint
) {
  const neededTime = (await now()) + 100n

  let [xIncreaseNewLiquidity, yIncreaseNewLiquidity, zIncreaseNewLiquidity] = [0n, 0n, 0n]

  const maybeNewLiq = LiquidityMath.getNewLiquidityParams(
    data.newLiquidityParams.assetIn,
    data.newLiquidityParams.debtIn,
    data.newLiquidityParams.collateralIn,
    currentTime + 5_0n,
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
  const borrowGivenPercentParams = BorrowMath.getBorrowGivenPercentParams(
    state,
    PROTOCOL_FEE,
    FEE,
    data.borrowGivenPercentParams.assetOut,
    maturity,
    currentTime +1_00n,
    data.borrowGivenPercentParams.percent
  )
  const yMin = shiftRightUp( divUp((borrowGivenPercentParams.xDecrease*state.y),(borrowGivenPercentParams.xDecrease-state.x)),4n)
  console.log('yMin',yMin);
  console.log('yIncrease',yIncrease);
  expect(yIncrease).gteBigInt(yMin)
  expect(yIncrease).equalBigInt(borrowGivenPercentParams.yIncrease)
  expect(zIncrease).equalBigInt(borrowGivenPercentParams.zIncrease)
}
