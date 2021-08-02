// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {Math} from './Math.sol';
import {ConstantProduct} from './ConstantProduct.sol';
import {SafeCast} from './SafeCast.sol';

library LendMath {
    using Math for uint256;
    using ConstantProduct for IPair.State;
    using SafeCast for uint256;

    function givenBond(
        IPair pair,
        uint256 maturity,
        uint128 assetIn,
        uint128 bondOut
    ) internal view returns (uint128 interestDecrease, uint128 cdpDecrease) {
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

        uint256 cdpAdjust = state.calculate(state.reserves.asset + assetIn, interestAdjust);

        uint256 _cdpDecrease = state.cdp;
        _cdpDecrease -= cdpAdjust;
        _cdpDecrease <<= 16;
        _cdpDecrease /= feeBase;
        cdpDecrease = _cdpDecrease.toUint128();
    }
}
