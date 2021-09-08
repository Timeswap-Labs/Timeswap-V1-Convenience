// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {Math} from '@timeswap-labs/timeswap-v1-core/contracts/libraries/Math.sol';
import {FullMath} from './FullMath.sol';
import {ConstantProduct} from './ConstantProduct.sol';
import {SafeCast} from '@timeswap-labs/timeswap-v1-core/contracts/libraries/SafeCast.sol';

library LendMath {
    using Math for uint256;
    using FullMath for uint256;
    using ConstantProduct for IPair;
    using ConstantProduct for ConstantProduct.CP;
    using SafeCast for uint256;

    function givenBond(
        IPair pair,
        uint256 maturity,
        uint112 assetIn,
        uint128 bondOut
    ) internal view returns (uint112 yDecrease, uint112 zDecrease) {
        uint256 feeBase = 0x10000 + pair.fee();

        ConstantProduct.CP memory cp = pair.get(maturity);

        uint256 _yDecrease = bondOut;
        _yDecrease -= assetIn;
        _yDecrease <<= 32;
        _yDecrease.divUp(maturity - block.timestamp);
        yDecrease = _yDecrease.toUint112();

        uint256 yAdjust = cp.y;
        yAdjust <<= 16;
        yAdjust -= _yDecrease * feeBase;

        uint256 zAdjust = cp.calculate(cp.x + assetIn, yAdjust);

        uint256 _zDecrease = cp.z;
        _zDecrease <<= 16;
        _zDecrease -= zAdjust;
        _zDecrease /= feeBase;
        zDecrease = _zDecrease.toUint112();
    }

    function givenInsurance(
        IPair pair,
        uint256 maturity,
        uint112 assetIn,
        uint128 insuranceOut
    ) internal view returns (uint112 yDecrease, uint112 zDecrease) {
        uint256 feeBase = 0x10000 + pair.fee();

        ConstantProduct.CP memory cp = pair.get(maturity);

        uint256 subtrahend = maturity;
        subtrahend -= block.timestamp;
        subtrahend *= cp.y;
        subtrahend += uint256(cp.x) << 32;
        uint256 denominator = cp.x;
        denominator += assetIn;
        denominator *= uint256(cp.x) << 32;
        subtrahend = subtrahend.mulDiv(assetIn * cp.z, denominator);

        uint256 _zDecrease = insuranceOut;
        _zDecrease -= subtrahend;
        zDecrease = _zDecrease.toUint112();

        uint256 zAdjust = cp.z;
        zAdjust <<= 16;
        zAdjust -= zDecrease * feeBase;

        uint256 interestAdjust = cp.calculate(cp.x + assetIn, zAdjust);

        uint256 _yDecrease = cp.y;
        _yDecrease <<= 16;
        _yDecrease -= interestAdjust;
        _yDecrease /= feeBase;
        yDecrease = _yDecrease.toUint112();
    }

    function givenPercent(
        IPair pair,
        uint256 maturity,
        uint112 assetIn,
        uint40 percent
    ) internal view returns (uint112 yDecrease, uint112 zDecrease) {
        uint256 feeBase = 0x10000 + pair.fee();

        ConstantProduct.CP memory cp = pair.get(maturity);

        uint256 minimum = assetIn;
        minimum *= cp.y;
        minimum /= (uint256(cp.x) + assetIn) << 4;

        uint256 yAdjust = cp.x;
        yAdjust *= cp.y;
        yAdjust <<= 16;
        yAdjust /= cp.x + assetIn;

        uint256 maximum = cp.y;
        maximum <<= 16;
        maximum -= yAdjust;
        maximum /= feeBase;

        uint256 _yDecrease = maximum;
        _yDecrease -= minimum;
        _yDecrease *= percent;
        _yDecrease += minimum << 32;
        _yDecrease >>= 32;
        yDecrease = _yDecrease.toUint112();

        yAdjust = cp.y;
        yAdjust <<= 16;
        yAdjust -= _yDecrease * feeBase;

        uint256 cdpAdjust = cp.calculate(cp.x + assetIn, yAdjust);

        uint256 _zDecrease = cp.z;
        _zDecrease <<= 16;
        _zDecrease -= cdpAdjust;
        _zDecrease /= feeBase;
        zDecrease = _zDecrease.toUint112();
    }
}
