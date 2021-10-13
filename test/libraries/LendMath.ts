import { bigInt } from '../../node_modules/fast-check/lib/types/fast-check-default'
import { divUp, mulDiv } from '../shared/Helper'

const MAXUINT112: bigint = 2n ** 112n
const MAXUINT256 = 1n << 256n

export const verifyYAndZDecreaseLendGivenBond = (
  state: { x: bigint; y: bigint; z: bigint },
  maturity: bigint,
  currentTime: bigint,
  assetIn: bigint,
  bondOut: bigint
) => {
  const feeBase = BigInt(0x10000 + 50)
  const yDecrease = divUp((bondOut - assetIn) << 32n, maturity - currentTime)
  if (yDecrease <= 0 || yDecrease >= MAXUINT112) {
    // console.log('yDecrease out of bounds',yDecrease)
    return false
  }
  const yAdjust = (state.y << 16n) - yDecrease * feeBase
  if (yAdjust <= 0 || yAdjust >= MAXUINT112) {
    // console.log('yAdjust out of bounds',yAdjust)
    return false
  }
  const xAdjust = state.x + assetIn
  if (xAdjust <= 0 || xAdjust >= MAXUINT112) {
    // console.log('yDecrease out of bounds',yDecrease)
    return false
  }
  const zDecrease = mulDiv(
    xAdjust * yAdjust - ((state.x * state.y) << 16n),
    state.z << 16n,
    xAdjust * yAdjust * feeBase
  )
  if (zDecrease <= 0 || zDecrease >= MAXUINT112) {
    // console.log({
    //     yDecrease: yDecrease,
    //     yAdjust: yAdjust,
    //     xAdjust: xAdjust,
    //     zDecrease: zDecrease,
    //     maturity: maturity,
    //     currentTime: currentTime,
    //     bondOut: bondOut,
    //     assetIn: assetIn,
    //     state: state
    // })
    // console.log('zDecrease out of bounds',zDecrease)
    return false
  }
  // console.log({
  //     yDecrease: yDecrease,
  //     yAdjust: yAdjust,
  //     xAdjust: xAdjust,
  //     zDecrease: zDecrease,
  //     maturity: maturity,
  //     currentTime: currentTime,
  //     bondOut: bondOut,
  //     assetIn: assetIn
  // })
  return true
}
export const verifyYAndZDecreaseLendGivenInsurance = (
    state: { x: bigint; y: bigint; z: bigint },
    maturity: bigint,
    currentTime: bigint,
    assetIn: bigint,
    insuranceOut: bigint
  ) => {
    const feeBase = BigInt(0x10000 + 50)
    const xAdjust = state.x + assetIn
    if (xAdjust <= 0 || xAdjust >= MAXUINT112) {
        // console.log('yDecrease out of bounds',yDecrease)
        return false
      }

    if (((maturity - currentTime) * state.y) + (state.x << 32n) >= MAXUINT256 ||
    assetIn * state.z >= MAXUINT256 ||
    xAdjust * (state.x << 32n) >= MAXUINT256 ) {
        return false
    }

    if (mulDiv(
        ((maturity - currentTime) * state.y) + (state.x << 32n),
        assetIn * state.z,
        xAdjust * (state.x << 32n)
      ) >= MAXUINT256) {
        return false
      }  
    const zDecrease =insuranceOut -  mulDiv(
      ((maturity - currentTime) * state.y) + (state.x << 32n),
      assetIn * state.z,
      xAdjust * (state.x << 32n)
    )
    if (zDecrease <= 0 || zDecrease >= MAXUINT112) {
        // console.log('yAdjust out of bounds',yAdjust)
        return false
      }
    const zAdjust = (state.z << 16n) - (zDecrease * feeBase)
    if (zAdjust <= 0 || zAdjust >= MAXUINT112) {
        // console.log('yAdjust out of bounds',yAdjust)
        return false
      }
    const yDecrease = mulDiv(
      xAdjust * zAdjust - ((state.x * state.z) << 16n),
      state.y << 16n,
      xAdjust * zAdjust * feeBase
    )
    if (yDecrease <= 0 || yDecrease >= MAXUINT112) {
        // console.log('yAdjust out of bounds',yAdjust)
        return false
      }
    return { yDecreaseLendGivenInsurance: yDecrease, zDecreaseLendGivenInsurance: zDecrease }
  }
export const verifyYAndZDecreaseLendGivenPercent = (
    state: { x: bigint; y: bigint; z: bigint },
    maturity: bigint,
    currentTime: bigint,
    assetIn: bigint,
    percent: bigint
  ) => {
    const feeBase = BigInt(0x10000 + 50)
    const xAdjust = state.x + assetIn
    if (xAdjust <= 0 || xAdjust >= MAXUINT112) {
        // console.log('yDecrease out of bounds',yDecrease)
        return false
      }
    const minimum = (assetIn * state.y) << 12n
    if (minimum <= 0 || minimum >= MAXUINT112) {
        // console.log('yAdjust out of bounds',yAdjust)
        return false
      }
    const maximum = minimum << 4n
    if (maximum <= 0 || maximum >= MAXUINT112) {
        // console.log('yAdjust out of bounds',yAdjust)
        return false
      }
    const yDecrease = (((maximum - minimum) * percent) >> 32n) + minimum
    if (yDecrease <= 0 || yDecrease >= MAXUINT112) {
        // console.log('yAdjust out of bounds',yAdjust)
        return false
      }
    const yAdjust = (state.y << 16n) - yDecrease * feeBase
    if (yAdjust <= 0 || yAdjust >= MAXUINT112) {
        // console.log('yAdjust out of bounds',yAdjust)
        return false
      }
    const zDecrease = mulDiv(
      xAdjust * yAdjust - ((state.x * state.y) << 16n),
      state.z << 16n,
      xAdjust * yAdjust * feeBase
    )
    if (zDecrease <= 0 || zDecrease >= MAXUINT112) {
        // console.log('yAdjust out of bounds',yAdjust)
        return false
      }
    return { yDecreaseLendGivenPercent: yDecrease, zDecreaseLendGivenPercent: zDecrease }
  }
