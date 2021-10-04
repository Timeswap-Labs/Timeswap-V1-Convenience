import { advanceTimeAndBlock, getBlock } from './Helper'
import { testTokenNew } from './TestToken'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { now } from '../shared/Helper'
import type { TimeswapFactory as Factory } from '../../typechain/TimeswapFactory'
import { Convenience, convenienceInit ,  } from './Convenience'

import type { TestToken } from '../../typechain/TestToken'
import { ethers } from 'hardhat'
import { NewLiquidityParams, AddLiquidityParams, RemoveLiquidityParams, LendGivenBondParams , LendGivenInsuranceParams, LendGivenPercentParams, CollectParams, BorrowGivenDebtParams, BorrowGivenCollateralParams, BorrowGivenPercentParams, RepayParams} from '../test-cases/types'

let assetValue = 100000n**100000n
let collateralValue = 100000n**100000n

export async function constructorFixture(
  assetValue: bigint,
  collateralValue: bigint,
  maturity: bigint,
  signerWithAddress: SignerWithAddress
) {
  const assetToken = await testTokenNew('DAI', 'DAI', assetValue)
  const collateralToken = await testTokenNew('Matic', 'MATIC', collateralValue)

  const convenience = await convenienceInit(maturity,assetToken, collateralToken, signerWithAddress)
  await assetToken.approve(convenience.convenienceContract.address, assetValue);
  await collateralToken.approve(convenience.convenienceContract.address, collateralValue);


  return { convenience, assetToken, collateralToken, maturity }
}

