import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftRightUp, mulDivUp, advanceTimeAndBlock, setTime } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import * as LendMath from '../libraries/LendMath'
import {
  newLiquidityFixture,
  constructorFixture,
  Fixture,
  lendGivenBondFixture,
  lendGivenBondETHCollateralFixture,
  newLiquidityETHCollateralFixture,
  lendGivenBondETHAssetFixture,
  newLiquidityETHAssetFixture,
} from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { LendGivenBondParams, NewLiquidityParams } from '../types'
import {
  BondInterest__factory,
  BondPrincipal__factory,
  ERC20__factory,
  InsuranceInterest__factory,
  InsurancePrincipal__factory,
  TestToken,
} from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'
import { Convenience } from '../shared/Convenience'
import { FEE, PROTOCOL_FEE } from '../shared/Constants'
import { lendGivenBondTestCases as testCases } from '../test-cases/index'
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

describe('Lend Given Bond', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityFixture(constructorFixture, signers[0], testCase.newLiquidityParams)
      await setTime(Number(currentTime + 10000n))
      const lendGivenBond = await lendGivenBondFixture(newLiquidity, signers[0], testCase.lendGivenBondParams)

      await lendGivenBondProperties(testCase, currentTime, lendGivenBond, assetToken.address, collateralToken.address)
    })
  })
})
describe('Lend Given Bond ETH Asset', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, convenience, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityETHAssetFixture(
        constructorFixture,
        signers[0],
        testCase.newLiquidityParams
      )
      await setTime(Number(currentTime + 10000n))
      const lendGivenBond = await lendGivenBondETHAssetFixture(newLiquidity, signers[0], testCase.lendGivenBondParams)

      await lendGivenBondProperties(
        testCase,
        currentTime,
        lendGivenBond,
        convenience.wethContract.address,
        collateralToken.address
      )
    })
  })
})
describe('Lend Given Bond Collateral', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, convenience } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityETHCollateralFixture(
        constructorFixture,
        signers[0],
        testCase.newLiquidityParams
      )
      await setTime(Number(currentTime + 10000n))
      const lendGivenBond = await lendGivenBondETHCollateralFixture(
        newLiquidity,
        signers[0],
        testCase.lendGivenBondParams
      )

      await lendGivenBondProperties(
        testCase,
        currentTime,
        lendGivenBond,
        assetToken.address,
        convenience.wethContract.address
      )
    })
  })
})

async function lendGivenBondProperties(
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
  fixture: {
    convenience: Convenience
    assetToken: TestToken
    collateralToken: TestToken
    maturity: bigint
  },
  assetAddress: string,
  collateralAddress: string
) {
  const neededTime = (await now()) + 100n

  const result = fixture

  let [yIncreaseNewLiquidity, zIncreaseNewLiquidity] = [0n, 0n]
  const maybeNewLiq = LiquidityMath.getNewLiquidityParams(
    data.newLiquidityParams.assetIn,
    data.newLiquidityParams.debtIn,
    data.newLiquidityParams.collateralIn,
    currentTime + 5_000n,
    maturity
  )
  if (maybeNewLiq !== false) {
    yIncreaseNewLiquidity = maybeNewLiq.yIncreaseNewLiquidity
    zIncreaseNewLiquidity = maybeNewLiq.zIncreaseNewLiquidity
  }

  const state = {
    x: data.newLiquidityParams.assetIn,
    y: yIncreaseNewLiquidity,
    z: zIncreaseNewLiquidity,
  }
  const { yDecrease: yDecreaseLendGivenBond, zDecrease: zDecreaseLendGivenBond } = LendMath.getLendGivenBondParams(
    state,
    FEE,
    PROTOCOL_FEE,
    maturity,
    currentTime + 10_000n,
    data.lendGivenBondParams.assetIn,
    data.lendGivenBondParams.bondOut
  )
  const delState = { x: data.lendGivenBondParams.assetIn, y: yDecreaseLendGivenBond, z: zDecreaseLendGivenBond }
  const bond = LendMath.getBond(delState, maturity, currentTime + 10_000n)
  const natives = await result.convenience.getNatives(assetAddress, collateralAddress, maturity)

  expect(bond).gteBigInt(data.lendGivenBondParams.bondOut)
}
