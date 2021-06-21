// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceERC721} from "./InterfaceERC721.sol";
import {InterfaceTimeswapPool} from "./InterfaceTimeswapPool.sol";

/// @title Timeswap ERC721 Interface
/// @author Ricsson W. Ngo
interface InterfaceTimeswapERC721 is InterfaceERC721 {
    /* ===== VIEW ===== */

    function collateralizedDebtOf(uint256 _tokenId) external view returns (uint128 _debt, uint128 _collateral);

    function totalSupply() external view returns (uint256);
}
