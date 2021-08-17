// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC721Metadata} from './IERC721Metadata.sol';
import {IConvenience} from './IConvenience.sol';
import {IPair} from './IPair.sol';

/// @author Ricsson W. Ngo
interface IDue is IERC721Metadata {
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
        uint112[] memory debtIn,
        uint112[] memory collateralsOut
    ) external returns (uint128 collateralOut);
}
