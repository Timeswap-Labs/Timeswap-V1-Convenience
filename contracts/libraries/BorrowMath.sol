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
        uint112 debtOut
    ) internal view returns (uint112 interestIncrease, uint112 cdpIncrease) {
        uint256 feeBase = 0x10000 - pair.fee();

        IPair.State memory state = pair.state(maturity);

        uint256 _interestIncrease = debtOut;
        _interestIncrease -= assetOut;
        _interestIncrease <<= 32; // shift up?
        _interestIncrease /= maturity - block.timestamp; // divUp?
        interestIncrease = _interestIncrease.toUint112();

        // interestIncrease = uint128[((debtOut - assetOut)*2^32/duration)=>uint256]

        uint256 interestAdjust = state.interest;
        interestAdjust <<= 16;
        interestAdjust += _interestIncrease * feeBase;
        interestAdjust >>= 16;
        interestAdjust = interestAdjust.toUint128();
        // interestAdjust = Interest + interestIncrease*2^16*baseFee

        uint256 cdpAdjust = state.calculate(state.asset - assetOut, interestAdjust);

        uint256 _cdpIncrease = cdpAdjust;
        _cdpIncrease -= state.cdp;
        _cdpIncrease <<= 16;
        _cdpIncrease /= feeBase; // Should divUp
        cdpIncrease = _cdpIncrease.toUint112();
    }

    function givenCollateral(
        IPair pair,
        uint256 maturity,
        uint128 assetOut,
        uint128 collateralLocked
    ) internal view returns (uint112 interestIncrease, uint112 cdpIncrease) {
        //TODO Math is to be reworked to prevent the loss of precision while dividing

        uint256 feeBase = 0x10000 - pair.fee();

        IPair.State memory state = pair.state(maturity);

        uint256 _assetReserve = state.asset;
        uint256 _cdpReserve = state.cdp;
        uint256 _interestReserve = state.interest;

        uint256 assetBalanceMulAsset = (_assetReserve - assetOut) * _assetReserve;

        uint256 _cdpIncrease = maturity - block.timestamp;
        _cdpIncrease *= _interestReserve;
        _cdpIncrease += _assetReserve;
        _cdpIncrease *= assetOut;
        _cdpIncrease *= _cdpReserve;
        _cdpIncrease /= assetBalanceMulAsset;
        _cdpIncrease = collateralLocked - _cdpIncrease;
        _cdpIncrease <<= 16;
        _cdpIncrease /= feeBase;
        cdpIncrease = _cdpIncrease.toUint112();

        uint256 _interestIncrease = state.calculate(_assetReserve - assetOut, _cdpReserve + cdpIncrease);
        _interestIncrease -= _interestReserve;
        _interestIncrease <<= 16;
        _interestIncrease /= feeBase;
        interestIncrease = _interestIncrease.toUint112();
    }

    function getCollateral(
        IPair pair,
        uint256 maturity,
        uint128 assetOut,
        uint112 cdpIncrease
    ) internal view returns (uint112 collateralIn) {
        IPair.State memory state = pair.state(maturity);

        uint256 _collateralIn = maturity;
        _collateralIn -= block.timestamp;
        _collateralIn *= state.interest;
        _collateralIn = _collateralIn.shiftUp(32);
        _collateralIn += state.asset;
        uint256 denominator = state.asset;
        denominator -= assetOut;
        denominator *= state.asset;
        _collateralIn = _collateralIn.mulDiv(uint256(assetOut) * state.cdp, denominator);
        _collateralIn += cdpIncrease;
        collateralIn = _collateralIn.toUint112();
    }
}
