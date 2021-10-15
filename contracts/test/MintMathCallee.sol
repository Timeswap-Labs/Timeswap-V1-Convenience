// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {MintMath} from '../libraries/MintMath.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';

contract MintMathCallee{
     function givenNew(
        uint256 maturity,
        uint112 assetIn,
        uint112 debtIn,
        uint112 collateralIn
    ) view public returns (uint112, uint112){
        return MintMath.givenNew(maturity,assetIn,debtIn,collateralIn);
    }
     function givenAdd(
        IPair pair,
        uint256 maturity,
        uint112 assetIn
    ) public view returns (uint112, uint112) {
        return MintMath.givenAdd(pair,maturity,assetIn);
    }   
}