export async function newLiquidityFixture(fixture: Fixture, signer: SignerWithAddress, newLiquidityParams: NewLiquidityParams){
  const { convenience, assetToken, collateralToken, maturity } = fixture
  const txn = await fixture.convenience.newLiquidity(
    fixture.maturity,
    fixture.assetToken.address,
    fixture.collateralToken.address,
    newLiquidityParams.assetIn,
    newLiquidityParams.debtIn,
    newLiquidityParams.collateralIn,
  )

  
  return {convenience, assetToken, collateralToken, maturity}
}
  export async function addLiquidityFixture(fixture: Fixture, signer: SignerWithAddress, addLiquidityParams: AddLiquidityParams){
    const { convenience, assetToken, collateralToken, maturity } = fixture
    const txn = await fixture.convenience.addLiquidity(
      fixture.maturity,
      fixture.assetToken.address,
      fixture.collateralToken.address,
      addLiquidityParams.assetIn,
      addLiquidityParams.minLiquidity,
      addLiquidityParams.maxDebt,
      addLiquidityParams.maxCollateral
    )
    
    return {convenience, assetToken, collateralToken, maturity}
  
}
export async function removeLiquidityFixture(fixture: Fixture, signer: SignerWithAddress, removeLiquidityParams: RemoveLiquidityParams){
  const { convenience, assetToken, collateralToken, maturity } = fixture
  const txn = await fixture.convenience.removeLiquidity(
    fixture.maturity,
    fixture.assetToken.address,
    fixture.collateralToken.address,
    removeLiquidityParams.liquidityIn,
  )
  
  return {convenience, assetToken, collateralToken, maturity}

}
export async function lendGivenBondFixture(fixture: Fixture, signer: SignerWithAddress, lendGivenBondParams: LendGivenBondParams){
  const { convenience, assetToken, collateralToken, maturity } = fixture
  const txn = await fixture.convenience.lendGivenBond(
    fixture.maturity,
    fixture.assetToken.address,
    fixture.collateralToken.address,
    lendGivenBondParams.assetIn,
    lendGivenBondParams.bondOut,
    lendGivenBondParams.minInsurance,
  )
  
  return {convenience, assetToken, collateralToken, maturity}

}
export async function lendGivenInsuranceFixture(fixture: Fixture, signer: SignerWithAddress, lendGivenInsuranceParams: LendGivenInsuranceParams){
  const { convenience, assetToken, collateralToken, maturity } = fixture
  const txn = await fixture.convenience.lendGivenInsurance(
    fixture.maturity,
    fixture.assetToken.address,
    fixture.collateralToken.address,
    lendGivenInsuranceParams.assetIn,
    lendGivenInsuranceParams.insuranceOut,
    lendGivenInsuranceParams.minBond,
  )
  
  return {convenience, assetToken, collateralToken, maturity}

}
export async function lendGivenPercentFixture(fixture: Fixture, signer: SignerWithAddress, lendGivenPercentParams: LendGivenPercentParams){
  const { convenience, assetToken, collateralToken, maturity } = fixture
  const txn = await fixture.convenience.lendGivenPercent(
    fixture.maturity,
    fixture.assetToken.address,
    fixture.collateralToken.address,
    lendGivenPercentParams.assetIn,
    lendGivenPercentParams.percent,
    lendGivenPercentParams.minInsurance,
    lendGivenPercentParams.minBond,
  )
  
  return {convenience, assetToken, collateralToken, maturity}

}
export async function collectFixture(fixture: Fixture, signer: SignerWithAddress, collectParams: CollectParams){
  const { convenience, assetToken, collateralToken, maturity } = fixture
  const txn = await fixture.convenience.collect(
    fixture.maturity,
    fixture.assetToken.address,
    fixture.collateralToken.address,
    collectParams.claims
  )
  
  return {convenience, assetToken, collateralToken, maturity}

}
export async function borrowGivenDebtFixture(fixture: Fixture, signer: SignerWithAddress, borrowGivenDebtParams: BorrowGivenDebtParams){
  const { convenience, assetToken, collateralToken, maturity } = fixture
  const txn = await fixture.convenience.borrowGivenDebt(
    fixture.maturity,
    fixture.assetToken.address,
    fixture.collateralToken.address,
    borrowGivenDebtParams.assetOut,
    borrowGivenDebtParams.debtIn,
    borrowGivenDebtParams.maxCollateral
  )
  
  return {convenience, assetToken, collateralToken, maturity}

}
export async function borrowGivenCollateralFixture(fixture: Fixture, signer: SignerWithAddress, borrowGivenCollateralParams: BorrowGivenCollateralParams){
  const { convenience, assetToken, collateralToken, maturity } = fixture
  const txn = await fixture.convenience.borrowGivenCollateral(
    fixture.maturity,
    fixture.assetToken.address,
    fixture.collateralToken.address,
    borrowGivenCollateralParams.assetOut,
    borrowGivenCollateralParams.maxDebt,
    borrowGivenCollateralParams.collateralIn
  )
  
  return {convenience, assetToken, collateralToken, maturity}

}
export async function borrowGivenPercentFixture(fixture: Fixture, signer: SignerWithAddress, borrowGivenPercentParams: BorrowGivenPercentParams){
  const { convenience, assetToken, collateralToken, maturity } = fixture
  const txn = await fixture.convenience.borrowGivenPercent(
    fixture.maturity,
    fixture.assetToken.address,
    fixture.collateralToken.address,
    borrowGivenPercentParams.assetOut,
    borrowGivenPercentParams.maxDebt,
    borrowGivenPercentParams.maxCollateral,
    borrowGivenPercentParams.percent
  )
  
  return {convenience, assetToken, collateralToken, maturity}

}
export async function repayFixture(fixture: Fixture, signer: SignerWithAddress, repayParams: RepayParams){
  const { convenience, assetToken, collateralToken, maturity } = fixture
  const txn = await fixture.convenience.repay(
    fixture.maturity,
    fixture.assetToken.address,
    fixture.collateralToken.address,
    repayParams.ids,
    repayParams.maxAssetsIn
  )
  
  return {convenience, assetToken, collateralToken, maturity}

}
export interface Fixture {
  convenience: Convenience
  assetToken: TestToken
  collateralToken: TestToken
  maturity: bigint
}