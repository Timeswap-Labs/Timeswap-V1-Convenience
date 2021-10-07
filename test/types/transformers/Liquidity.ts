import { NewLiquidityParams, AddLiquidityParams, NewLiquidityParamsUint, AddLiquidityParamsUint } from "..";

export const newLiquidityParamsUToB = (newLiquidityParamsUint: NewLiquidityParamsUint):NewLiquidityParams => {
    const {assetIn,debtIn,collateralIn} = newLiquidityParamsUint
    return {
        assetIn: assetIn.toBigInt(),
        debtIn: debtIn.toBigInt(),
        collateralIn: collateralIn.toBigInt()
    }
}

export const addLiquidityParamsUToB = (addLiquidityParamsUint: AddLiquidityParamsUint):AddLiquidityParams => {
    const {assetIn,minLiquidity,maxCollateral,maxDebt} = addLiquidityParamsUint
    return {
        assetIn: assetIn.toBigInt(),
        minLiquidity: minLiquidity.toBigInt(),
        maxCollateral: maxCollateral.toBigInt(),
        maxDebt: maxDebt.toBigInt()
    }
}