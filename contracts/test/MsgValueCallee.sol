// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {SafeCast} from '@timeswap-labs/timeswap-v1-core/contracts/libraries/SafeCast.sol';
import {MsgValue} from '../libraries/MsgValue.sol';
contract MsgValueCallee{
    function getUint112() payable public{
        MsgValue.getUint112();
    }
}