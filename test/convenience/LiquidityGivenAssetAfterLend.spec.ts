import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftRightUp, mulDivUp, advanceTimeAndBlock, setTime } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import * as LendMath from '../libraries/LendMath'
import {
  newLiquidityFixture,
  constructorFixture,
  Fixture,
  liquidityGivenAssetFixture,
  newLiquidityETHAssetFixture,
  liquidityGivenAssetETHAssetFixture,
  newLiquidityETHCollateralFixture,
  liquidityGivenAssetETHCollateralFixture,
  lendGivenBondFixture,
  lendGivenBondETHCollateralFixture,
  lendGivenBondETHAssetFixture,
} from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { LiquidityGivenAssetParams, NewLiquidityParams } from '../types'
import {
  CollateralizedDebt__factory,
  ERC20__factory,
  TestToken,
  TimeswapPair,
  TimeswapPair__factory,
} from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'
import { Convenience } from '../shared/Convenience'
import { liquidityGivenAssetAfterLendTestCases as testCases } from '../test-cases/index'
import { FEE, PROTOCOL_FEE } from '../shared/Constants'
const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n

async function fixture(): Promise<Fixture> {
  maturity = (await now()) + 31536000n
  signers = await ethers.getSigners()

  const constructor = await constructorFixture(1n << 255n, 1n << 255n, maturity, [signers[0]])

  return constructor
}

describe('Liquidity Given Asset', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityFixture(constructorFixture, signers[0], testCase.newLiquidityParams)
      await setTime(Number(currentTime + 7500n))
      const lendGivenBond = await lendGivenBondFixture(newLiquidity,signers[0],testCase.lendGivenBondParams)
       await setTime(Number(currentTime + 10000n))
       const addLiquidity = await liquidityGivenAssetFixture(
        newLiquidity,
        signers[0],
        testCase.liquidityGivenAssetParams
      )

      await addLiquidityProperties(testCase, currentTime, addLiquidity, assetToken.address, collateralToken.address)
    })
  })
})

describe('Liquidity Given Asset ETH Asset', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, convenience, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityETHAssetFixture(
        constructorFixture,
        signers[0],
        testCase.newLiquidityParams
      )
      await setTime(Number(currentTime + 7500n))
      const lendGivenBond = await lendGivenBondETHAssetFixture(newLiquidity,signers[0],testCase.lendGivenBondParams)
      await setTime(Number(currentTime + 10000n))
      const addLiquidity = await liquidityGivenAssetETHAssetFixture(
        newLiquidity,
        signers[0],
        testCase.liquidityGivenAssetParams
      )

      await addLiquidityProperties(
        testCase,
        currentTime,
        addLiquidity,
        convenience.wethContract.address,
        collateralToken.address
      )
    })
  })
})

describe('Liquidity Given Asset ETH Collateral', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, convenience, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityETHCollateralFixture(
        constructorFixture,
        signers[0],
        testCase.newLiquidityParams
      )
      await setTime(Number(currentTime + 10000n))
      await setTime(Number(currentTime + 7500n))
      const lendGivenBond = await lendGivenBondETHCollateralFixture(newLiquidity,signers[0],testCase.lendGivenBondParams)
      const addLiquidity = await liquidityGivenAssetETHCollateralFixture(
        newLiquidity,
        signers[0],
        testCase.liquidityGivenAssetParams
      )

      await addLiquidityProperties(
        testCase,
        currentTime,
        addLiquidity,
        assetToken.address,
        convenience.wethContract.address
      )
    })
  })
})

async function addLiquidityProperties(
  data: {
    newLiquidityParams: {
      assetIn: bigint
      debtIn: bigint
      collateralIn: bigint
    },
    lendGivenBondParams: {
      assetIn: bigint
      bondOut: bigint
      minInsurance: bigint
    },
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
  const {xIncrease,yDecrease,zDecrease} = LendMath.getLendGivenBondParams(state,FEE,PROTOCOL_FEE,maturity,currentTime + 7_500n,data.lendGivenBondParams.assetIn,data.lendGivenBondParams.bondOut)
  const state1 ={
    x: xIncrease+xIncreaseNewLiquidity,
    y: yIncreaseNewLiquidity-yDecrease,
    z: zIncreaseNewLiquidity-zDecrease
  }
  const  {feeStoredIncrease} = LendMath.getLendFee(maturity,currentTime+7500n,xIncrease,FEE,PROTOCOL_FEE)
  const { xIncreaseAddLiqudity, yIncreaseAddLiquidity, zIncreaseAddLiquidity } =
    LiquidityMath.getLiquidityGivenAssetParams(state1, data.liquidityGivenAssetParams.assetIn, feeStoredIncrease)
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
