import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftRightUp, mulDivUp, advanceTimeAndBlock, setTime, advanceTime, getBlock } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import * as LendMath from '../libraries/LendMath'
import { FEE, PROTOCOL_FEE } from '../shared/Constants'

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
  borrowGivenCollateralFixture,
  borrowGivenPercentFixture,
  repayFixture,
  collectFixture,
  repayETHCollateralFixture
} from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { LiquidityGivenAssetParams, NewLiquidityParams } from '../types'
import {
  BondInterest__factory,
  BondPrincipal__factory,
  CollateralizedDebt__factory,
  ERC20__factory,
  InsuranceInterest__factory,
  InsurancePrincipal__factory,
  Liquidity,
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
import { test } from 'mocha'
import { Signer } from 'ethers'
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

async function getPoolLiquidity(pair: TimeswapPair, maturity: bigint){
  return (await pair.totalLiquidity(maturity)).toBigInt()
}

async function getLiquidityBalanceOf(liquiditityToken: Liquidity, signer: SignerWithAddress){
  return await liquiditityToken.balanceOf(signer.address)
}

async function getFee(pair: TimeswapPair){
  return {
    fee: (await pair.protocolFee()).toBigInt(),
    protocolFee: (await pair.fee()).toBigInt()
  }
}

 async function executeTransaction(fixture: Fixture, pair: TimeswapPair,signer: SignerWithAddress, params,type: string) {
  if(type === 'AL'){
    const initialLiquidity = (await getPoolLiquidity(pair,fixture.maturity))
    console.log('hd')
    console.log(params)
    const addLiquidity = await liquidityGivenAssetFixture(fixture,signer,params)
    console.log('gd')
    const currentLiquidity = (await getPoolLiquidity(pair,fixture.maturity))
    // const {fee,protocolFee} = await getFee(pair)
    console.log('reached here')
    const liquidityIssued = currentLiquidity - initialLiquidity
    // const userBalance = await getLiquidityBalanceOf()
    return {
      fixture: addLiquidity,
      transactionState: {
      "AssetIn": params.assetIn,
      "CollateralIn": params.collateralIn,
      "TotalLiquidity Before": initialLiquidity,
      "TotalLiquidity After": currentLiquidity,
      "UserAddress": signer.address,
      "LiquidityIssued": liquidityIssued
      }
    }
  }
  else if(type==='BL'){
    console.log(params)
    const initialLiquidity = (await getPoolLiquidity(pair,fixture.maturity))
    const removeLiquidity = await removeLiquidityFixture(fixture,signer,params)
    const currentLiquidity = (await getPoolLiquidity(pair,fixture.maturity))
    // const {fee,protocolFee} = await getFee(pair)
    const liquidityIssued = currentLiquidity - initialLiquidity
    // const userBalance = await getLiquidityBalanceOf()
    return {
      fixture: removeLiquidity,
      transactionState: {
      "AssetOut": params.assetIn,
      "CollateralOut": params.collateralIn,
      "TotalLiquidityBefore": initialLiquidity,
      "TotalLiquidityAfter": currentLiquidity,
      "UserAddress": signer.address,
      "LiquidityTokensBurnt": liquidityIssued
      }
    }
  }
}
describe.only('Multiple Liquidity Given Asset', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, collateralToken, convenience } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)

      let transactionStates = []

      // NEW LIQUIDITY
      let beforeLiq = 0n
      let currentFixture = await newLiquidityFixture(constructorFixture,signers[19],testCase.newLiquidityParams)
      const pair = await constructorFixture.convenience.factoryContract.getPair(constructorFixture.assetToken.address, constructorFixture.collateralToken.address)
      const pairContract = TimeswapPair__factory.connect(pair, ethers.provider);

      for(let i=0;i<testCase.addLiquidityParams.length;i++){
        console.log(`completing ${i} addliquidity`)
        let {fixture,transactionState} = await executeTransaction(currentFixture,pairContract,signers[i],testCase.addLiquidityParams[i],'AL')
        currentFixture = fixture
        transactionStates.push(transactionState)
      }
      advanceTimeAndBlock(Number(maturity))
      for(let i=0;i<testCase.addLiquidityParams.length;i++){
        console.log(`Burning liquidity for ${i}`)
        let {fixture,transactionState} = await executeTransaction(currentFixture,pairContract,signers[i],{liquidityIn: transactionStates[i].LiquidityIssued},'AL')
        currentFixture = fixture
        transactionStates.push(transactionState)
        
      }
      console.log(transactionStates)
    // if(ethers.BigNumber.isBigNumber(percent))percent.to
    // console.log(JSON.stringify(percent))
    // //  console.log(percent)
    //  fs.writeFile('testLiq.json', JSON.stringify(transactionStates),function(err) {
    //     if (err) throw err;
    //     console.log('complete');
    //     })
    })
  })
})

