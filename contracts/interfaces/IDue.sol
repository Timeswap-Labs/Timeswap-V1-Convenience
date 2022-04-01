// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity =0.8.4;

import {IERC721Permit} from './IERC721Permit.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';

/// @author Ricsson W. Ngo
interface IDue is IERC721Permit {
    // VIEW

    function convenience() external returns (address);

    function pair() external returns (IPair);

    function maturity() external returns (uint256);

    function dueOf(uint256 id) external returns (IPair.Due memory);

    // UPDATE

    function mint(address to, uint256 id) external;
}
