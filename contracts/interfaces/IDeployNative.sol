// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IFactory} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IFactory.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';import {CollateralizedDebt} from '../CollateralizedDebt.sol';

interface IDeployNative {
    struct Deploy {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        uint256 deadline;
    }
}
