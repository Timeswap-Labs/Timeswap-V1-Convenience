// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {Math} from "./Math.sol";

library ConstantProduct {
    using Math for uint256;

    function calculate(
        uint256 a,
        uint256 b,
        uint256 c,
        uint256 d
    ) internal pure returns (uint256 result) {
        result = mulDivUp(a, b, c);
        result = result.divUp(d);
    }
    
    function mulDiv(
        uint256 a,
        uint256 b,
        uint256 denominator
    ) private pure returns (uint256 result) {
        uint256 prod0;
        uint256 prod1;
        assembly {
            let mm := mulmod(a, b, not(0))
            prod0 := mul(a,b)
            prod1 := sub(sub(mm, prod0), lt(mm, prod0))
        }

        if (prod1 == 0) {
            require (denominator > 0);
            assembly {
                result := div(prod0, denominator)
            }
            return result;
        }

        require(denominator > prod1);

        uint256 remainder;
        assembly {
            remainder := mulmod(a, b, denominator)
        }

        assembly {
            prod1 := sub(prod1, gt(remainder, prod0))
            prod0 := sub(prod0, remainder)
        }

        uint256 twos;
        unchecked {
            twos = (type(uint256).max - denominator + 1) & denominator;
        }
        assembly {
            denominator := div(denominator, twos)
        }

        assembly {
            prod0 := div(prod0, twos)
        }

        assembly {
            twos := add(div(sub(0, twos), twos), 1)
        }
        prod0 |= prod1 * twos;

        uint256 inv;
        unchecked {
            inv = (3 * denominator) ^ 2;

            inv *= 2 - denominator * inv;
            inv *= 2 - denominator * inv;
            inv *= 2 - denominator * inv;
            inv *= 2 - denominator * inv;
            inv *= 2 - denominator * inv;
            inv *= 2 - denominator * inv;
        }

        result = prod0 * inv;
        return result;
    }

    function mulDivUp(
        uint256 a,
        uint256 b,
        uint256 denominator
    ) private pure returns (uint256 result) {
        result = mulDiv(a, b, denominator);
        if (mulmod(a, b, denominator) > 0) {
            require(result < type(uint256).max);
            result++;
        }
    }
}