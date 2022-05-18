// import { ethers, waffle } from 'hardhat'
// import { mulDiv, now, min, shiftRightUp, mulDivUp, advanceTimeAndBlock, setTime, advanceTime, getBlock } from '../shared/Helper'
// import { expect } from '../shared/Expect'
// import * as LiquidityMath from '../libraries/LiquidityMath'
// import * as LendMath from '../libraries/LendMath'
// import { FEE, PROTOCOL_FEE } from '../shared/Constants'

// import {
//   newLiquidityFixture,
//   constructorFixture,
//   Fixture,
//   removeLiquidityFixture,
//   liquidityGivenAssetFixture,
//   newLiquidityETHAssetFixture,
//   liquidityGivenAssetETHAssetFixture,
//   newLiquidityETHCollateralFixture,
//   liquidityGivenAssetETHCollateralFixture,
//   lendGivenBondFixture,
//   borrowGivenCollateralFixture,
//   borrowGivenPercentFixture,
//   repayFixture,
//   collectFixture,
//   lendGivenPercentFixture
// } from '../shared/Fixtures'
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
// import * as fc from 'fast-check'
// import { LiquidityGivenAssetParams, NewLiquidityParams } from '../types'
// import {
//   BondInterest__factory,
//   BondPrincipal__factory,
//   CollateralizedDebt__factory,
//   ERC20__factory,
//   InsuranceInterest__factory,
//   InsurancePrincipal__factory,
//   Liquidity__factory,
//   TestToken,
//   TimeswapPair,
//   TimeswapPair__factory,
// } from '../../typechain'
// import * as fs from "fs"
// import * as LiquidityFilter from '../filters/Liquidity'
// import { Convenience } from '../shared/Convenience'
// import { multipleLiquidityAddition as testCases } from '../test-cases/index'
// import { json } from 'stream/consumers'
// import testcases from '../test-cases/liquidity/LiquidityGivenAsset'
// import { test } from 'mocha'
// const { loadFixture } = waffle

// let maturity = 0n
// let signers: SignerWithAddress[] = []

// const MAXUINT112: bigint = 2n ** 112n

// async function fixture(): Promise<Fixture> {
//   maturity = (await now()) + 31536000n
//   signers = await ethers.getSigners()

//   const constructor = await constructorFixture(1n << 255n, 1n << 255n, maturity, signers)

//   return constructor
// }


// describe.only('Multiple Liquidity Given Asset', () => {
//   testCases.forEach((testCase, index) => {
//     it(`Succeeded ${index}`, async () => {
//       const { maturity, assetToken, collateralToken, convenience } = await loadFixture(fixture)
//       let currentTime = await now()

//       const constructorFixture = await loadFixture(fixture)

//       // await setTime(Number(currentTime + 5000n))
//       let percent = {}
//       let lend_percent = {}

//       // NEW LIQUIDITY
//       let beforeLiq = 0n

//       // const newLiquidity = await newLiquidityFixture(constructorFixture, signers[19], testCase.newLiquidityParams)
//       const newLiquidity = await newLiquidityFixture(constructorFixture,signers[19],testCase.newLiquidityParamsX)
//       const pair = await constructorFixture.convenience.factoryContract.getPair(constructorFixture.assetToken.address, constructorFixture.collateralToken.address)
//       const pairContract = TimeswapPair__factory.connect(pair, ethers.provider);

//       let protFeeBefore = (await pairContract.protocolFeeStored()).toBigInt();
//       let feeBefore = (await pairContract.fee()).toBigInt();

//       let afterLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
//       let liqTokenContract = Liquidity__factory.connect((await newLiquidity.convenience.getNatives(assetToken.address,collateralToken.address,newLiquidity.maturity)).liquidity,ethers.provider)
//       let liqConv = await pairContract.liquidityOf(maturity,newLiquidity.convenience.convenienceContract.address)
//       let liqIssued =  await liqTokenContract.balanceOf(signers[19].address)
//       let totalLiqSupplied = await liqTokenContract.totalSupply()

//        let protFeeAfter = (await pairContract.protocolFee()).toBigInt()
//        let feeAfter = (await pairContract.fee()).toBigInt()

//       let liqEvtFilter= await pairContract.filters.Mint()
//       let liqEvt = await pairContract.queryFilter(liqEvtFilter)
//       console.log('liq evt 19 ',liqEvt);
//       console.log('liq evt 19  ',liqEvt[0].args.dueOut.collateral);

