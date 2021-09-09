// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {Math} from '@timeswap-labs/timeswap-v1-core/contracts/libraries/Math.sol';
import {FullMath} from './FullMath.sol';
import {ConstantProduct} from './ConstantProduct.sol';
import {SafeCast} from '@timeswap-labs/timeswap-v1-core/contracts/libraries/SafeCast.sol';

library BorrowMath {
    using Math for uint256;
    using FullMath for uint256;
    using ConstantProduct for IPair;
    using ConstantProduct for ConstantProduct.CP;
    using SafeCast for uint256;

    function givenDebt(
        IPair pair,
        uint256 maturity,
        uint112 assetOut,
        uint112 debtIn
    ) internal view returns (uint112 yIncrease, uint112 zIncrease) {
        uint256 feeBase = 0x10000 - pair.fee();

        ConstantProduct.CP memory cp = pair.get(maturity);

        uint256 _yIncrease = debtIn;
        _yIncrease -= assetOut;
        _yIncrease <<= 32;
        _yIncrease /= maturity - block.timestamp;
        yIncrease = _yIncrease.toUint112();

        uint256 yAdjust = cp.y;
        yAdjust <<= 16;
        yAdjust += _yIncrease * feeBase;

        uint256 zAdjust = cp.calculate(cp.x - assetOut, yAdjust);

        uint256 _zIncrease = zAdjust;
        _zIncrease -= uint256(cp.z) << 16;
        _zIncrease = _zIncrease.divUp(feeBase);
        zIncrease = _zIncrease.toUint112();
    }

    function givenCollateral(
        IPair pair,
        uint256 maturity,
        uint112 assetOut,
        uint112 collateralIn
    ) internal view returns (uint112 yIncrease, uint112 zIncrease) {
        uint256 feeBase = 0x10000 - pair.fee();

        ConstantProduct.CP memory cp = pair.get(maturity);

        uint256 subtrahend = maturity;
        subtrahend -= block.timestamp;
        subtrahend *= cp.y;
        subtrahend += uint256(cp.x) << 32;
        uint256 denominator = cp.x;
        denominator -= assetOut;
        denominator *= uint256(cp.x) << 32;
        subtrahend = subtrahend.mulDivUp(assetOut * cp.z, denominator);

        uint256 _zIncrease = collateralIn;
        _zIncrease -= subtrahend;
        zIncrease = _zIncrease.toUint112();

        uint256 zAdjust = cp.z;
        zAdjust <<= 16;
        zAdjust += _zIncrease * feeBase;

        uint256 yAdjust = cp.calculate(cp.x - assetOut, zAdjust);

        uint256 _yIncrease = yAdjust;
        _yIncrease -= uint256(cp.y) << 16;
        _yIncrease = _yIncrease.divUp(feeBase);
        yIncrease = _yIncrease.toUint112();
    }

    function givenPercent(
        IPair pair,
        uint256 maturity,
        uint112 assetOut,
        uint40 percent
    ) internal view returns (uint112 yIncrease, uint112 zIncrease) {
        uint256 feeBase = 0x10000 - pair.fee();

        ConstantProduct.CP memory cp = pair.get(maturity);

        uint256 minimum = assetOut;
        minimum *= cp.y;
        minimum /= (uint256(cp.x) - assetOut) << 4;

        uint256 yAdjust = cp.x;
        yAdjust *= cp.y;
        yAdjust <<= 16;
        yAdjust /= cp.x - assetOut;

        uint256 maximum = yAdjust;
        maximum -= uint256(cp.y) << 16;
        maximum = maximum.divUp(feeBase);

        uint256 _yIncrease = maximum;
        _yIncrease -= minimum;
        _yIncrease *= percent;
        _yIncrease += minimum << 32;
        _yIncrease >>= 32;
        yIncrease = _yIncrease.toUint112();

        yAdjust = cp.y;
        yAdjust <<= 16;
        yAdjust += _yIncrease * feeBase;

        uint256 zAdjust = cp.calculate(cp.x - assetOut, yAdjust);

        uint256 _zIncrease = zAdjust;
        _zIncrease -= uint256(cp.z) << 16;
        _zIncrease = _zIncrease.divUp(feeBase);
        zIncrease = _zIncrease.toUint112();
    }

    function getCollateral(
        IPair pair,
        uint256 maturity,
        uint112 assetOut,
        uint112 zIncrease
    ) internal view returns (uint112 collateralIn) {
        ConstantProduct.CP memory cp = pair.get(maturity);

        uint256 _collateralIn = maturity;
        _collateralIn -= block.timestamp;
        _collateralIn *= cp.y;
        _collateralIn += uint256(cp.x) << 32;
        uint256 denominator = cp.x;
        denominator -= assetOut;
        denominator *= uint256(cp.x) << 32;
        _collateralIn = _collateralIn.mulDivUp(uint256(assetOut) * cp.z, denominator);
        _collateralIn += zIncrease;
        collateralIn = _collateralIn.toUint112();
    }
}
