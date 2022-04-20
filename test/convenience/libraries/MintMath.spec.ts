import * as MintMath from '../../libraries/LiquidityMath'
import {
  constructorFixture,
  Fixture,
  mintMathCalleeGivenAssetFixture,
  mintMathCalleeGivenCollateralFixture,
  mintMathCalleeGivenDebtFixture,
  mintMathCalleeGivenNewFixture,
  newLiquidityFixture,
} from '../../shared/Fixtures'
import * as fc from 'fast-check'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { now, setTime } from '../../shared/Helper'
import * as LiquidityFilter from '../../filters/Liquidity'
import * as LiquidityMath from '../../libraries/LiquidityMath'
import { expect } from '../../shared/Expect'
import { PROTOCOL_FEE } from '../../shared/Constants'

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

const newLiquiditytestCases = [
  {
    assetIn: 9999n,
    debtIn: 12000n,
    collateralIn: 1000n,
  },
]
const liquidityGivenAssetTestCases = [
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    liquidityGivenAssetParams: {
      assetIn: 9000n,
      minLiquidity: 5700000n,
      maxDebt: 12000n,
      maxCollateral: 10000n,
    },
  },
  // {
  //   newLiquidityParams: {
  //     assetIn: 10000n,
  //     debtIn: 12000n,
  //     collateralIn: 1000n,
  //   },
  //   liquidityGivenAssetParams: {
  //     assetIn: 100000n,
  //     minLiquidity: 3000000n,
  //     maxDebt: 110000n,
  //     maxCollateral: 90000n,
  //   },
  // },
  // {
  //   newLiquidityParams: {
  //     assetIn: 100000n,
  //     debtIn: 130000n,
  //     collateralIn: 1000n,
  //   },
  //   liquidityGivenAssetParams: {
  //     assetIn: 10000n,
  //     minLiquidity: 5700000n,
  //     maxDebt: 12000n,
  //     maxCollateral: 10000n,
  //   },
  // },
  // {
  //   newLiquidityParams: {
  //     assetIn: 10000n,
  //     debtIn: 12000n,
  //     collateralIn: 1000n,
  //   },
  //   liquidityGivenAssetParams: {
  //     assetIn: 10000n,
  //     minLiquidity: 5700000n,
  //     maxDebt: 12000n,
  //     maxCollateral: 10000n,
  //   },
  // },
  // {
  //   newLiquidityParams: {
  //     assetIn: 10000n,
  //     debtIn: 12000n,
  //     collateralIn: 1000n,
  //   },
  //   liquidityGivenAssetParams: {
  //     assetIn: 10000n,
  //     minLiquidity: 5700000n,
  //     maxDebt: 12000n,
  //     maxCollateral: 10000n,
  //   },
  // },
  // {
  //   newLiquidityParams: {
  //     assetIn: 10000n,
  //     debtIn: 12000n,
  //     collateralIn: 1000n,
  //   },
  //   liquidityGivenAssetParams: {
  //     assetIn: 10000n,
  //     minLiquidity: 5700000n,
  //     maxDebt: 12000n,
  //     maxCollateral: 10000n,
  //   },
  // },
  // {
  //   newLiquidityParams: {
  //     assetIn: 10000n,
  //     debtIn: 12000n,
  //     collateralIn: 1000n,
  //   },
  //   liquidityGivenAssetParams: {
  //     assetIn: 10000n,
  //     minLiquidity: 5700000n,
  //     maxDebt: 12000n,
  //     maxCollateral: 10000n,
  //   },
  // },
  // {
  //   newLiquidityParams: {
  //     assetIn: 10000n,
  //     debtIn: 12000n,
  //     collateralIn: 1000n,
  //   },
  //   liquidityGivenAssetParams: {
  //     assetIn: 10000n,
  //     minLiquidity: 5700000n,
  //     maxDebt: 12000n,
  //     maxCollateral: 10000n,
  //   },
  // },
  // {
  //   newLiquidityParams: {
  //     assetIn: 10000n,
  //     debtIn: 12000n,
  //     collateralIn: 1000n,
  //   },
  //   liquidityGivenAssetParams: {
  //     assetIn: 10000n,
  //     minLiquidity: 5700000n,
  //     maxDebt: 12000n,
  //     maxCollateral: 10000n,
  //   },
  // },
]

const liquidityGivenDebtTestCases = [
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    liquidityGivenDebtParams: {
      debtIn: 10000n,
      minLiquidity: 1000n,
      maxAsset: 15000n,
      maxCollateral: 2000n,
    },
  },
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    liquidityGivenDebtParams: {
      debtIn: 100000n,
      minLiquidity: 10000n,
      maxAsset: 150000n,
      maxCollateral: 20000n,
    },
  },
]
const liquidityGivenCollateralTestCases = [
  {
    newLiquidityParams: {
      assetIn: 10000n,
      debtIn: 12000n,
      collateralIn: 1000n,
    },
    liquidityGivenCollateralParams: {
      collateralIn: 10000n,
      minLiquidity: 1000n,
      maxDebt: 1000n,
      maxAsset: 15000n,
    },
  },
]

