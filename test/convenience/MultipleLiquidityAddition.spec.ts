import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftRightUp, mulDivUp, advanceTimeAndBlock, setTime } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import {
  newLiquidityFixture,
  constructorFixture,
  Fixture,
  liquidityGivenAssetFixture,
  newLiquidityETHAssetFixture,
  liquidityGivenAssetETHAssetFixture,
  newLiquidityETHCollateralFixture,
  liquidityGivenAssetETHCollateralFixture,
} from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { LiquidityGivenAssetParams, NewLiquidityParams } from '../types'
import {
  CollateralizedDebt__factory,
  ERC20__factory,
  Liquidity__factory,
  TestToken,
  TimeswapPair,
  TimeswapPair__factory,
} from '../../typechain'
import * as fs from "fs"
import * as LiquidityFilter from '../filters/Liquidity'
import { Convenience } from '../shared/Convenience'
import { multipleLiquidityAddition as testCases } from '../test-cases/index'
const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n

async function fixture(): Promise<Fixture> {
  maturity = (await now()) + 31536000n
  signers = await ethers.getSigners()

  const constructor = await constructorFixture(1n << 255n, 1n << 255n, maturity, signers[0])

  return constructor
}



describe.only('Multiple Liquidity Given Asset', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityFixture(constructorFixture, signers[0], testCase.newLiquidityParams)
      await setTime(Number(currentTime + 10000n))
      const pair = await newLiquidity.convenience.factoryContract.getPair(newLiquidity.assetToken.address, newLiquidity.collateralToken.address)
      const pairContract = TimeswapPair__factory.connect(pair, ethers.provider);
      
      const percent = []

      let beforeLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
      let addLiquidity = await liquidityGivenAssetFixture(
        newLiquidity,
        signers[0],
        testCase.addLiquidityParams[0]
      )
      let afterLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
    //   percent.push(Number(((afterLiq - beforeLiq)*10_000n) / afterLiq) / 10_000);
     for(let i=1;i<testCase.addLiquidityParams.length;i++){
        beforeLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
       addLiquidity = await liquidityGivenAssetFixture(
        newLiquidity,
        signers[i],
        testCase.addLiquidityParams[i]
      )
      afterLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
      const liqTokenContract = Liquidity__factory.connect((await addLiquidity.convenience.getNatives(assetToken.address,collateralToken.address,maturity)).liquidity,ethers.provider)
        // console.log(assetToken.address)
        // console.log(collateralToken.address)
        // console.log(await pairContract.asset())
        // console.log(await pairContract.collateral())
        const liqConv = await pairContract.liquidityOf(maturity,addLiquidity.convenience.convenienceContract.address)
      const liqIssued =  await liqTokenContract.balanceOf(signers[i].address)
      const totalLiqSupplied = await liqTokenContract.totalSupply()
      percent.push({
          "Asset In": testCase.addLiquidityParams[i].assetIn.toString(),
          "Min Liquidity": testCase.addLiquidityParams[i].minLiquidity.toString(),
          "Max Debt": testCase.addLiquidityParams[i].maxDebt.toString(),
          "Max Collateral": testCase.addLiquidityParams[i].maxCollateral.toString(),
         "Percent Liquidity Issued": ((((afterLiq - beforeLiq)*10_000n) / afterLiq) / 10_000n).toString(),
         "Total Liquidity": afterLiq.toString(),
         "User Address": signers[i].address,
         "Liq Issued": liqIssued.toString(),
         "Total liq supplied": totalLiqSupplied.toString(),
         "Total liq on conv": liqConv.toString()
      }
          );
    //   await addMultipleLiquidityProperties(testCase, currentTime, addLiquidity, assetToken.address, collateralToken.address)

     }
    //  console.log(addLiquidity)
     console.log(percent)
     fs.writeFile('multipleLiq.json', JSON.stringify(percent),function(err) {
        if (err) throw err;
        console.log('complete');
        })
    })
  })
})

// describe('Liquidity Given Asset ETH Asset', () => {
//   testCases.forEach((testCase, index) => {
//     it(`Succeeded ${index}`, async () => {
//       const { maturity, convenience, assetToken, collateralToken } = await loadFixture(fixture)
//       let currentTime = await now()

//       const constructorFixture = await loadFixture(fixture)
//       await setTime(Number(currentTime + 5000n))
//       const newLiquidity = await newLiquidityETHAssetFixture(
//         constructorFixture,
//         signers[0],
//         testCase.newLiquidityParams
//       )
//       await setTime(Number(currentTime + 10000n))
//       const addLiquidity = await liquidityGivenAssetETHAssetFixture(
//         newLiquidity,
//         signers[0],
//         testCase.liquidityGivenAssetParams
//       )

