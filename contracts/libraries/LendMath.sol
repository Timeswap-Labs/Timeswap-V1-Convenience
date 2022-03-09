// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {Math} from '@timeswap-labs/timeswap-v1-core/contracts/libraries/Math.sol';
import {SquareRoot} from './SquareRoot.sol';
import {FullMath} from '@timeswap-labs/timeswap-v1-core/contracts/libraries/FullMath.sol';
import {ConstantProduct} from './ConstantProduct.sol';
import {SafeCast} from '@timeswap-labs/timeswap-v1-core/contracts/libraries/SafeCast.sol';
import 'hardhat/console.sol';
library LendMath {
    using Math for uint256;
    using SquareRoot for uint256;
    using FullMath for uint256;
    using ConstantProduct for IPair;
    using ConstantProduct for ConstantProduct.CP;
    using SafeCast for uint256;

    uint256 private constant BASE = 0x10000000000;

    function givenBond(
        IPair pair,
        uint256 maturity,
        uint112 assetIn,
        uint128 bondOut
    )
        internal
        view
        returns (
            uint112 xIncrease,
            uint112 yDecrease,
            uint112 zDecrease
        )
    {
        console.log('!!!!!!SMARTCONTRACT BEGINS!!!!!!!!!');
        ConstantProduct.CP memory cp = pair.get(maturity);
        console.log('maturity',maturity);
        console.log('currentTime',block.timestamp);
        xIncrease = getX(pair, maturity, assetIn);
        console.log('xIncrease',xIncrease);
        uint256 xReserve = cp.x;
        xReserve += xIncrease;
        console.log('xReserve',xReserve);
          console.log('bond Out',bondOut);
        uint256 _yDecrease = bondOut;
          console.log('_yDecrease 1',_yDecrease);

        _yDecrease -= xIncrease;
          console.log('_yDecrease 2',_yDecrease);

        _yDecrease <<= 32;
        console.log('yDecrease',_yDecrease);
        uint256 denominator = maturity;
        denominator -= block.timestamp;
        console.log('denominator',denominator);
        _yDecrease = _yDecrease.divUp(denominator);
        yDecrease = _yDecrease.toUint112();
        console.log('yDecreae',_yDecrease);
        uint256 yReserve = cp.y;
        yReserve -= _yDecrease;
        console.log('yReserve',yReserve);
        uint256 zReserve = cp.x;
        zReserve *= cp.y;
        console.log('zReserve',zReserve);
        denominator = xReserve;
        denominator *= yReserve;
        console.log('denominator',denominator);
        zReserve = zReserve.mulDivUp(cp.z, denominator);
        console.log('zReserve',zReserve);
        uint256 _zDecrease = cp.z;
        _zDecrease -= zReserve;
        zDecrease = _zDecrease.toUint112();
        console.log('zDecrease',zDecrease);
          console.log('!!!!!!!!!!!!SMARTCONTRAACT ENDS!!!!!!!!!!!!!!!!');

    }

    function givenInsurance(
        IPair pair,
        uint256 maturity,
        uint112 assetIn,
        uint128 insuranceOut
    )
        internal
        view
        returns (
            uint112 xIncrease,
            uint112 yDecrease,
            uint112 zDecrease
        )
    {
        ConstantProduct.CP memory cp = pair.get(maturity);

        xIncrease = getX(pair, maturity, assetIn);
        console.log('xIncrease',xIncrease);
        uint256 xReserve = cp.x;
        xReserve += xIncrease;

        uint256 _zDecrease = insuranceOut;
        _zDecrease *= xReserve;
        uint256 subtrahend = cp.z;
        subtrahend *= xIncrease;
        _zDecrease -= subtrahend;
        _zDecrease <<= 25;
        uint256 denominator = maturity;
        denominator -= block.timestamp;
        denominator *= xReserve;
        _zDecrease = _zDecrease.divUp(denominator);
        zDecrease = _zDecrease.toUint112();

        uint256 zReserve = cp.z;
        zReserve -= _zDecrease;

        uint256 yReserve = cp.x;
        yReserve *= cp.z;
        denominator = xReserve;
        denominator *= zReserve;
        yReserve = yReserve.mulDivUp(cp.y, denominator);

        uint256 _yDecrease = cp.y;
        _yDecrease -= yReserve;
        yDecrease = _yDecrease.toUint112();
        console.log(yDecrease,zDecrease);
    }

    function givenPercent(
        IPair pair,
        uint256 maturity,
        uint112 assetIn,
        uint40 percent
    )
        internal
        view
        returns (
            uint112 xIncrease,
            uint112 yDecrease,
            uint112 zDecrease
        )
    {
        ConstantProduct.CP memory cp = pair.get(maturity);

        xIncrease = getX(pair, maturity, assetIn);

        uint256 xReserve = cp.x;
        xReserve += xIncrease;

        if (percent <= 0x80000000) {
            uint256 yMid = cp.y;
            uint256 subtrahend = cp.y;
            subtrahend *= cp.y;
            subtrahend = subtrahend.mulDivUp(cp.x, xReserve);
            subtrahend = subtrahend.sqrtUp();
            yMid -= subtrahend;

            uint256 _yDecrease = yMid;
            _yDecrease *= percent;
            _yDecrease >>= 31;
            yDecrease = _yDecrease.toUint112();

            uint256 yReserve = cp.y;
            yReserve -= _yDecrease;

            uint256 zReserve = cp.x;
            zReserve *= cp.y;
            uint256 denominator = xReserve;
            denominator *= yReserve;
            zReserve = zReserve.mulDivUp(cp.z, denominator);

            uint256 _zDecrease = cp.z;
            _zDecrease -= zReserve;
            zDecrease = _zDecrease.toUint112();
        } else {
            percent = 0x100000000 - percent;

            uint256 zMid = cp.z;
            uint256 subtrahend = cp.z;
            subtrahend *= cp.z;
            subtrahend = subtrahend.mulDivUp(cp.x, xReserve);
            subtrahend = subtrahend.sqrtUp();
            zMid -= subtrahend;

            uint256 _zDecrease = zMid;
            _zDecrease *= percent;
            _zDecrease >>= 31;
            zDecrease = _zDecrease.toUint112();

            uint256 zReserve = cp.z;
            zReserve -= _zDecrease;

            uint256 yReserve = cp.x;
            yReserve *= cp.z;
            uint256 denominator = xReserve;
            denominator *= zReserve;
            yReserve = yReserve.mulDivUp(cp.y, denominator);

            uint256 _yDecrease = cp.y;
            _yDecrease -= yReserve;
            yDecrease = _yDecrease.toUint112();
        }
    }

    function getX(
        IPair pair,
        uint256 maturity,
        uint112 assetIn
    ) private view returns (uint112 xIncrease) {
        // uint256 duration = maturity;
        // duration -= block.timestamp;

        uint256 totalFee = pair.fee();
        totalFee += pair.protocolFee();

        uint256 denominator = maturity;
        denominator -= block.timestamp;
        denominator *= totalFee;
        denominator += BASE;

        uint256 _xIncrease = assetIn;
        _xIncrease *= BASE;
        _xIncrease /= denominator;
        xIncrease = _xIncrease.toUint112();

        // uint256 denominator = duration;
        // denominator *= pair.fee();
        // denominator += BASE;

        // uint256 _xIncrease = assetIn;
        // _xIncrease *= BASE;
        // _xIncrease /= denominator;

        // denominator = duration;
        // denominator *= pair.protocolFee();
        // denominator += BASE;

        // _xIncrease *= BASE;
        // _xIncrease /= denominator;
        // xIncrease = _xIncrease.toUint112();
    }
}
