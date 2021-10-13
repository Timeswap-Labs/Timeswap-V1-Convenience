import { FEE } from '../shared/Constants'
import { divUp, mulDivUp, shiftUp } from '../shared/Helper'
const adjust = (reserve: bigint, increase: bigint) => {
  return (reserve << 16n) + (0x10000n - 50n) * increase
}
const constantProduct = (state: { x: bigint; y: bigint; z: bigint }, delState: { x: bigint; y: bigint; z: bigint }) => {
  if (delState.y * delState.z * delState.x > state.x * state.y * state.z) {
    return true
  }
  return false
}
export const check = (state: { x: bigint; y: bigint; z: bigint }, delState: { x: bigint; y: bigint; z: bigint }) => {
  const feeBase = 0x10000n - 50n
  const xReserve = state.x - delState.x
  const yAdjust = adjust(state.y, delState.y)
  const zAdjust = adjust(state.z, delState.z)
  if (!constantProduct(state, { x: xReserve, y: yAdjust, z: zAdjust })) {
    return false
  }
  const minimum = divUp((delState.x * state.y) << 12n, xReserve * feeBase)
  if (delState.y < minimum) {
    return false
  }
  console.log(`ts start`)
  console.log({
    minimum: minimum,
    delState: delState,
    state: state,
    xReserve: xReserve,
    yAdjust: yAdjust,
    zAdjust: zAdjust,
  })
  console.log(`ts end`)
  return true
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

  let denominator = xAdjust * (state.x << 32n)
  let subtrahend = (maturity - currentTime) * state.y + (state.x << 32n)
  const zIncrease = collateralIn - mulDivUp(subtrahend, assetOut * state.z, denominator)

  const zAdjust = (state.z << 16n) + zIncrease * feeBase

  subtrahend = xAdjust * zAdjust
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
  return shiftUp((maturity - currentTime) * delState.y, 32n) + delState.x
}

export const getCollateral = (
  state: { x: bigint; y: bigint; z: bigint },
  delState: { x: bigint; y: bigint; z: bigint },
  maturity: bigint,
  currentTime: bigint
) => {
  return (
    mulDivUp(
      (maturity - currentTime) * state.y + (state.x << 32n),
      delState.x * state.z,
      ((state.x - delState.x) * state.x) << 32n
    ) + delState.z
  )
}