//       // await setTime(Number(currentTime + 10000n))
//     //   const lendGivenBond  = await lendGivenBondFixture(newLiquidity,signers[0],testCase.lenGivenBondParams)
//     //   const borrowGivenCollateral = await borrowGivenCollateralFixture(lendGivenBond, signers[0],testCase.borrowGivenCollateralParams)

//     percent[signers[19].address] ={
//        "Collateral In" :  liqEvt[0].args.dueOut.collateral.toString(),
//        "Asset In": testCase.newLiquidityParams.assetIn.toString(),
//        "Max Collateral": testCase.addLiquidityParams[0].maxCollateral.toString(),
//        "Total liquidity Before": beforeLiq.toString(),
//        "Total liquidity After": afterLiq.toString(),
//        "Percent Liquidity Issued": String(Number(((afterLiq - beforeLiq)*10_000n) / afterLiq) / 10_000).toString(),
//        "Total Liquidity": afterLiq.toString(),
//        "User Address": signers[19].address,
//        "Liq Issued": liqIssued.toString(),
//        "Total liq supplied": totalLiqSupplied.toString(),
//        "LI": (afterLiq - beforeLiq).toString(),
//        "Total liq on conv": liqConv.toString(),
//        'signer': 19,
//     }

//       console.log('New liquidity Completed')

// //       // FIRST ADD LIQUIDITY
// //       beforeLiq = afterLiq

// //       let addLiquidity = await liquidityGivenAssetFixture(
// //         newLiquidity,
// //         signers[0],
// //         testCase.addLiquidityParams[0]
// //       )
// //       console.log('signer 0');
// //           //MINT evt
// //       let fliqEvtFilter= await pairContract.filters.Mint()
// //       let fliqEvt = await pairContract.queryFilter(fliqEvtFilter)
// //       console.log('liq evt 19  ',fliqEvt[0].args.dueOut.collateral);

// //       afterLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
// //       liqTokenContract = Liquidity__factory.connect((await newLiquidity.convenience.getNatives(assetToken.address,collateralToken.address,newLiquidity.maturity)).liquidity,ethers.provider)
// //       liqConv = await pairContract.liquidityOf(maturity,newLiquidity.convenience.convenienceContract.address)
// //       liqIssued =  await liqTokenContract.balanceOf(signers[0].address)
// //       totalLiqSupplied = await liqTokenContract.totalSupply()

// //       percent[signers[0].address] ={
// //        "Asset In": testCase.addLiquidityParams[0].assetIn.toString(),
// //        "Min Liquidity": testCase.addLiquidityParams[0].minLiquidity.toString(),
// //        "Max Debt": testCase.addLiquidityParams[0].maxDebt.toString(),
// //        "Max Collateral": testCase.addLiquidityParams[0].maxCollateral.toString(),
// //        "Total liquidity Before": beforeLiq.toString(),
// //        "Total liquidity After": afterLiq.toString(),
// //        "Percent Liquidity Issued": String(Number(((afterLiq - beforeLiq)*10_000n) / afterLiq) / 10_000).toString(),
// //        "Total Liquidity": afterLiq.toString(),
// //        "User Address": signers[0].address,
// //        "Liq Issued": liqIssued.toString(),
// //        "Total liq supplied": totalLiqSupplied.toString(),
// //        "LI": (afterLiq - beforeLiq).toString(),
// //        "Total liq on conv": liqConv.toString(),
// //        "signer": 0,

// //     }

// //     console.log('1st Add Liquidity Completed')
// //     // let liqEventFilter = await pairContract.filters.Mint()
// //     // let liqEvents = await pairContract.queryFilter(liqEventFilter)


// //     //ADD Liquidity from 1-12
// //      for(let i=1;i<testCase.addLiquidityParams.length;i++){
// //         beforeLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()

// //        let addLiquidity = await liquidityGivenAssetFixture(
// //         newLiquidity,
// //         signers[i],
// //         testCase.addLiquidityParams[i]
// //       )
// //       let maddLiqEvtFilter= await pairContract.filters.Mint()
// //       let maddLiqEvt = await pairContract.queryFilter(maddLiqEvtFilter)
// //        console.log('addliq evt ',maddLiqEvt[0].args.dueOut.collateral);
// //  console.log('>>>',i);

