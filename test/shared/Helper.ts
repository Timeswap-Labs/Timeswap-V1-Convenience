import { ethers } from 'hardhat'
import { Uint } from '@timeswap-labs/timeswap-v1-sdk-core/dist/uint/uint'
import { uint16Array } from 'fast-check'
import { Uint256 } from '@timeswap-labs/timeswap-v1-sdk-core'
export async function advanceTime(time: number) {
  await ethers.provider.send('evm_increaseTime', [time])
}

export async function setTime(time: number) {
  await ethers.provider.send('evm_setNextBlockTimestamp', [time])
}

async function advanceBlock() {
  const block = await getBlock('latest')
  return block.hash
}

export async function advanceTimeAndBlock(time: number) {
  await advanceTime(time)
  await advanceBlock()
}

export async function now(): Promise<bigint> {
  const block = await getBlock('latest')
  return BigInt(block.timestamp)
}

export async function getBlock(blockHashOrBlockTag: string) {
  const block = await ethers.provider.getBlock(blockHashOrBlockTag)
  return block
}

export async function getTimestamp(blockHash: string): Promise<bigint> {
  const block = await getBlock(blockHash)
  return BigInt(block.timestamp)
}
export function mulDiv(a: bigint, b: bigint, denominator: bigint): bigint {
  let z = a * b
  z = z / denominator
  return z
}
export function mulDivUint(a: Uint, b: Uint, denominator: Uint): Uint {
  let z = a.mul(b)
  z = z.div(denominator)
  return z
}
export function mulDivUp(a: bigint, b: bigint, denominator: bigint): bigint {
  let z = mulDiv(a, b, denominator)
  let mulmod = (a * b) % denominator
  if (mulmod > 0) z++
  return z
}
export function mulDivUpUint(a: Uint256, b: Uint256, denominator: Uint256): Uint256 {
  return new Uint256(mulDivUp(a.toBigInt(), b.toBigInt(), denominator.toBigInt()))
}
export function min(x: bigint, y: bigint, z: bigint): bigint {
  if (x <= y && x <= z) {
    return x
  } else if (y <= x && y <= z) {
    return y
  } else {
    return z
  }
}
export function minUint(x: Uint, y: Uint, z: Uint): Uint {
  if (x <= y && x <= z) {
    return x
  } else if (y <= x && y <= z) {
    return y
  } else {
    return z
  }
}

export function divUp(x: bigint, y: bigint): bigint {
  let z = x / y
  if (x % y > 0) z++
  return z
}

export function shiftUp(x: bigint, y: bigint): bigint {
  let z = x >> y
  if (x != z << y) z++
  return z
}
export function shiftUpUint(x: Uint, y: Uint): Uint {
  return new Uint256(shiftUp(x.toBigInt(), y.toBigInt()))
}

export const objectMap = (obj: { [key: string]: Uint }, fn: any) =>
  Object.fromEntries(Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)]))
export const UToBObj = (obj: { [key: string]: Uint }): { [key: string]: bigint } =>
  objectMap(obj, (v: Uint) => v.toBigInt())

export default {
  now,
  advanceTimeAndBlock,
  getBlock,
  getTimestamp,
  setTime,
  mulDiv,
  min,
  mulDivUp,
  divUp,
  shiftUp,
  objectMap,
  UToBObj,
}
