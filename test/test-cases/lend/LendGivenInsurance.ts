const testCases = [

    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      lendGivenInsuranceParams: {
        assetIn: 1000n,
        insuranceOut: 67n,
        minBond: 1050n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      lendGivenInsuranceParams: {
        assetIn: 1000000000n,
        insuranceOut: 995n,
        minBond: 1050n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      lendGivenInsuranceParams: {
        assetIn: 1000n,
        insuranceOut: 67n,
        minBond: 1050n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000000000000000000000n,
        debtIn: 12000000000000000000000n,
        collateralIn: 1000000000000000000000n,
      },
      lendGivenInsuranceParams: {
        assetIn: 1000000000000000000000n,
        insuranceOut: 67000000000000000000n,
        minBond: 1050000000000000000000n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000000000000000000000n,
        debtIn: 12000000000000000000000n,
        collateralIn: 1000000000000000000000n,
      },
      lendGivenInsuranceParams: {
        assetIn: 1000000000000000000000000000n,
        insuranceOut: 995000000000000000000n,
        minBond: 1050000000000000000000n,
      },
    },
  ]

export default testCases