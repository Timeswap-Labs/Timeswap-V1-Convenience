import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftUp, mulDivUp, advanceTimeAndBlock, setTime } from '../shared/Helper'
import { expect } from '../shared/Expect'
import { newLiquidityTests } from '../test-cases'
import { newLiquidityFixture, constructorFixture, Fixture, addLiquidityFixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { AddLiquidityParams, NewLiquidityParams } from '../test-cases/types'
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

  const getYandZIncreaseNewLiquidity = (assetIn: bigint, debtIn: bigint, collateralIn: bigint, currentTime: bigint) => {
    const yIncrease = ((debtIn - assetIn) << 32n) / (maturity - currentTime)
    const denominator = (maturity - currentTime) * yIncrease + (assetIn << 33n)
    const zIncrease = ((collateralIn * assetIn) << 32n) / denominator

    return { yIncreaseNewLiquidity: yIncrease, zIncreaseNewLiquidity: zIncrease }
  }
  const getYandZIncreaseAddLiquidity = (state: { x: bigint; y: bigint; z: bigint }, assetIn: bigint) => {
    const yIncrease = (state.y * assetIn) / state.x
    const zIncrease = (state.z * assetIn) / state.x

    return { yIncreaseAddLiquidity: yIncrease, zIncreaseAddLiquidity: zIncrease }
  }
  const liquidityCalculateNewLiquidity = (assetIn: bigint, currentTime: bigint) => {
    return ((assetIn << 56n) * 0x10000000000n) / ((maturity - currentTime) * 50n + 0x10000000000n)
  }
  const liquidityCalculateAddLiquidity = (
    state: { x: bigint; y: bigint; z: bigint },
    delState: { x: bigint; y: bigint; z: bigint },
    currentTime: bigint
  ) => {
    console.log('Time from js ', currentTime)
    const initialTotalLiquidity = state.x << 56n
    console.log('ts total liquidity :', initialTotalLiquidity)
    console.log('ts muldiv 1 :', mulDiv(initialTotalLiquidity, delState.x, state.x))
    console.log('ts muldiv 2 :', mulDiv(initialTotalLiquidity, delState.y, state.y))
    console.log('ts muldiv :', delState.y, state.y)
    console.log('ts muldiv 3 :', mulDiv(initialTotalLiquidity, delState.z, state.z))
    const totalLiquidity = min(
      mulDiv(initialTotalLiquidity, delState.x, state.x),
      mulDiv(initialTotalLiquidity, delState.y, state.y),
      mulDiv(initialTotalLiquidity, delState.z, state.z)
    )
    console.log('ts liquidity total :', totalLiquidity)
    return (totalLiquidity * 0x10000000000n) / ((maturity - currentTime) * 50n + 0x10000000000n)
  }

  const getDebtAddLiquidity = (
    delState: { x: bigint; y: bigint; z: bigint },
    maturity: bigint,
    currentTime: bigint
  ) => {
    return shiftUp((maturity - currentTime) * delState.y, 32n) + delState.x
  }
  const getCollateralAddLiquidity = (
    delState: { x: bigint; y: bigint; z: bigint },
    maturity: bigint,
    currentTime: bigint
  ) => {
    console.log('delState', delState)
    return mulDivUp((maturity - currentTime) * delState.y + (delState.x << 33n), delState.z, delState.x << 32n)
  }

  function filterSuccessNewLiquidity(newLiquidityParams: NewLiquidityParams, currentTime: bigint) {
    const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = getYandZIncreaseNewLiquidity(
      newLiquidityParams.assetIn,
      newLiquidityParams.debtIn,
      newLiquidityParams.collateralIn,
      currentTime
    )
    if (newLiquidityParams.assetIn <= 0) {
      return false
    }

    if (
      !(
        yIncreaseNewLiquidity > 0n &&
        zIncreaseNewLiquidity > 0n &&
        yIncreaseNewLiquidity < MAXUINT112 &&
        zIncreaseNewLiquidity < MAXUINT112
      )
    ) {
      return false
    }
    return true
  }

  function filterSuccessAddLiquidity(
    liquidityParams: { newLiquidityParams: NewLiquidityParams; addLiquidityParams: AddLiquidityParams },
    currentTimeNL: bigint,
    currentTimeAL: bigint
  ) {
    const { newLiquidityParams, addLiquidityParams } = liquidityParams

    if (
      (addLiquidityParams.assetIn <= 0 && addLiquidityParams.maxDebt <= 0,
      addLiquidityParams.maxCollateral <= 0,
      addLiquidityParams.minLiquidity <= 0)
    ) {
      return false
    }

    const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = getYandZIncreaseNewLiquidity(
      newLiquidityParams.assetIn,
      newLiquidityParams.debtIn,
      newLiquidityParams.collateralIn,
      currentTimeNL
    )
    const state = { x: newLiquidityParams.assetIn, y: yIncreaseNewLiquidity, z: zIncreaseNewLiquidity }
    const { yIncreaseAddLiquidity, zIncreaseAddLiquidity } = getYandZIncreaseAddLiquidity(
      state,
      addLiquidityParams.assetIn
    )

    if (
      !(
        yIncreaseAddLiquidity > 0n &&
        zIncreaseAddLiquidity > 0n &&
        yIncreaseAddLiquidity < MAXUINT112 &&
        zIncreaseAddLiquidity < MAXUINT112
      )
    ) {
      return false
    }

    const delState = { x: addLiquidityParams.assetIn, y: yIncreaseAddLiquidity, z: zIncreaseAddLiquidity }

    const debt = getDebtAddLiquidity(delState, maturity, currentTimeAL)
    const collateral = getCollateralAddLiquidity(delState, maturity, currentTimeAL)
    const liquidity = liquidityCalculateAddLiquidity(state, delState, currentTimeAL)
    console.log('ts liquidity out : ', liquidity)

    if (
      addLiquidityParams.maxDebt < debt ||
      addLiquidityParams.maxCollateral < collateral ||
      addLiquidityParams.minLiquidity > liquidity
    )
      return false

    return true
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
              .filter((x) => filterSuccessNewLiquidity(x, currentTime + 5_000n)),
            addLiquidityParams: fc.record({
              assetIn: fc.bigUintN(50),
              minLiquidity: fc.bigUintN(100),
              maxDebt: fc.bigUintN(50),
              maxCollateral: fc.bigUintN(50),
            }),
          })
          .filter((x) => filterSuccessAddLiquidity(x, currentTime + 5_000n, currentTime + 10_000n))
          .noShrink(),
        async (data) => {
          console.log(data)
          console.log('Inside the check ', currentTime, await now())
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], data.newLiquidityParams)
            console.log('new time', (await now()) - currentTime)
            await setTime(Number(currentTime + 10000n))
            const addLiquidity = await addLiquidityFixture(newLiquidity, signers[0], data.addLiquidityParams)
            console.log('add time', (await now()) - currentTime)
            return addLiquidity
          }

          // Trying things
          const neededTime = (await now()) + 100n
          // providers.

          const result = await loadFixture(success)
          // currentTime = await now()

          const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = getYandZIncreaseNewLiquidity(
            data.newLiquidityParams.assetIn,
            data.newLiquidityParams.debtIn,
            data.newLiquidityParams.collateralIn,
            currentTime
          )

          const state = {
            x: data.newLiquidityParams.assetIn,
            y: yIncreaseNewLiquidity,
            z: zIncreaseNewLiquidity,
          }
          const { yIncreaseAddLiquidity, zIncreaseAddLiquidity } = getYandZIncreaseAddLiquidity(
            state,
            data.addLiquidityParams.assetIn
          )
          const liquidityBalanceNew = liquidityCalculateNewLiquidity(
            data.newLiquidityParams.assetIn,
            currentTime + 5_000n
          )
          const delState = {
            x: data.addLiquidityParams.assetIn,
            y: yIncreaseAddLiquidity,
            z: zIncreaseAddLiquidity,
          }
          const liquidityBalanceAdd = liquidityCalculateAddLiquidity(state, delState, currentTime + 10_000n)
          const liquidityBalance = liquidityBalanceNew + liquidityBalanceAdd
          console.log(data)
          console.log(liquidityBalance)
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
          console.log(liquidityBalanceContract)
          expect(liquidityBalanceContract).equalBigInt(liquidityBalance)
        }
      )
    )
  }).timeout(600000)
})
