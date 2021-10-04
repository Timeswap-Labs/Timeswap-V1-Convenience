import { LendGivenInsuranceParams } from "./types";

export function lendGivenInsuranceTests():LendGivenInsuranceParams[]{
    return [{
        assetIn: 5000n,
        insuranceOut: 0n,
        minBond: 2n
    }]
}
