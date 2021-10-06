import { ethers, waffle } from 'hardhat'
import { now } from '../shared/Helper'
import { expect } from '../shared/Expect'
import { newLiquidityTests } from '../test-cases'
import { newLiquidityFixture, constructorFixture, Fixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { NewLiquidityParams } from '../test-cases/types'
import { ERC20__factory } from '../../typechain'

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

  const checkYAndZIncrease = (assetIn: bigint, debtIn: bigint, collateralIn: bigint, currentTime: bigint) => {
    // const ct = BigInt(Math.floor(Date.now() / 1000))

    const yIncrease = ((debtIn - assetIn) << 32n) / (maturity - currentTime)
    const denominator = (maturity - currentTime) * yIncrease + (assetIn << 33n)
    const zIncrease = ((collateralIn * assetIn) << 32n) / denominator

    return yIncrease > 0n && zIncrease > 0n && yIncrease < MAXUINT112 && zIncrease < MAXUINT112
  }
  function filterSuccessNewLiquidity(newLiquidityParams: NewLiquidityParams, currentTime: bigint) {
    if (newLiquidityParams.assetIn <= 0) {
      return false
    }
    if (
      !checkYAndZIncrease(
        newLiquidityParams.assetIn,
        newLiquidityParams.debtIn,
        newLiquidityParams.collateralIn,
        currentTime
      )
    ) {
      return false
    }
    return true
  }

  it('Succeeded', async () => {
    const { maturity } = await loadFixture(fixture)
    let currentTime = await now()

    const liquidityCalculate = (assetIn: bigint, newCurrentTime: bigint) => {
      return ((assetIn << 56n) * 0x10000000000n) / ((maturity - newCurrentTime) * 50n + 0x10000000000n)
    }

    await fc.assert(
      fc.asyncProperty(
        fc
          .record({ assetIn: fc.bigUintN(112), debtIn: fc.bigUintN(112), collateralIn: fc.bigUintN(112) })
          .filter((x) => filterSuccessNewLiquidity(x, currentTime)),
        async (data) => {
          const success = async () => {
            const constructor = await loadFixture(fixture)
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], data)
            return newLiquidity
          }

          const result = await loadFixture(success)
          const newCurrentTime = await now()
          const liquidityBalance = liquidityCalculate(data.assetIn, newCurrentTime)
          console.log(data)
          // console.log(liquidityBalance)
          // console.log((maturity - currentTime))

          // expect((await result.assetToken.balanceOf(signers[0].address)).toBigInt()).equalBigInt(
          //   (1n << 150n) - data.assetIn
          // )
          // expect((await result.collateralToken.balanceOf(signers[0].address)).toBigInt()).equalBigInt(
          //   (1n << 150n) - data.collateralIn
          // )
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
