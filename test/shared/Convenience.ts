import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { run, ethers } from "hardhat";
import { TestToken } from "../../typechain/TestToken";
import type {TimeswapConvenience as ConvenienceContract} from '../../typechain/TimeswapConvenience'
import { deploy } from "./DeployConvenience";
interface Native{
    liquidity: string,
    bond: string,
    insurance: string,
    collateralizedDebt: string
}
export class Convenience {
    constructor(public convenienceContract: ConvenienceContract, public signerWithAddress: SignerWithAddress){}

     async getNatives(asset:string,collateral:string,maturity:bigint): Promise<Native>{
         return await this.convenienceContract.getNative(asset,collateral,maturity)
     }
}

export async function convenienceInit(maturity: bigint, asset: TestToken, collateral: TestToken) {
    const convenienceContract = await deploy(asset,collateral,maturity)
    const signers = await ethers.getSigners()
    return new Convenience(convenienceContract,signers[0])
}