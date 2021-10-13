import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftUp, mulDivUp, advanceTimeAndBlock, setTime, advanceTime } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import {
  newLiquidityFixture,
  constructorFixture,
  Fixture,
  addLiquidityFixture,
  removeLiquidityFixture,
} from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { AddLiquidityParams, NewLiquidityParams } from '../types'
import { CollateralizedDebt__factory, ERC20__factory } from '../../typechain'
import { TimeswapPair__factory } from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'

const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n

describe('Remove Liquidity', () => {
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
              })
              .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5000n, maturity)),
            removeLiquidityParams: fc.record({
              liquidityIn: fc.bigUintN(50),
            }),
          })
          .filter((x) => LiquidityFilter.removeLiquiditySuccess(x, currentTime + 5000n, maturity))
          .noShrink(),
        async (data) => {
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], data.newLiquidityParams)
            await advanceTime(Number(maturity))
            const removeLiquidity = await removeLiquidityFixture(newLiquidity, signers[0], data.removeLiquidityParams)
            return removeLiquidity
          }

          const result = await loadFixture(success)
          //   currentTime = await now()
          const liquidityBalanceNew = LiquidityMath.liquidityCalculateNewLiquidity(
            data.newLiquidityParams.assetIn,
            currentTime + 5000n,
            maturity
          )
          //   console.log(currentTime)
          //   console.log('ts liquidity state',liquidityBalanceNew);
          //   console.log('ts liquidity in', data.removeLiquidityParams.liquidityIn);
          //   console.log('ts updated balance',liquidityBalanceNew - data.removeLiquidityParams.liquidityIn);
          const liquidityBalance = liquidityBalanceNew - data.removeLiquidityParams.liquidityIn
          const natives = await result.convenience.getNatives(
            result.assetToken.address,
            result.collateralToken.address,
            maturity
          )

          const liquidityToken = ERC20__factory.connect(natives.liquidity, ethers.provider)
          const liquidityBalanceContract = (await liquidityToken.balanceOf(signers[0].address)).toBigInt()
          // console.log(liquidityBalanceContract)
          expect(liquidityBalanceContract).equalBigInt(liquidityBalance)

          const totalLiquidityBalanceContract = await TimeswapPair__factory.connect(
            await result.convenience.factoryContract.getPair(result.assetToken.address, result.collateralToken.address),
            ethers.provider
          ).totalLiquidity(maturity)
          const totalLiquidityBalance =
            (data.newLiquidityParams.assetIn << 56n) - data.removeLiquidityParams.liquidityIn
          expect(totalLiquidityBalanceContract).equalBigInt(totalLiquidityBalance)
        }
      )
    )
  }).timeout(600000)
})
