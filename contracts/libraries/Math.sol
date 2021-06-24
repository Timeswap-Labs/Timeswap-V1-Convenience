// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

/// @title Math Library
/// @author Ricsson W. Ngo
library Math {
    function divUp(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x / y;
        if (x != z * y) z++;
    }

    function divDownAndUp(uint256 x, uint256 y) internal pure returns (uint256 w, uint256 z) {
        w = x / y;
        if (x == w * y) {
            z = w;
        } else {
            z = w + 1;
        }
    }
}
