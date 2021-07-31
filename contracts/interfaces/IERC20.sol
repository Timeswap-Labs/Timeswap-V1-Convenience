// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

/// @title ERC20 Interface
/// @author Ricsson W. Ngo
interface IERC20 {
    /* ===== VIEW ===== */

    function totalSupply() external view returns (uint256);

    function balanceOf(address _owner) external view returns (uint256);

    function transfer(address to, uint256 amount) external view returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external view returns (bool);
}
