// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IFactory} from '../interfaces/IFactory.sol';
import {IWETH} from '../interfaces/IWETH.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {IERC721} from '../interfaces/IERC721.sol';
import {IPair} from '../interfaces/IPair.sol';
import {IPay} from '../interfaces/IPay.sol';
import {IDue} from '../interfaces/IDue.sol';
import {SafeTransfer} from './SafeTransfer.sol';
import {Deploy} from './Deploy.sol'; // No need
import {MsgValue} from './MsgValue.sol';
import {ETH} from './ETH.sol';

library Pay {
    using SafeTransfer for IERC20;
    using Deploy for IConvenience.Native; // No need

    function pay(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IPay.Repay memory params
    ) external returns (uint128 collateralOut) {
        uint112 debtToBePaid; // totalDebtIn ? // Should be uint128
        for (uint256 i = 0; i < params.ids.length; i++) debtToBePaid += params.debtsIn[i]; // no need for i = 0
        collateralOut = _pay(
            natives,
            factory,
            IPay._Repay(
                params.asset,
                params.collateral,
                params.maturity,
                params.owner,
                params.assetFrom,
                params.collateralTo,
                params.ids,
                params.debtsIn,
                debtToBePaid,
                params.deadline
            )
        );
    }

    function payETHAsset(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IPay.RepayETHAsset memory params
    ) external returns (uint128 collateralOut) {
        uint112 assetIn = MsgValue.getUint112(); // Should be uint128
        uint112 debtToBePaid; // Should be uint128
        for (uint256 i = 0; i < params.ids.length; i++) debtToBePaid += params.debtsIn[i];
        weth.deposit{value: debtToBePaid}(); // do we need the require?

        collateralOut = _pay(
            natives,
            factory,
            IPay._Repay(
                weth,
                params.collateral,
                params.maturity,
                params.owner,
                params.assetFrom,
                params.collateralTo,
                params.ids,
                params.debtsIn,
                debtToBePaid,
                params.deadline
            )
        );

        if (assetIn - collateralOut > 0) ETH.transfer(payable(msg.sender), assetIn - collateralOut); // assetIn - totalDebtsIn
    }

    function payETHCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IPay.RepayETHCollateral memory params
    ) external returns (uint128 collateralOut) {
        require(params.deadline >= block.timestamp, 'Expired');

        uint112 debtToBePaid; // Should be uint128
        for (uint256 i = 0; i < params.ids.length; i++) debtToBePaid += params.debtsIn[i]; // no n eed for i =0

        collateralOut = _pay(
            natives,
            factory,
            IPay._Repay(
                params.asset,
                weth,
                params.maturity,
                params.owner,
                params.assetFrom,
                params.collateralTo,
                params.ids,
                params.debtsIn,
                debtToBePaid,
                params.deadline
            )
        );

        if (collateralOut > 0) {
            weth.withdraw(collateralOut);
            ETH.transfer(payable(params.owner), collateralOut); // should be collateralTo no need to wrap payable
        }
    }

    function _pay(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IPay._Repay memory params
    ) private returns (uint128 collateralOut) {
        IDue collateralizedDebt = natives[params.asset][params.collateral][params.maturity].collateralizedDebt; // Need check for existence // move this after get pair for code consistency // third
        // Safety check require(not zero address)

        IPair pair = factory.getPair(params.asset, params.collateral); // seoncd
        require(address(pair) != address(0), 'Zero');
        require(params.deadline >= block.timestamp, 'Expired'); // first
        IERC20(params.asset).safeTransferFrom(params.assetFrom, pair, params.assetIn);
        collateralOut = collateralizedDebt.burn(params.owner, params.collateralTo, params.ids, params.debtsIn);
    }
}