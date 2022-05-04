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
  collectFixture,
  collectETHAssetFixture,
  collectETHCollateralFixture,
  newLiquidityETHAssetFixture,
  lendGivenBondETHAssetFixture,
  newLiquidityETHCollateralFixture,
  lendGivenBondETHCollateralFixture,
} from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { LendGivenBondParams, NewLiquidityParams, CollectParams } from '../types'
import {
  BondInterest__factory,
  BondPrincipal__factory,
  ERC20__factory,
  InsuranceInterest__factory,
  InsurancePrincipal__factory,
  TestToken,
} from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'
import { collectTestCases as testCases } from '../test-cases/index'
import { Convenience } from '../shared/Convenience'
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

describe('Collect', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityFixture(constructorFixture, signers[0], testCase.newLiquidityParams)
      await setTime(Number(currentTime + 10000n))
      const lendGivenBond = await lendGivenBondFixture(newLiquidity, signers[0], testCase.lendGivenBondParams)
      await setTime(Number(maturity + 1n))
      const collect = await collectFixture(lendGivenBond, signers[0], testCase.collectParams)

      await collectProperties(testCase, currentTime, collect, assetToken.address, collateralToken.address)
    })
  })
})
describe('Collect ETH Asset', () => {
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
      await setTime(Number(currentTime + 10000n))
      const lendGivenBond = await lendGivenBondETHAssetFixture(newLiquidity, signers[0], testCase.lendGivenBondParams)
      await setTime(Number(maturity + 1n))
      const collect = await collectETHAssetFixture(lendGivenBond, signers[0], testCase.collectParams)

      await collectProperties(testCase, currentTime, collect, convenience.wethContract.address, collateralToken.address)
    })
  })
})
describe('Collect ETH Collateral', () => {
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
      const lendGivenBond = await lendGivenBondETHCollateralFixture(
        newLiquidity,
        signers[0],
        testCase.lendGivenBondParams
      )
      await setTime(Number(maturity + 1n))
      const collect = await collectETHCollateralFixture(lendGivenBond, signers[0], testCase.collectParams)

      await collectProperties(testCase, currentTime, collect, assetToken.address, convenience.wethContract.address)
    })
  })
})

async function collectProperties(
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
    collectParams: {
      claims: {
        bondInterest: bigint
        bondPrincipal: bigint
        insuranceInterest: bigint
        insurancePrincipal: bigint
      }
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

  let [xIncreaseNewLiquidity, yIncreaseNewLiquidity, zIncreaseNewLiquidity] = [0n, 0n, 0n]
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
  const {
    xIncrease: xIncreaseLendGivenBond,
    yDecrease: yDecreaseLendGivenBond,
    zDecrease: zDecreaseLendGivenBond,
  } = LendMath.getLendGivenBondParams(
    state,
    FEE,
    PROTOCOL_FEE,
    maturity,
    currentTime + 10_000n,
    data.lendGivenBondParams.assetIn,
    data.lendGivenBondParams.bondOut
  )

  const delState = {
    x: xIncreaseLendGivenBond,
    y: yDecreaseLendGivenBond,
    z: zDecreaseLendGivenBond,
  }

  const bond = LendMath.getBond(delState, maturity, currentTime + 10_000n)
  const insurance = LendMath.getInsurance(state, delState, maturity, currentTime + 10_000n)
  const insurancePrincipal = LendMath.getInsurancePrincipal(state, delState)
  const insuranceInterest = LendMath.getInsuranceInterest(delState, maturity, currentTime + 10_000n)

  const natives = await result.convenience.getNatives(assetAddress, collateralAddress, result.maturity)

  const bondPrincipalToken = BondPrincipal__factory.connect(natives.bondPrincipal, ethers.provider)
  const bondInterestToken = BondInterest__factory.connect(natives.bondInterest, ethers.provider)

  const insurancePrincipalToken = InsurancePrincipal__factory.connect(natives.insurancePrincipal, ethers.provider)
  const insuranceInterestToken = InsuranceInterest__factory.connect(natives.insuranceInterest, ethers.provider)

  const bondPrincipalContractBalance = (await bondPrincipalToken.balanceOf(signers[0].address)).toBigInt()
  const bondInterestContractBalance = (await bondInterestToken.balanceOf(signers[0].address)).toBigInt()

  const insurancePrincipalContractBalance = (await insurancePrincipalToken.balanceOf(signers[0].address)).toBigInt()
  const insuranceInterestContractBalance = (await insuranceInterestToken.balanceOf(signers[0].address)).toBigInt()

  expect(bondPrincipalContractBalance + bondInterestContractBalance).equalBigInt(
    bond - (data.collectParams.claims.bondPrincipal + data.collectParams.claims.bondInterest)
  )
  expect(insurancePrincipalContractBalance + insuranceInterestContractBalance).equalBigInt(
    insurance - (data.collectParams.claims.insurancePrincipal + data.collectParams.claims.insuranceInterest)
  )
}
