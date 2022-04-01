// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity =0.8.4;

import {IERC20Permit} from './IERC20Permit.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';

/// @author Ricsson W. Ngo
interface IClaim is IERC20Permit {
    // VIEW

    function convenience() external returns (address);

    function pair() external returns (IPair);

    function maturity() external returns (uint256);

    // UPDATE

    function mint(address to, uint128 amount) external;

    function burn(address from, uint128 amount) external;
}