export const calcYAndZDecreaseLendGivenBond = (
  state: { x: bigint; y: bigint; z: bigint },
  maturity: bigint,
  currentTime: bigint,
  assetIn: bigint,
  bondOut: bigint
) => {
  const feeBase = BigInt(0x10000 + 50)
  const yDecrease = divUp((bondOut - assetIn) << 32n, maturity - currentTime)
  const yAdjust = (state.y << 16n) - yDecrease * feeBase
  const xAdjust = state.x + assetIn
  const zDecrease = mulDiv(
    xAdjust * yAdjust - ((state.x * state.y) << 16n),
    state.z << 16n,
    xAdjust * yAdjust * feeBase
  )
  return { yDecreaseLendGivenBond: yDecrease, zDecreaseLendGivenBond: zDecrease }
}

export const calcYAndZDecreaseLendGivenInsurance = (
  state: { x: bigint; y: bigint; z: bigint },
  maturity: bigint,
  currentTime: bigint,
  assetIn: bigint,
  insuranceOut: bigint
) => {
  const feeBase = BigInt(0x10000 + 50)
  const xAdjust = state.x + assetIn
  const zDecrease = mulDiv(
    ((maturity - currentTime) * state.y) + (state.x << 32n),
    assetIn * state.z,
    xAdjust * (state.x << 32n)
  )
  const zAdjust = (state.z << 16n) - zDecrease * feeBase
  const yDecrease = mulDiv(
    xAdjust * zAdjust - ((state.x * state.z) << 16n),
    state.y << 16n,
    xAdjust * zAdjust * feeBase
  )
  return { yDecreaseLendGivenInsurance: yDecrease, zDecreaseLendGivenInsurance: zDecrease }
}
export const calcYAndZDecreaseLendGivenPercent = (
  state: { x: bigint; y: bigint; z: bigint },
  maturity: bigint,
  currentTime: bigint,
  assetIn: bigint,
  percent: bigint
) => {
  const feeBase = BigInt(0x10000 + 50)
  const xAdjust = state.x + assetIn
  const minimum = (assetIn * state.y) << 12n
  const maximum = minimum << 4n
  const yDecrease = (((maximum - minimum) * percent) >> 32n) + minimum
  const yAdjust = (state.y << 16n) - yDecrease * feeBase
  const zDecrease = mulDiv(
    xAdjust * yAdjust - ((state.x * state.y) << 16n),
    state.z << 16n,
    xAdjust * yAdjust * feeBase
  )
  return { yDecreaseLendGivenPercent: yDecrease, zDecreaseLendGivenPercent: zDecrease }
}
const adjust = (reserve: bigint, decrease: bigint, feeBase: bigint) => {
  return (reserve << 16n) - feeBase * decrease
}

const checkConstantProduct = (
  state: {
    x: bigint
    y: bigint
    z: bigint
  },
  adjDelState: {
    x: bigint
    y: bigint
    z: bigint
  }
) => {
  if (adjDelState.y * adjDelState.z * adjDelState.x > state.y * (state.z << 32n) * state.x) {
    return true
  }
  return false
}

export const check = (
  state: {
    x: bigint
    y: bigint
    z: bigint
  },
  delState: {
    x: bigint
    y: bigint
    z: bigint
  }
) => {
  const feeBase = BigInt(0x10000 + 50)
  const xReserve = delState.x + state.x
  const yAdjusted = adjust(state.y, delState.y, feeBase)
  const zAdjusted = adjust(state.z, delState.z, feeBase)
  if (checkConstantProduct(state, { x: xReserve, y: yAdjusted, z: zAdjusted })) {
    const minimum = ((delState.x * state.y) << 12n) /( xReserve * feeBase)
    if (delState.y < minimum) {
        console.log('minimum failed')
      return false
    } else {
      return true
    }
  } else {
      console.log('constant product check failed')
    return false
  }
}
export const getBond = (delState: { x: bigint; y: bigint; z: bigint }, maturity: bigint, currentTime: bigint) => {
  return (((maturity - currentTime) * delState.y) >> 32n) + delState.x
}
export const getInsurance = (
  state: { x: bigint; y: bigint; z: bigint },
  delState: { x: bigint; y: bigint; z: bigint },
  maturity: bigint,
  currentTime: bigint
) => {
  return mulDiv(
    (maturity - currentTime) * state.y + (state.x << 32n),
    delState.x * state.z,
    ((delState.x + state.x) * state.x) << 32n
  )+delState.z
}
