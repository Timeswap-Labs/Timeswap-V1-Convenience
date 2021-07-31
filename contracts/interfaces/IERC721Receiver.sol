// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

/// @title ERC721 Receiver Interface
/// @author Ricsson W. Ngo
interface IERC721Receiver {
    /* ===== UPDATE ===== */

    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes calldata _data
    ) external pure returns (bytes4);
}
