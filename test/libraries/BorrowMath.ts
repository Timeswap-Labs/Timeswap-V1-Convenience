import { FEE } from '../shared/Constants'
import { divUp, mulDivUp, shiftRightUp } from '../shared/Helper'
const MAXUINT112 = 2 ** 112
const MAXUINT256 = 2 ** 256
const adjust = (reserve: bigint, increase: bigint) => {
  return (reserve << 16n) + (0x10000n - 100n) * increase
}
const constantProduct = (state: { x: bigint; y: bigint; z: bigint }, delState: { x: bigint; y: bigint; z: bigint }) => {
  if (delState.y * delState.z * delState.x > state.x * state.y * state.z) {
    return true
  }
  return false
}
export const check = (state: { x: bigint; y: bigint; z: bigint }, delState: { x: bigint; y: bigint; z: bigint }) => {
  const feeBase = 0x10000n - 100n
  const xReserve = state.x - delState.x
  const yAdjust = adjust(state.y, delState.y)
  const zAdjust = adjust(state.z, delState.z)
  if (!constantProduct(state, { x: xReserve, y: yAdjust, z: zAdjust })) {
    return false
  }
  const minimum = divUp((delState.x * state.y) << 12n, xReserve * feeBase)
  // console.log(minimum)
  // console.log(delState.y)
  if (delState.y < minimum) {
    return false
  }

  //console.log(.*)
  return true
}
export const checkError = (
  state: { x: bigint; y: bigint; z: bigint },
  delState: { x: bigint; y: bigint; z: bigint }
) => {
  const feeBase = 0x10000n - 100n
  const xReserve = state.x - delState.x
  const yAdjust = adjust(state.y, delState.y)
  const zAdjust = adjust(state.z, delState.z)
  if (!constantProduct(state, { x: xReserve, y: yAdjust, z: zAdjust })) {
    return 'Invariance'
  }
  const minimum = divUp((delState.x * state.y) << 12n, xReserve * feeBase)
  if (delState.y < minimum) {
    return 'E302'
  }

  //console.log(.*)
  return ''
}
export const verifyYandZIncreaseBorrowGivenCollateral = (
  state: { x: bigint; y: bigint; z: bigint },
  assetOut: bigint,
  maturity: bigint,
  currentTime: bigint,
  collateralIn: bigint
) => {
  const feeBase = 0x10000n - 100n

  const xAdjust = state.x - assetOut
  if (xAdjust < 0 || xAdjust >= MAXUINT256) {
    //console.log(.*)
    return false
  }
  let _zIncrease= ((collateralIn  * xAdjust) - (state.z * assetOut)) << 32n
  let denominator = (maturity - currentTime) * state.y 
  const zIncrease = _zIncrease / denominator
  // console.log('zIncrease ts:', zIncrease)
  if (zIncrease <= 0 || zIncrease >= MAXUINT112) {
    //console.log(.*)
    return false
  }
  const zAdjust = (state.z << 16n) + zIncrease * feeBase
  if (zAdjust < 0 || zAdjust >= MAXUINT256) {
    //console.log(.*)
    return false
  }
  // console.log(zIncrease)
  
  let subtrahend = xAdjust * zAdjust
  if (((state.x * state.z) << 16n) - subtrahend <= 0 ) {
    //console.log(.*)
    return false
  }
  denominator = xAdjust * zAdjust * feeBase
  const yIncrease = mulDivUp(((state.x * state.z) << 16n) - subtrahend, state.y << 16n, denominator)
  if (yIncrease <= 0 || yIncrease >= MAXUINT112) {
    //console.log(.*)
    return false
  }
  return { yIncreaseBorrowGivenCollateral: yIncrease, zIncreaseBorrowGivenCollateral: zIncrease }
}

export const getYandZIncreaseBorrowGivenPercent = (
  state: { x: bigint; y: bigint; z: bigint },
  assetOut: bigint,
  percent: bigint
) => {
  const feeBase = 0x10000n - 100n

  const xAdjust = state.x - assetOut

  let denominator = xAdjust * feeBase
  const minimum = divUp((assetOut * state.y) << 12n, denominator)
  const maximum = (minimum << 4n) / denominator

  const yIncrease = (((maximum - minimum) * percent) >> 32n) + minimum
  const yAdjust = (state.y << 16n) + yIncrease * feeBase

  const subtrahend = xAdjust * yAdjust
  denominator = xAdjust * yAdjust * feeBase

  const zIncrease = mulDivUp(((state.x * state.y) << 16n) - subtrahend, state.z << 16n, denominator)

  return { yIncreaseBorrowGivenPercent: yIncrease, zIncreaseBorrowGivenPercent: zIncrease }
}

export const getYandZIncreaseBorrowGivenCollateral = (
  state: { x: bigint; y: bigint; z: bigint },
  assetOut: bigint,
  maturity: bigint,
  currentTime: bigint,
  collateralIn: bigint
) => {
  const feeBase = 0x10000n - 100n

  const xAdjust = state.x - assetOut


  let _zIncrease= ((collateralIn  * xAdjust) - (state.z * assetOut)) << 32n
  let denominator = (maturity - currentTime) * state.y 
  const zIncrease = _zIncrease / denominator
  const zAdjust = (state.z << 16n) + zIncrease * feeBase

  let subtrahend = xAdjust * zAdjust
  denominator = xAdjust * zAdjust * feeBase
  const yIncrease = mulDivUp(((state.x * state.z) << 16n) - subtrahend, state.y << 16n, denominator)

  return { yIncreaseBorrowGivenCollateral: yIncrease, zIncreaseBorrowGivenCollateral: zIncrease }
}

export const getYandZIncreaseBorrowGivenDebt = (
  state: { x: bigint; y: bigint; z: bigint },
  assetOut: bigint,
  maturity: bigint,
  currentTime: bigint,
  debtIn: bigint
) => {
  const feeBase = 0x10000n - 100n

  const yIncrease = ((debtIn - assetOut) << 32n) / (maturity - currentTime)

  const yAdjust = (state.y << 16n) + yIncrease * feeBase
  const xAdjust = state.x - assetOut

  let denominator = xAdjust * yAdjust * feeBase
  const zIncrease = mulDivUp(((state.x * state.y) << 16n) - xAdjust * yAdjust, state.z << 16n, denominator)

  return { yIncreaseBorrowGivenDebt: yIncrease, zIncreaseBorrowGivenDebt: zIncrease }
}

export const getDebt = (delState: { x: bigint; y: bigint; z: bigint }, maturity: bigint, currentTime: bigint) => {
  return shiftRightUp((maturity - currentTime) * delState.y, 32n) + delState.x
}

export const getCollateral = (
  state: { x: bigint; y: bigint; z: bigint },
  delState: { x: bigint; y: bigint; z: bigint },
  maturity: bigint,
  currentTime: bigint
) => {
  return (
    divUp(
      ((maturity - currentTime) * state.y * delState.z) + ((state.z * delState.x) <<32n),
      ((state.x - delState.x) ) << 32n
    ) 
  )
}
