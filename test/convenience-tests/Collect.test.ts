import { ethers, waffle } from 'hardhat'
import { now , advanceTimeAndBlock} from '../shared/Helper'
// import { expect } from './Expect'
import { addLiquidityTests, lendGivenPercentTests, newLiquidityTests, collectTests} from '../test-cases'
import { newLiquidityFixture, constructorFixture, Fixture, addLiquidityFixture, lendGivenPercentFixture , collectFixture} from '../shared/Fixtures'
import  {NewLiquidityParams,AddLiquidityParams,LendGivenPercentParams, CollectParams} from '../test-cases/types'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Convenience } from '../shared/Convenience'

const { loadFixture } = waffle

let maturity  = 0n
let signers: SignerWithAddress[]= []

export interface Test {
    newLiquidityTest: NewLiquidityParams,
    addLiquidityTest: AddLiquidityParams,
    lendGivenPercentTest: LendGivenPercentParams,
    collectTest: CollectParams

}


describe('Collect',() =>{
    let tests:Test[]= []
    newLiquidityTests().forEach((newLiquidityTest,idx)=>{
        const addLiquidityTest = addLiquidityTests()[idx]
        const lendGivenPercentTest = lendGivenPercentTests()[idx]
        const collectTest = collectTests()[idx]
        tests[idx]={newLiquidityTest: newLiquidityTest, addLiquidityTest: addLiquidityTest, lendGivenPercentTest: lendGivenPercentTest,collectTest:collectTest }
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
                const lendGivenPercent = await lendGivenPercentFixture(addLiquidity, signers[0],test.lendGivenPercentTest)
                advanceTimeAndBlock(31536000)

                const collect = await collectFixture(lendGivenPercent, signers[0],test.collectTest)

        
                return collect
              }
        
              it('Should have natives', async () => {
                const { convenience, assetToken, collateralToken, maturity } = await loadFixture(fixtureSuccess)
        
                const natives = await convenience.getNatives(assetToken.address,collateralToken.address,maturity)
                console.log(natives);
              })
        })
    })
})