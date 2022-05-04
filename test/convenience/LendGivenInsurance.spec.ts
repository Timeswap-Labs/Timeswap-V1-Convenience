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
  lendGivenInsuranceFixture,
  lendGivenInsuranceETHCollateralFixture,
  newLiquidityETHCollateralFixture,
  lendGivenInsuranceETHAssetFixture,
  newLiquidityETHAssetFixture,
} from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { LendGivenInsuranceParams, NewLiquidityParams } from '../types'
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
import { lendGivenInsuranceTestCases as testCases } from '../test-cases/index'
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

describe('Lend Given Insurance', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityFixture(constructorFixture, signers[0], testCase.newLiquidityParams)
      await setTime(Number(currentTime + 10000n))
      const lendGivenInsurance = await lendGivenInsuranceFixture(
        newLiquidity,
        signers[0],
        testCase.lendGivenInsuranceParams
      )

      await lendGivenInsuranceProperties(
        testCase,
        currentTime,
        lendGivenInsurance,
        assetToken.address,
        collateralToken.address
      )
    })
  })
})

describe('Lend Given Insurance ETH Asset', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, convenience, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityETHAssetFixture(
        constructorFixture,
        signers[0],
        testCase.newLiquidityParams
      )
      await setTime(Number(currentTime + 10000n))
      const lendGivenInsurance = await lendGivenInsuranceETHAssetFixture(
        newLiquidity,
        signers[0],
        testCase.lendGivenInsuranceParams
      )

      await lendGivenInsuranceProperties(
        testCase,
        currentTime,
        lendGivenInsurance,
        convenience.wethContract.address,
        collateralToken.address
      )
    })
  })
})

describe('Lend Given Insurance ETH Collateral', () => {
  testCases.forEach((testCase, index) => {
    it(`Succeeded ${index}`, async () => {
      const { maturity, assetToken, convenience, collateralToken } = await loadFixture(fixture)
      let currentTime = await now()

      const constructorFixture = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await newLiquidityETHCollateralFixture(
        constructorFixture,
        signers[0],
        testCase.newLiquidityParams
      )
      await setTime(Number(currentTime + 10000n))
      const lendGivenInsurance = await lendGivenInsuranceETHCollateralFixture(
        newLiquidity,
        signers[0],
        testCase.lendGivenInsuranceParams
      )

      await lendGivenInsuranceProperties(
        testCase,
        currentTime,
        lendGivenInsurance,
        assetToken.address,
        convenience.wethContract.address
      )
    })
  })
})

async function lendGivenInsuranceProperties(
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
    xIncrease: xIncreaseLendGivenInsurance,
    yDecrease: yDecreaseLendGivenInsurance,
    zDecrease: zDecreaseLendGivenInsurance,
  } = LendMath.getLendGivenInsuranceParams(
    state,
    maturity,
    FEE,
    PROTOCOL_FEE,
    currentTime + 10_000n,
    data.lendGivenInsuranceParams.assetIn,
    data.lendGivenInsuranceParams.insuranceOut
  )

  const delState = {
    x: xIncreaseLendGivenInsurance,
    y: yDecreaseLendGivenInsurance,
    z: zDecreaseLendGivenInsurance,
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

  expect(bondPrincipalContractBalance + bondInterestContractBalance).equalBigInt(bond)
  expect(insurancePrincipalContractBalance + insuranceInterestContractBalance).equalBigInt(insurance)

  expect(insurancePrincipalContractBalance).equalBigInt(insurancePrincipal)
  expect(insuranceInterestContractBalance).equalBigInt(insuranceInterest)

  expect(insurance).gteBigInt(data.lendGivenInsuranceParams.insuranceOut)
}
