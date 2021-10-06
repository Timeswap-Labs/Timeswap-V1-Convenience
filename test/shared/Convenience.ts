import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Assertion } from 'chai'
import { run, ethers } from 'hardhat'
import { Test } from 'mocha'
import { PerformanceNodeTiming } from 'perf_hooks'
import { TestToken } from '../../typechain/TestToken'
import type { TimeswapConvenience as ConvenienceContract } from '../../typechain/TimeswapConvenience'
import type { TimeswapFactory as FactoryContract } from '../../typechain/TimeswapFactory'
import type { TimeswapPair as PairContract } from '../../typechain/TimeswapPair'
import { Claims, CollectParams } from '../types'
import { deploy } from './DeployConvenience'
interface Native {
  liquidity: string
  bond: string
  insurance: string
  collateralizedDebt: string
}
export class Convenience {
  public convenienceContract: ConvenienceContract
  public factoryContract: FactoryContract
  public signer: SignerWithAddress
  constructor(convenienceContract: ConvenienceContract, factoryContract: FactoryContract, signer: SignerWithAddress) {
    this.convenienceContract = convenienceContract
    this.factoryContract = factoryContract
    this.signer = signer
  }
  async updateSigner(signer: SignerWithAddress) {
    this.signer = signer
  }

  async getNatives(asset: string, collateral: string, maturity: bigint): Promise<Native> {
    return await this.convenienceContract.getNative(asset, collateral, maturity)
  }
  async newLiquidity(
    maturity: bigint,
    asset: string,
    collateral: string,
    assetIn: bigint,
    debtIn: bigint,
    collateralIn: bigint
  ) {
    return await this.convenienceContract.newLiquidity({
      maturity: maturity,
      asset: asset,
      collateral: collateral,
      assetIn: assetIn,
      debtIn: debtIn,
      collateralIn: collateralIn,
      dueTo: this.signer.address,
      liquidityTo: this.signer.address,
      deadline: maturity,
    })
  }
  async addLiquidity(
    maturity: bigint,
    asset: string,
    collateral: string,
    assetIn: bigint,
    minLiquidity: bigint,
    maxDebt: bigint,
    maxCollateral: bigint
  ) {
    return await this.convenienceContract.addLiquidity({
      maturity: maturity,
      asset: asset,
      collateral: collateral,
      assetIn: assetIn,
      minLiquidity: minLiquidity,
      maxDebt: maxDebt,
      maxCollateral: maxCollateral,
      dueTo: this.signer.address,
      liquidityTo: this.signer.address,
      deadline: maturity,
    })
  }
  async removeLiquidity(maturity: bigint, asset: string, collateral: string, liquidityIn: bigint) {
    return await this.convenienceContract.removeLiquidity({
      maturity: maturity,
      asset: asset,
      collateral: collateral,
      assetTo: this.signer.address,
      collateralTo: this.signer.address,
      liquidityIn: liquidityIn,
    })
  }
  async lendGivenBond(
    maturity: bigint,
    asset: string,
    collateral: string,
    assetIn: bigint,
    bondOut: bigint,
    minInsurance: bigint
  ) {
    return await this.convenienceContract.lendGivenBond({
      maturity: maturity,
      asset: asset,
      collateral: collateral,
      bondTo: this.signer.address,
      insuranceTo: this.signer.address,
      assetIn: assetIn,
      bondOut: bondOut,
      minInsurance: minInsurance,
      deadline: maturity,
    })
  }
  async lendGivenInsurance(
    maturity: bigint,
    asset: string,
    collateral: string,
    assetIn: bigint,
    insuranceOut: bigint,
    minBond: bigint
  ) {
    return await this.convenienceContract.lendGivenInsurance({
      maturity: maturity,
      asset: asset,
      collateral: collateral,
      bondTo: this.signer.address,
      insuranceTo: this.signer.address,
      assetIn: assetIn,
      insuranceOut: insuranceOut,
      minBond: minBond,
      deadline: maturity,
    })
  }
  async lendGivenPercent(
    maturity: bigint,
    asset: string,
    collateral: string,
    assetIn: bigint,
    minInsurance: bigint,
    minBond: bigint,
    percent: bigint
  ) {
    return await this.convenienceContract.lendGivenPercent({
      maturity: maturity,
      asset: asset,
      collateral: collateral,
      bondTo: this.signer.address,
      insuranceTo: this.signer.address,
      assetIn: assetIn,
      percent: percent,
      minInsurance: minInsurance,
      minBond: minBond,
      deadline: maturity,
    })
  }
  async collect(maturity: bigint, asset: string, collateral: string, claims: Claims) {
    return await this.convenienceContract.collect({
      maturity: maturity,
      asset: asset,
      collateral: collateral,
      collateralTo: this.signer.address,
      assetTo: this.signer.address,
      claimsIn: claims,
    })
  }
  async borrowGivenDebt(
    maturity: bigint,
    asset: string,
    collateral: string,
    assetOut: bigint,
    debtIn: bigint,
    maxCollateral: bigint
  ) {
    return await this.convenienceContract.borrowGivenDebt({
      maturity: maturity,
      asset: asset,
      collateral: collateral,
      dueTo: this.signer.address,
      assetTo: this.signer.address,
      assetOut: assetOut,
      debtIn: debtIn,
      maxCollateral: maxCollateral,
      deadline: maturity,
    })
  }
  async borrowGivenCollateral(
    maturity: bigint,
    asset: string,
    collateral: string,
    assetOut: bigint,
    maxDebt: bigint,
    collateralIn: bigint
  ) {
    return await this.convenienceContract.borrowGivenCollateral({
      maturity: maturity,
      asset: asset,
      collateral: collateral,
      dueTo: this.signer.address,
      assetTo: this.signer.address,
      assetOut: assetOut,
      maxDebt: maxDebt,
      collateralIn: collateralIn,
      deadline: maturity,
    })
  }
  async borrowGivenPercent(
    maturity: bigint,
    asset: string,
    collateral: string,
    assetOut: bigint,
    maxDebt: bigint,
    maxCollateral: bigint,
    percent: bigint
  ) {
    return await this.convenienceContract.borrowGivenPercent({
      maturity: maturity,
      asset: asset,
      collateral: collateral,
      dueTo: this.signer.address,
      assetTo: this.signer.address,
      assetOut: assetOut,
      maxDebt: maxDebt,
      maxCollateral: maxCollateral,
      percent: percent,
      deadline: maturity,
    })
  }
  async repay(maturity: bigint, asset: string, collateral: string, ids: bigint[], maxAssetsIn: bigint[]) {
    return await this.convenienceContract.repay({
      maturity: maturity,
      asset: asset,
      collateral: collateral,
      collateralTo: this.signer.address,
      ids: ids,
      maxAssetsIn: maxAssetsIn,
      deadline: maturity,
    })
  }
}

export async function convenienceInit(
  maturity: bigint,
  asset: TestToken,
  collateral: TestToken,
  signerWithAddress: SignerWithAddress
) {
  const { convenience, factory } = await deploy(asset, collateral, maturity)
  return new Convenience(convenience, factory, signerWithAddress)
}
