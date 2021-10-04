import { ethers, waffle } from 'hardhat'
import { now } from '../shared/Helper'
// import { expect } from './Expect'
import { addLiquidityTests, lendGivenInsuranceTests,  newLiquidityTests} from '../test-cases'
import { newLiquidityFixture, constructorFixture, Fixture, addLiquidityFixture, lendGivenInsuranceFixture } from '../shared/Fixtures'
import  {NewLiquidityParams,AddLiquidityParams,LendGivenInsuranceParams} from '../test-cases/types'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

const { loadFixture } = waffle

let maturity  = 0n
let signers: SignerWithAddress[]= []

export interface Test {
    newLiquidityTest: NewLiquidityParams,
    addLiquidityTest: AddLiquidityParams,
    lendGivenInsuranceTest: LendGivenInsuranceParams
}

describe('Lend Given Insurance',() =>{
    let tests:Test[]= []
    newLiquidityTests().forEach((newLiquidityTest,idx)=>{
        const addLiquidityTest = addLiquidityTests()[idx]
        const lendGivenInsuranceTest = lendGivenInsuranceTests()[idx]
        tests[idx]={newLiquidityTest: newLiquidityTest, addLiquidityTest: addLiquidityTest, lendGivenInsuranceTest: lendGivenInsuranceTest}
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
                const lendGivenInsurance = await lendGivenInsuranceFixture(addLiquidity, signers[0],test.lendGivenInsuranceTest)
        
                return lendGivenInsurance
              }
        
              it('Should have natives', async () => {
                const { convenience, assetToken, collateralToken, maturity } = await loadFixture(fixtureSuccess)
        
                const natives = await convenience.getNatives(assetToken.address,collateralToken.address,maturity)
                console.log(natives);
              })
        })
    })
})