import { ethers, waffle } from 'hardhat'
import { now } from '../shared/Helper'
// import { expect } from './Expect'
import { addLiquidityTests,  borrowGivenPercentTests, newLiquidityTests,repayTests} from '../test-cases'
import  {NewLiquidityParams,AddLiquidityParams, BorrowGivenPercentParams,RepayParams} from '../test-cases/types'

import { newLiquidityFixture, constructorFixture, Fixture, addLiquidityFixture, repayFixture,lendGivenBondFixture, borrowGivenPercentFixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

const { loadFixture } = waffle

let maturity  = 0n
let signers: SignerWithAddress[]= []

export interface Test {
    newLiquidityTest: NewLiquidityParams,
    addLiquidityTest: AddLiquidityParams,
    borrowGivenPercentTest: BorrowGivenPercentParams
    repayTest: RepayParams
}

describe('Repay',() =>{
    let tests:Test[]= []
    newLiquidityTests().forEach((newLiquidityTest,idx)=>{
        const addLiquidityTest = addLiquidityTests()[idx]
        const borrowGivenPercentTest = borrowGivenPercentTests()[idx]
        const repayTest = repayTests()[idx]
        tests[idx]={newLiquidityTest: newLiquidityTest, addLiquidityTest: addLiquidityTest, borrowGivenPercentTest: borrowGivenPercentTest,repayTest:repayTest}
    })
    async function fixture():Promise<Fixture>{
        
    maturity = (await now()) + 31536000n
    signers = await ethers.getSigners()

    const constructor = await constructorFixture(10000n, 10000n, maturity, signers[0] )
    
    return constructor

    } 

    tests.forEach((test,idx)=>{
        describe(`Case ${idx}`,()=>{
            async function fixtureSuccess(): Promise<Fixture> {
                const constructor = await loadFixture(fixture)
        
                const newLiquidity = await newLiquidityFixture(constructor, signers[0], test.newLiquidityTest)
                const addLiquidity = await addLiquidityFixture(newLiquidity, signers[0], test.addLiquidityTest)
                const borrowGivenPercent = await borrowGivenPercentFixture(addLiquidity, signers[0],test.borrowGivenPercentTest)
                const repay = await repayFixture(borrowGivenPercent,signers[0],test.repayTest)
                return repay
              }
        
              it('Should have natives', async () => {
                const { convenience, assetToken, collateralToken, maturity } = await loadFixture(fixtureSuccess)
        
                const natives = await convenience.getNatives(assetToken.address,collateralToken.address,maturity)
                console.log(natives);
              })
        })
    })
})