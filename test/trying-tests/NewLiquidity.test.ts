import { ethers, waffle } from 'hardhat'
import { now } from '../shared/Helper'
import { expect } from '../shared/Expect'
import { newLiquidityTests } from '../test-cases'
import { newLiquidityFixture, constructorFixture, Fixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { NewLiquidityParams } from '../test-cases/types'

const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

describe('New Liquidity', () => {
  async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 31536000n
    signers = await ethers.getSigners()

    const constructor = await constructorFixture(10000n, 10000n, maturity, signers[0])

    return constructor
  }

  //   async function fixtureSuccess(): Promise<Fixture> {
  //     const constructor = await loadFixture(fixture)

  //     const newLiquidity = await newLiquidityFixture(constructor, signers[0], test)

  //     return newLiquidity
  //   }

  it('Succeeded', async () => {
    const success = async (test: NewLiquidityParams) => {
      const constructor = await loadFixture(fixture)
      const newLiquidity = await newLiquidityFixture(constructor, signers[0], test)
      return newLiquidity
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({ assetIn: fc.bigUintN(112), collateralIn: fc.bigUintN(112), debtIn: fc.bigUintN(112) })),
        async (data) => {
          for (const param of data) {
            console.log('Entered', data)
            const x = await success(param)
            console.log(x)
            console.log('Hello')
          }
        }
      )
    )

    console.log('Done')
  })
})
