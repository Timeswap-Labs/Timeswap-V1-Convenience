// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {Math} from './Math.sol';
import {FullMath} from './FullMath.sol';
import {ConstantProduct} from './ConstantProduct.sol';
import {SafeCast} from './SafeCast.sol';

library LendMath {
    using Math for uint256;
    using FullMath for uint256;
    using ConstantProduct for IPair.State;
    using SafeCast for uint256;

    function givenBond(
        IPair pair,
        uint256 maturity,
        uint112 assetIn,
        uint128 bondOut
    ) internal view returns (uint112 interestDecrease, uint112 cdpDecrease) {
        uint256 feeBase = 0x10000 + pair.fee();

        IPair.State memory state = pair.state(maturity);

        uint256 _interestDecrease = bondOut;
        _interestDecrease -= assetIn;
        _interestDecrease <<= 32;
        _interestDecrease.divUp(maturity - block.timestamp);
        interestDecrease = _interestDecrease.toUint112();

        uint256 interestAdjust = state.interest;
        interestAdjust <<= 16;
        interestAdjust -= _interestDecrease * feeBase;

        uint256 cdpAdjust = state.getConstantProduct(state.asset + assetIn, interestAdjust);

        uint256 _cdpDecrease = state.cdp;
        _cdpDecrease <<= 16;
        _cdpDecrease -= cdpAdjust;
        _cdpDecrease /= feeBase;
        cdpDecrease = _cdpDecrease.toUint112();
    }

    function givenInsurance(
        IPair pair,
        uint256 maturity,
        uint112 assetIn,
        uint128 insuranceOut
    ) internal view returns (uint112 interestDecrease, uint112 cdpDecrease) {
        uint256 feeBase = 0x10000 + pair.fee();

        IPair.State memory state = pair.state(maturity);

        uint256 subtrahend = maturity;
        subtrahend -= block.timestamp;
        subtrahend *= state.interest;
        subtrahend += uint256(state.asset) << 32;
        uint256 denominator = state.asset;
        denominator += assetIn;
        denominator *= uint256(state.asset) << 32;
        subtrahend = subtrahend.mulDiv(assetIn * state.cdp, denominator);

        uint256 _cdpDecrease = insuranceOut;
        _cdpDecrease -= subtrahend;
        cdpDecrease = _cdpDecrease.toUint112();

        uint256 cdpAdjust = state.cdp;
        cdpAdjust <<= 16;
        cdpAdjust -= cdpDecrease * feeBase;

        uint256 interestAdjust = state.getConstantProduct(state.asset + assetIn, cdpAdjust);

        uint256 _interestDecrease = state.interest;
        _interestDecrease <<= 16;
        _interestDecrease -= interestAdjust;
        _interestDecrease /= feeBase;
        interestDecrease = _interestDecrease.toUint112();
    }
}