// //       afterLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
// //     //    liqTokenContract = Liquidity__factory.connect((await addLiquidity.convenience.getNatives(assetToken.address,collateralToken.address,maturity)).liquidity,ethers.provider)
// //         // console.log(assetToken.address)
// //         // console.log(collateralToken.address)
// //         // console.log(await pairContract.asset())
// //         // console.log(await pairContract.collateral())
// //         // console.log(liqTokenContract.address)
// //         // const liqTokenContract = Liquidity__factory.connect((await addLiquidity.convenience.getNatives(assetToken.address,collateralToken.address,maturity)).liquidity,ethers.provider)
// //        liqConv = await pairContract.liquidityOf(maturity,newLiquidity.convenience.convenienceContract.address)
// //        liqIssued =  await liqTokenContract.balanceOf(signers[i].address)
// //        totalLiqSupplied = await liqTokenContract.totalSupply()

// //         percent[signers[i].address] ={
// //             // "Collateral In" :  testCase.addLiquidityParams[i]..toString(),
// //             "Asset In": testCase.addLiquidityParams[i].assetIn.toString(),
// //             "Min Liquidity": testCase.addLiquidityParams[i].minLiquidity.toString(),
// //             "Max Debt": testCase.addLiquidityParams[i].maxDebt.toString(),
// //             "Max Collateral": testCase.addLiquidityParams[i].maxCollateral.toString(),
// //             "Total liquidity Before": beforeLiq.toString(),
// //             "Total liquidity After": afterLiq.toString(),
// //             "Percent Liquidity Issued": String(Number(((afterLiq - beforeLiq)*10_000n) / afterLiq) / 10_000),
// //           "Total Liquidity": afterLiq.toString(),
// //           "User Address": signers[i].address,
// //           "Liq Issued": liqIssued.toString(),
// //           "Total liq supplied": totalLiqSupplied.toString(),
// //           "LI": (afterLiq - beforeLiq).toString(),
// //           "Total liq on conv": liqConv.toString(),
// //           'signer': i,

// //         }
// //     }
// //           console.log('Add liquidity Completed')

//     // //   await addMultipleLiquidityProperties(testCase, currentTime, addLiquidity, assetToken.address, collateralToken.address)

//     //  }
//     beforeLiq = afterLiq

//     // LEND TX  13 signer
//     // natives
//     let addLiquidity = newLiquidity

//     let bondPrincipalContract = BondPrincipal__factory.connect((await addLiquidity.convenience.getNatives(assetToken.address,collateralToken.address,addLiquidity.maturity)).bondPrincipal,ethers.provider)
//     let bondInterestContract = BondInterest__factory.connect((await addLiquidity.convenience.getNatives(assetToken.address,collateralToken.address,addLiquidity.maturity)).bondInterest,ethers.provider)
//     let insurancePrincipalContract = InsurancePrincipal__factory.connect((await addLiquidity.convenience.getNatives(assetToken.address,collateralToken.address,addLiquidity.maturity)).insurancePrincipal,ethers.provider)
//     let insuranceInterestContract  = InsuranceInterest__factory.connect((await addLiquidity.convenience.getNatives(assetToken.address,collateralToken.address,addLiquidity.maturity)).insuranceInterest,ethers.provider)



//     await setTime(Number(currentTime + 10000n))
//       let beforeClaim = (await pairContract.claimsOf(addLiquidity.maturity, signers[13].address ))

//       protFeeBefore = (await pairContract.protocolFeeStored()).toBigInt();
//       feeBefore = (await pairContract.fee()).toBigInt();

//       beforeLiq =   (await pairContract.totalLiquidity(addLiquidity.maturity)).toBigInt()

//       let lendGivenPercent = await lendGivenPercentFixture(addLiquidity, signers[13], testCase.lendGivenPercentParams)
// //log
// let bondPrincipalBalance  = await bondPrincipalContract.balanceOf(signers[13].address)
// let bondInterestBalance  = await bondInterestContract.balanceOf(signers[13].address)
// let iitBal = await insuranceInterestContract.balanceOf(signers[13].address)
// let iptBal = await insurancePrincipalContract.balanceOf(signers[13].address)
//       let lendEventFilter = await pairContract.filters.Lend()
//       let lendEvents = await pairContract.queryFilter(lendEventFilter)
//       console.log('lend event', lendEvents)
//     console.log('bpt',bondPrincipalBalance);
//     console.log('bit',bondInterestBalance);
//     console.log('ipt',iptBal);
//     console.log('iit',iitBal);
//       afterLiq = (await pairContract.totalLiquidity(addLiquidity.maturity)).toBigInt()

