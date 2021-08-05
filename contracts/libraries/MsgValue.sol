// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {ETH} from './ETH.sol';
import {SafeCast} from './SafeCast.sol';

library MsgValue {
    using SafeCast for uint256;

    function getUint112() internal returns (uint128 value) {
        value = msg.value.truncateUint112();
        if (msg.value > value) ETH.transfer(payable(msg.sender), msg.value - value);
    }

    function getUint128() internal returns (uint128 value) {
        value = msg.value.truncateUint128();
        if (msg.value > value) ETH.transfer(payable(msg.sender), msg.value - value);
    }
}
