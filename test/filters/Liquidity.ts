import * as LiquidityMath from '../libraries/LiquidityMath'
import { AddLiquidityParams, AddLiquidityParamsUint, NewLiquidityParams, NewLiquidityParamsUint } from '../types'
import {objectMap, UToBObj} from '../shared/Helper'
import { Uint112 } from '@timeswap-labs/timeswap-v1-sdk-core'
const MAXUINT112: bigint = 2n ** 112n


export function newLiquiditySuccess(newLiquidityParams: NewLiquidityParamsUint, currentTime: bigint,maturity:bigint) {
    if (newLiquidityParams.assetIn.toBigInt() < 0 || newLiquidityParams.debtIn.toBigInt() - newLiquidityParams.assetIn.toBigInt() <= 0) {
      return false
    }
    const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = UToBObj(LiquidityMath.getYandZIncreaseNewLiquidity(
      newLiquidityParams.assetIn,
      newLiquidityParams.debtIn,
      newLiquidityParams.collateralIn,
      currentTime,
      maturity
    ))

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
    liquidityParams: { newLiquidityParams: NewLiquidityParamsUint; addLiquidityParams: AddLiquidityParamsUint },
    currentTimeNL: bigint,
    currentTimeAL: bigint,
    maturity:bigint
  ) {
    const { newLiquidityParams, addLiquidityParams } = liquidityParams

    if (
      (addLiquidityParams.assetIn.toBigInt() <= 0 || addLiquidityParams.maxDebt.toBigInt() <= 0 ||
      addLiquidityParams.maxCollateral.toBigInt() <= 0 ||
      addLiquidityParams.minLiquidity.toBigInt() <= 0)
    ) {
      return false
    }
    if (newLiquidityParams.assetIn.toBigInt() < 0 || (newLiquidityParams.debtIn.toBigInt() - newLiquidityParams.assetIn.toBigInt()) <=0) {
      return false
    }
    const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = UToBObj(LiquidityMath.getYandZIncreaseNewLiquidity(
      newLiquidityParams.assetIn,
      newLiquidityParams.debtIn,
      newLiquidityParams.collateralIn,
      currentTimeNL,
      maturity
    ))
    const state = { x: newLiquidityParams.assetIn, y: new Uint112(yIncreaseNewLiquidity), z: new Uint112(zIncreaseNewLiquidity) }
    const { yIncreaseAddLiquidity, zIncreaseAddLiquidity } = UToBObj(LiquidityMath.getYandZIncreaseAddLiquidity(
      state,
      addLiquidityParams.assetIn
    ))

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

    const delState = { x: addLiquidityParams.assetIn, y: new Uint112(yIncreaseAddLiquidity), z: new Uint112(zIncreaseAddLiquidity) }

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