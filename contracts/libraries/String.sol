// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

library String {
    function toString(uint256 i) internal pure returns (string memory str) {
        if (i == 0) {
            return '0';
        }

        uint256 j = i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }

        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + (j % 10)));
            j /= 10;
        }

        str = string(bstr);
    }
}