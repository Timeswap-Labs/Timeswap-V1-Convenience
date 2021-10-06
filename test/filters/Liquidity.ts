import * as LiquidityMath from '../libraries/LiquidityMath'
import { AddLiquidityParams, NewLiquidityParams } from '../types'
const MAXUINT112: bigint = 2n ** 112n


export function newLiquiditySuccess(newLiquidityParams: NewLiquidityParams, currentTime: bigint,maturity:bigint) {
    if (newLiquidityParams.assetIn < 0 || newLiquidityParams.debtIn - newLiquidityParams.assetIn <= 0) {
      return false
    }
    const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = LiquidityMath.getYandZIncreaseNewLiquidity(
      newLiquidityParams.assetIn,
      newLiquidityParams.debtIn,
      newLiquidityParams.collateralIn,
      currentTime,
      maturity
    )

    if (
      !(
        yIncreaseNewLiquidity > 0n &&
        zIncreaseNewLiquidity > 0n &&
        yIncreaseNewLiquidity < MAXUINT112 &&
        zIncreaseNewLiquidity < MAXUINT112
      )
    ) {
      return false
    }
    return true
  }

  export function addLiquiditySuccess(
    liquidityParams: { newLiquidityParams: NewLiquidityParams; addLiquidityParams: AddLiquidityParams },
    currentTimeNL: bigint,
    currentTimeAL: bigint,
    maturity:bigint
  ) {
    const { newLiquidityParams, addLiquidityParams } = liquidityParams

    if (
      (addLiquidityParams.assetIn <= 0 || addLiquidityParams.maxDebt <= 0 ||
      addLiquidityParams.maxCollateral <= 0 ||
      addLiquidityParams.minLiquidity <= 0)
    ) {
      return false
    }
    if (newLiquidityParams.assetIn < 0 || (newLiquidityParams.debtIn - newLiquidityParams.assetIn) <=0) {
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
    const { yIncreaseAddLiquidity, zIncreaseAddLiquidity } = LiquidityMath.getYandZIncreaseAddLiquidity(
      state,
      addLiquidityParams.assetIn
    )

    if (
      !(
        yIncreaseAddLiquidity > 0n &&
        zIncreaseAddLiquidity > 0n &&
        yIncreaseAddLiquidity < MAXUINT112 &&
        zIncreaseAddLiquidity < MAXUINT112
      )
    ) {
      return false
    }

    const delState = { x: addLiquidityParams.assetIn, y: yIncreaseAddLiquidity, z: zIncreaseAddLiquidity }

    const debt = LiquidityMath.getDebtAddLiquidity(delState, maturity, currentTimeAL)
    const collateral = LiquidityMath.getCollateralAddLiquidity(delState, maturity, currentTimeAL)
    const liquidity = LiquidityMath.liquidityCalculateAddLiquidity(state, delState, currentTimeAL,maturity)
    // console.log('ts liquidity out : ', liquidity)

    if (
      addLiquidityParams.maxDebt < debt ||
      addLiquidityParams.maxCollateral < collateral ||
      addLiquidityParams.minLiquidity > liquidity
    )
      return false

    return true
  }
  export default {
      addLiquiditySuccess,
      newLiquiditySuccess
  }