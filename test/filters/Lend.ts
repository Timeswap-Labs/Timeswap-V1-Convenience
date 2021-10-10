import { LendGivenBondParams, NewLiquidityParams, NewLiquidityParamsUint } from "../types";
import * as LiquidityMath from '../libraries/LiquidityMath'
import * as LendMath from '../libraries/LendMath'
const MAXUINT112: bigint = 2n ** 112n

export function lendGivenBondSuccess(params: {newLiquidityParams: NewLiquidityParams,lendGivenBondParams:LendGivenBondParams},currentTimeNL:bigint,currentTimeLGB:bigint, maturity:bigint){
    const {newLiquidityParams, lendGivenBondParams} = params
    if (
        (lendGivenBondParams.assetIn <= 0 || lendGivenBondParams.bondOut <=0 ||
        lendGivenBondParams.minInsurance <= 0 || lendGivenBondParams.bondOut - lendGivenBondParams.assetIn <= 0)
      ) {
        return false
      }
      const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = LiquidityMath.getYandZIncreaseNewLiquidity(
        newLiquidityParams.assetIn,
        newLiquidityParams.debtIn,
        newLiquidityParams.collateralIn,
        currentTimeNL,
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
      const state = { x: newLiquidityParams.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity }
      console.log(state)
      const {yDecreaseLendGivenBond, zDecreaseLendGivenBond} = LendMath.calcYAndZDecreaseLendGivenBond(state,maturity,currentTimeLGB,lendGivenBondParams.assetIn,lendGivenBondParams.bondOut)
      if (
        !(
          yDecreaseLendGivenBond > 0n &&
          zDecreaseLendGivenBond > 0n &&
          lendGivenBondParams.assetIn + state.x < MAXUINT112
        )
      ) {
        return false
      }
      const delState = {x:lendGivenBondParams.assetIn,y:yDecreaseLendGivenBond,z:zDecreaseLendGivenBond}
      if(!LendMath.check(state,delState)){
          return false
      }
      if(LendMath.getInsurance(state,delState,maturity,currentTimeLGB)<lendGivenBondParams.minInsurance){
        return false
      }
      return true

}