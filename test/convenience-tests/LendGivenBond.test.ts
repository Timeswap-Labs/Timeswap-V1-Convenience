import { ethers, waffle } from 'hardhat'
import { now } from '../shared/Helper'
// import { expect } from './Expect'
import { addLiquidityTests,  lendGivenBondTests, newLiquidityTests} from '../test-cases'
import  {NewLiquidityParams,AddLiquidityParams, LendGivenBondParams} from '../test-cases/types'

import { newLiquidityFixture, constructorFixture, Fixture, addLiquidityFixture, lendGivenBondFixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

const { loadFixture } = waffle

let maturity  = 0n
let signers: SignerWithAddress[]= []

export interface Test {
    newLiquidityTest: NewLiquidityParams,
    addLiquidityTest: AddLiquidityParams,
    lendGivenBondTest: LendGivenBondParams
}

describe('Lend Given Bond',() =>{
    let tests:Test[]= []
    newLiquidityTests().forEach((newLiquidityTest,idx)=>{
        const addLiquidityTest = addLiquidityTests()[idx]
        const lendGivenBondTest = lendGivenBondTests()[idx]
        tests[idx]={newLiquidityTest: newLiquidityTest, addLiquidityTest: addLiquidityTest, lendGivenBondTest: lendGivenBondTest}
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
                const lendGivenBond = await lendGivenBondFixture(addLiquidity, signers[0],test.lendGivenBondTest)
        
                return lendGivenBond
              }
        
              it('Should have natives', async () => {
                const { convenience, assetToken, collateralToken, maturity } = await loadFixture(fixtureSuccess)
        
                const natives = await convenience.getNatives(assetToken.address,collateralToken.address,maturity)
                console.log(natives);
              })
        })
    })
})