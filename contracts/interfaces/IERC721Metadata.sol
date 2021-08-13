// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC721} from './IERC721.sol';

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function tokenURI(uint256 id) external view returns (string memory);

    function assetDecimals() external view returns (uint8);

    function collateralDecimals() external view returns (uint8);
}
