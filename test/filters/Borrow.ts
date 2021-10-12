import * as LiquidityMath from '../libraries/LiquidityMath'
import * as BorrowMath from '../libraries/BorrowMath'
import {
  AddLiquidityParams,
  AddLiquidityParamsUint,
  NewLiquidityParams,
  NewLiquidityParamsUint,
  BorrowGivenPercentParams,
  BorrowGivenDebtParams,
  BorrowGivenCollateralParams,
} from '../types'
import { objectMap, UToBObj } from '../shared/Helper'
import { Uint112 } from '@timeswap-labs/timeswap-v1-sdk-core'
const MAXUINT112: bigint = 2n ** 112n - 1n

export function borrowGivenPercentSuccess(
  liquidityParams: {
    newLiquidityParams: NewLiquidityParams
    borrowGivenPercentParams: BorrowGivenPercentParams
  },
  currentTimeNL: bigint,
  currentTimeB: bigint,
  maturity: bigint
) {
  const { newLiquidityParams, borrowGivenPercentParams } = liquidityParams

  if (borrowGivenPercentParams.assetOut <= 0 || borrowGivenPercentParams.percent > 0x100000000n) {
    return false
  }
  const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = LiquidityMath.getYandZIncreaseNewLiquidity(
    newLiquidityParams.assetIn,
    newLiquidityParams.debtIn,
    newLiquidityParams.collateralIn,
    currentTimeNL,
    maturity
  )
  const state = { x: newLiquidityParams.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity }

  if (state.x <= borrowGivenPercentParams.assetOut) {
    return false
  }

  const { yIncreaseBorrowGivenPercent, zIncreaseBorrowGivenPercent } = BorrowMath.getYandZIncreaseBorrowGivenPercent(
    state,
    borrowGivenPercentParams.assetOut,
    borrowGivenPercentParams.percent
  )

  if (
    !(
      yIncreaseBorrowGivenPercent > 0n &&
      zIncreaseBorrowGivenPercent > 0n &&
      yIncreaseBorrowGivenPercent + state.y <= MAXUINT112 &&
      zIncreaseBorrowGivenPercent + state.z <= MAXUINT112 &&
      state.x - borrowGivenPercentParams.assetOut > 0n
    )
  ) {
    return false
  }

  const delState = {
    x: borrowGivenPercentParams.assetOut,
    y: yIncreaseBorrowGivenPercent,
    z: zIncreaseBorrowGivenPercent,
  }
  const debt = BorrowMath.getDebt(delState, maturity, currentTimeB)
  const collateral = BorrowMath.getCollateral(state, delState, maturity, currentTimeB)

  if (
    borrowGivenPercentParams.maxDebt < debt ||
    borrowGivenPercentParams.maxCollateral < collateral ||
    debt > MAXUINT112 ||
    collateral > MAXUINT112
  )
    return false

  return true
}

export function borrowGivenDebtSuccess(
  liquidityParams: {
    newLiquidityParams: NewLiquidityParams
    borrowGivenDebtParams: BorrowGivenDebtParams
  },
  currentTimeNL: bigint,
  currentTimeB: bigint,
  maturity: bigint
) {
  const { newLiquidityParams, borrowGivenDebtParams } = liquidityParams

  if (borrowGivenDebtParams.assetOut <= 0) {
    return false
  }
  const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = LiquidityMath.getYandZIncreaseNewLiquidity(
    newLiquidityParams.assetIn,
    newLiquidityParams.debtIn,
    newLiquidityParams.collateralIn,
    currentTimeNL,
    maturity
  )
  const state = { x: newLiquidityParams.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity }

  if (state.x <= borrowGivenDebtParams.assetOut) {
    return false
  }

  const { yIncreaseBorrowGivenDebt, zIncreaseBorrowGivenDebt } = BorrowMath.getYandZIncreaseBorrowGivenDebt(
    state,
    borrowGivenDebtParams.assetOut,
    maturity,
    currentTimeB,
    borrowGivenDebtParams.debtIn
  )

  if (
    !(
      yIncreaseBorrowGivenDebt > 0n &&
      zIncreaseBorrowGivenDebt > 0n &&
      yIncreaseBorrowGivenDebt + state.y <= MAXUINT112 &&
      zIncreaseBorrowGivenDebt + state.z <= MAXUINT112 &&
      state.x - borrowGivenDebtParams.assetOut > 0n
    )
  ) {
    return false
  }

  const delState = {
    x: borrowGivenDebtParams.assetOut,
    y: yIncreaseBorrowGivenDebt,
    z: zIncreaseBorrowGivenDebt,
  }
  const debt = BorrowMath.getDebt(delState, maturity, currentTimeB)
  const collateral = BorrowMath.getCollateral(state, delState, maturity, currentTimeB)

  if (debt <= 0 || borrowGivenDebtParams.maxCollateral < collateral || debt > MAXUINT112 || collateral > MAXUINT112)
    return false

  return true
}

export function borrowGivenCollateralSuccess(
  liquidityParams: {
    newLiquidityParams: NewLiquidityParams
    borrowGivenCollateralParams: BorrowGivenCollateralParams
  },
  currentTimeNL: bigint,
  currentTimeB: bigint,
  maturity: bigint
) {
  const { newLiquidityParams, borrowGivenCollateralParams } = liquidityParams

  if (borrowGivenCollateralParams.assetOut <= 0) {
    return false
  }
  const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = LiquidityMath.getYandZIncreaseNewLiquidity(
    newLiquidityParams.assetIn,
    newLiquidityParams.debtIn,
    newLiquidityParams.collateralIn,
    currentTimeNL,
    maturity
  )
  const state = { x: newLiquidityParams.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity }

  if (state.x <= borrowGivenCollateralParams.assetOut) {
    return false
  }

  const { yIncreaseBorrowGivenCollateral, zIncreaseBorrowGivenCollateral } =
    BorrowMath.getYandZIncreaseBorrowGivenCollateral(
      state,
      borrowGivenCollateralParams.assetOut,
      maturity,
      currentTimeB,
      borrowGivenCollateralParams.collateralIn
    )

  if (
    !(
      yIncreaseBorrowGivenCollateral > 0n &&
      zIncreaseBorrowGivenCollateral > 0n &&
      yIncreaseBorrowGivenCollateral + state.y <= MAXUINT112 &&
      zIncreaseBorrowGivenCollateral + state.z <= MAXUINT112 &&
      state.x - borrowGivenCollateralParams.assetOut > 0n
    )
  ) {
    return false
  }

  const delState = {
    x: borrowGivenCollateralParams.assetOut,
    y: yIncreaseBorrowGivenCollateral,
    z: zIncreaseBorrowGivenCollateral,
  }
  const debt = BorrowMath.getDebt(delState, maturity, currentTimeB)
  const collateral = BorrowMath.getCollateral(state, delState, maturity, currentTimeB)

  if (borrowGivenCollateralParams.maxDebt < debt || collateral <= 0 || debt > MAXUINT112 || collateral > MAXUINT112)
    return false

  return true
}

export default {
  borrowGivenPercentSuccess,
}
