import { BorrowGivenDebtParams } from "./types";

export function borrowGivenDebtTests():BorrowGivenDebtParams[]{
    return [{
        assetOut: 5000n,
        maxCollateral: 500n,
        debtIn: 20n
    }]
}
