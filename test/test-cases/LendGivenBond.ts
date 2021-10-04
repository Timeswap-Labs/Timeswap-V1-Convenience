import { LendGivenBondParams } from "./types";

export function lendGivenBondTests():LendGivenBondParams[]{
    return [{
        assetIn: 5000n,
        bondOut: 500n,
        minInsurance: 20n
    }]
}
