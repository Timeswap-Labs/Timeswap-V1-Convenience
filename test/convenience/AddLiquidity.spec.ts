import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftUp, mulDivUp, advanceTimeAndBlock, setTime } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import { newLiquidityFixture, constructorFixture, Fixture, addLiquidityFixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { AddLiquidityParams, NewLiquidityParams } from '../types'
import { ERC20__factory } from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'

const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n

describe('Add Liquidity', () => {
  async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 31536000n
    signers = await ethers.getSigners()

    const constructor = await constructorFixture(1n << 255n, 1n << 255n, maturity, signers[0])

    return constructor
  }




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
              .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n,maturity)),
            addLiquidityParams: fc.record({
              assetIn: fc.bigUintN(112),
              minLiquidity: fc.bigUintN(256),
              maxDebt: fc.bigUintN(112),
              maxCollateral: fc.bigUintN(112),
            }).noShrink(),
          })
          .filter((x) => LiquidityFilter.addLiquiditySuccess(x, currentTime + 5_000n, currentTime + 10_000n,maturity)).noShrink(),
        async (data) => {
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], data.newLiquidityParams)
            await setTime(Number(currentTime + 10000n))
            const addLiquidity = await addLiquidityFixture(newLiquidity, signers[0], data.addLiquidityParams)
            return addLiquidity
          }

          // Trying things
          const neededTime = (await now()) + 100n
          // providers.

          const result = await loadFixture(success)
          // currentTime = await now()
          console.log(data);
          const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = LiquidityMath.getYandZIncreaseNewLiquidity(
            data.newLiquidityParams.assetIn,
            data.newLiquidityParams.debtIn,
            data.newLiquidityParams.collateralIn,
            currentTime + 5_000n,
            maturity
          )

          const state = {
            x: data.newLiquidityParams.assetIn,
            y: yIncreaseNewLiquidity,
            z: zIncreaseNewLiquidity,
          }
          const { yIncreaseAddLiquidity, zIncreaseAddLiquidity } = LiquidityMath.getYandZIncreaseAddLiquidity(
            state,
            data.addLiquidityParams.assetIn
          )
          const liquidityBalanceNew = LiquidityMath.liquidityCalculateNewLiquidity(
            data.newLiquidityParams.assetIn,
            currentTime + 5_000n,
            maturity
          )
          const delState = {
            x: data.addLiquidityParams.assetIn,
            y: yIncreaseAddLiquidity,
            z: zIncreaseAddLiquidity,
          }
          const liquidityBalanceAdd = LiquidityMath.liquidityCalculateAddLiquidity(state, delState, currentTime + 10_000n,maturity)
          const liquidityBalance = liquidityBalanceNew + liquidityBalanceAdd
          const liquidityToken = ERC20__factory.connect(
            (await result.convenience.getNatives(result.assetToken.address, result.collateralToken.address, maturity))
              .liquidity,
            ethers.provider
          )
          const liquidityBalanceContract = (await liquidityToken.balanceOf(signers[0].address)).toBigInt()
          // console.log(liquidityBalanceContract)
          expect(liquidityBalanceContract).equalBigInt(liquidityBalance)
        }
      ), {skipAllAfterTimeLimit:50000}
    )
  }).timeout(100000)
})
