const testcases = [
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      liquidityGivenCollateralParams: {
        collateralIn: 999n,
        minLiquidity: 100n,
        maxDebt: 13000n,
        maxAsset: 13000n,
      },
    }
  ];

  export default testcases;