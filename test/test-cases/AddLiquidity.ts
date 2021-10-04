import { AddLiquidityParams } from "./types";

export function addLiquidityTests():AddLiquidityParams[]{
    return [{
        assetIn: 100n,
        minLiquidity: 1500n,
        maxDebt: 1000n,
        maxCollateral: 5000n,
    }]
    }
