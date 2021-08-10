// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IPair} from '../interfaces/IPair.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {Liquidity} from '../Liquidity.sol';
import {Bond} from '../Bond.sol';
import {Insurance} from '../Insurance.sol';
import {CollateralizedDebt} from '../CollateralizedDebt.sol';

interface IDeploy {
    function deploy(
        IConvenience convenience,
        IPair pair,
        IERC20 asset,
        IERC20 collateral,
        uint256 maturity
    ) external returns (IConvenience.Native memory);
}
