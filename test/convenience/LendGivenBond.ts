import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min, shiftUp, mulDivUp, advanceTimeAndBlock, setTime } from '../shared/Helper'
import { expect } from '../shared/Expect'
import * as LiquidityMath from '../libraries/LiquidityMath'
import * as LendMath from '../libraries/LendMath'
import { newLiquidityFixture, constructorFixture, Fixture, lendGivenBondFixture } from '../shared/Fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { LendGivenBondParams, NewLiquidityParams } from '../types'
import { ERC20__factory } from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'
import * as LendFilter from '../filters/Lend'


const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n

describe('Lend Given Bond', () => {
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
                assetIn: fc.bigUintN(50),
                debtIn: fc.bigUintN(50),
                collateralIn: fc.bigUintN(50),
              })
              .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n,maturity)),
            lendGivenBondParams: fc.record({
              assetIn: fc.bigUintN(50),
              bondOut: fc.bigUintN(50),
              minInsurance: fc.bigUintN(50),
            })
          })
          .filter((x) => LendFilter.lendGivenBondSuccess(x, currentTime + 5_000n, currentTime + 10_000n,maturity)).noShrink(),
        async (data) => {
          const success = async () => {
            const constructor = await loadFixture(fixture)
            await setTime(Number(currentTime + 5000n))
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], data.newLiquidityParams)
            await setTime(Number(currentTime + 10000n))
            const lendGivenBond = await lendGivenBondFixture(newLiquidity, signers[0], data.lendGivenBondParams)
            return lendGivenBond
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
          const { yDecreaseLendGivenBond, zDecreaseLendGivenBond } = LendMath.calcYAndZDecreaseLendGivenBond(
            state,
            maturity,
            currentTime + 10_000n,
            data.lendGivenBondParams.assetIn,
            data.lendGivenBondParams.bondOut
          )
          
          const delState = {x:data.lendGivenBondParams.assetIn,y:yDecreaseLendGivenBond,z:zDecreaseLendGivenBond}
          const bond = LendMath.getBond(delState,maturity,currentTime+10_000n)
          console.log('start')
          console.log(data)
          console.log(state)
          console.log(bond)
          console.log(data.lendGivenBondParams.bondOut)
          console.log('end')
            expect(bond).equalBigInt(data.lendGivenBondParams.bondOut)
          // const liquidityBalanceNew = LiquidityMath.liquidityCalculateNewLiquidity(
          //   data.newLiquidityParams.assetIn,
          //   currentTime + 5_000n,
          //   maturity
          // )
          // const delState = {
          //   x: data.addLiquidityParams.assetIn,
          //   y: yIncreaseAddLiquidity,
          //   z: zIncreaseAddLiquidity,
          // }
          // const liquidityBalanceAdd = LiquidityMath.liquidityCalculateAddLiquidity(state, delState, currentTime + 10_000n,maturity)
          // const liquidityBalance = liquidityBalanceNew + liquidityBalanceAdd
          // const liquidityToken = ERC20__factory.connect(
          //   (await result.convenience.getNatives(result.assetToken.address, result.collateralToken.address, maturity))
          //     .liquidity,
          //   ethers.provider
          // )
          // const liquidityBalanceContract = (await liquidityToken.balanceOf(signers[0].address)).toBigInt()
          // // console.log(liquidityBalanceContract)
          // expect(liquidityBalanceContract).equalBigInt(liquidityBalance)
        }
      ), {skipAllAfterTimeLimit:50000}
    )
  }).timeout(100000)
})