describe('Mint Math Given New', () => {
  newLiquiditytestCases.forEach((testCase, index) => {
    it('Succeeded', async () => {
      const { maturity } = await loadFixture(fixture)
      let currentTime = await now()

      const success = async () => {
        const constructor = await loadFixture(fixture)
        await setTime(Number(currentTime + 5000n))

        const mintMath = await mintMathCalleeGivenNewFixture(constructor, signers[0], testCase)

        return mintMath
      }
      const [xIncrease, yIncrease, zIncrease] = (await loadFixture(success)).map((x) => x.toBigInt())
      mintMathNewProperties(testCase, currentTime, maturity, xIncrease, yIncrease, zIncrease)
    })
  })
})
describe('Mint Math Given Asset', () => {
  liquidityGivenAssetTestCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityFixture(constructorFixture, signers[0], testCase.newLiquidityParams)
      await setTime(Number(currentTime + 10000n))
      const [xIncrease, yIncrease, zIncrease] = await (
        await mintMathCalleeGivenAssetFixture(newLiquidity, signers[0], testCase.liquidityGivenAssetParams)
      ).map((x) => x.toBigInt())

      await mintMathGivenAssetProperties(testCase, currentTime, maturity, xIncrease, yIncrease, zIncrease)
    })
  })
})
describe('Mint Math Given Debt', () => {
  liquidityGivenDebtTestCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityFixture(constructorFixture, signers[0], testCase.newLiquidityParams)
      await setTime(Number(currentTime + 10000n))
      const [xIncrease, yIncrease, zIncrease] = await (
        await mintMathCalleeGivenDebtFixture(newLiquidity, signers[0], testCase.liquidityGivenDebtParams)
      ).map((x) => x.toBigInt())

      await mintMathGivenDebtProperties(testCase, currentTime, maturity, xIncrease, yIncrease, zIncrease)
    })
  })
})
describe('Mint Math Given Collateral', () => {
  liquidityGivenCollateralTestCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityFixture(constructorFixture, signers[0], testCase.newLiquidityParams)
      await setTime(Number(currentTime + 10000n))
      const [xIncrease, yIncrease, zIncrease] = await (
        await mintMathCalleeGivenCollateralFixture(newLiquidity, signers[0], testCase.liquidityGivenCollateralParams)
      ).map((x) => x.toBigInt())

      await mintMathGivenCollateralProperties(testCase, currentTime, maturity, xIncrease, yIncrease, zIncrease)
    })
  })
})

function mintMathNewProperties(
  data: {
    assetIn: bigint
    debtIn: bigint
    collateralIn: bigint
  },
  currentTime: bigint,
  maturity: bigint,
  xIncrease: bigint,
  yIncrease: bigint,
  zIncrease: bigint
) {
  const maybeNewMintParams = LiquidityMath.getNewLiquidityParams(
    data.assetIn,
    data.debtIn,
    data.collateralIn,
    currentTime + 5_000n,
    maturity
  )
  let { xIncreaseNewLiquidity, yIncreaseNewLiquidity, zIncreaseNewLiquidity } = {
    xIncreaseNewLiquidity: 0n,
    yIncreaseNewLiquidity: 0n,
    zIncreaseNewLiquidity: 0n,
  }
  if (maybeNewMintParams != false) {
    xIncreaseNewLiquidity = maybeNewMintParams.xIncreaseNewLiquidity
    yIncreaseNewLiquidity = maybeNewMintParams.yIncreaseNewLiquidity
    zIncreaseNewLiquidity = maybeNewMintParams.zIncreaseNewLiquidity
  }

  expect(xIncrease).equalBigInt(xIncreaseNewLiquidity)
  expect(yIncrease).equalBigInt(yIncreaseNewLiquidity)
  expect(zIncrease).equalBigInt(zIncreaseNewLiquidity)
}

async function mintMathGivenAssetProperties(
  data: {
    newLiquidityParams: {
      assetIn: bigint
      debtIn: bigint
      collateralIn: bigint
    }
    liquidityGivenAssetParams: {
      assetIn: bigint
      minLiquidity: bigint
      maxDebt: bigint
      maxCollateral: bigint
    }
  },
  currentTime: bigint,
  maturity: bigint,
  xIncrease: bigint,
  yIncrease: bigint,
  zIncrease: bigint
) {
  const maybeNewMintParams = LiquidityMath.getNewLiquidityParams(
    data.newLiquidityParams.assetIn,
    data.newLiquidityParams.debtIn,
    data.newLiquidityParams.collateralIn,
    currentTime + 5_000n,
    maturity
  )
  let { xIncreaseNewLiquidity, yIncreaseNewLiquidity, zIncreaseNewLiquidity } = {
    xIncreaseNewLiquidity: 0n,
    yIncreaseNewLiquidity: 0n,
    zIncreaseNewLiquidity: 0n,
  }
  if (maybeNewMintParams != false) {
    xIncreaseNewLiquidity = maybeNewMintParams.xIncreaseNewLiquidity
    yIncreaseNewLiquidity = maybeNewMintParams.yIncreaseNewLiquidity
    zIncreaseNewLiquidity = maybeNewMintParams.zIncreaseNewLiquidity
  }

  const state = {
    x: xIncreaseNewLiquidity,
    y: yIncreaseNewLiquidity,
    z: zIncreaseNewLiquidity,
  }
  const { xIncreaseAddLiqudity, yIncreaseAddLiquidity, zIncreaseAddLiquidity } =
    LiquidityMath.getLiquidityGivenAssetParams(state, data.liquidityGivenAssetParams.assetIn, 0n)
  const delState = {
    x: xIncreaseAddLiqudity,
    y: yIncreaseAddLiquidity,
    z: zIncreaseAddLiquidity,
  }
  expect(xIncrease).equalBigInt(xIncreaseAddLiqudity)
  expect(yIncrease).equalBigInt(yIncreaseAddLiquidity)
  expect(zIncrease).equalBigInt(zIncreaseAddLiquidity)
}

