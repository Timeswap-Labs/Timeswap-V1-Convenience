import {
  borrowMathGivenCollateralFixture,
  borrowMathGivenDebtFixture,
  borrowMathGivenPercentFixture,
  constructorFixture,
  Fixture,
  lendMathGivenBondFixture,
  lendMathGivenInsuranceFixture,
  lendMathGivenPercentFixture,
  mintMathCalleeGivenAssetFixture,
  mintMathCalleeGivenNewFixture,
  newLiquidityFixture,
} from '../../shared/Fixtures'
import * as fc from 'fast-check'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { now, setTime } from '../../shared/Helper'
import * as LiquidityFilter from '../../filters/Liquidity'
import * as LiquidityMath from '../../libraries/LiquidityMath'
import * as BorrowMath from '../../libraries/BorrowMath'
import { expect } from '../../shared/Expect'
import { FEE, PROTOCOL_FEE } from '../../shared/Constants'
import { constants } from 'perf_hooks'

const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n
async function fixture(): Promise<Fixture> {
  maturity = (await now()) + 31536000n
  signers = await ethers.getSigners()

  const constructor = await constructorFixture(1n << 255n, 1n << 255n, maturity, signers[0])

  return constructor
}

const borrowGivenDebtTestCases = [
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    borrowGivenDebtParams: {
      assetOut: 1000n,
      debtIn: 1010n,
      maxCollateral: 5000n,
    },
  },
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    borrowGivenDebtParams: {
      assetOut: 2000n,
      debtIn: 2247n,
      maxCollateral: 200n,
    },
  },
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    borrowGivenDebtParams: {
      assetOut: 5000n,
      debtIn: 5231n,
      maxCollateral: 1000n,
    },
  },
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    borrowGivenDebtParams: {
      assetOut: 1000n,
      debtIn: 1114n,
      maxCollateral: 100n,
    },
  },
]

const borrowGivenCollateralTestCases = [
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

const borrowGivenPercentTestCases = [
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    borrowGivenPercentParams: {
      assetOut: 1000n,
      percent: 1n << 31n,
      maxDebt: 2000n,
      maxCollateral: 1000n,
    },
  },
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    borrowGivenPercentParams: {
      assetOut: 2000n,
      percent: 2n << 30n,
      maxDebt: 3000n,
      maxCollateral: 5000n,
    },
  },
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    borrowGivenPercentParams: {
      assetOut: 5000n,
      percent: 1n << 29n,
      maxDebt: 10000n,
      maxCollateral: 100000n,
    },
  },
]
describe('Borrow Math Given Debt', () => {
  borrowGivenDebtTestCases.forEach((testCase, index) => {
    it('Succeeded', async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const success = async () => {
        const constructor = await loadFixture(fixture)
        await setTime(Number(currentTime + 5000n))
        const newLiquidity = await newLiquidityFixture(constructor, signers[0], testCase.newLiquidityParams)
        await setTime(Number(currentTime + 10000n))
        const borrowGivenDebt = await borrowMathGivenDebtFixture(
          newLiquidity,
          signers[0],
          testCase.borrowGivenDebtParams
        )
        return borrowGivenDebt
      }
      const [xDecrease, yIncrease, zIncrease] = (await loadFixture(success)).map((x) => x.toBigInt())
      await borrowMathGivenDebtProperties(testCase, currentTime, maturity, yIncrease, zIncrease)
    }).timeout(600000)
  })
})

describe('BorrowMath  Given Collateral', () => {
  borrowGivenCollateralTestCases.forEach((testCase, index) => {
    it('Succeeded', async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const success = async () => {
        const constructor = await loadFixture(fixture)
        await setTime(Number(currentTime + 5000n))
        const newLiquidity = await newLiquidityFixture(constructor, signers[0], testCase.newLiquidityParams)
        await setTime(Number(currentTime + 10000n))
        const borrowGivenCollateral = await borrowMathGivenCollateralFixture(
          newLiquidity,
          signers[0],
          testCase.borrowGivenCollateralParams
        )
        return borrowGivenCollateral
      }
      const [xDecrease, yIncrease, zIncrease] = (await loadFixture(success)).map((x) => x.toBigInt())
      await borrowMathGivenCollateralProperties(testCase, currentTime, maturity, yIncrease, zIncrease)
    }).timeout(600000)
  })
})

describe('Borrow Math Given Percent', () => {
  borrowGivenPercentTestCases.forEach((testCase, index) => {
    it('Succeeded', async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const success = async () => {
        const constructor = await loadFixture(fixture)
        await setTime(Number(currentTime + 5000n))
        const newLiquidity = await newLiquidityFixture(constructor, signers[0], testCase.newLiquidityParams)
        await setTime(Number(currentTime + 10000n))
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

async function borrowMathGivenDebtProperties(
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
  const borrowMathGivenDebt = BorrowMath.getBorrowGivenDebtParams(
    state,
    PROTOCOL_FEE,
    FEE,
    data.borrowGivenDebtParams.assetOut,
    maturity,
    currentTime + 10_000n,
    data.borrowGivenDebtParams.debtIn
  )
  expect(yIncrease).equalBigInt(borrowMathGivenDebt.yIncrease)
  expect(zIncrease).equalBigInt(borrowMathGivenDebt.zIncrease)
}

async function borrowMathGivenCollateralProperties(
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
  const borrowGivenCollateralParms = BorrowMath.getBorrowGivenCollateralParams(
    state,
    PROTOCOL_FEE,
    FEE,
    data.borrowGivenCollateralParams.assetOut,
    maturity,
    currentTime + 10_000n,
    data.borrowGivenCollateralParams.collateralIn
  )

  expect(yIncrease).equalBigInt(borrowGivenCollateralParms.yIncrease)
  expect(zIncrease).equalBigInt(borrowGivenCollateralParms.zIncrease)
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
  const borrowGivenPercentParams = BorrowMath.getBorrowGivenPercentParams(
    state,
    PROTOCOL_FEE,
    FEE,
    data.borrowGivenPercentParams.assetOut,
    maturity,
    currentTime,
    data.borrowGivenPercentParams.percent
  )
  expect(yIncrease).equalBigInt(borrowGivenPercentParams.yIncrease)
  expect(zIncrease).equalBigInt(borrowGivenPercentParams.zIncrease)
}
