import { advanceTimeAndBlock, getBlock } from './Helper'
import { testTokenNew } from './TestToken'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { now } from '../shared/Helper'
import type { TimeswapFactory as Factory } from '../../typechain/TimeswapFactory'
import { convenienceInit } from './Convenience'

import type { TestToken } from '../../typechain/TestToken'
import { ethers } from 'hardhat'

export async function constructorFixture(
  assetValue: bigint,
  collateralValue: bigint,
  maturity: bigint
) {
  const assetToken = await testTokenNew('DAI', 'DAI', assetValue)
  const collateralToken = await testTokenNew('Matic', 'MATIC', collateralValue)

  const convenience = await convenienceInit(maturity,assetToken, collateralToken)
  await assetToken.approve(convenience.convenienceContract.address, assetValue);
  await collateralToken.approve(convenience.convenienceContract.address, collateralValue);

  return { convenience, assetToken, collateralToken }
}

export async function newLiquidityFixture(

)