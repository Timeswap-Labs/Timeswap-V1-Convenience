// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IFactory} from '../interfaces/IFactory.sol';
import {IWETH} from '../interfaces/IWETH.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {IPair} from '../interfaces/IPair.sol';
import {IWithdraw} from '../interfaces/IWithdraw.sol';
import {ETH} from './ETH.sol';

library Withdraw {
    function collect(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWithdraw.Collect calldata params
    ) external returns (IPair.Tokens memory tokensOut) {
        tokensOut = collectBothERC20(natives, factory, params);
    }

    function collectETHAsset(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IWithdraw.CollectETHAsset calldata params
    ) external returns (IPair.Tokens memory tokensOut) {
        tokensOut = collectBothERC20(
            natives,
            factory,
            IWithdraw.Collect(
                weth,
                params.collateral,
                params.maturity,
                address(this),
                params.collateralTo,
                params.claimsIn
            )
        );

        if (tokensOut.asset > 0) {
            weth.withdraw(tokensOut.asset);
            ETH.transfer(params.assetTo, tokensOut.asset);
        }
    }

    function collectETHCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IWithdraw.CollectETHCollateral calldata params
    ) external returns (IPair.Tokens memory tokensOut) {
        tokensOut = collectBothERC20(
            natives,
            factory,
            IWithdraw.Collect(params.asset, weth, params.maturity, params.assetTo, address(this), params.claimsIn)
        );

        if (tokensOut.collateral > 0) {
            weth.withdraw(tokensOut.collateral);
            ETH.transfer(params.collateralTo, tokensOut.collateral);
        }
    }

    function collectBothERC20(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWithdraw.Collect memory params
    ) private returns (IPair.Tokens memory tokensOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        IConvenience.Native memory native = natives[params.asset][params.collateral][params.maturity];
        require(address(native.liquidity) == address(0), 'Forbidden');

        if (params.claimsIn.bond > 0)
            tokensOut.asset = native.bond.burn(msg.sender, params.assetTo, params.claimsIn.bond);
        if (params.claimsIn.insurance > 0)
            tokensOut.collateral = native.insurance.burn(msg.sender, params.collateralTo, params.claimsIn.insurance);
    }
}
