// SPDX-License-Identifier: BUSL-1.1

pragma solidity =0.8.4;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IFactory} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IFactory.sol';
import {IWETH} from '../interfaces/IWETH.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {IPay} from '../interfaces/IPay.sol';
import {IDue} from '../interfaces/IDue.sol';
import {PayMath} from './PayMath.sol';
import {MsgValue} from './MsgValue.sol';
import {ETH} from './ETH.sol';

library Pay {
    using PayMath for IPair;

    function pay(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IPay.Repay memory params,
        address from
    ) external returns (uint128 assetIn, uint128 collateralOut) {
        (assetIn, collateralOut) = _pay(
            natives,
            IPay._Repay(
                factory,
                params.asset,
                params.collateral,
                params.maturity,
                from,
                params.collateralTo,
                params.ids,
                params.maxAssetsIn,
                params.deadline
            )
        );
    }

    function payETHAsset(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IPay.RepayETHAsset memory params,
        address from
    ) external returns (uint128 assetIn, uint128 collateralOut) {
        uint128 maxAssetIn = MsgValue.getUint112();

        (assetIn, collateralOut) = _pay(
            natives,
            IPay._Repay(
                factory,
                weth,
                params.collateral,
                params.maturity,
                from,
                params.collateralTo,
                params.ids,
                params.maxAssetsIn,
                params.deadline
            )
        );

        if (maxAssetIn > assetIn) {
            uint256 excess = maxAssetIn;
            unchecked {
                excess -= assetIn;
            }
            ETH.transfer(payable(from), excess);
        }
    }

    function payETHCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IPay.RepayETHCollateral memory params,
        address from
    ) external returns (uint128 assetIn, uint128 collateralOut) {
        (assetIn, collateralOut) = _pay(
            natives,
            IPay._Repay(
                factory,
                params.asset,
                weth,
                params.maturity,
                from,
                address(this),
                params.ids,
                params.maxAssetsIn,
                params.deadline
            )
        );

        if (collateralOut != 0) {
            weth.withdraw(collateralOut);
            ETH.transfer(params.collateralTo, collateralOut);
        }
    }

    function _pay(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IPay._Repay memory params
    ) private returns (uint128 assetIn, uint128 collateralOut) {
        require(params.deadline >= block.timestamp, 'E504');
        require(params.maturity > block.timestamp, 'E508');
        require(params.ids.length == params.maxAssetsIn.length, '520');

        IPair pair = params.factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'E501');

        IDue collateralizedDebt = natives[params.asset][params.collateral][params.maturity].collateralizedDebt;
        require(address(collateralizedDebt) != address(0), 'E502');

        (uint112[] memory assetsIn, uint112[] memory collateralsOut) = pair.givenMaxAssetsIn(
            params.maturity,
            collateralizedDebt,
            params.ids,
            params.maxAssetsIn,
            params.from
        );

        (assetIn, collateralOut) = pair.pay(
            IPair.PayParam(
                params.maturity,
                params.collateralTo,
                address(this),
                params.ids,
                assetsIn,
                collateralsOut,
                bytes(abi.encode(params.asset, params.collateral, params.from, params.maturity))
            )
        );
    }
}
