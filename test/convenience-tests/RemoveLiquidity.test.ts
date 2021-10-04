import { ethers, waffle } from 'hardhat'
import { now , advanceTimeAndBlock} from '../shared/Helper'
// import { expect } from './Expect'
import {addLiquidityTests, newLiquidityTests,  removeLiquidityTests} from '../test-cases'
import { newLiquidityFixture, constructorFixture, Fixture, addLiquidityFixture, removeLiquidityFixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import  {NewLiquidityParams,AddLiquidityParams, RemoveLiquidityParams} from '../test-cases/types'

const { loadFixture } = waffle

let maturity  = 0n
let signers: SignerWithAddress[]= []

export interface Test {
    newLiquidityTest: NewLiquidityParams,
    addLiquidityTest: AddLiquidityParams,
    removeLiquidityTest: RemoveLiquidityParams
}

describe('Remove Liquidity',() =>{
    let tests:Test[]= []
    newLiquidityTests().forEach((newLiquidityTest,idx)=>{
        const addLiquidityTest = addLiquidityTests()[idx]
        const removeLiquidityTest = removeLiquidityTests()[idx]
        tests[idx]={newLiquidityTest: newLiquidityTest, addLiquidityTest: addLiquidityTest, removeLiquidityTest: removeLiquidityTest}
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
                advanceTimeAndBlock(31536000)

                const removeLiquidity = await removeLiquidityFixture(addLiquidity,signers[0], test.removeLiquidityTest)
        
                return removeLiquidity
              }
        
              it('Should have natives', async () => {
                const { convenience, assetToken, collateralToken, maturity } = await loadFixture(fixtureSuccess)
        
                const natives = await convenience.getNatives(assetToken.address,collateralToken.address,maturity)
                console.log(natives);
              })
        })
    })
})