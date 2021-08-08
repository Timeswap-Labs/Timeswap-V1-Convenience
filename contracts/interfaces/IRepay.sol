// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from './IERC20.sol';
import {IPair} from './IPair.sol';

interface IRepay {
    struct Repay {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address owner;
        address collateralTo;
        uint256[] ids;
        uint112[] assetsPay;
        uint256 deadline;
    }
    struct _Repay {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address owner;
        address collateralTo;
        uint256[] ids;
        uint112[] assetsPay;
    }
    struct RepayETHAsset {
        IERC20 collateral;
        uint256 maturity;
        address owner;
        address collateralTo;
        uint256[] ids;
        uint112[] assetsPay;
        uint256 deadline;
    }
    struct RepayETHCollateral {
        IERC20 asset;
        uint256 maturity;
        address owner;
        address collateralTo;
        uint256[] ids;
        uint112[] assetsPay;
        uint256 deadline;
    }
}
