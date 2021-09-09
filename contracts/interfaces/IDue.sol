// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC721Permit} from './IERC721Permit.sol';
import {INative} from './INative.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {ITimeswapPayCallback} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/callback/ITimeswapPayCallback.sol';

/// @author Ricsson W. Ngo
interface IDue is IERC721Permit, ITimeswapPayCallback {
    function dueOf(uint256 id) external returns (IPair.Due memory);

    // UPDATE

    function mint(address to, uint256 id) external;

    function burn(
        address from,
        address to,
        uint256[] memory ids,
        uint112[] memory debtIn,
        uint112[] memory collateralsOut,
        bytes calldata data
    ) external returns (uint128 assetIn, uint128 collateralOut);
}
