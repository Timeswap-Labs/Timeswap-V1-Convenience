// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {Math} from '@timeswap-labs/timeswap-v1-core/contracts/libraries/Math.sol';
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
        uint112 assetOut,
        uint112 debtOut
    ) internal view returns (uint112 interestIncrease, uint112 cdpIncrease) {
        uint256 feeBase = 0x10000 - pair.fee();

        IPair.State memory state = pair.state(maturity);

        uint256 _interestIncrease = debtOut;
        _interestIncrease -= assetOut;
        _interestIncrease <<= 32;
        _interestIncrease /= maturity - block.timestamp;
        interestIncrease = _interestIncrease.toUint112();

        uint256 interestAdjust = state.interest;
        interestAdjust <<= 16;
        interestAdjust += _interestIncrease * feeBase;

        uint256 cdpAdjust = state.getConstantProduct(state.asset - assetOut, interestAdjust);

        uint256 _cdpIncrease = cdpAdjust;
        _cdpIncrease -= uint256(state.cdp) << 16;
        _cdpIncrease = _cdpIncrease.divUp(feeBase);
        cdpIncrease = _cdpIncrease.toUint112();
    }

    function givenCollateral(
        IPair pair,
        uint256 maturity,
        uint112 assetOut,
        uint112 collateralIn
    ) internal view returns (uint112 interestIncrease, uint112 cdpIncrease) {
        uint256 feeBase = 0x10000 - pair.fee();

        IPair.State memory state = pair.state(maturity);

        uint256 subtrahend = maturity;
        subtrahend -= block.timestamp;
        subtrahend *= state.interest;
        subtrahend += uint256(state.asset) << 32;
        uint256 denominator = state.asset;
        denominator -= assetOut;
        denominator *= uint256(state.asset) << 32;
        subtrahend = subtrahend.mulDivUp(assetOut * state.cdp, denominator);

        uint256 _cdpIncrease = collateralIn;
        _cdpIncrease -= subtrahend;
        cdpIncrease = _cdpIncrease.toUint112();

        uint256 cdpAdjust = state.cdp;
        cdpAdjust <<= 16;
        cdpAdjust += _cdpIncrease * feeBase;

        uint256 interestAdjust = state.getConstantProduct(state.asset - assetOut, cdpAdjust);

        uint256 _interestIncrease = interestAdjust;
        _interestIncrease -= uint256(state.interest) << 16;
        _interestIncrease = _interestIncrease.divUp(feeBase);
        interestIncrease = _interestIncrease.toUint112();
    }

    function givenPercent(
        IPair pair,
        uint256 maturity,
        uint112 assetOut,
        uint40 percent
    ) internal view returns (uint112 interestIncrease, uint112 cdpIncrease) {
        uint256 feeBase = 0x10000 - pair.fee();

        IPair.State memory state = pair.state(maturity);

        uint256 minimum = assetOut;
        minimum *= state.interest;
        minimum /= (uint256(state.asset) - assetOut) << 4;

        uint256 interestAdjust = state.asset;
        interestAdjust *= state.interest;
        interestAdjust <<= 16;
        interestAdjust /= state.asset - assetOut;

        uint256 maximum = interestAdjust;
        maximum -= uint256(state.interest) << 16;
        maximum = maximum.divUp(feeBase);

        uint256 _interestIncrease = maximum;
        _interestIncrease -= minimum;
        _interestIncrease *= percent;
        _interestIncrease += minimum << 32;
        _interestIncrease >>= 32;
        interestIncrease = _interestIncrease.toUint112();

        interestAdjust = state.interest;
        interestAdjust <<= 16;
        interestAdjust += _interestIncrease * feeBase;

        uint256 cdpAdjust = state.getConstantProduct(state.asset - assetOut, interestAdjust);

        uint256 _cdpIncrease = cdpAdjust;
        _cdpIncrease -= uint256(state.cdp) << 16;
        _cdpIncrease = _cdpIncrease.divUp(feeBase);
        cdpIncrease = _cdpIncrease.toUint112();
    }

    function getCollateral(
        IPair pair,
        uint256 maturity,
        uint112 assetOut,
        uint112 cdpIncrease
    ) internal view returns (uint112 collateralIn) {
        IPair.State memory state = pair.state(maturity);

        uint256 _collateralIn = maturity;
        _collateralIn -= block.timestamp;
        _collateralIn *= state.interest;
        _collateralIn += uint256(state.asset) << 32;
        uint256 denominator = state.asset;
        denominator -= assetOut;
        denominator *= uint256(state.asset) << 32;
        _collateralIn = _collateralIn.mulDivUp(uint256(assetOut) * state.cdp, denominator);
        _collateralIn += cdpIncrease;
        collateralIn = _collateralIn.toUint112();
    }
}
