const testCases = [
    {
      newLiquidityParams: {
        assetIn: 10000n, 
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      lendGivenBondParams: {
        assetIn: 1000n,
        bondOut: 1010n,
        minInsurance: 50n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      lendGivenBondParams: {
        assetIn: 1000n,
        bondOut: 1087n,
        minInsurance: 50n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      lendGivenBondParams: {
        assetIn: 500n,
        bondOut: 591n,
        minInsurance: 20n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 990n,
      },
      lendGivenBondParams: {
        assetIn: 1000n,
        bondOut: 1010n,
        minInsurance: 50n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 990n,
      },
      lendGivenBondParams: {
        assetIn: 100n,
        bondOut: 110n,
        minInsurance: 2n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000000000000000000000n,
        debtIn: 12000000000000000000000n,
        collateralIn: 1000000000000000000000n,
      },
      lendGivenBondParams: {
        assetIn: 1000000000000000000000n,
        bondOut: 1010000000000000000000n,
        minInsurance: 50000000000000000000n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000000000000000000000n,
        debtIn: 12000000000000000000000n,
        collateralIn: 1000000000000000000000n,
      },
      lendGivenBondParams: {
        assetIn: 1000000000000000000000n,
        bondOut: 1087000000000000000000n,
        minInsurance: 50000000000000000000n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000000000000000000000n,
        debtIn: 12000000000000000000000n,
        collateralIn: 1000000000000000000000n,
      },
      lendGivenBondParams: {
        assetIn: 500000000000000000000n,
        bondOut: 591000000000000000000n,
        minInsurance: 20000000000000000000n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000000000000000000000n,
        debtIn: 12000000000000000000000n,
        collateralIn: 990000000000000000000n,
      },
      lendGivenBondParams: {
        assetIn: 1000000000000000000000n,
        bondOut: 1010000000000000000000n,
        minInsurance: 50000000000000000000n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000000000000000000000n,
        debtIn: 12000000000000000000000n,
        collateralIn: 990000000000000000000n,
      },
      lendGivenBondParams: {
        assetIn: 100000000000000000000n,
        bondOut: 110000000000000000000n,
        minInsurance: 2000000000000000000n,
      },
    },
  ]

  export default testCases