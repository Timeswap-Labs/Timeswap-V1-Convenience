import { mulDiv, now, min, shiftUp, mulDivUp, advanceTimeAndBlock, setTime } from '../shared/Helper'


  export const getYandZIncreaseNewLiquidity = (assetIn: bigint, debtIn: bigint, collateralIn: bigint, currentTime: bigint,maturity:bigint) => {
    
    const yIncrease = ((debtIn - assetIn) << 32n) / (maturity - currentTime)
    const denominator = (maturity - currentTime) * yIncrease + (assetIn << 33n)
    const zIncrease = ((collateralIn * assetIn) << 32n) / denominator

    return { yIncreaseNewLiquidity: yIncrease, zIncreaseNewLiquidity: zIncrease }
  }

  export  const getYandZIncreaseAddLiquidity = (state: { x: bigint; y: bigint; z: bigint }, assetIn: bigint) => {
    const yIncrease = (state.y * assetIn) / state.x
    const zIncrease = (state.z * assetIn) / state.x

    return { yIncreaseAddLiquidity: yIncrease, zIncreaseAddLiquidity: zIncrease }
  }

  export const liquidityCalculateNewLiquidity = (assetIn: bigint, currentTime: bigint,maturity:bigint) => {
    return ((assetIn << 56n) * 0x10000000000n) / ((maturity - currentTime) * 50n + 0x10000000000n)
  }
  
  export const liquidityCalculateAddLiquidity = (
    state: { x: bigint; y: bigint; z: bigint },
    delState: { x: bigint; y: bigint; z: bigint },
    currentTime: bigint,
    maturity:bigint
  ) => {
    const initialTotalLiquidity = state.x << 56n
    const totalLiquidity = min(
      mulDiv(initialTotalLiquidity, delState.x, state.x),
      mulDiv(initialTotalLiquidity, delState.y, state.y),
      mulDiv(initialTotalLiquidity, delState.z, state.z)
    )
    const liquidityOut = (totalLiquidity * 0x10000000000n) / ((maturity - currentTime) * 50n + 0x10000000000n)
    return liquidityOut
  }

  
  export const getDebtAddLiquidity = (
    delState: { x: bigint; y: bigint; z: bigint },
    maturity: bigint,
    currentTime: bigint
  ) => {
    return shiftUp((maturity - currentTime) * delState.y, 32n) + delState.x
  }
  
  export const getCollateralAddLiquidity = (
    delState: { x: bigint; y: bigint; z: bigint },
    maturity: bigint,
    currentTime: bigint
  ) => {
    return mulDivUp((maturity - currentTime) * delState.y + (delState.x << 33n), delState.z, delState.x << 32n)
  }