//       console.log('before liq',beforeLiq);
//       console.log('after liq' , afterLiq);
//       let afterClaim = (await pairContract.claimsOf(maturity,convenience.convenienceContract.address))

//     console.log('claims of lender',afterClaim);
//       liqConv = await pairContract.liquidityOf(maturity,newLiquidity.convenience.convenienceContract.address)
//       liqIssued =  await liqTokenContract.balanceOf(signers[13].address)
//       totalLiqSupplied = await liqTokenContract.totalSupply()
//       let lendersLiq = await pairContract.claimsOf(maturity,signers[13].address)

//     console.log('liq issued 13',lendersLiq   );
//       percent[signers[13].address] ={
//         // "Asset In": testCase.lendGivenBondParamsX.assetIn.toString(),
//         "Bond Out": bondPrincipalBalance.toString(),
//         // "Min Liquidity": testCase.lendGivenBondParams.minLiquidity.toString(),
//         // "Max Debt  ": testCase.addLiquidityParams[0].maxDebt.toString(),
//         // "Max Collateral": testCase.addLiquidityParams[0].maxCollateral.toString(),
//         "Total liquidity Before": beforeLiq.toString(),
//         "Total liquidity After": afterLiq.toString(),
//         "Percent Liquidity Issued": String(Number(((afterLiq - beforeLiq)*10_000n) / afterLiq) / 10_000),
//         "Total Liquidity": afterLiq.toString(),
//         "User Address": signers[0].address,
//         "Liq Issued": liqIssued.toString(),
//         "Total liq supplied": totalLiqSupplied.toString(),
//         "LI": (afterLiq - beforeLiq).toString(),
//         "Total liq on conv": liqConv.toString(),
//         "BondPrincipalBalance": bondPrincipalBalance.toString(),
//       "BondInterestBalance": bondInterestBalance.toString(),
//       "InsurancePrincipalBal": iptBal.toString(),
//       "InsuranceInterest Bal": iitBal.toString(),
//     }
//     console.log('1st Lend Completed')

// //   // LENDING 14 -17 signers
// //     for(let i=14;i<18;i++){
// //       // let feeBefore = (await pairContract.feeStored(maturity)).toBigInt();
// //       protFeeBefore = (await pairContract.protocolFeeStored()).toBigInt();

// //       feeBefore = (await pairContract.fee()).toBigInt();

// //       beforeLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()

// //       let beforeClaim = (await pairContract.claimsOf(maturity,convenience.convenienceContract.address))

// //       lendGivenBond = await lendGivenBondFixture(lendGivenBond,signers[i],testCase.lendGivenBondParams)

// //       afterLiq = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
// //       liqIssued =  await liqTokenContract.balanceOf(signers[i].address)

// //       protFeeAfter = (await pairContract.protocolFee()).toBigInt()
// //       feeAfter = (await pairContract.fee()).toBigInt()

// //       bondPrincipalBalance  = await bondPrincipalContract.balanceOf(signers[i].address)
// //       bondInterestBalance  = await bondInterestContract.balanceOf(signers[i].address)
// //       iitBal = await insuranceInterestContract.balanceOf(signers[i].address)
// //       iptBal = await insurancePrincipalContract.balanceOf(signers[i].address)

// // console.log('###############################');

// //       let afterClaim = (await pairContract.claimsOf(maturity,convenience.convenienceContract.address))
// //       let afterClaim13 = (await pairContract.claimsOf(maturity,signers[13].address))

// //       // console.log('tot claim change clamim change',afterClaim.bondPrincipal.toBigInt() - beforeClaim.bondPrincipal.toBigInt());
// //       // console.log('tot claim change13',afterClaim13);
// //       // console.log('after liq', afterLiq);
// //       // // claimVal = afterClaimL
// //       // console.log('BPT CLAIM',afterClaim.bondPrincipal.toBigInt()-beforeClaim.bondPrincipal.toBigInt());

// //       // console.log('addr',i);


