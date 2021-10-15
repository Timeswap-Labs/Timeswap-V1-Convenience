import * as fc from 'fast-check'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, waffle } from 'hardhat'
import { expect } from '../../shared/Expect'
import { MsgValueCallee } from '../../../typechain'
import { infiniteStream } from 'fast-check'
import { ContractTransaction } from '@ethersproject/contracts'
const MAXUINT256 = (1n << 256n) -1n
const MAXUINT112 = (1n << 112n) -1n
describe('Msg Value',()=>{
    it('Succeded', async()=>{
        const signer = (await ethers.getSigners())[0]
        await fc.assert(
            fc.asyncProperty(
                fc.bigUintN(100).filter((x)=> x>0).noShrink(),
                async (ethSent) => {
                    const msgValueCalleeFactory = await ethers.getContractFactory('MsgValueCallee')
                    const msgValueContract = (await msgValueCalleeFactory.deploy()) as MsgValueCallee
                    const initalUserBalance = await (await ethers.provider.getBalance(signer.address)).toBigInt()

                    const txn: ContractTransaction = await msgValueContract.connect(signer).getUint112({value: ethSent.toString()})
                    const gasUsed = (await txn.wait()).gasUsed.toBigInt()
                    const contractBalance = (await ethers.provider.getBalance(msgValueContract.address)).toBigInt()
                    const userBalance = (await ethers.provider.getBalance(signer.address)).toBigInt()
                    const userSpent=  (ethSent+gasUsed)
                    const expectedUserBalance = (initalUserBalance- userSpent)

                    
                    if(ethSent>MAXUINT112){
                        expect(userSpent).equalBigInt(ethSent-(MAXUINT256-MAXUINT112))
                        expect(contractBalance).equalBigInt(MAXUINT112);
                    }
                    else{
                        expect(userBalance).equalBigInt(expectedUserBalance)
                        expect(contractBalance).equalBigInt(ethSent)
                    }
                }
            )
        )
    })
})