//       await addLiquidityProperties(
//         testCase,
//         currentTime,
//         addLiquidity,
//         convenience.wethContract.address,
//         collateralToken.address
//       )
//     })
//   })
// })

// describe('Liquidity Given Asset ETH Collateral', () => {
//   testCases.forEach((testCase, index) => {
//     it(`Succeeded ${index}`, async () => {
//       const { maturity, convenience, assetToken, collateralToken } = await loadFixture(fixture)
//       let currentTime = await now()

//       const constructorFixture = await loadFixture(fixture)
//       await setTime(Number(currentTime + 5000n))
//       const newLiquidity = await newLiquidityETHCollateralFixture(
//         constructorFixture,
//         signers[0],
//         testCase.newLiquidityParams
//       )
//       await setTime(Number(currentTime + 10000n))
//       const addLiquidity = await liquidityGivenAssetETHCollateralFixture(
//         newLiquidity,
//         signers[0],
//         testCase.liquidityGivenAssetParams
//       )

//       await addLiquidityProperties(
//         testCase,
//         currentTime,
//         addLiquidity,
//         assetToken.address,
//         convenience.wethContract.address
//       )
//     })
//   })
// })

async function addMultipleLiquidityProperties(
  data: {
    newLiquidityParams: {
      assetIn: bigint
      debtIn: bigint
      collateralIn: bigint
    }
    liquidityGivenAssetParams: {
      assetIn: bigint
      minLiquidity: bigint
      maxDebt: bigint
      maxCollateral: bigint
    }
  },
  currentTime: bigint,
  fixture: {
    convenience: Convenience
    assetToken: TestToken
    collateralToken: TestToken
    maturity: bigint
  },
  assetAddress: string,
  collateralAddress: string
) {
  const result = fixture

  const maybeNewMintParams = LiquidityMath.getNewLiquidityParams(
    data.newLiquidityParams.assetIn,
    data.newLiquidityParams.debtIn,
    data.newLiquidityParams.collateralIn,
    currentTime + 5_000n,
    maturity
  )
  let { xIncreaseNewLiquidity, yIncreaseNewLiquidity, zIncreaseNewLiquidity } = {
    xIncreaseNewLiquidity: 0n,
    yIncreaseNewLiquidity: 0n,
    zIncreaseNewLiquidity: 0n,
  }
  if (maybeNewMintParams != false) {
    xIncreaseNewLiquidity = maybeNewMintParams.xIncreaseNewLiquidity
    yIncreaseNewLiquidity = maybeNewMintParams.yIncreaseNewLiquidity
    zIncreaseNewLiquidity = maybeNewMintParams.zIncreaseNewLiquidity
  }

  const state = {
    x: xIncreaseNewLiquidity,
    y: yIncreaseNewLiquidity,
    z: zIncreaseNewLiquidity,
  }
  const { xIncreaseAddLiqudity, yIncreaseAddLiquidity, zIncreaseAddLiquidity } =
    LiquidityMath.getLiquidityGivenAssetParams(state, data.liquidityGivenAssetParams.assetIn, 0n)
  const delState = {
    x: xIncreaseAddLiqudity,
    y: yIncreaseAddLiquidity,
    z: zIncreaseAddLiquidity,
  }
  const liquidityBalanceNew = LiquidityMath.getInitialLiquidity(xIncreaseNewLiquidity)

  const maybeLiquidityBalanceAdd = LiquidityMath.getLiquidity(state, delState, currentTime + 10_000n, maturity)
  let liquidityBalanceAdd = 0n

  if (typeof maybeLiquidityBalanceAdd != 'string') {
    liquidityBalanceAdd = maybeLiquidityBalanceAdd
  }
  const liquidityBalance = liquidityBalanceNew + liquidityBalanceAdd

  const debt = LiquidityMath.getDebtAddLiquidity(
    { x: xIncreaseAddLiqudity, y: yIncreaseAddLiquidity, z: zIncreaseAddLiquidity },
    maturity,
    currentTime + 10_000n
  )
  const collateral = LiquidityMath.getCollateralAddLiquidity(
    { x: xIncreaseAddLiqudity, y: yIncreaseAddLiquidity, z: zIncreaseAddLiquidity },
    maturity,
    currentTime + 10_000n
  )

  const natives = await result.convenience.getNatives(assetAddress, collateralAddress, maturity)

  const collateralizedDebtContract = CollateralizedDebt__factory.connect(natives.collateralizedDebt, ethers.provider)
  const collateralizedDebtToken = await collateralizedDebtContract.dueOf(1)

  const collateralBalanceContract = collateralizedDebtToken.collateral.toBigInt()
  const debtBalanceContract = collateralizedDebtToken.debt.toBigInt()

  expect(collateralBalanceContract).equalBigInt(collateral)
  expect(debtBalanceContract).equalBigInt(debt)
}
