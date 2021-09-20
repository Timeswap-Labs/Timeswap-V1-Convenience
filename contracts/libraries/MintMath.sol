// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {Math} from '@timeswap-labs/timeswap-v1-core/contracts/libraries/Math.sol';
import {ConstantProduct} from './ConstantProduct.sol';
import {SafeCast} from '@timeswap-labs/timeswap-v1-core/contracts/libraries/SafeCast.sol';

library MintMath {
    using Math for uint256;
    using ConstantProduct for IPair;
    using SafeCast for uint256;

    function givenNew(
        uint256 maturity,
        uint112 assetIn,
        uint112 debtIn,
        uint112 collateralIn
    ) internal view returns (uint112 yIncrease, uint112 zIncrease) {
        uint256 _yIncrease = debtIn;
        _yIncrease -= assetIn;
        _yIncrease <<= 32;
        _yIncrease /= maturity - block.timestamp;
        yIncrease = _yIncrease.toUint112();

        uint256 denominator = maturity;
        denominator -= block.timestamp;
        denominator *= yIncrease;
        denominator += uint256(assetIn) << 33;
        uint256 _zIncrease = collateralIn;
        _zIncrease *= assetIn;
        _zIncrease <<= 32;
        _zIncrease /= denominator;
        zIncrease = _zIncrease.toUint112();
    }

    function givenAdd(
        IPair pair,
        uint256 maturity,
        uint112 assetIn
    ) internal view returns (uint112 yIncrease, uint112 zIncrease) {
        ConstantProduct.CP memory cp = pair.get(maturity);

        uint256 _yIncrease = cp.y;
        _yIncrease *= assetIn;
        _yIncrease /= cp.x;
        yIncrease = _yIncrease.toUint112();

        uint256 _zIncrease = cp.z;
        _zIncrease *= assetIn;
        _zIncrease /= cp.x;
        zIncrease = _zIncrease.toUint112();
    }
}
