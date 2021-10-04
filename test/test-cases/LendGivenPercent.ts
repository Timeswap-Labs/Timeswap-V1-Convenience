import { LendGivenPercentParams } from "./types";

export function lendGivenPercentTests():LendGivenPercentParams[]{
    return [{
        assetIn: 5000n,
        percent: 60n,
        minInsurance: 500n,
        minBond: 20n
    }]
}
