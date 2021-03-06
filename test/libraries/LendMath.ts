import { getMaxListeners } from 'process'
import { bigInt } from '../../node_modules/fast-check/lib/types/fast-check-default'
import { divUp, mulDiv, mulDivUp, sqrtUp } from '../shared/Helper'

const MAXUINT112: bigint = 2n ** 112n
const MAXUINT256 = 1n << 256n

export const getLendGivenBondParams = (
  state: { x: bigint; y: bigint; z: bigint },
  fee: bigint,
  protocolFee: bigint,
  maturity: bigint,
  currentTime: bigint,
  assetIn: bigint,
  bondOut: bigint
) => {
  const xIncrease = getX(protocolFee, fee, maturity, currentTime, assetIn)

  let xReserve = state.x
  xReserve += xIncrease

  let _yDecrease = bondOut

  _yDecrease -= xIncrease

  _yDecrease <<= 32n

  let denominator = maturity
  denominator -= currentTime

  _yDecrease = divUp(_yDecrease, denominator)

  let yReserve = state.y
  yReserve -= _yDecrease

  let zReserve = state.x
  zReserve *= state.y

  denominator = xReserve
  denominator *= yReserve

  zReserve = mulDivUp(zReserve, state.z, denominator)

  let _zDecrease = state.z
  _zDecrease -= zReserve

  return { xIncrease: xIncrease, yDecrease: _yDecrease, zDecrease: _zDecrease }
}
export const getLendGivenInsuranceParams = (
  state: { x: bigint; y: bigint; z: bigint },
  maturity: bigint,
  fee: bigint,
  protocolFee: bigint,
  currentTime: bigint,
  assetIn: bigint,
  insuranceOut: bigint
) => {
  let xIncrease = getX(protocolFee, fee, maturity, currentTime, assetIn)

  let xReserve = state.x
  xReserve += xIncrease

  let _zDecrease = insuranceOut
  _zDecrease++
  _zDecrease *= xReserve
  let subtrahend = state.z
  subtrahend *= xIncrease
  _zDecrease -= subtrahend
  _zDecrease <<= 25n
  let denominator = maturity - currentTime
  denominator *= xReserve
  _zDecrease = divUp(_zDecrease, denominator)

  let zReserve = state.z
  zReserve -= _zDecrease

  let yReserve = state.x
  yReserve *= state.z
  denominator = xReserve
  denominator *= zReserve
  yReserve = mulDivUp(yReserve, state.y, denominator)

  let _yDecrease = state.y
  _yDecrease -= yReserve

  return { xIncrease: xIncrease, yDecrease: _yDecrease, zDecrease: _zDecrease }
}
export const getLendGivenPercentParams = (
  state: { x: bigint; y: bigint; z: bigint },
  maturity: bigint,
  currentTime: bigint,
  fee: bigint,
  protocolFee: bigint,
  assetIn: bigint,
  percent: bigint
) => {
  let xIncrease = getX(fee, protocolFee, maturity, currentTime, assetIn)

  let xReserve = state.x
  xReserve += xIncrease

  if (percent <= 0x80000000) {
    let yMin = xIncrease
    yMin *= state.y
    yMin = divUp(yMin, xReserve)
    yMin >>= 4n

    let yMid = state.y
    let subtrahend = state.y
    subtrahend *= state.y
    subtrahend = mulDivUp(subtrahend, state.x, xReserve)
    subtrahend = sqrtUp(subtrahend)
    yMid -= subtrahend

    let _yDecrease = yMid
    _yDecrease -= yMin
    _yDecrease *= percent
    _yDecrease >>= 31n
    _yDecrease += yMin

    let yReserve = state.y
    yReserve -= _yDecrease

    let zReserve = state.x
    zReserve *= state.y
    let denominator = xReserve
    denominator *= yReserve
    zReserve = mulDivUp(zReserve, state.z, denominator)

    let _zDecrease = state.z
    _zDecrease -= zReserve

    return { xIncrease: xIncrease, yDecrease: _yDecrease, zDecrease: _zDecrease }
  } else {
    percent = 0x100000000n - percent

    let zMid = state.z
    let subtrahend = state.z
    subtrahend *= state.z
    subtrahend = mulDivUp(subtrahend, state.z, xReserve)
    subtrahend = sqrtUp(subtrahend)
    zMid -= subtrahend

    let _zDecrease = zMid
    _zDecrease *= percent
    _zDecrease >>= 31n

    let zReserve = state.z
    zReserve -= _zDecrease

    let yReserve = state.x
    yReserve *= state.z
    let denominator = xReserve
    denominator *= zReserve
    yReserve = mulDivUp(yReserve, state.y, denominator)

    let _yDecrease = state.y
    _yDecrease -= yReserve

    return { xIncrease: xIncrease, yDecrease: _yDecrease, zDecrease: _zDecrease }
  }
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
  const feeBase = BigInt(0x10000 + 100)
  const xReserve = delState.x + state.x
  const yAdjusted = adjust(state.y, delState.y, feeBase)
  const zAdjusted = adjust(state.z, delState.z, feeBase)
  if (checkConstantProduct(state, { x: xReserve, y: yAdjusted, z: zAdjusted })) {
    const minimum = ((delState.x * state.y) << 12n) / (xReserve * feeBase)
    if (delState.y < minimum) {
      return false
    } else {
      return true
    }
  } else {
    return false
  }
}

