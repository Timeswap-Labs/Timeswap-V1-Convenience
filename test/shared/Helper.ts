import { ethers } from 'hardhat'

async function advanceTime(time: number) {
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
export function mulDiv(
  a: bigint,
  b: bigint,
  denominator: bigint
): bigint {
  let z = a * b;
  z = z / denominator;
  return z;
}

export function mulDivUp(
  a: bigint,
  b: bigint,
  denominator: bigint
) : bigint {
  let z = mulDiv(a, b, denominator);
  let mulmod = (a * b) % denominator;
  if (mulmod > 0) z++;
  return z;
}
export function min(x: bigint, y: bigint, z: bigint): bigint {
  if (x <= y && x <= z) {
    return x;
  } else if (y <= x && y <= z) {
    return y;
  } else {
    return z;
  }
}


export default {
  now,
  advanceTimeAndBlock,
  getBlock,
  getTimestamp,
  setTime,
  mulDiv,
  min,
  mulDivUp
}
