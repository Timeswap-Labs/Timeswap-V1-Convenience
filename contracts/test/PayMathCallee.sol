// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {PayMath} from '../libraries/PayMath.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {IDue} from '../interfaces/IDue.sol';

contract PayMathCallee{
     function givenMaxAssetsIn(
         IDue collateralizedDebt,
        uint256[] memory ids,
        uint112[] memory maxAssetsIn
    )  public returns (uint112[] memory, uint112[] memory){
        return PayMath.givenMaxAssetsIn(collateralizedDebt, ids, maxAssetsIn);
    }
}