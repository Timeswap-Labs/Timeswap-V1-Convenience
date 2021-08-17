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
import {MsgValue} from './MsgValue.sol';
import {ETH} from './ETH.sol';

library Pay {
    using SafeTransfer for IERC20;

    function pay(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IPay.Repay memory params
    ) external returns (uint128 collateralOut) {
        uint128 debtToBePaid; 
        for (uint256 i; i < params.ids.length; i++) debtToBePaid += params.maxDebtsIn[i];
        collateralOut = _pay(
            natives,
            factory,
            IPay._Repay(
                params.asset,
                params.collateral,
                params.maturity,
                params.collateralTo,
                params.ids,
                params.maxDebtsIn,
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
        uint128 assetIn = MsgValue.getUint112();
        uint128 debtToBePaid;
        for (uint256 i = 0; i < params.ids.length; i++) debtToBePaid += params.maxDebtsIn[i];
        weth.deposit{value: debtToBePaid}();
        collateralOut = _pay(
            natives,
            factory,
            IPay._Repay(
                weth,
                params.collateral,
                params.maturity,
                params.collateralTo,
                params.ids,
                params.maxDebtsIn,
                debtToBePaid,
                params.deadline
            )
        );

        if (assetIn - collateralOut > 0) ETH.transfer(payable(msg.sender), assetIn - debtToBePaid);
    }

    function payETHCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IPay.RepayETHCollateral memory params
    ) external returns (uint128 collateralOut) {
        require(params.deadline >= block.timestamp, 'Expired');

        uint128 debtToBePaid;
        for (uint256 i; i < params.ids.length; i++) debtToBePaid += params.maxDebtsIn[i];

        collateralOut = _pay(
            natives,
            factory,
            IPay._Repay(
                params.asset,
                weth,
                params.maturity,
                params.collateralTo,
                params.ids,
                params.maxDebtsIn,
                debtToBePaid,
                params.deadline
            )
        );

        if (collateralOut > 0) {
            weth.withdraw(collateralOut);
            ETH.transfer(params.collateralTo, collateralOut);
        }
    }

    function _pay(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IPay._Repay memory params
    ) private returns (uint128 collateralOut) {
        require(params.deadline >= block.timestamp, 'Expired');

        IPair pair = factory.getPair(params.asset, params.collateral); 
        require(address(pair) != address(0), 'Zero');

        IDue collateralizedDebt = natives[params.asset][params.collateral][params.maturity].collateralizedDebt;
        require(address(collateralizedDebt)!=address(0),'Zero');

        (uint112[] memory collateralsOut, uint112[] memory debtsIn) = _getCollateralAndDebt(collateralizedDebt,params.ids,params.maxDebtsIn);
        

        IERC20(params.asset).safeTransferFrom(msg.sender, pair, params.assetIn);
        collateralOut = collateralizedDebt.burn(msg.sender, params.collateralTo, params.ids,debtsIn, collateralsOut);
    }

    function _getCollateralAndDebt( IDue collateralizedDebt,
                                    uint256[] memory ids,
                                    uint112[] memory maxDebtsIn
    ) private returns(uint112[] memory collateralsOut, uint112[] memory debtsIn){
        debtsIn = maxDebtsIn;
        for(uint256 i;i<ids.length;i++){
            IPair.Due memory due = collateralizedDebt.dueOf(ids[i]);
            if(msg.sender==collateralizedDebt.ownerOf(ids[i])){
                collateralsOut[i]=maxDebtsIn[i]*due.collateral/due.debt;
            }
            if(maxDebtsIn[i]>=due.debt){
                debtsIn[i] = due.debt;
            }
        }
    }

}