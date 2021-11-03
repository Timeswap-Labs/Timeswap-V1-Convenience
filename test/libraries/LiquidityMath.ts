import { mulDiv, now, min, shiftRightUp, mulDivUp, advanceTimeAndBlock, setTime, divUp } from '../shared/Helper'



export function cbrt(val: bigint): bigint {
  let x = 0n;
  for (let y = 1n << 255n; y > 0n; y >>= 3n) {
    x <<= 1n;
    let z = 3n * x * (x + 1n) + 1n;
    if (val / y >= z) {
      val -= y * z;
      x += 1n;
    }
  }
  return x;
}



export const getYandZIncreaseNewLiquidity = (
  assetIn: bigint,
  debtIn: bigint,
  collateralIn: bigint,
  currentTime: bigint,
  maturity: bigint
) => {
  const yIncrease = ((debtIn - assetIn) << 32n) / (maturity - currentTime)
  const denominator = (maturity - currentTime) * yIncrease + (assetIn << 32n)
  const zIncrease = ((collateralIn * assetIn) << 32n) / denominator

  return { yIncreaseNewLiquidity: yIncrease, zIncreaseNewLiquidity: zIncrease }
}

export const getYandZIncreaseAddLiquidity = (state: { x: bigint; y: bigint; z: bigint }, assetIn: bigint) => {
  const yIncrease = (state.y * assetIn) / state.x
  const zIncrease = (state.z * assetIn) / state.x

  return { yIncreaseAddLiquidity: yIncrease, zIncreaseAddLiquidity: zIncrease }
} 

export const liquidityCalculateNewLiquidity = (delState: { x: bigint; y: bigint; z: bigint }, currentTime: bigint, maturity: bigint) => {
  return ((cbrt(delState.x))*cbrt(delState.y*delState.z) * 0x10000000000n) / ((maturity - currentTime) * 50n + 0x10000000000n)
}

export const liquidityCalculateAddLiquidity = (
  state: { x: bigint; y: bigint; z: bigint },
  delState: { x: bigint; y: bigint; z: bigint },
  currentTime: bigint,
  maturity: bigint
) => {
  const initialTotalLiquidity = (cbrt(state.x))*cbrt(state.y*state.z)
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
  return shiftRightUp((maturity - currentTime) * delState.y, 32n) + delState.x
}

export const getCollateralAddLiquidity = (
  delState: { x: bigint; y: bigint; z: bigint },
  maturity: bigint,
  currentTime: bigint
) => {
  return divUp((maturity - currentTime) * delState.y * delState.z, delState.x << 32n) + delState.z
}