// //     percent[signers[i].address] ={
// //       "Asset In": testCase.lendGivenBondParams.assetIn.toString(),
// //       "Bond Out": bondPrincipalBalance.toString(),
// //       // "Min Insurance": testCase.lendGivenBondParams.minInsurance.toString(),
// //       // "Min Liquidity": testCase.addLiquidityParams[i].minLiquidity.toString(),
// //       // "Max Debt": testCase.addLiquidityParams[i].maxDebt.toString(),
// //       // "Max Collateral": testCase.addLiquidityParams[i].maxCollateral.toString(),
// //       "Total liquidity Before": beforeLiq.toString(),
// //       "Total liquidity After": afterLiq.toString(),
// //       "Percent Liquidity Issued": String(Number(((afterLiq - beforeLiq)*10_000n) / afterLiq) / 10_000),
// //       "Total Liquidity": afterLiq.toString(),
// //       "User Address": signers[i].address,
// //       "Liq Issued": liqIssued.toString(),
// //       "Total liq supplied": totalLiqSupplied.toString(),
// //       "LI": (afterLiq - beforeLiq).toString(),
// //       "Total liq on conv": liqConv.toString(),
// //       "address": signers[i].address,
// //       "signer" : i,
// //       "BondPrincipalBalance": bondPrincipalBalance.toString(),
// //       "BondInterestBalance": bondInterestBalance.toString(),
// //       "InsurancePrincipalBal": iptBal.toString(),
// //       "InsuranceInterest Bal": iitBal.toString(),
// //     }
// //   }
//   console.log('Lend Completed')
//   // const dueBefore = await pairContract.dueOf(maturity,convenience.convenienceContract.address,13) //id :13

//   // console.log('due before', dueBefore.collateral);

//     feeBefore = feeAfter

//    // BORROW  TRANSACTION - signer18
//     // feeBefore = (await pairContract.feeStored(maturity)).toBigInt();
//     feeBefore = (await pairContract.fee()).toBigInt();
//     protFeeBefore = (await pairContract.protocolFeeStored()).toBigInt();
//     console.log('borrow percentage params',testCase.borrowGivenPercentParams);

//     const borrowGivenPercent = await borrowGivenPercentFixture(
//       lendGivenPercent,
//       signers[18],
//       testCase.borrowGivenPercentParams
//     )

//     let borrowEventFilter = await pairContract.filters.Borrow()
//     let borrowEvents = await pairContract.queryFilter(borrowEventFilter)
//     console.log('here borrow event', borrowEvents[0].args.dueOut)

//     protFeeAfter = (await pairContract.protocolFee()).toBigInt()
//     feeAfter = (await pairContract.feeStored(maturity)).toBigInt();


//     // const due = await pairContract.dueOf(maturity,convenience.convenienceContract.address,13) //id :13
//     // console.log('conv due', due);

//     // percent[signers[18].address] = {...percent[signers[18].address], ...{
//     //   // 'Liq burned': (beforeBurn - afterBurn).toString(),
//     //   'Liq left in Conv': (await pairContract.totalLiquidity(newLiquidity.maturity)).toString(),
//     //   'Debt in': due.debt.toString(),
//     //   'CollateralIn':due.collateral.toString(),
//     //   'signer': 18,
//     //   'address': signers[18].address,
//     //   }
//     // }

//     console.log('Borrow Completed')


//     console.log('>Pool matures, borrower defaults');
//     await advanceTime(Number(maturity))

//     //  console.log(percent)
//     //  console.log('liq addition done')


//      //Lender withdraws signers13
//      let beforeBurn = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()

//      beforeLiq = (await pairContract.totalLiquidity(borrowGivenPercent.maturity)).toBigInt()

//      let collect = await collectFixture(borrowGivenPercent, signers[13], testCase.collectParamsX)

//      let afterBurn = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()

//      afterLiq = (await pairContract.totalLiquidity(borrowGivenPercent.maturity)).toBigInt()
//     //  let burnE = await pairContract.queryFilter
//     //  console.log('BPT CLAIM',afterClaim.bondPrincipal.toBigInt()-beforeClaim.bondPrincipal.toBigInt());

//     let withdrawEventFilter = await pairContract.filters.Withdraw()
//     let withdrawEvents = await pairContract.queryFilter(withdrawEventFilter)
//      console.log("", withdrawEvents[0].args.tokensOut)
//     console.log('^^^^^^^^^^^^^^^^^^');
//      percent[signers[13].address] = {...percent[signers[13].address], ...{
//       'Liq burned': (beforeBurn - afterBurn).toString(),
//       'Liq left in Conv': (await pairContract.totalLiquidity(newLiquidity.maturity)).toString(),
//       // 'Asset Out': burnEvents[0].args.assetOut.toString(),
//       // 'Collateral Out': burnEvents[0].args.collateralOut.toString(),
//       'signer': 13,
//       'address': signers[13].address,


//   }}

//     // //all lenders withdraw signers14-17

//     // for(let i=0;i<4;i++){
//     //   let k = i+14
//     //  let beforeBurn = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()

