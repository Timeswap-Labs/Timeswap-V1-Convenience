// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {ConstantProduct} from '../libraries/ConstantProduct.sol';

contract ConstantProductCallee {


    function get(IPair pair,uint256 maturity) public view returns(ConstantProduct.CP memory){
        return ConstantProduct.get(pair,maturity);
    }
          
}