import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftUp, mulDivUp, advanceTimeAndBlock, setTime } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import * as LendMath from '../libraries/LendMath'
import { newLiquidityFixture, constructorFixture, Fixture, lendGivenBondFixture, collectFixture, collectETHAssetFixture, collectETHCollateralFixture, newLiquidityETHAssetFixture, lendGivenBondETHAssetFixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { LendGivenBondParams, NewLiquidityParams, CollectParams } from '../types'
import { ERC20__factory } from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'
import * as LendFilter from '../filters/Lend'

const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n
async function fixture(): Promise<Fixture> {
  maturity = (await now()) + 31536000n
  signers = await ethers.getSigners()

  const constructor = await constructorFixture(1n << 255n, 1n << 255n, maturity, signers[0])

  return constructor
}

describe('Collect', () => {


  it('Succeeded', async () => {
    const { maturity } = await loadFixture(fixture)
    let currentTime = await now()

    await fc.assert(
      fc.asyncProperty(
        fc
          .record({
            newLiquidityParams: fc
              .record({
                assetIn: fc.bigUintN(112),
                debtIn: fc.bigUintN(112),
                collateralIn: fc.bigUintN(112),
              })
              .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n, maturity)),
            lendGivenBondParams: fc.record({
              assetIn: fc.bigUintN(112),
              bondOut: fc.bigUintN(112),
              minInsurance: fc.bigUintN(112),
            }),
            collectParams: fc.record({
                claims: fc.record({
                    bond: fc.bigUintN(112),
                    insurance: fc.bigUintN(112)
                })})

          })
          .filter((x) => LendFilter.lendGivenBondSuccess(x, currentTime + 5_000n, currentTime + 10_000n, maturity))
          .filter((x)=> LendFilter.collectSuccess(x, currentTime + 5_000n, currentTime + 10_000n, maturity))
          .noShrink(),
        async (data) => {
          const success = async () => {
            //console.log(.*)
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], data.newLiquidityParams)
            await setTime(Number(currentTime + 10000n))
            const lendGivenBond = await lendGivenBondFixture(newLiquidity, signers[0], data.lendGivenBondParams)
            await setTime(Number(maturity+1n))
            const collect = await collectFixture(lendGivenBond,signers[0],data.collectParams)
            return collect

          }
          await loadFixture(success)
        }),
      { skipAllAfterTimeLimit: 50000, numRuns: 10 }
      )   

    }).timeout(100000)
  })

  describe('Collect ETHAsset', () => {

  
    it('Succeeded', async () => {
      const { maturity } = await loadFixture(fixture)
      let currentTime = await now()
  
      await fc.assert(
        fc.asyncProperty(
          fc
            .record({
              newLiquidityParams: fc
                .record({
                  assetIn: fc.bigUintN(112),
                  debtIn: fc.bigUintN(112),
                  collateralIn: fc.bigUintN(112),
                })
                .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n, maturity)),
              lendGivenBondParams: fc.record({
                assetIn: fc.bigUintN(112),
                bondOut: fc.bigUintN(112),
                minInsurance: fc.bigUintN(112),
              }),
              collectParams: fc.record({
                  claims: fc.record({
                      bond: fc.bigUintN(112),
                      insurance: fc.bigUintN(112)
                  })})
  
            })
            .filter((x) => LendFilter.lendGivenBondSuccess(x, currentTime + 5_000n, currentTime + 10_000n, maturity))
            .filter((x)=> LendFilter.collectSuccess(x, currentTime + 5_000n, currentTime + 10_000n, maturity))
            .noShrink(),
          async (data) => {
            const success = async () => {
              //console.log(.*)
              const constructor = await loadFixture(fixture)
              await setTime(Number(currentTime + 5000n))
              const newLiquidity = await newLiquidityETHAssetFixture(constructor, signers[0], data.newLiquidityParams)
              await setTime(Number(currentTime + 10000n))
              const lendGivenBond = await lendGivenBondETHAssetFixture(newLiquidity, signers[0], data.lendGivenBondParams)
              await setTime(Number(maturity+1n))
              const collect = await collectETHAssetFixture(lendGivenBond,signers[0],data.collectParams)
              return collect
  
            }
            //console.log(.*)
            await loadFixture(success)
          }),
        { skipAllAfterTimeLimit: 50000, numRuns: 10 }
        )
      }).timeout(100000)
    })
  
    describe('Collect ETHCollateral', () => {

    
      it('Succeeded', async () => {
        const { maturity } = await loadFixture(fixture)
        let currentTime = await now()
    
        await fc.assert(
          fc.asyncProperty(
            fc
              .record({
                newLiquidityParams: fc
                  .record({
                    assetIn: fc.bigUintN(112),
                    debtIn: fc.bigUintN(112),
                    collateralIn: fc.bigUintN(112),
                  })
                  .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n, maturity)),
                lendGivenBondParams: fc.record({
                  assetIn: fc.bigUintN(112),
                  bondOut: fc.bigUintN(112),
                  minInsurance: fc.bigUintN(112),
                }),
                collectParams: fc.record({
                    claims: fc.record({
                        bond: fc.bigUintN(112),
                        insurance: fc.bigUintN(112)
                    })})
    
              })
              .filter((x) => LendFilter.lendGivenBondSuccess(x, currentTime + 5_000n, currentTime + 10_000n, maturity))
              .filter((x)=> LendFilter.collectSuccess(x, currentTime + 5_000n, currentTime + 10_000n, maturity))
              .noShrink(),
            async (data) => {
              const success = async () => {
                //console.log(.*)
                const constructor = await loadFixture(fixture)
                await setTime(Number(currentTime + 5000n))
                const newLiquidity = await newLiquidityETHAssetFixture(constructor, signers[0], data.newLiquidityParams)
                await setTime(Number(currentTime + 10000n))
                const lendGivenBond = await lendGivenBondETHAssetFixture(newLiquidity, signers[0], data.lendGivenBondParams)
                await setTime(Number(maturity+1n))
                const collect = await collectETHAssetFixture(lendGivenBond,signers[0],data.collectParams)
                return collect
    
              }
              //console.log(.*)
              await loadFixture(success)
            }),
          { skipAllAfterTimeLimit: 50000, numRuns: 10 }
          )
        }).timeout(100000)
      })
