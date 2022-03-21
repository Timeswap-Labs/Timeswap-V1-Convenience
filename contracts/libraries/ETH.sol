// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity =0.8.4;

library ETH {
    function transfer(address payable to, uint256 amount) internal {
        (bool success, ) = to.call{value: amount}('');
        require(success, 'E521');
    }
}
