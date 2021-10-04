import { BorrowGivenPercentParams } from "./types";

export function borrowGivenPercentTests():BorrowGivenPercentParams[]{
    return [{
        assetOut: 5000n,
        maxDebt: 500n,
        maxCollateral: 20n,
        percent:100n
    }]
}
