// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

interface IDebt {
    function mint(address to, uint256 id) external;

    function burn(
        address from,
        address to,
        uint256[] memory ids,
        uint112[] memory assetsPay
    ) external returns (uint128 collateralOut);
}
