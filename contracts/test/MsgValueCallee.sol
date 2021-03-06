// SPDX-License-Identifier: UNLICENSED

pragma solidity =0.8.4;

import {SafeCast} from '@timeswap-labs/timeswap-v1-core/contracts/libraries/SafeCast.sol';
import {MsgValue} from '../libraries/MsgValue.sol';

contract MsgValueCallee {
    function getUint112() public payable {
        MsgValue.getUint112();
    }
}
