// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {Math} from './Math.sol';
import {FullMath} from './FullMath.sol';
import {ConstantProduct} from './ConstantProduct.sol';
import {SafeCast} from './SafeCast.sol';

library BorrowMath {
    using Math for uint256;
    using FullMath for uint256;
    using ConstantProduct for IPair.State;
    using SafeCast for uint256;

    function givenDebt(
        IPair pair,
        uint256 maturity,
        uint128 assetOut,
        uint128 debtOut
    ) internal view returns (uint128 interestIncrease, uint128 cdpIncrease) {
        uint256 feeBase = 0x10000 - pair.fee();

        IPair.State memory state = pair.state(maturity);

        uint256 _interestIncrease = debtOut;
        _interestIncrease -= assetOut;
        _interestIncrease <<= 32; // shift up?
        _interestIncrease /= maturity - block.timestamp; // divUp?
        interestIncrease = _interestIncrease.toUint128();

        uint256 interestAdjust = state.interest;
        interestAdjust <<= 16;
        interestAdjust += _interestIncrease * feeBase;
        interestAdjust >>= 16;
        interestAdjust = interestAdjust.toUint128();

        uint256 cdpAdjust = state.calculate(state.reserves.asset - assetOut, interestAdjust);

        uint256 _cdpIncrease = cdpAdjust;
        _cdpIncrease -= state.cdp;
        _cdpIncrease <<= 16;
        _cdpIncrease /= feeBase; // Should divUp
        cdpIncrease = _cdpIncrease.toUint128();
    }

    function getCollateral(
        IPair pair,
        uint256 maturity,
        uint128 assetOut,
        uint128 cdpIncrease
    ) internal view returns (uint112 collateralIn) {
        IPair.State memory state = pair.state(maturity);

        uint256 _collateralIn = maturity;
        _collateralIn -= block.timestamp;
        _collateralIn *= state.interest;
        _collateralIn = _collateralIn.shiftUp(32);
        _collateralIn += state.reserves.asset;
        uint256 denominator = state.reserves.asset;
        denominator -= assetOut;
        denominator *= state.reserves.asset;
        _collateralIn = _collateralIn.mulDiv(uint256(assetOut) * state.cdp, denominator);
        _collateralIn += cdpIncrease;
        collateralIn = _collateralIn.toUint112();
    }
}
