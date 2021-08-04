// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';

library MintMath {
    function givenNew(
        uint256 maturity,
        uint128 assetIn,
        uint112 debtOut,
        uint112 collateralIn
    ) internal returns (uint128 interestIncrease, uint128 cdpIncrease) {}

    function givenAdd(
        IPair pair,
        uint256 maturity,
        uint128 assetIn
    ) internal returns (uint128 interestIncrease, uint128 cdpIncrease) {}
}
