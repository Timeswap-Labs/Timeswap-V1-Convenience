import { ethers, waffle } from 'hardhat'
import { mulDiv, now, min } from '../shared/Helper'
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

const MAXUINT112:bigint = 2n**112n

describe('New Liquidity', () => {


  
  async function fixture(): Promise<Fixture> {
    maturity = (await now()) + 31536000n
    signers = await ethers.getSigners()

    const constructor = await constructorFixture(1n << 112n, 1n << 112n, maturity, signers[0])

    return constructor
  }

  const getYandZIncreaseNewLiquidity = (assetIn: bigint, debtIn: bigint, collateralIn: bigint, currentTime: bigint)=>{
    
    const yIncrease = ((debtIn - assetIn) << 32n) / (maturity - currentTime)
    const denominator = (maturity - currentTime) * yIncrease + (assetIn << 33n)
    const zIncrease = ((collateralIn * assetIn) << 32n) / denominator

    return {yIncreaseNewLiquidity: yIncrease, zIncreaseNewLiquidity: zIncrease}
  }
  const getYandZIncreaseAddLiquidity = (state: {x:bigint, y:bigint,z:bigint}, assetIn:bigint)=>{
    
    const yIncrease = state.y*assetIn/state.x
    const zIncrease = state.z*assetIn/state.x

    return {yIncreaseAddLiquidity: yIncrease, zIncreaseAddLiquidity: zIncrease}
  }
  
  
  function filterSucessNewLiquidity(newLiquidityParams: NewLiquidityParams, currentTime: bigint){
    const {yIncreaseNewLiquidity,zIncreaseNewLiquidity} = getYandZIncreaseNewLiquidity(newLiquidityParams.assetIn,newLiquidityParams.debtIn,newLiquidityParams.collateralIn,currentTime)
    if(newLiquidityParams.assetIn <= 0){
      return false
    }

    if(!(yIncreaseNewLiquidity > 0n && zIncreaseNewLiquidity > 0n && yIncreaseNewLiquidity <  MAXUINT112 && zIncreaseNewLiquidity < MAXUINT112
        )){
      return false
    }
    return true
  }

function filterSuccessAddLiquidity(liquidityParams: {newLiquidityParams: NewLiquidityParams, addLiquidityParams: AddLiquidityParams},currentTime:bigint){
    const {newLiquidityParams, addLiquidityParams} = liquidityParams
    const {yIncreaseNewLiquidity,zIncreaseNewLiquidity} = getYandZIncreaseNewLiquidity(newLiquidityParams.assetIn,newLiquidityParams.debtIn,newLiquidityParams.collateralIn,currentTime)
    const {yIncreaseAddLiquidity,zIncreaseAddLiquidity} = getYandZIncreaseAddLiquidity({x: newLiquidityParams.assetIn,y:yIncreaseNewLiquidity,z:zIncreaseNewLiquidity},addLiquidityParams.assetIn)
    if(addLiquidityParams.assetIn <= 0&& addLiquidityParams.maxDebt <= 0,addLiquidityParams.maxCollateral <= 0,addLiquidityParams.minLiquidity <= 0){
        return false
      }
  
      if(!(yIncreaseAddLiquidity > 0n && zIncreaseAddLiquidity > 0n && yIncreaseAddLiquidity <  MAXUINT112 && zIncreaseAddLiquidity < MAXUINT112
          )){
        return false
      }
    return true
  }
  

  it('Succeeded', async () => {
    const { maturity } = await loadFixture(fixture)
    let currentTime = await now()


    const liquidityCalculateNewLiquidty = async (assetIn: bigint) => {
      return ((assetIn << 56n) * 0x10000000000n) / ((maturity - (await now())) * 50n + 0x10000000000n)
    }
    const liquidityCalculateAddLiquidty = async (state:{x:bigint, y:bigint,z:bigint},delState:{x:bigint, y:bigint,z:bigint}) => {
        const initialTotalLiquidity = state.x << 256n
        const totalLiquidity = min(
                    mulDiv(initialTotalLiquidity,delState.x,state.x),
                    mulDiv(initialTotalLiquidity,delState.y,state.y),
                    mulDiv(initialTotalLiquidity,delState.z,state.z))
        return (totalLiquidity * 0x10000000000n) / ((maturity - (await now())) * 50n + 0x10000000000n)
      }

    await fc.assert(
      fc.asyncProperty(
        fc.record(
            {
            newLiquidityParams: 
                fc.record({ 
                    assetIn: fc.bigUintN(50),
                    debtIn: fc.bigUintN(50),
                    collateralIn: fc.bigUintN(50)
                }).filter((x) => filterSucessNewLiquidity(x,currentTime)),
            addLiquidityParams:
                fc.record({
                    assetIn: fc.bigUintN(50),
                    minLiquidity: fc.bigUintN(100),
                    maxDebt: fc.bigUintN(50),
                    maxCollateral: fc.bigUintN(50) 
                })
            }
        ).filter((x)=> filterSuccessAddLiquidity(x,currentTime)),
        async (data) => {
          console.log(data)
          const success = async () => {
            const constructor = await loadFixture(fixture)
            const newLiquidity = await newLiquidityFixture(constructor, signers[0], data.newLiquidityParams)
            const addLiquidity = await addLiquidityFixture(newLiquidity,signers[0],data.addLiquidityParams)
            return addLiquidity
          }

          const result = await loadFixture(success)
          // currentTime = await now()
          const {yIncreaseNewLiquidity,zIncreaseNewLiquidity}=getYandZIncreaseNewLiquidity(data.newLiquidityParams.assetIn,data.newLiquidityParams.debtIn,data.newLiquidityParams.collateralIn,currentTime)

          const state = {
              x: data.newLiquidityParams.assetIn,
              y: yIncreaseNewLiquidity,
              z: zIncreaseNewLiquidity
          }
          const {yIncreaseAddLiquidity,zIncreaseAddLiquidity} = getYandZIncreaseAddLiquidity(state,data.addLiquidityParams.assetIn)
          const liquidityBalanceNew = await liquidityCalculateNewLiquidty(data.newLiquidityParams.assetIn)
          const delState = {
            x: data.addLiquidityParams.assetIn,
            y: yIncreaseAddLiquidity,
            z: zIncreaseAddLiquidity
        }
          const liquidityBalanceAdd = await liquidityCalculateAddLiquidty(
                                               state, delState         
                                            )
        const liquidityBalance = liquidityBalanceNew + liquidityBalanceAdd
          // console.log(data);
          console.log(liquidityBalance)
          // console.log((maturity - currentTime))

          // expect((await result.assetToken.balanceOf(signers[0].address)).toBigInt()).equalBigInt(
          //   (1n << 150n) - data.assetIn
          // )
          // expect((await result.collateralToken.balanceOf(signers[0].address)).toBigInt()).equalBigInt(
          //   (1n << 150n) - data.collateralIn
          // )
          const liquidityToken = ERC20__factory.connect(
            (await result.convenience.getNatives(result.assetToken.address,result.collateralToken.address,maturity)).liquidity,
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
