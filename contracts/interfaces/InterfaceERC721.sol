// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

/// @title ERC721 Interface
/// @author Ricsson W. Ngo
interface InterfaceERC721 {

    /* ===== VIEW ===== */

    function ownerOf(uint256 _tokenId) external view returns (address);

    /* ===== UPDATE ===== */

    function safeTransferFrom(address _from, address _to, uint256 _tokenId) external;
}
