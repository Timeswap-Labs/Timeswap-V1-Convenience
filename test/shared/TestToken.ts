import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'

import type { TestToken } from '../../typechain/TestToken'



export const testTokenNew = async (name: string, symbol: string, value: bigint, signerWithAddresses: SignerWithAddress[]) => {
  const testTokenFactory = await ethers.getContractFactory('TestToken')
  const testToken = (await testTokenFactory.deploy(name, symbol, value)) as TestToken
  await testToken.deployed()
  for(let i =1;i<signerWithAddresses.length;i++){
    testToken.transfer(signerWithAddresses[i].address,BigInt(value/BigInt(signerWithAddresses.length+1)))
  }

  return testToken
}