//     //   beforeLiq = (await pairContract.totalLiquidity(borrowGivenPercent.maturity)).toBigInt()

//     //   collect = await collectFixture(collect,signers[k],testCase.collectParams[i])
//     //   afterLiq = (await pairContract.totalLiquidity(borrowGivenPercent.maturity)).toBigInt()
//     //  let afterBurn = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()

//     //  let burnEventFilter = await pairContract.filters.Withdraw()
//     //  let burnEvents = await pairContract.queryFilter(burnEventFilter)
//     //   // console.log("",burnEvents[i])

//     //   // console.log(lendBurnEvents[0].getBlock,lendBurnEvents[0].removeListener[0].removed)

//     //   console.log('>>>');

//     //   percent[signers[k].address] = {...percent[signers[k].address], ...{
//     //     'Liq burned': (beforeBurn - afterBurn).toString(),
//     //     'Liq left in Conv': (await pairContract.totalLiquidity(newLiquidity.maturity)).toString(),
//     //     'Asset Out': burnEvents[0].args.tokensOut.toString(),
//     //     // 'Collateral Out': burnEvents[0].args.collateralOut.toString(),
//     //     'signer': k,
//     //     'address': signers[k].address,

//     // }}
//     // }

//     // console.log('Collect Complete, all Lenders withdraw');

//      // Liquidity BURN signers19

//       beforeBurn = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()
//      let removeLiquidity = await removeLiquidityFixture(collect,signers[19],{liquidityIn: BigInt(percent[signers[19].address]["Liq Issued"])})
//       afterBurn = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()

//      let burnEventFilter = await pairContract.filters.Burn(null,null,signers[19].address)
//      let burnEvents = await pairContract.queryFilter(burnEventFilter)
//     //  console.log('burn event',burnEvents)
//     console.log('burn, aset collatral');
//      console.log(burnEvents[0].args.assetOut, burnEvents[0].args.collateralOut)
//     // events.forEach((event)=> {
//     //     if event
//     // })
//      percent[signers[19].address] = {...percent[signers[19].address], ...{
//          'Liq burned': (beforeBurn - afterBurn).toString(),
//          'Liq left in Conv': (await pairContract.totalLiquidity(newLiquidity.maturity)).toString(),
//          'Asset Out': burnEvents[0].args.assetOut.toString(),
//          'Collateral Out': burnEvents[0].args.collateralOut.toString(),
//          'signer': 19,
//          'address': signers[19].address
//      }}

//         //REPAY TRANSACTION  >E504
//     // const repay = await repayFixture(borrowGivenPercent,signers[17],{ids: [13n], maxAssetsIn: [BigInt(due.debt.toString())]})
//     // let repayEventFilter = await pairContract.filters.Pay(null,null,signers[17].address)
//     // let repayEvents = await pairContract.queryFilter(repayEventFilter)
//     // console.log(repayEvents)
//     // console.log('Repay Completed')

//     //  for(let i=0;i<testCase.addLiquidityParams.length;i++){
//     //     beforeBurn = (await pairContract.totalLiquidity(removeLiquidity.maturity)).toBigInt()
//     //     // console.log(percent[signers[i].address]["Liq Issued"])
//     //     // console.log(await liqTokenContract.balanceOf(signers[i].address))
//     //     removeLiquidity = await removeLiquidityFixture(removeLiquidity,signers[i],{liquidityIn: BigInt(percent[signers[i].address]["Liq Issued"])})

//     //     afterBurn = (await pairContract.totalLiquidity(newLiquidity.maturity)).toBigInt()

//     //     let burnEvent = await pairContract.filters.Burn(null,null,signers[i].address)
//     //     let bevents = await pairContract.queryFilter(burnEvent)
//     // //     console.log('>>');
//     // //     console.log('',i);
//     //  console.log('burn event',bevents)
//     // console.log('>burn, aset collatral');

//     //     console.log(bevents[0].args.assetOut, bevents[0].args.collateralOut)
//     //     percent[signers[i].address] = {...percent[signers[i].address], ...{
//     //         'Liq burned': (beforeBurn - afterBurn).toString(),
//     //         'Liq left in Conv': (await pairContract.totalLiquidity(newLiquidity.maturity)).toString(),
//     //         'Asset Out': bevents[0].args.assetOut.toBigInt().toString(),
//     //         'Collateral Out': bevents[0].args.collateralOut.toString(),
//     //         'signer': i,
//     //         'address': signers[i].address
//     //     }}
//     //     // console.log('',(beforeBurn - afterBurn).toString())
//     //     // console.log('>>');
//     //  }
//      console.log('Liquidity Tokens Burn Complete');
//     //  console.log('',await pairContract.conve);
//      console.log('feee stored ', ( await pairContract.fee()));
//      console.log('PROT feee stored ', ( await pairContract.protocolFeeStored()));