async function mintMathGivenDebtProperties(
  data: {
    newLiquidityParams: {
      assetIn: bigint
      debtIn: bigint
      collateralIn: bigint
    }
    liquidityGivenDebtParams: {
      debtIn: bigint
      minLiquidity: bigint
      maxAsset: bigint
      maxCollateral: bigint
    }
  },
  currentTime: bigint,
  maturity: bigint,
  xIncrease: bigint,
  yIncrease: bigint,
  zIncrease: bigint
) {
  const maybeNewMintParams = LiquidityMath.getNewLiquidityParams(
    data.newLiquidityParams.assetIn,
    data.newLiquidityParams.debtIn,
    data.newLiquidityParams.collateralIn,
    currentTime + 5_000n,
    maturity
  )
  let { xIncreaseNewLiquidity, yIncreaseNewLiquidity, zIncreaseNewLiquidity } = {
    xIncreaseNewLiquidity: 0n,
    yIncreaseNewLiquidity: 0n,
    zIncreaseNewLiquidity: 0n,
  }
  if (maybeNewMintParams != false) {
    xIncreaseNewLiquidity = maybeNewMintParams.xIncreaseNewLiquidity
    yIncreaseNewLiquidity = maybeNewMintParams.yIncreaseNewLiquidity
    zIncreaseNewLiquidity = maybeNewMintParams.zIncreaseNewLiquidity
  }

  const state = {
    x: xIncreaseNewLiquidity,
    y: yIncreaseNewLiquidity,
    z: zIncreaseNewLiquidity,
  }
  const { xIncreaseAddLiquidity, yIncreaseAddLiquidity, zIncreaseAddLiquidity } =
    LiquidityMath.getIncreaseAddLiquidityGivenDebtParams(
      state,
      data.liquidityGivenDebtParams.debtIn,
      maturity,
      currentTime + 10000n
    )
  const delState = {
    x: xIncreaseAddLiquidity,
    y: yIncreaseAddLiquidity,
    z: zIncreaseAddLiquidity,
  }
  expect(xIncrease).equalBigInt(xIncreaseAddLiquidity)
  expect(yIncrease).equalBigInt(yIncreaseAddLiquidity)
  expect(zIncrease).equalBigInt(zIncreaseAddLiquidity)
}

async function mintMathGivenCollateralProperties(
  data: {
    newLiquidityParams: {
      assetIn: bigint
      debtIn: bigint
      collateralIn: bigint
    }
    liquidityGivenCollateralParams: {
      collateralIn: bigint
      minLiquidity: bigint
      maxDebt: bigint
      maxAsset: bigint
    }
  },
  currentTime: bigint,
  maturity: bigint,
  xIncrease: bigint,
  yIncrease: bigint,
  zIncrease: bigint
) {
  const result = fixture

  const maybeNewMintParams = LiquidityMath.getNewLiquidityParams(
    data.newLiquidityParams.assetIn,
    data.newLiquidityParams.debtIn,
    data.newLiquidityParams.collateralIn,
    currentTime + 5_000n,
    maturity
  )
  let { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = { yIncreaseNewLiquidity: 0n, zIncreaseNewLiquidity: 0n }
  if (maybeNewMintParams != false) {
    yIncreaseNewLiquidity = maybeNewMintParams.yIncreaseNewLiquidity
    zIncreaseNewLiquidity = maybeNewMintParams.zIncreaseNewLiquidity
  }

  const state = {
    x: data.newLiquidityParams.assetIn,
    y: yIncreaseNewLiquidity,
    z: zIncreaseNewLiquidity,
  }
  const { xIncreaseAddLiquidity, yIncreaseAddLiquidity, zIncreaseAddLiquidity } =
    LiquidityMath.getAddLiquidityGivenCollateralParams(
      state,
      data.liquidityGivenCollateralParams.collateralIn,
      maturity,
      currentTime
    )
  const delState = {
    x: xIncreaseAddLiquidity,
    y: yIncreaseAddLiquidity,
    z: zIncreaseAddLiquidity,
  }
}
