
import { constructorFixture, Fixture, lendMathGivenBondFixture, lendMathGivenInsuranceFixture, lendMathGivenPercentFixture, mintMathCalleeGivenAssetFixture, mintMathCalleeGivenNewFixture, newLiquidityFixture } from '../../shared/Fixtures'
import * as fc from 'fast-check'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { now, setTime } from '../../shared/Helper'
import * as LiquidityFilter from '../../filters/Liquidity'
import * as LiquidityMath from '../../libraries/LiquidityMath'
import * as LendFilter from '../../filters/Lend'
import * as LendMath from '../../libraries/LendMath'
import { expect } from '../../shared/Expect'
import { FEE, PROTOCOL_FEE } from '../../shared/Constants'
const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const lendGivenBondTestCases = [
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
  // {
  //   newLiquidityParams: {
  //     assetIn: 10000n,
  //     debtIn: 12000n,
  //     collateralIn: 1000n,
  //   },
  //   lendGivenBondParams: {
  //     assetIn: 1000000000n,
  //     bondOut: 995719504n,
  //     minInsurance: 50n,
  //   },
  // },
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
]
const lendGivenInsuranceTestCases = [
  // {
  //   newLiquidityParams: {
  //     assetIn: 10000n,
  //     debtIn: 12000n,
  //     collateralIn: 1000n,
  //   },
  //   lendGivenInsuranceParams: {
  //     assetIn: 1000n,
  //     insuranceOut: 8n,
  //     minBond: 1005n,
  //   },
  // },
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
  // {
  //   newLiquidityParams: {
  //     assetIn: 10000n,
  //     debtIn: 12000n,
  //     collateralIn: 1000n,
  //   },
  //   lendGivenInsuranceParams: {
  //     assetIn: 100000n,
  //     insuranceOut: 467n,
  //     minBond: 100010n,
  //   },
  // },
  // {
  //   newLiquidityParams: {
  //     assetIn: 10000n,
  //     debtIn: 12000n,
  //     collateralIn: 1000n,
  //   },
  //   lendGivenInsuranceParams: {
  //     assetIn: 500n,
  //     insuranceOut: 24n,
  //     minBond: 550n,
  //   },
  // },
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
]
const lendGivenPercentTestCases = [
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
      minBond: 0n,
      minInsurance: 0n,
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
      minBond: 0n,
      minInsurance: 0n,
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
      minBond: 0n,
      minInsurance: 0n,
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
      minBond: 0n,
      minInsurance: 0n,
    },
  },
]
const MAXUINT112: bigint = 2n ** 112n
async function fixture(): Promise<Fixture> {
  maturity = (await now()) + 31536000n
  signers = await ethers.getSigners()

  const constructor = await constructorFixture(1n << 255n, 1n << 255n, maturity, signers[0])
 
  return constructor
}
describe('Lend Math Given Bond', () => {
  lendGivenBondTestCases.forEach((testCase, index) => {
    it('Succeeded', async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()
  
      
            const success = async () => {
              const constructor = await loadFixture(fixture)
              await setTime(Number(currentTime + 5000n))
              const newLiquidity = await newLiquidityFixture(constructor, signers[0], testCase.newLiquidityParams)
              await setTime(Number(currentTime + 10000n))
              const lendGivenBond = await lendMathGivenBondFixture(newLiquidity, signers[0], testCase.lendGivenBondParams)
              return lendGivenBond
            }
            const [xIncrease,yDecrease,zDecrease] = (await loadFixture(success)).map((x)=>x.toBigInt())
          console.log('fix',await loadFixture(success))
          
            await lendMathGivenBondProperties(testCase, currentTime, maturity,yDecrease,zDecrease)
          
    }).timeout(100000)
  
  })
  })
  describe('Lend Math Given Insurance', () => {
    lendGivenInsuranceTestCases.forEach((testCase, index) => {
    it('Succeeded', async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()
  
    
            const success = async () => {
              const constructor = await loadFixture(fixture)
              await setTime(Number(currentTime + 5000n))
              const newLiquidity = await newLiquidityFixture(constructor, signers[0], testCase.newLiquidityParams)
              await setTime(Number(currentTime + 10000n))
              const lendGivenBond = await lendMathGivenInsuranceFixture(
                newLiquidity,
                signers[0],
                testCase.lendGivenInsuranceParams
              )
              return lendGivenBond
            }
  
            
          const [xIncrease,yDecrease,zDecrease] = (await loadFixture(success)).map((x)=>x.toBigInt())
          console.log('fix',await loadFixture(success))
          await lendMathGivenInsuranceProperties(testCase, currentTime, maturity,yDecrease,zDecrease)
          
    }).timeout(100000)
  })
})
describe('Lend Math Given Percent', () => {
  async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 31536000n
    signers = await ethers.getSigners()

    const constructor = await constructorFixture(1n << 255n, 1n << 255n, maturity, signers[0])

    return constructor
  }
  lendGivenPercentTestCases.forEach((testCase, index) => {

  it('Succeeded', async () => {
    const { maturity } = await loadFixture(fixture)
    let currentTime = await now()

    
      
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], testCase.newLiquidityParams)
            await setTime(Number(currentTime + 10000n))
            const lendGivenBond = await lendMathGivenPercentFixture(newLiquidity, signers[0], testCase.lendGivenPercentParams)
            return lendGivenBond
          }
          
          
          
          const [xIncrease,yDecrease,zDecrease] = (await loadFixture(success)).map((x)=>x.toBigInt())
          console.log('fix',await loadFixture(success))
          await lendMathGivenPercentProperties(testCase, currentTime, maturity,yDecrease,zDecrease)

          
     
  }).timeout(100000)
})
})
  async function lendMathGivenBondProperties(
    data: {
      newLiquidityParams: {
        assetIn: bigint
        debtIn: bigint
        collateralIn: bigint
      }
      lendGivenBondParams: {
        assetIn: bigint
        bondOut: bigint
        minInsurance: bigint
      }
    },
    currentTime: bigint,
    maturity:bigint,
    yDecrease: bigint,
    zDecrease: bigint
  ) {
    
    const neededTime = (await now()) + 100n
    
  
    console.log('maturity 1',maturity)
    console.log('current time 1',currentTime)
  
    let [xIncreaseNewLiquidity,yIncreaseNewLiquidity, zIncreaseNewLiquidity] = [0n,0n, 0n]
    const maybeNewLiq = LiquidityMath.getNewLiquidityParams(
      data.newLiquidityParams.assetIn,
      data.newLiquidityParams.debtIn,
      data.newLiquidityParams.collateralIn,
      currentTime + 5_000n,
      maturity
    )
    if (maybeNewLiq !== false) {
      xIncreaseNewLiquidity = maybeNewLiq.xIncreaseNewLiquidity
      yIncreaseNewLiquidity = maybeNewLiq.yIncreaseNewLiquidity
      zIncreaseNewLiquidity = maybeNewLiq.zIncreaseNewLiquidity
    }
    const state = {
      x: xIncreaseNewLiquidity,
      y: yIncreaseNewLiquidity,
      z: zIncreaseNewLiquidity,
    }
    const lendGivenBondParamsFromConv = LendMath.getLendGivenBondParams(
      state,
      FEE,
      PROTOCOL_FEE,
      maturity,
      currentTime + 10_000n,
      data.lendGivenBondParams.assetIn,
      data.lendGivenBondParams.bondOut
    )
    console.log(lendGivenBondParamsFromConv);
    expect(yDecrease).equalBigInt(lendGivenBondParamsFromConv.yDecrease)
    expect(zDecrease).equalBigInt(lendGivenBondParamsFromConv.zDecrease)
  }
  
