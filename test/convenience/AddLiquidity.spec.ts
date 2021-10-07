import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftUp, mulDivUp, advanceTimeAndBlock, setTime, objectMap, UToBObj } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import { newLiquidityFixture, constructorFixture, Fixture, addLiquidityFixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { AddLiquidityParams, NewLiquidityParams } from '../types'
import { ERC20__factory } from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'
import { Uint112, Uint256 } from '@timeswap-labs/timeswap-v1-sdk-core'
import { addLiquidityParamsUToB, newLiquidityParamsUToB } from '../types/transformers/Liquidity'

const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n



describe('New Liquidity', () => {
  async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 31536000n
    signers = await ethers.getSigners()

    const constructor = await constructorFixture(1n << 112n, 1n << 112n, maturity, signers[0])

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
                assetIn: fc.bigUintN(50),
                debtIn: fc.bigUintN(50),
                collateralIn: fc.bigUintN(50),
              }).map(({ assetIn, debtIn, collateralIn }) => {
                return {
                  assetIn: new Uint112(assetIn),
                  debtIn: new Uint112(debtIn),
                  collateralIn: new Uint112(collateralIn),
                }})
              .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n,maturity)),
            addLiquidityParams: fc.record({
              assetIn: fc.bigUintN(50),
              minLiquidity: fc.bigUintN(100),
              maxDebt: fc.bigUintN(50),
              maxCollateral: fc.bigUintN(50),
            }).map(({ assetIn, minLiquidity, maxDebt,maxCollateral }) => {
              return {
                assetIn: new Uint112(assetIn),
                minLiquidity: new Uint256(minLiquidity),
                maxDebt: new Uint112(maxDebt),
                maxCollateral: new Uint112(maxCollateral),
              }}
              )
          })
          .filter((x) => LiquidityFilter.addLiquiditySuccess(x, currentTime + 5_000n, currentTime + 10_000n,maturity)).noShrink(),
        async (data) => {
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], newLiquidityParamsUToB(data.newLiquidityParams))
            await setTime(Number(currentTime + 10000n))
            const addLiquidity = await addLiquidityFixture(newLiquidity, signers[0], addLiquidityParamsUToB(data.addLiquidityParams))
            return addLiquidity
          }
          console.log(data);
          // Trying things
          const neededTime = (await now()) + 100n
          // providers.

          const result = await loadFixture(success)
          // currentTime = await now()

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
          const liquidityBalance = liquidityBalanceNew.add(liquidityBalanceAdd).toBigInt()
          const liquidityToken = ERC20__factory.connect(
            (await result.convenience.getNatives(result.assetToken.address, result.collateralToken.address, maturity))
              .liquidity,
            ethers.provider
          )
          const liquidityBalanceContract = (await liquidityToken.balanceOf(signers[0].address)).toBigInt()
          // console.log(liquidityBalanceContract)
          expect(liquidityBalanceContract).equalBigInt(liquidityBalance)
        }
      )
    )
  }).timeout(600000)
})
