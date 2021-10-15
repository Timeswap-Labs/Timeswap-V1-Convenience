// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {ETH} from '../libraries/ETH.sol';

contract ETHCallee{
    function transfer(address payable to, uint256 amount) public{
    ETH.transfer(to, amount);
    }
}