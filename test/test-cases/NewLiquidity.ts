import { NewLiquidityParams } from "./types";

export function newLiquidityTests():NewLiquidityParams[]{
return [{
    assetIn: 100n,
    debtIn: 500n,
    collateralIn: 100n,
}]
}

