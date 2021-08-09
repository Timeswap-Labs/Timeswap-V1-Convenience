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
    ) internal view returns (uint112 interestDecrease, uint112 cdpDecrease) {
        uint256 feeBase = 0x10000 + pair.fee();
        uint256 duration = maturity - block.timestamp;

        IPair.State memory state = pair.state(maturity);

        uint256 _interestDecrease = bondOut;
        _interestDecrease -= assetIn;
        _interestDecrease <<= 32;
        _interestDecrease /= duration;
        interestDecrease = _interestDecrease.toUint112();

        uint256 interestAdjust = state.interest;
        interestAdjust <<= 16;
        interestAdjust -= _interestDecrease * feeBase;
        interestAdjust >>= 16;
        interestAdjust = interestAdjust.toUint128();

        uint256 cdpAdjust = state.calculate(state.asset + assetIn, interestAdjust);

        uint256 _cdpDecrease = state.cdp;
        _cdpDecrease -= cdpAdjust;
        _cdpDecrease <<= 16;
        _cdpDecrease /= feeBase;
        cdpDecrease = _cdpDecrease.toUint112();
    }

    function givenInsurance(
        IPair pair,
        uint256 maturity,
        uint128 assetIn,
        uint128 insuranceOut
    ) internal view returns (uint112 interestDecrease, uint112 cdpDecrease) {
        uint256 feeBase = 0x10000 + pair.fee();
        uint256 duration = maturity - block.timestamp;

        IPair.State memory state = pair.state(maturity);

        uint256 _r = state.asset;
        _r += state.interest * duration;
        _r /= state.asset;

        uint256 _cdpDecrease = state.asset;
        _cdpDecrease *= state.cdp;
        _cdpDecrease /= (state.asset + assetIn);
        _cdpDecrease = state.cdp - _cdpDecrease;
        _cdpDecrease *= _r;
        _cdpDecrease = insuranceOut - _cdpDecrease;
        _cdpDecrease <<= 16;
        _cdpDecrease /= feeBase;
        cdpDecrease = _cdpDecrease.toUint112();

        uint256 cdpAdjust = state.cdp;
        cdpAdjust -= cdpDecrease;

        uint256 interestAdjust = state.calculate(state.asset + assetIn, cdpAdjust);

        uint256 _interestDecrease = state.interest;
        _interestDecrease -= interestAdjust;
        _interestDecrease <<= 16;
        _interestDecrease /= feeBase;
        interestDecrease = _interestDecrease.toUint112();
    }
}
