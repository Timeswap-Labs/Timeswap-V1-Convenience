// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {FullMath} from './FullMath.sol';

library ConstantProduct {
    using FullMath for uint256;

    struct CP {
        uint112 x;
        uint112 y;
        uint112 z;
    }

    function get(IPair pair, uint256 maturity) internal view returns (CP memory cp) {
        (uint112 x, uint112 y, uint112 z) = pair.constantProduct(maturity);
        cp = CP(x, y, z);
    }

    function calculate(
        CP memory cp,
        uint256 denominator1,
        uint256 denominator2
    ) internal pure returns (uint256 result) {
        result = ((uint256(cp.y) * cp.z) << 32).mulDivUp(cp.x, denominator1 * denominator2);
    }
}
