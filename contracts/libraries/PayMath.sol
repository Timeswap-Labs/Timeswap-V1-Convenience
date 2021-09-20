// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {IDue} from '../interfaces/IDue.sol';
import {SafeCast} from '@timeswap-labs/timeswap-v1-core/contracts/libraries/SafeCast.sol';

library PayMath {
    using SafeCast for uint256;

    function givenMaxAssetsIn(
        IDue collateralizedDebt,
        uint256[] memory ids,
        uint112[] memory maxAssetsIn
    ) internal returns (uint112[] memory assetsIn, uint112[] memory collateralsOut) {
        assetsIn = maxAssetsIn;
        collateralsOut = new uint112[](ids.length);

        for (uint256 i; i < ids.length; i++) {
            IPair.Due memory due = collateralizedDebt.dueOf(ids[i]);

            if (assetsIn[i] > due.debt) assetsIn[i] = due.debt;
            if (msg.sender == collateralizedDebt.ownerOf(ids[i])) {
                uint256 _collateralOut = assetsIn[i];
                _collateralOut *= due.collateral;
                _collateralOut /= due.debt;
                collateralsOut[i] = _collateralOut.toUint112();
            } 
        }
    }
}
