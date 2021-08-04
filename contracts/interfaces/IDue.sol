// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC721} from './IERC721.sol';
import {IConvenience} from './IConvenience.sol';
import {IPair} from './IPair.sol';

/// @author Ricsson W. Ngo
interface IDue is IERC721 {
    // VIEW

    function convenience() external returns (IConvenience);

    function pair() external returns (IPair);

    function maturity() external returns (uint256);

    function dueOf(uint256 id) external returns (IPair.Due memory);

    // UPDATE

    function mint(address to, uint256 id) external;

    function burn(
        address from,
        address to,
        uint256[] memory ids,
        uint112[] memory assetsPay
    ) external returns (uint128 collateralOut);
}
