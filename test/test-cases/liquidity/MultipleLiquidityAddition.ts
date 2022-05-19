const testcases = [{
    newLiquidityParams: {
      assetIn: 1000000000000000000000n,
      debtIn: 1499200000000000000000n,
      collateralIn: 14992000000000000000000n,

    },
    addLiquidityParams: [
    {
      assetIn: 1000000000000000000000n,
      minLiquidity: 5700000000000000000000000n,
      maxDebt: 24000000000000000000000n,
      maxCollateral: 20000000000000000000000n,
    },
      {
        assetIn: 2000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 24000000000000000000000n,
        maxCollateral: 200000000000000000000000n,
      },

      {
        assetIn: 3000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 36000000000000000000000n,
        maxCollateral: 3000000000000000000000000n,
      },

      {
        assetIn: 5000000000000000000000n,
        minLiquidity: 5700000000000000000000000n,
        maxDebt: 60000000000000000000000n,
        maxCollateral: 800000000000000000000000000n,
      },
]
  }]
  export default testcases