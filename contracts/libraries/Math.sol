// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

/// @title Math Library
/// @author Ricsson W. Ngo
library Math {
    function divUp(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x / y;
        if (x != z * y) z++;
    }
}
