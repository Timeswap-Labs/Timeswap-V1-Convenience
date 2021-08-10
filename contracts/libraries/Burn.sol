// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IFactory} from '../interfaces/IFactory.sol';
import {IWETH} from '../interfaces/IWETH.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {IPair} from '../interfaces/IPair.sol';
import {IBurn} from '../interfaces/IBurn.sol';
import {ETH} from './ETH.sol';

library Burn {
    function removeLiquidity(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IBurn.RemoveLiquidity calldata params
    ) external returns (IPair.Tokens memory tokensOut) {
        tokensOut = removeLiquidityBothERC20(natives, factory, params);
    }

    function removeLiquidityETHAsset(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IBurn.RemoveLiquidityETHAsset calldata params
    ) external returns (IPair.Tokens memory tokensOut) {
        tokensOut = removeLiquidityBothERC20(
            natives,
            factory,
            IBurn.RemoveLiquidity(
                weth,
                params.collateral,
                params.maturity,
                address(this),
                params.collateralTo,
                params.liquidityIn
            )
        );

        if (tokensOut.asset > 0) {
            weth.withdraw(tokensOut.asset);
            ETH.transfer(params.assetTo, tokensOut.asset);
        }
    }

    function removeLiquidityETHCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IBurn.RemoveLiquidityETHCollateral calldata params
    ) external returns (IPair.Tokens memory tokensOut) {
        tokensOut = removeLiquidityBothERC20(
            natives,
            factory,
            IBurn.RemoveLiquidity(
                params.asset,
                weth,
                params.maturity,
                params.assetTo,
                address(this),
                params.liquidityIn
            )
        );

        if (tokensOut.collateral > 0) {
            weth.withdraw(tokensOut.collateral);
            ETH.transfer(params.collateralTo, tokensOut.collateral);
        }
    }

    function removeLiquidityBothERC20(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IBurn.RemoveLiquidity memory params
    ) private returns (IPair.Tokens memory tokensOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        IConvenience.Native memory native = natives[params.asset][params.collateral][params.maturity];
        require(address(native.liquidity) == address(0), 'Forbidden');

        tokensOut = native.liquidity.burn(msg.sender, params.assetTo, params.collateralTo, params.liquidityIn);
    }
}
