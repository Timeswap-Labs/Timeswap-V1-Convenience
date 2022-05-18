const testcases = [{
    newLiquidityParams: {
      assetIn: 1000000000000000000000n,
      debtIn: 1499200000000000000000n,
      collateralIn: 1499200000000000000000n,

    },
    lendGivenPercentParams: {
      assetIn: 1000000000000000000001n,
      percent: 4294967295n,
      minBond: 100000000000000000000n,
      minInsurance: 100000000000n,
    },
    lendGivenPercentParamsX: {
      assetIn: 1000000000000000000001n,
      percent: 4294967295n,
      minBond: 100000000000000000000n,
      minInsurance: 100000000000n,
    },
    newLiquidityParamsX: {
      assetIn: 1000000000000000000000n,
      debtIn: 1000000000000000000001n,
      collateralIn: 1500000000000000000001n,
      minLiquidity: 100000000000000000000n,
    },
    lendGivenBondParams: {
      assetIn: 1000000000000000000000n,
      bondOut: 1100000000000000000000n,
      minInsurance: 10000000000n,
    },

    collectParamsX: {
      claims: {
        bondPrincipal: 995717522095306615229n,
        bondInterest: 0n,
        insurancePrincipal: 514031732135330096017n,
        insuranceInterest: 123766662078n,
      },
    },

    collectParams15: {
      claims: {
        bondPrincipal: 10n,
        bondInterest: 5n,
        insurancePrincipal: 40n,
        insuranceInterest: 4n,
      }
    },
    collectParams16: {
      claims: {
        bondPrincipal: 995717522230564855191n,
        bondInterest: 14282477769435144809n,
        insurancePrincipal:6427935097465587826514n,
        insuranceInterest: 6033549478532333547398n,
      },
    },collectParams17: {
      claims: {
        bondPrincipal:     995717522636339575299n,
        bondInterest:      14282477363660424701n,
        insurancePrincipal:6427934998274001900810n,
        insuranceInterest: 6033549478532333547398,
      },
    },
    collectParams:
    [
           {claims: {
            bondPrincipal: 995717522230564855191n,
            bondInterest: 14282477769435144809n,
            insurancePrincipal: 733041196958992848493n,
            insuranceInterest: 668900953294597928372n,
           }},
         { claims: {
            bondPrincipal: 995717522365823095190n,
            bondInterest: 14282477634176904810n,
            insurancePrincipal:667615982049917490065n,
            insuranceInterest: 608274264825005886457n,
          }},
    
        { claims: {
          bondPrincipal: 995717522501081335226n,
          bondInterest: 14282477498918664774n,
          insurancePrincipal:610653816608959483879n,
          insuranceInterest: 555525717670180575728n,
        }},
         { claims: {
        bondPrincipal: 995717522636339575299n,
        bondInterest:  14282477363660424701n,
        insurancePrincipal:560752467858652426366n,
        insuranceInterest: 509346976148717766692n,
        }},
      ],

    borrowGivenCollateralParams: {
        assetOut: 1000000000000000000000n,
        collateralIn: 190n,
        maxDebt: 3000n,
      },
      borrowGivenPercentParamsX: {
        assetOut: 1000000000000000000000n,
        percent: 4294967295n,
        maxDebt: 2000000000000000000000n,
        maxCollateral: 2000000000000000000000n
      },
      borrowGivenPercentParams: {
        assetOut: 1000000000000000000000n,
        percent: 4294967295n,
        maxDebt: 9163990956869185396432n,
        maxCollateral: 5000000000000000000000n,
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