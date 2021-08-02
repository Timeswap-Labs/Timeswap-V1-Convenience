// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from './IERC20.sol';
import {IConvenience} from './IConvenience.sol';
import {IPair} from './IPair.sol';

/// @author Ricsson W. Ngo
interface IClaim is IERC20 {
    // VIEW

    function convenience() external returns (IConvenience);

    function pair() external returns (IPair);

    function maturity() external returns (uint256);

    // UPDATE

    function mint(address to, uint128 amount) external;

    function burn(
        address from,
        address to,
        uint128 amount
    ) external returns (uint128 tokenOut);
}
