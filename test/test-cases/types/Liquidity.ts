export interface AddLiquidityParams{ assetIn:bigint,minLiquidity:bigint,maxDebt:bigint,maxCollateral:bigint}
export interface NewLiquidityParams{ assetIn:bigint,debtIn:bigint,collateralIn: bigint}
export interface RemoveLiquidityParams{
    liquidityIn: bigint
}