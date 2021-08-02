// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {Math} from './Math.sol';
import {FullMath} from './FullMath.sol';

library ConstantProduct {
    using Math for uint256;
    using FullMath for uint256;

    function calculate(
        uint256 x,
        uint256 yz,
        uint256 denominator1,
        uint256 denominator2
    ) internal pure returns (uint256 result) {
        result = x.mulDivUp(yz, denominator1);
        result = result.divUp(denominator2);
    }

    function calculate(
        IPair.State memory state,
        uint256 denominator1,
        uint256 denominator2
    ) internal pure returns (uint256 result) {
        result = (uint256(state.interest) * state.cdp).mulDivUp(state.reserves.asset, denominator1);
        result = result.divUp(denominator2);
    }
}
