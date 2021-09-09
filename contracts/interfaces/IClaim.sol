// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20Permit} from './IERC20Permit.sol';
import {INative} from './INative.sol';

/// @author Ricsson W. Ngo
interface IClaim is IERC20Permit, INative {
    // UPDATE

    function mint(address to, uint128 amount) external;

    function burn(
        address from,
        address to,
        uint128 amount
    ) external returns (uint128 tokenOut);
}
