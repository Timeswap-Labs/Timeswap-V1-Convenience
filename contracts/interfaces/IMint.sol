// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IWETH} from './IWETH.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';

interface IMint {
    struct NewLiquidity {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address liquidityTo;
        address dueTo;
        uint112 assetIn;
        uint112 debtOut;
        uint112 collateralIn;
        uint256 deadline;
    }

    struct NewLiquidityETHAsset {
        IERC20 collateral;
        uint256 maturity;
        address liquidityTo;
        address dueTo;
        uint112 debtOut;
        uint112 collateralIn;
        uint256 deadline;
    }

    struct NewLiquidityETHCollateral {
        IERC20 asset;
        uint256 maturity;
        address liquidityTo;
        address dueTo;
        uint112 assetIn;
        uint112 debtOut;
        uint256 deadline;
    }

    struct _NewLiquidity {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address assetFrom;
        address collateralFrom;
        address liquidityTo;
        address dueTo;
        uint112 assetIn;
        uint112 debtOut;
        uint112 collateralIn;
        uint256 deadline;
    }

    struct AddLiquidity {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address liquidityTo;
        address dueTo;
        uint112 assetIn;
        uint256 minLiquidity;
        uint112 maxDebt;
        uint112 maxCollateral;
        uint256 deadline;
    }

    struct AddLiquidityETHAsset {
        IERC20 collateral;
        uint256 maturity;
        address liquidityTo;
        address dueTo;
        uint256 minLiquidity;
        uint112 maxDebt;
        uint112 maxCollateral;
        uint256 deadline;
    }

    struct AddLiquidityETHCollateral {
        IERC20 asset;
        uint256 maturity;
        address liquidityTo;
        address dueTo;
        uint112 assetIn;
        uint256 minLiquidity;
        uint112 maxDebt;
        uint256 deadline;
    }

    struct _AddLiquidity {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address assetFrom;
        address collateralFrom;
        address liquidityTo;
        address dueTo;
        uint112 assetIn;
        uint256 minLiquidity;
        uint112 maxDebt;
        uint112 maxCollateral;
        uint256 deadline;
    }

    struct _Mint {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address assetFrom;
        address collateralFrom;
        address liquidityTo;
        address dueTo;
        uint112 assetIn;
        uint112 interestIncrease;
        uint112 cdpIncrease;
        uint256 deadline;
    }
}
