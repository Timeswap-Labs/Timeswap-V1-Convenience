export async function givenNew(maturity:bigint, assetIn:bigint, debtIn:bigint,collateralIn: bigint, now: bigint){
        let yIncrease = debtIn
        yIncrease -= assetIn
        yIncrease =  yIncrease * BigInt(2 ** 32)
        yIncrease /= maturity - now
        

        let denominator = maturity
        denominator -= now
        denominator *= yIncrease
        denominator += assetIn * BigInt(2 ** 33)
        let zIncrease = collateralIn
        zIncrease *= assetIn
        zIncrease = zIncrease * BigInt ( 2**32)
        zIncrease /= denominator;

        return {yIncrease: yIncrease, zIncrease: zIncrease}
}
