import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftRightUp, mulDivUp, advanceTimeAndBlock, setTime, advanceTime } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import {
  newLiquidityFixture,
  constructorFixture,
  Fixture,
  removeLiquidityFixture,
  liquidityGivenAssetFixture,
  newLiquidityETHAssetFixture,
  liquidityGivenAssetETHAssetFixture,
  newLiquidityETHCollateralFixture,
  liquidityGivenAssetETHCollateralFixture,
  lendGivenBondFixture,
  borrowGivenCollateralFixture
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
import { json } from 'stream/consumers'
import testcases from '../test-cases/liquidity/LiquidityGivenAsset'
const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n

async function fixture(): Promise<Fixture> {
  maturity = (await now()) + 31536000n
  signers = await ethers.getSigners()

  const constructor = await constructorFixture(1n << 255n, 1n << 255n, maturity, signers)

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
      const lendGivenBond  = await lendGivenBondFixture(newLiquidity,signers[0],testCase.lenGivenBondParams)
      const borrowGivenCoxgit llateral = await borrowGivenCollateralFixture(lendGivenBond, signers[0],testCase.borrowGivenCollateralParams)
      const pair = await newLiquidity.convenience.factoryContract.getPair(newLiquidity.assetToken.address, newLiquidity.collateralToken.address)
      const pairContract = TimeswapPair__factory.connect(pair, ethers.provider);
      
      let percent = {}

      let beforeLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
      let addLiquidity = await liquidityGivenAssetFixture(
        borrowGivenCollateral,
        signers[0],
        testCase.addLiquidityParams[0]
      )
      let afterLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
      let liqTokenContract = Liquidity__factory.connect((await newLiquidity.convenience.getNatives(assetToken.address,collateralToken.address,newLiquidity.maturity)).liquidity,ethers.provider)
      let liqConv = await pairContract.liquidityOf(maturity,newLiquidity.convenience.convenienceContract.address)
      let liqIssued =  await liqTokenContract.balanceOf(signers[0].address)
      let totalLiqSupplied = await liqTokenContract.totalSupply()
        percent[signers[0].address] =percent[signers[0].address] ={
        "Asset In": testCase.addLiquidityParams[0].assetIn.toString(),
        "Min Liquidity": testCase.addLiquidityParams[0].minLiquidity.toString(),
        "Max Debt": testCase.addLiquidityParams[0].maxDebt.toString(),
        "Max Collateral": testCase.addLiquidityParams[0].maxCollateral.toString(),
        "Total liquidity Before": beforeLiq.toString(),
        "Total liquidity After": afterLiq.toString(),
       "Percent Liquidity Issued": String(Number(((afterLiq - beforeLiq)*10_000n) / afterLiq) / 10_000).toString(),
       "Total Liquidity": afterLiq.toString(),
       "User Address": signers[0].address,
       "Liq Issued": liqIssued.toString(),
       "Total liq supplied": totalLiqSupplied.toString(),
       "LI": (afterLiq - beforeLiq).toString(),
       "Total liq on conv": liqConv.toString()
    }
     for(let i=1;i<testCase.addLiquidityParams.length;i++){
        beforeLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
       addLiquidity = await liquidityGivenAssetFixture(
        addLiquidity,
        signers[i],
        testCase.addLiquidityParams[i]
      )
      afterLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
    //    liqTokenContract = Liquidity__factory.connect((await addLiquidity.convenience.getNatives(assetToken.address,collateralToken.address,maturity)).liquidity,ethers.provider)
        // console.log(assetToken.address)
        // console.log(collateralToken.address)
        // console.log(await pairContract.asset())
        // console.log(await pairContract.collateral())
        // console.log(liqTokenContract.address)
        // const liqTokenContract = Liquidity__factory.connect((await addLiquidity.convenience.getNatives(assetToken.address,collateralToken.address,maturity)).liquidity,ethers.provider)
       liqConv = await pairContract.liquidityOf(maturity,newLiquidity.convenience.convenienceContract.address)
       liqIssued =  await liqTokenContract.balanceOf(signers[i].address)
       totalLiqSupplied = await liqTokenContract.totalSupply()

      percent[signers[i].address] ={
          "Asset In": testCase.addLiquidityParams[i].assetIn.toString(),
          "Min Liquidity": testCase.addLiquidityParams[i].minLiquidity.toString(),
          "Max Debt": testCase.addLiquidityParams[i].maxDebt.toString(),
          "Max Collateral": testCase.addLiquidityParams[i].maxCollateral.toString(),
          "Total liquidity Before": beforeLiq.toString(),
          "Total liquidity After": afterLiq.toString(),
          "Percent Liquidity Issued": String(Number(((afterLiq - beforeLiq)*10_000n) / afterLiq) / 10_000),
         "Total Liquidity": afterLiq.toString(),
         "User Address": signers[i].address,
         "Liq Issued": liqIssued.toString(),
         "Total liq supplied": totalLiqSupplied.toString(),
         "Total liq on conv": liqConv.toString()
      }
          
      
    //   await addMultipleLiquidityProperties(testCase, currentTime, addLiquidity, assetToken.address, collateralToken.address)

     }
     
    //  console.log(percent)
    //  console.log('liq addition done')
     await advanceTime(Number(maturity))
     let beforeBurn = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
     let removeLiquidity = await removeLiquidityFixture(addLiquidity,signers[0],{liquidityIn: BigInt(percent[signers[0].address]["Liq Issued"])}) 
     let afterBurn = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
     percent[signers[0].address] = {...percent[signers[0].address], ...{
         'Liq burned': (beforeBurn - afterBurn).toString(),
         'Liq left in Conv': (await pairContract.totalLiquidity(newLiquidity.maturity)).toString()
     }}
    //  console.log(testCase.addLiquidityParams.length)
     for(let i=1;i<testCase.addLiquidityParams.length;i++){
        beforeBurn = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
        // console.log(percent[signers[i].address]["Liq Issued"])
        // console.log(await liqTokenContract.balanceOf(signers[i].address))
        removeLiquidity = await removeLiquidityFixture(removeLiquidity,signers[i],{liquidityIn: BigInt(percent[signers[i].address]["Liq Issued"])}) 
        afterBurn= (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
        percent[signers[i].address] = {...percent[signers[i].address], ...{
            'Liq burned': (beforeBurn - afterBurn).toString(),
            'Liq left in Conv': (await pairContract.totalLiquidity(newLiquidity.maturity)).toString()
        }}
        // console.log(i)
     }
    //  console.log(addLiquidity)
    percent = Object.values(percent)
    // console.log(JSON.stringify(percent))
    //  console.log(percent)
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
