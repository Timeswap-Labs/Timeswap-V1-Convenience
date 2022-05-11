const testcases = [{
    newLiquidityParams: {
      assetIn: 1000000000000000000000n,
      debtIn: 1499200000000000000000n,
      collateralIn: 1499200000000000000000n,
    },
    lenGivenBondParams: {
        assetIn: 1000n,
        bondOut: 1010n,
        minInsurance: 50n,
    },
    borrowGivenCollateralParams: {
        assetOut: 1000000000000000000000n,
        collateralIn: 190n,
        maxDebt: 3000n,
      },
      borrowGivenPercentParams: {
        assetOut: 1000000000000000000000n,
        percent: 2n**31n,
        maxDebt: 10000000000000000000000n,
        maxCollateral: 10000000000000000000000n
      },
    addLiquidityParams: [
    {
      assetIn: 1000000000000000000000n,
      minLiquidity: 5700000000000000000000000n,
      maxDebt: 12000000000000000000000n,
      maxCollateral: 10000000000000000000000n,
    },
    {
        assetIn: 1000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 12000000000000000000000n,
        maxCollateral: 10000000000000000000000n,
      },
      {
        assetIn: 1000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 12000000000000000000000n,
        maxCollateral: 10000000000000000000000n,
      },
      {
        assetIn: 1000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 12000000000000000000000n,
        maxCollateral: 10000000000000000000000n,
      },
      {
        assetIn: 1000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 12000000000000000000000n,
        maxCollateral: 10000000000000000000000n,
      },
      {
        assetIn: 1000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 12000000000000000000000n,
        maxCollateral: 10000000000000000000000n,
      },
      {
        assetIn: 1000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 12000000000000000000000n,
        maxCollateral: 10000000000000000000000n,
      },
      {
        assetIn: 1000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 12000000000000000000000n,
        maxCollateral: 10000000000000000000000n,
      },
      {
        assetIn: 1000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 12000000000000000000000n,
        maxCollateral: 10000000000000000000000n,
      },

      {
        assetIn: 2000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 24000000000000000000000n,
        maxCollateral: 20000000000000000000000n,
      },

      {
        assetIn: 3000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 36000000000000000000000n,
        maxCollateral: 30000000000000000000000n,
      },

      {
        assetIn: 5000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 60000000000000000000000n,
        maxCollateral: 60000000000000000000000n,
      },
]
  }]
  export default testcases