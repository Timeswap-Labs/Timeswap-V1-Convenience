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
        minInsurance: 50n
      },
      collectParams: {
        claims: {
          bondPrincipal: 10n,
          bondInterest: 5n,
          insurancePrincipal: 40n,
          insuranceInterest: 4n,
        }
      }
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
      collectParams: {
        claims: {
          bondPrincipal: 1n,
          bondInterest: 1n,
          insurancePrincipal: 0n,
          insuranceInterest: 0n,
        }
      }
    },
  ]
  export default testCases