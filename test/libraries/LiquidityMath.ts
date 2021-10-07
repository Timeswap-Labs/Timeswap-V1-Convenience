import { mulDiv, now, min, shiftUp, mulDivUp, advanceTimeAndBlock, setTime, mulDivUint, minUint, shiftUpUint, mulDivUpUint } from '../shared/Helper'
import { Uint112, Uint256 } from '@timeswap-labs/timeswap-v1-sdk-core'
import { NewLiquidityParamsUint } from '../types'
import { Uint } from '@timeswap-labs/timeswap-v1-sdk-core/dist/uint/uint'

  export const getYandZIncreaseNewLiquidity = (assetIn: Uint112, debtIn: Uint112, collateralIn: Uint112, currentTime: bigint,maturity:bigint) => {
    
    const yIncrease = new Uint256(debtIn)
    .sub(assetIn)
    .shiftLeft(32)
    .div(maturity - currentTime)
    const denominator = new Uint256(maturity - currentTime).mul(yIncrease).add(new Uint256(assetIn).shiftLeft(33))
    const zIncrease = new Uint256(collateralIn).mul(assetIn).shiftLeft(32).div(denominator)

    return { yIncreaseNewLiquidity: new Uint112(yIncrease), zIncreaseNewLiquidity: new Uint112(zIncrease) }
  }

  export  const getYandZIncreaseAddLiquidity = (state: { x: Uint112; y: Uint112; z: Uint112 }, assetIn: Uint112) => {
    const yIncrease = new Uint112(new Uint256(state.y).mul(assetIn).div(state.x))
    const zIncrease = new Uint112(new Uint256(state.z).mul(assetIn).div( state.x))

    return { yIncreaseAddLiquidity: yIncrease, zIncreaseAddLiquidity: zIncrease }
  }

  export const liquidityCalculateNewLiquidity = (assetIn: Uint112, currentTime: bigint,maturity:bigint) => {
    const maturityUint = new Uint256(maturity)
    const currentTimeUint = new Uint256(currentTime)
    return new Uint256(assetIn.shiftLeft(56n).mul(0x10000000000n).div((maturityUint.sub(currentTimeUint).mul(50n).add(0x10000000000n))))

  }
  
  export const liquidityCalculateAddLiquidity = (
    state: { x: Uint112; y: Uint112; z: Uint112 },
    delState: { x: Uint112; y: Uint112; z: Uint112 },
    currentTime: bigint,
    maturity:bigint
  ) => {
    let maturityUint = new Uint256(maturity)
    let currentTimeUint = new Uint256(currentTime)
    const initialTotalLiquidity = new Uint256(state.x.shiftLeft(56))
    const totalLiquidity = minUint(
      mulDivUint(initialTotalLiquidity, delState.x, state.x),
      mulDivUint(initialTotalLiquidity, delState.y, state.y),
      mulDivUint(initialTotalLiquidity, delState.z, state.z)
    )
    const liquidityOut = new Uint256(totalLiquidity.mul(0x10000000000n).div((maturityUint).sub( currentTimeUint).mul( 50n).add( 0x10000000000n)))
    return liquidityOut
  }

  
  export const getDebtAddLiquidity = (
    delState: { x: Uint112; y: Uint112; z: Uint112 },
    maturity: bigint,
    currentTime: bigint
  ) => {
    const maturityUint = new Uint256(maturity)
    const currentTimeUint = new Uint256(currentTime)
    return new Uint112(shiftUpUint((maturityUint).sub(currentTimeUint).mul(delState.y), new Uint112(32n)).add( delState.x))
  }
  
  export const getCollateralAddLiquidity = (
    delState: { x: Uint112; y: Uint112; z: Uint112 },
    maturity: bigint,
    currentTime: bigint
  ) => {
    const maturityUint = new Uint256(maturity)
    const currentTimeUint = new Uint256(currentTime)
    return mulDivUpUint((maturityUint).sub(currentTimeUint).mul(delState.y).add(delState.x.shiftLeft( 33n)), delState.z, delState.x.shiftLeft(32n))
  }
  
  export const liquidityCalculate = (assetIn: bigint, newCurrentTime: bigint,maturity:bigint) => {
    return ((assetIn << 56n) * 0x10000000000n) / ((maturity - newCurrentTime) * 50n + 0x10000000000n)
  }

  export const debtCollateralCalculate = ({ assetIn, debtIn, collateralIn }: NewLiquidityParamsUint, currentTime: bigint,maturity:bigint) => {
    const yIncrease = new Uint112(
      new Uint256(debtIn)
        .sub(assetIn)
        .shiftLeft(32)
        .div(maturity - currentTime)
    )
    const denominator = new Uint256(maturity - currentTime).mul(yIncrease).add(new Uint256(assetIn).shiftLeft(33))
    const zIncrease = new Uint112(new Uint256(collateralIn).mul(assetIn).shiftLeft(32).div(denominator))

    const debt = shiftUp(new Uint256(yIncrease).mul(maturity - currentTime).toBigInt(), 32n) + assetIn.toBigInt()
    const collateral = mulDivUp(
      new Uint256(yIncrease)
        .mul(maturity - currentTime)
        .add(new Uint256(assetIn).shiftLeft(33))
        .toBigInt(),
      zIncrease.toBigInt(),
      new Uint256(assetIn).shiftLeft(32).toBigInt()
    )

    return { debt, collateral }
  }