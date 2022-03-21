import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import * as fc from 'fast-check'
import { ethers, waffle } from 'hardhat'
import { CollateralizedDebt__factory, TestToken } from '../../typechain'
import * as LiquidityFilter from '../filters/Liquidity'
import * as BorrowMath from '../libraries/BorrowMath'
import * as LiquidityMath from '../libraries/LiquidityMath'
import { Convenience } from '../shared/Convenience'
import { expect } from '../shared/Expect'
import {
  borrowGivenDebtFixture,
  constructorFixture,
  Fixture,
  newLiquidityFixture,
  repayFixture,
} from '../shared/Fixtures'
import { now, setTime } from '../shared/Helper'
import { FEE, PROTOCOL_FEE } from '../shared/Constants'

const { loadFixture } = waffle

let maturity = 0n
let signers: SignerWithAddress[] = []

const MAXUINT112: bigint = 2n ** 112n

async function fixture(): Promise<Fixture> {
  maturity = (await now()) + 31536000n
  signers = await ethers.getSigners()

  const constructor = await constructorFixture(1n << 150n, 1n << 150n, maturity, signers[0])

  return constructor
}
const testcases = {
  newLiquidity: {
    assetIn: 1000000000n,
    debtIn: 2000000000n,
    collateralIn: 1000000000n,
  },
  borrow: Array(1000).fill({
    assetOut: 100n,
    debtIn: 150n,
    maxCollateral: 1000n,
  }),
}

describe('Borrow Given Debt', () => {
  it('Succeeded', async () => {
    const { maturity, assetToken, collateralToken } = await loadFixture(fixture)
    let currentTime = await now()

    const success = async () => {
      const constructor = await loadFixture(fixture)
      await setTime(Number(currentTime + 5000n))
      const newLiquidity = await loadFixture(() => newLiquidityFixture(constructor, signers[0], testcases.newLiquidity))
      await setTime(Number(currentTime + 10000n))
      const borrowGivenDebt = await loadFixture(() =>
        borrowGivenDebtFixture(newLiquidity, signers[0], testcases.borrow[0])
      )
      let currentFixture = borrowGivenDebt
      for (let i = 1; i < testcases.borrow.length; i++) {
        await setTime(Number(currentTime + 5000n * BigInt(i + 3)))
        currentFixture = await loadFixture(() =>
          borrowGivenDebtFixture(currentFixture, signers[0], testcases.borrow[i])
        )
      }
      const repay = await repayFixture(currentFixture, signers[0], { ids: [1n], maxAssetsIn: [10n] })

      return repay
    }
    await loadFixture(success)
  }).timeout(600000)
})

async function borrowGivenDebtProperties(
  data: {
    newLiquidityParams: {
      assetIn: bigint
      debtIn: bigint
      collateralIn: bigint
    }
    borrowGivenDebtParams: {
      assetOut: bigint
      debtIn: bigint
      maxCollateral: bigint
    }
  },
  currentTime: bigint,
  success: () => Promise<{
    convenience: Convenience
    assetToken: TestToken
    collateralToken: TestToken
    maturity: bigint
  }>,
  assetAddress: string,
  collateralAddress: string
) {
  const neededTime = (await now()) + 100n

  const result = await loadFixture(success)

  let [xIncreaseNewLiquidity, yIncreaseNewLiquidity, zIncreaseNewLiquidity] = [0n, 0n, 0n]
  const maybeNewLiq = LiquidityMath.getNewLiquidityParams(
    data.newLiquidityParams.assetIn,
    data.newLiquidityParams.debtIn,
    data.newLiquidityParams.collateralIn,
    currentTime + 5_000n,
    maturity
  )
  if (maybeNewLiq !== false) {
    xIncreaseNewLiquidity = maybeNewLiq.xIncreaseNewLiquidity
    yIncreaseNewLiquidity = maybeNewLiq.yIncreaseNewLiquidity
    zIncreaseNewLiquidity = maybeNewLiq.zIncreaseNewLiquidity
  }
  const state = {
    x: data.newLiquidityParams.assetIn,
    y: yIncreaseNewLiquidity,
    z: zIncreaseNewLiquidity,
  }
  const { xDecrease, yIncrease, zIncrease } = BorrowMath.getBorrowGivenDebtParams(
    state,
    PROTOCOL_FEE,
    FEE,
    state.x,
    result.maturity,
    currentTime + 10_000n,
    data.borrowGivenDebtParams.debtIn
  )

  const delState = {
    x: xDecrease,
    y: yIncrease,
    z: zIncrease,
  }

  const debt = BorrowMath.getDebt(delState, maturity, currentTime + 10_000n)
  const collateral = BorrowMath.getCollateral(state, delState, maturity, currentTime + 10_000n)

  const natives = await result.convenience.getNatives(assetAddress, collateralAddress, maturity)
  const cdToken = CollateralizedDebt__factory.connect(natives.collateralizedDebt, ethers.provider)

  const cdTokenBalance = await cdToken.dueOf(1)
  const debtContract = cdTokenBalance.debt.toBigInt()
  const collateralContract = cdTokenBalance.collateral.toBigInt()

  expect(debtContract).equalBigInt(debt)
  expect(collateralContract).equalBigInt(collateral)
}
