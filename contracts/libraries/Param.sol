// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IERC20} from '../interfaces/IERC20.sol';

library Param {
    function toParameter(IConvenience.ETHAsset memory ethAsset, IERC20 weth)
        internal
        pure
        returns (IConvenience.Parameter memory)
    {
        return IConvenience.Parameter(weth, ethAsset.collateral, ethAsset.maturity);
    }

    function toParameter(IConvenience.ETHCollateral memory ethCollateral, IERC20 weth)
        internal
        pure
        returns (IConvenience.Parameter memory)
    {
        return IConvenience.Parameter(ethCollateral.asset, weth, ethCollateral.maturity);
    }
}
