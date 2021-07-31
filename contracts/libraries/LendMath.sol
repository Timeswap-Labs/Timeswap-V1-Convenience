// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {SafeCast} from './SafeCast.sol';
import {Math} from './Math.sol';
import {ConstantProduct} from './ConstantProduct.sol';

library LendMath {
    using Math for uint256;
    using SafeCast for uint256;

    function fromBond(
        IPair pair,
        uint256 maturity,
        uint128 assetIn,
        uint128 bondOut
    ) internal returns (uint128 interestDecrease, uint128 cdpDecrease) {
        uint256 feeBase = 0x0000 + pair.fee();
        uint256 duration = maturity - block.timestamp;

        IPair.State memory state = pair.state(maturity);

        uint256 _interestDecrease = bondOut;
        _interestDecrease -= assetIn;
        _interestDecrease <<= 32;
        _interestDecrease /= duration;
        interestDecrease = _interestDecrease.toUint128();

        uint256 interestAdjust = state.interest;
        interestAdjust <<= 16;
        interestAdjust -= _interestDecrease * feeBase;
        interestAdjust >>= 16;
        interestAdjust = interestAdjust.toUint128();

        // fix
    }
}
