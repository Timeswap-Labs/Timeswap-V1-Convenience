// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20Permit} from './IERC20Permit.sol';
import {INative} from './INative.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';

/// @author Ricsson W. Ngo
interface ILiquidity is IERC20Permit {
    function mint(address to, uint256 amount) external;

    function burn(
        address from,
        address assetTo,
        address collateralTo,
        uint256 amount
    ) external returns (IPair.Tokens memory tokensOut);
}
