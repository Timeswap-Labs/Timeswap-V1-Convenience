// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {IDue} from '../interfaces/IDue.sol';

library PayMath {
    function givenMaxAssetsIn(
        IDue collateralizedDebt,
        uint256[] memory ids,
        uint112[] memory maxAssetsIn
    ) internal returns (uint112[] memory assetsIn, uint112[] memory collateralsOut) {
        assetsIn = maxAssetsIn;
        for (uint256 i; i < ids.length; i++) {
            IPair.Due memory due = collateralizedDebt.dueOf(ids[i]);

            if (assetsIn[i] > due.debt) assetsIn[i] = due.debt;
            if (msg.sender == collateralizedDebt.ownerOf(ids[i]))
                collateralsOut[i] = (maxAssetsIn[i] * due.collateral) / due.debt;
        }
    }
}
