const testCases = [
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      lendGivenPercentParams: {
        assetIn: 1000n,
        percent: 1n << 31n,
        minBond: 1000n,
        minInsurance: 50n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      lendGivenPercentParams: {
        assetIn: 100000n,
        percent: 2n << 31n,
        minBond: 100000n,
        minInsurance: 400n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      lendGivenPercentParams: {
        assetIn: 500n,
        percent: 4n << 30n,
        minBond: 500n,
        minInsurance: 20n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      lendGivenPercentParams: {
        assetIn: 1000000000n,
        percent: 2n << 30n,
        minBond: 800000000n,
        minInsurance: 500n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      lendGivenPercentParams: {
        assetIn: 67900000000n,
        percent: 1n << 31n,
        minBond: 65000000000n,
        minInsurance: 500n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000000000000000000000n,
        debtIn: 12000000000000000000000n,
        collateralIn: 990000000000000000000n,
      },
      lendGivenPercentParams: {
        assetIn: 100000000000000000000n,
        percent: 1n << 31n,
        minBond: 100000000000000000000n,
        minInsurance: 1000000000000000000n,
      },
    },
  ]

  export default testCases