//      console.log(percent)

//     percent = Object.values(percent)
//     // if(ethers.BigNumber.isBigNumber(percent))percent.to
//     // console.log(JSON.stringify(percent))
//     // //  console.log(percent)
//      fs.writeFile('testLiq.json', JSON.stringify(percent),function(err) {
//         if (err) throw err;
//         console.log('complete');
//         })
//     })
//   })
// })

// // describe('Liquidity Given Asset ETH Asset', () => {
// //   testCases.forEach((testCase, index) => {
// //     it(`Succeeded ${index}`, async () => {
// //       const { maturity, convenience, assetToken, collateralToken } = await loadFixture(fixture)
// //       let currentTime = await now()

// //       const constructorFixture = await loadFixture(fixture)
// //       await setTime(Number(currentTime + 5000n))
// //       const newLiquidity = await newLiquidityETHAssetFixture(
// //         constructorFixture,
// //         signers[0],
// //         testCase.newLiquidityParams
// //       )
// //       await setTime(Number(currentTime + 10000n))
// //       const addLiquidity = await liquidityGivenAssetETHAssetFixture(
// //         newLiquidity,
// //         signers[0],
// //         testCase.liquidityGivenAssetParams
// //       )

// //       await addLiquidityProperties(
// //         testCase,
// //         currentTime,
// //         addLiquidity,
// //         convenience.wethContract.address,
// //         collateralToken.address
// //       )
// //     })
// //   })
// // })

// // describe('Liquidity Given Asset ETH Collateral', () => {
// //   testCases.forEach((testCase, index) => {
// //     it(`Succeeded ${index}`, async () => {
// //       const { maturity, convenience, assetToken, collateralToken } = await loadFixture(fixture)
// //       let currentTime = await now()

// //       const constructorFixture = await loadFixture(fixture)
// //       await setTime(Number(currentTime + 5000n))
// //       const newLiquidity = await newLiquidityETHCollateralFixture(
// //         constructorFixture,
// //         signers[0],
// //         testCase.newLiquidityParams
// //       )
// //       await setTime(Number(currentTime + 10000n))
// //       const addLiquidity = await liquidityGivenAssetETHCollateralFixture(
// //         newLiquidity,
// //         signers[0],
// //         testCase.liquidityGivenAssetParams
// //       )

// //       await addLiquidityProperties(
// //         testCase,
// //         currentTime,
// //         addLiquidity,
// //         assetToken.address,
// //         convenience.wethContract.address
// //       )
// //     })
// //   })
// // })

// async function addMultipleLiquidityProperties(
//   data: {
//     newLiquidityParams: {
//       assetIn: bigint
//       debtIn: bigint
//       collateralIn: bigint
//     }
//     liquidityGivenAssetParams: {
//       assetIn: bigint
//       minLiquidity: bigint
//       maxDebt: bigint
//       maxCollateral: bigint
//     }
//   },
//   currentTime: bigint,
//   fixture: {
//     convenience: Convenience
//     assetToken: TestToken
//     collateralToken: TestToken
//     maturity: bigint
//   },
//   assetAddress: string,
//   collateralAddress: string
// ) {
//   const result = fixture

//   const maybeNewMintParams = LiquidityMath.getNewLiquidityParams(
//     data.newLiquidityParams.assetIn,
//     data.newLiquidityParams.debtIn,
//     data.newLiquidityParams.collateralIn,
//     currentTime + 5_000n,
//     maturity
//   )
//   let { xIncreaseNewLiquidity, yIncreaseNewLiquidity, zIncreaseNewLiquidity } = {
//     xIncreaseNewLiquidity: 0n,
//     yIncreaseNewLiquidity: 0n,
//     zIncreaseNewLiquidity: 0n,
//   }
//   if (maybeNewMintParams != false) {
//     xIncreaseNewLiquidity = maybeNewMintParams.xIncreaseNewLiquidity
//     yIncreaseNewLiquidity = maybeNewMintParams.yIncreaseNewLiquidity
//     zIncreaseNewLiquidity = maybeNewMintParams.zIncreaseNewLiquidity
//   }

