// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20Metadata} from './IERC20Metadata.sol';
import {IConvenience} from './IConvenience.sol';
import {IPair} from './IPair.sol';

/// @author Ricsson W. Ngo
interface ILiquidity is IERC20Metadata {
    // VIEW

    function convenience() external returns (IConvenience);

    function pair() external returns (IPair);

    function maturity() external returns (uint256);

    // UPDATE

    function mint(address to, uint256 amount) external;

    function burn(
        address from,
        address assetTo,
        address collateralTo,
        uint256 amount
    ) external returns (IPair.Tokens memory tokensOut);
}
