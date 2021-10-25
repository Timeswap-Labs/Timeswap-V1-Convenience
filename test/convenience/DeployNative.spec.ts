// import { ethers, waffle } from 'hardhat'
// import { mulDiv, now, min, shiftRightUp, mulDivUp, advanceTimeAndBlock, setTime } from '../shared/Helper'
// import { expect } from '../shared/Expect'
// import * as LiquidityMath from '../libraries/LiquidityMath'
// import {
//   newLiquidityFixture,
//   constructorFixture,
//   Fixture,
//   addLiquidityFixture,
//   newLiquidityETHAssetFixture,
//   addLiquidityETHAssetFixture,
//   newLiquidityETHCollateralFixture,
//   addLiquidityETHCollateralFixture,
//   mintNewCoreFixture,
// } from '../shared/Fixtures'
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
// import * as fc from 'fast-check'
// import { AddLiquidityParams, NewLiquidityParams } from '../types'
// import { ERC20__factory, TestToken } from '../../typechain'
// import * as LiquidityFilter from '../filters/Liquidity'
// import { Convenience } from '../shared/Convenience'

// const { loadFixture } = waffle

// let maturity = 0n
// let signers: SignerWithAddress[] = []

// const MAXUINT112: bigint = 2n ** 112n

// // async function fixture(): Promise<Fixture> {
// //   maturity = (await now()) + 31536000n
// //   signers = await ethers.getSigners()

// //   const constructor = await constructorFixture(1n << 255n, 1n << 255n, maturity, signers[0])

// //   return constructor
// // }


// describe('Add Liquidity', () => {
//   it('Succeeded', async () => {
//     let currentTime = await now()
//     maturity = (await now()) + 31536000n
//     await fc.assert(
//       fc.asyncProperty(
//         fc
//           .record({
//             newLiquidityParams: fc
//               .record({
//                 assetIn: fc.bigUintN(50),
//                 debtIn: fc.bigUintN(50),
//                 collateralIn: fc.bigUintN(50),
//               })
//               .filter((x) => LiquidityFilter.newLiquiditySuccess(x, currentTime + 5_000n, maturity)),
//             addLiquidityParams: fc.record({
//               assetIn: fc.bigUintN(50),
//               minLiquidity: fc.bigUintN(50),
//               maxDebt: fc.bigUintN(50),
//               maxCollateral: fc.bigUintN(50),
//             }),
//           })
//           .filter((x) => LiquidityFilter.addLiquiditySuccess(x, currentTime + 5_000n, currentTime + 10_000n, maturity)).noShrink(),
//         async (data) => {
//           const success = async () => {
//             await setTime(Number(currentTime + 5000n))
//             const {yIncreaseNewLiquidity,zIncreaseNewLiquidity} = LiquidityMath.getYandZIncreaseNewLiquidity(data.newLiquidityParams.assetIn,data.newLiquidityParams.debtIn,data.newLiquidityParams.collateralIn,currentTime+5000n,maturity)
//             const newLiquidity = await mintNewCoreFixture(signers[0],maturity,data.newLiquidityParams.assetIn,yIncreaseNewLiquidity,zIncreaseNewLiquidity)
//             await setTime(Number(currentTime + 10000n))
//             console.log(newLiquidity.pairContract.address)
//             const addLiquidity = await addLiquidityFixture(newLiquidity, signers[0], data.addLiquidityParams)
//             return addLiquidity
//           }
//           await loadFixture(success)
//           // await addLiquidityProperties(data, currentTime, success, assetToken.address, collateralToken.address)
//         }
//       ),
//       { skipAllAfterTimeLimit: 50000, numRuns: 10 }
//     )
//   }).timeout(100000)})



// async function addLiquidityProperties(
//   data: {
//     newLiquidityParams: {
//       assetIn: bigint
//       debtIn: bigint
//       collateralIn: bigint
//     }
//     addLiquidityParams: {
//       assetIn: bigint
//       minLiquidity: bigint
//       maxDebt: bigint
//       maxCollateral: bigint
//     }
//   },
//   currentTime: bigint,
//   success: () => Promise<{
//     convenience: Convenience
//     assetToken: TestToken
//     collateralToken: TestToken
//     maturity: bigint
//   }>,
//   assetAddress: string,
//   collateralAddress: string
// ) {
//   const result = await loadFixture(success)
//   // currentTime = await now()
//   // //console.log(.*)
//   const { yIncreaseNewLiquidity, zIncreaseNewLiquidity } = LiquidityMath.getYandZIncreaseNewLiquidity(
//     data.newLiquidityParams.assetIn,
//     data.newLiquidityParams.debtIn,
//     data.newLiquidityParams.collateralIn,
//     currentTime + 5_000n,
//     maturity
//   )

//   const state = {
//     x: data.newLiquidityParams.assetIn,
//     y: yIncreaseNewLiquidity,
//     z: zIncreaseNewLiquidity,
//   }
//   const { yIncreaseAddLiquidity, zIncreaseAddLiquidity } = LiquidityMath.getYandZIncreaseAddLiquidity(
//     state,
//     data.addLiquidityParams.assetIn
//   )
//   const liquidityBalanceNew = LiquidityMath.liquidityCalculateNewLiquidity(
//     data.newLiquidityParams.assetIn,
//     currentTime + 5_000n,
//     maturity
//   )
//   const delState = {
//     x: data.addLiquidityParams.assetIn,
//     y: yIncreaseAddLiquidity,
//     z: zIncreaseAddLiquidity,
//   }
//   const liquidityBalanceAdd = LiquidityMath.liquidityCalculateAddLiquidity(
//     state,
//     delState,
//     currentTime + 10_000n,
//     maturity
//   )
//   const liquidityBalance = liquidityBalanceNew + liquidityBalanceAdd
//   const liquidityToken = ERC20__factory.connect(
//     (await result.convenience.getNatives(assetAddress, collateralAddress, maturity)).liquidity,
//     ethers.provider
//   )
//   const liquidityBalanceContract = (await liquidityToken.balanceOf(signers[0].address)).toBigInt()
//   // //console.log(.*)
//   expect(liquidityBalanceContract).equalBigInt(liquidityBalance)
// }