async function lendMathGivenInsuranceProperties(
    data: {
      newLiquidityParams: {
        assetIn: bigint
        debtIn: bigint
        collateralIn: bigint
      }
      lendGivenInsuranceParams: {
        assetIn: bigint
        insuranceOut: bigint
        minBond: bigint
      }
    },
    currentTime: bigint,
    maturity:bigint,
    yDecrease: bigint,
    zDecrease: bigint
  ) {
    
    const neededTime = (await now()) + 100n
    
    
   
  let [xIncreaseNewLiquidity,yIncreaseNewLiquidity, zIncreaseNewLiquidity] = [0n,0n, 0n]
  const maybeNewLiq = LiquidityMath.getNewLiquidityParams(
    data.newLiquidityParams.assetIn,
    data.newLiquidityParams.debtIn,
    data.newLiquidityParams.collateralIn,
    currentTime + 5_000n,
    maturity
  )
  if (maybeNewLiq !== false) {
    xIncreaseNewLiquidity = maybeNewLiq.xIncreaseNewLiquidity
    yIncreaseNewLiquidity = maybeNewLiq.yIncreaseNewLiquidity
    zIncreaseNewLiquidity = maybeNewLiq.zIncreaseNewLiquidity
  }
  
    const state = {
      x: xIncreaseNewLiquidity,
      y: yIncreaseNewLiquidity,
      z: zIncreaseNewLiquidity,
    }
    const lendGivenInsuranceParamsFromConv = LendMath.getLendGivenInsuranceParams(
      state,
      maturity,

      FEE,
      PROTOCOL_FEE,
      currentTime + 10_000n,

      data.lendGivenInsuranceParams.assetIn,
      data.lendGivenInsuranceParams.insuranceOut
    )
    expect(yDecrease).equalBigInt(lendGivenInsuranceParamsFromConv.yDecrease)
    expect(zDecrease).equalBigInt(lendGivenInsuranceParamsFromConv.zDecrease)
  }
  async function lendMathGivenPercentProperties(
    data: {
      newLiquidityParams: {
        assetIn: bigint
        debtIn: bigint
        collateralIn: bigint
      }
      lendGivenPercentParams: {
        assetIn: bigint
        percent: bigint
        minBond: bigint
        minInsurance: bigint
      }
    },
    currentTime: bigint,
    maturity:bigint,
    yDecrease: bigint,
    zDecrease: bigint
  ) {

    let [xIncreaseNewLiquidity,yIncreaseNewLiquidity, zIncreaseNewLiquidity] = [0n,0n, 0n]
    const maybeNewLiq = LiquidityMath.getNewLiquidityParams(
      data.newLiquidityParams.assetIn,
      data.newLiquidityParams.debtIn,
      data.newLiquidityParams.collateralIn,
      currentTime + 5_000n,
      maturity
    )
    if (maybeNewLiq !== false) {
      xIncreaseNewLiquidity = maybeNewLiq.xIncreaseNewLiquidity
      yIncreaseNewLiquidity = maybeNewLiq.yIncreaseNewLiquidity
      zIncreaseNewLiquidity = maybeNewLiq.zIncreaseNewLiquidity
    }

  const state = {
    x: xIncreaseNewLiquidity,
    y: yIncreaseNewLiquidity,
    z: zIncreaseNewLiquidity,
  }
  const lendGivenPercentParamsFromConv = LendMath.getLendGivenPercentParams(
    state,
    maturity,
    currentTime + 10_000n,

    FEE,
    PROTOCOL_FEE,

    data.lendGivenPercentParams.assetIn,
    data.lendGivenPercentParams.percent
  )
  expect(yDecrease).equalBigInt(lendGivenPercentParamsFromConv.yDecrease)
  expect(zDecrease).equalBigInt(lendGivenPercentParamsFromConv.zDecrease)
}