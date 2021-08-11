// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from './IERC20.sol';
import {IPair} from './IPair.sol';
import {IWETH} from './IWETH.sol';

interface IBorrow {
    struct _Borrow {
        IPair pair;
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address from;
        address assetTo;
        address dueTo;
        uint112 assetOut;
        uint112 collateralIn;
        uint112 interestIncrease;
        uint112 cdpIncrease;
        uint256 deadline;
    }

    // No need to IWETH weth anymore as we already know the amount to deposit
    struct _BorrowGivenCollateral {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address from;
        address assetTo;
        address dueTo;
        uint112 assetOut;
        uint112 collateralIn;
        uint112 maxDebt;
        IWETH weth;
        uint256 deadline;
    }

    struct BorrowGivenCollateral {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address assetTo;
        address dueTo;
        uint112 assetOut;
        uint112 collateralIn;
        uint112 maxDebt;
        uint256 deadline;
    }

    struct BorrowGivenCollateralETHAsset {
        IERC20 collateral;
        uint256 maturity;
        address assetTo; // make it payable
        address dueTo;
        uint112 assetOut;
        uint112 collateralIn;
        uint112 maxDebt;
        uint256 deadline;
    }

    // Remove collateralIn as it is the msg.value = collateralIn
    struct BorrowGivenCollateralETHCollateral {
        IERC20 asset;
        uint256 maturity;
        address assetTo;
        address dueTo;
        uint112 assetOut;
        uint112 collateralIn;
        uint112 maxDebt;
        uint256 deadline;
    }

    // Move the IWETH weth to in between debtIn and maxCollateral
    struct _BorrowGivenDebt {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address from;
        address assetTo;
        address dueTo;
        uint112 assetOut;
        uint112 debtIn;
        uint112 maxCollateral;
        IWETH weth;
        uint256 deadline;
    }

    struct BorrowGivenDebt {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address assetTo;
        address dueTo;
        uint112 assetOut;
        uint112 debtIn;
        uint112 maxCollateral;
        uint256 deadline;
    }

    struct BorrowGivenDebtETHAsset {
        IERC20 collateral;
        uint256 maturity;
        address assetTo; // make it payable
        address dueTo;
        uint112 assetOut;
        uint112 debtIn;
        uint112 maxCollateral;
        uint256 deadline;
    }

    struct BorrowGivenDebtETHCollateral {
        IERC20 asset;
        uint256 maturity;
        address assetTo;
        address dueTo;
        uint112 assetOut;
        uint112 debtIn;
        uint256 deadline;
    }
}
