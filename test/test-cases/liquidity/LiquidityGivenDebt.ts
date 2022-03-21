const testcases = [
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      liquidityGivenDebtParams: {
        debtIn: 10000n,
        minLiquidity: 1000n,
        maxAsset: 15000n,
        maxCollateral: 2000n,
      },
    },
    {
      newLiquidityParams: {
        assetIn: 10000n,
        debtIn: 12000n,
        collateralIn: 1000n,
      },
      liquidityGivenDebtParams: {
        debtIn: 100000n,
        minLiquidity: 10000n,
        maxAsset: 150000n,
        maxCollateral: 20000n,
      },
    },
  ];
  export default testcases