//   const state = {
//     x: xIncreaseNewLiquidity,
//     y: yIncreaseNewLiquidity,
//     z: zIncreaseNewLiquidity,
//   }
//   const { xIncreaseAddLiqudity, yIncreaseAddLiquidity, zIncreaseAddLiquidity } =
//     LiquidityMath.getLiquidityGivenAssetParams(state, data.liquidityGivenAssetParams.assetIn, 0n)
//   const delState = {
//     x: xIncreaseAddLiqudity,
//     y: yIncreaseAddLiquidity,
//     z: zIncreaseAddLiquidity,
//   }
//   const liquidityBalanceNew = LiquidityMath.getInitialLiquidity(xIncreaseNewLiquidity)

//   const maybeLiquidityBalanceAdd = LiquidityMath.getLiquidity(state, delState, currentTime + 10_000n, maturity)
//   let liquidityBalanceAdd = 0n

//   if (typeof maybeLiquidityBalanceAdd != 'string') {
//     liquidityBalanceAdd = maybeLiquidityBalanceAdd
//   }
//   const liquidityBalance = liquidityBalanceNew + liquidityBalanceAdd

//   const debt = LiquidityMath.getDebtAddLiquidity(
//     { x: xIncreaseAddLiqudity, y: yIncreaseAddLiquidity, z: zIncreaseAddLiquidity },
//     maturity,
//     currentTime + 10_000n
//   )
//   const collateral = LiquidityMath.getCollateralAddLiquidity(
//     { x: xIncreaseAddLiqudity, y: yIncreaseAddLiquidity, z: zIncreaseAddLiquidity },
//     maturity,
//     currentTime + 10_000n
//   )

//   const natives = await result.convenience.getNatives(assetAddress, collateralAddress, maturity)

//   const collateralizedDebtContract = CollateralizedDebt__factory.connect(natives.collateralizedDebt, ethers.provider)
//   const collateralizedDebtToken = await collateralizedDebtContract.dueOf(1)

//   const collateralBalanceContract = collateralizedDebtToken.collateral.toBigInt()
//   const debtBalanceContract = collateralizedDebtToken.debt.toBigInt()

//   expect(collateralBalanceContract).equalBigInt(collateral)
//   expect(debtBalanceContract).equalBigInt(debt)
// }

// async function lendGivenBondProperties(
//   data: {
//     newLiquidityParams: {
//       assetIn: bigint
//       debtIn: bigint
//       collateralIn: bigint
//     }
//     lendGivenBondParams: {
//       assetIn: bigint
//       bondOut: bigint
//       minInsurance: bigint
//     }
//   },
//   currentTime: bigint,
//   fixture: {
//     convenience: Convenience
//     assetToken: TestToken
//     collateralToken: TestToken
//     maturity: bigint
//   },
//   assetAddress: string,
//   collateralAddress: string
// ) {
//   const neededTime = (await now()) + 100n

//   const result = fixture

//   let [yIncreaseNewLiquidity, zIncreaseNewLiquidity] = [0n, 0n]
//   const maybeNewLiq = LiquidityMath.getNewLiquidityParams(
//     data.newLiquidityParams.assetIn,
//     data.newLiquidityParams.debtIn,
//     data.newLiquidityParams.collateralIn,
//     currentTime + 5_000n,
//     maturity
//   )
//   if (maybeNewLiq !== false) {
//     yIncreaseNewLiquidity = maybeNewLiq.yIncreaseNewLiquidity
//     zIncreaseNewLiquidity = maybeNewLiq.zIncreaseNewLiquidity
//   }

//   const state = {
//     x: data.newLiquidityParams.assetIn,
//     y: yIncreaseNewLiquidity,
//     z: zIncreaseNewLiquidity,
//   }
//   const { yDecrease: yDecreaseLendGivenBond, zDecrease: zDecreaseLendGivenBond } = LendMath.getLendGivenBondParams(
//     state,
//     FEE,
//     PROTOCOL_FEE,
//     maturity,
//     currentTime + 10_000n,
//     data.lendGivenBondParams.assetIn,
//     data.lendGivenBondParams.bondOut
//   )
//   const delState = { x: data.lendGivenBondParams.assetIn, y: yDecreaseLendGivenBond, z: zDecreaseLendGivenBond }
//   const bond = LendMath.getBond(delState, maturity, currentTime + 10_000n)
//   expect(bond).gteBigInt(data.lendGivenBondParams.bondOut)
// }
