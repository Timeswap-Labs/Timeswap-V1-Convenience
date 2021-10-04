import { BorrowGivenCollateralParams } from "./types";

export function borrowGivenCollateralTests():BorrowGivenCollateralParams[]{
    return [{
        assetOut: 5000n,
        maxDebt: 6000n,
        collateralIn: 10000n
    }]
}
