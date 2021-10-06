import { Uint112, Uint256 } from '@timeswap-labs/timeswap-v1-sdk-core'

export interface AddLiquidityParams {
  assetIn: bigint
  minLiquidity: bigint
  maxDebt: bigint
  maxCollateral: bigint
}
export interface NewLiquidityParams {
  assetIn: bigint
  debtIn: bigint
  collateralIn: bigint
}
export interface AddLiquidityParamsUint {
    assetIn: Uint112
    minLiquidity: Uint256
    maxDebt: Uint112
    maxCollateral: Uint112
  }
  export interface NewLiquidityParamsUint {
    assetIn: Uint112
    debtIn: Uint112
    collateralIn: Uint112
  }
export interface RemoveLiquidityParams {
  liquidityIn: bigint
}