export const checkError = (
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
  const feeBase = BigInt(0x10000 + 100)
  const xReserve = delState.x + state.x
  const yAdjusted = adjust(state.y, delState.y, feeBase)
  const zAdjusted = adjust(state.z, delState.z, feeBase)
  if (checkConstantProduct(state, { x: xReserve, y: yAdjusted, z: zAdjusted })) {
    const minimum = ((delState.x * state.y) << 12n) / (xReserve * feeBase)
    if (delState.y < minimum) {
      return 'Minimum'
    } else {
      return ''
    }
  } else {
    return 'Invariance'
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
  const _insuranceOut = ((maturity - currentTime) * delState.z) >> 25n
  const denominator = delState.x + state.x
  const minimum = (state.z * delState.x) / denominator

  return _insuranceOut + minimum
}

export const getInsurancePrincipal = (
  state: { x: bigint; y: bigint; z: bigint },
  delState: { x: bigint; y: bigint; z: bigint }
): bigint => {
  return (state.z * delState.x) / (state.x + delState.x)
}

export const getInsuranceInterest = (
  delState: { x: bigint; y: bigint; z: bigint },
  maturity: bigint,
  currentTime: bigint
): bigint => {
  return ((maturity - currentTime) * delState.z) >> 25n
}

export const getX = (protocolFee: bigint, fee: bigint, maturity: bigint, currentTime: bigint, assetIn: bigint) => {
  const duration = maturity - currentTime

  const BASE = 0x10000000000n
  let denominator = duration * (fee + protocolFee) + BASE

  let xIncrease = (assetIn * BASE) / denominator

  return xIncrease
}

export const getLendFee = (
  maturity: bigint,
  currentTime: bigint,
  xIncrease: bigint,
  fee: bigint,
  protocolFee: bigint
) => {
  const BASE = 0x10000000000n

  let totalFee = fee
  totalFee += protocolFee

  let numerator = maturity
  numerator -= currentTime
  numerator *= totalFee
  numerator += BASE

  let adjusted = xIncrease
  adjusted *= numerator
  adjusted = divUp(adjusted, BASE)
  let totalFeeStoredIncrease = adjusted
  totalFeeStoredIncrease -= xIncrease

  let feeStoredIncrease = totalFeeStoredIncrease
  feeStoredIncrease *= fee
  feeStoredIncrease /= totalFee
  let protocolFeeStoredIncrease = totalFeeStoredIncrease
  protocolFeeStoredIncrease -= feeStoredIncrease
  return {
    feeStoredIncrease,
    protocolFeeStoredIncrease,
  }
}
