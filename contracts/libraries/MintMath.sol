// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {SafeCast} from './SafeCast.sol';

library MintMath {
    using SafeCast for uint256;

    function givenNew(
        uint256 maturity,
        uint128 assetIn,
        uint112 debtOut,
        uint112 collateralIn
    ) internal returns (uint112 interestIncrease, uint112 cdpIncrease) {
        uint256 _interestIncrease = debtOut;
        _interestIncrease -= assetIn;
        _interestIncrease <<= 32;
        _interestIncrease /= maturity - block.timestamp; // div Up?
        interestIncrease = _interestIncrease.toUint112();

        uint256 _cdpIncrease = collateralIn;
        uint256 denominator = maturity;
        denominator -= block.timestamp;
        denominator *= interestIncrease;
        denominator += uint256(assetIn) << 32;
        _cdpIncrease *= assetIn;
        _cdpIncrease <<= 32;
        _cdpIncrease /= denominator; // shift Up?
        cdpIncrease = _cdpIncrease.toUint112();
    }

    function givenAdd(
        IPair pair,
        uint256 maturity,
        uint128 assetIn
    ) internal returns (uint112 interestIncrease, uint112 cdpIncrease) {}
}
