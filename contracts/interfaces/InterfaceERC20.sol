// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

/// @title ERC20 Interface
/// @author Ricsson W. Ngo
interface InterfaceERC20 {
    /* ===== VIEW ===== */

    function totalSupply() external view returns (uint256);

    function balanceOf(address _owner) external view returns (uint256);
}
