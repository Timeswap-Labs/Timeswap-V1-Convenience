// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IFactory} from '../interfaces/IFactory.sol';
import {IPair} from '../interfaces/IPair.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {CollateralizedDebt} from '../CollateralizedDebt.sol';

interface IDeployNatives {

    struct Deploy{
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        uint256 deadline;
    }

}
