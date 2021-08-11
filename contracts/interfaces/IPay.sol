// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from './IERC20.sol';
import {IPair} from './IPair.sol';

// Change name from IRepay to IPay
interface IPay {
    struct Repay {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address owner; // not necessary
        address assetFrom; // change name to from?
        address collateralTo;
        uint256[] ids;
        uint112[] debtsIn;
        uint256 deadline;
    }

    struct _Repay {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address owner; // necessary?
        address assetFrom; // change name to from?
        address collateralTo;
        uint256[] ids;
        uint112[] debtsIn;
        uint256 assetIn;
        uint256 deadline;
    }

    struct RepayETHAsset {
        IERC20 collateral;
        uint256 maturity;
        address owner; // necessary?
        address assetFrom; // change name to from?
        address collateralTo;
        uint256[] ids;
        uint112[] debtsIn;
        uint256 deadline;
    }

    struct RepayETHCollateral {
        IERC20 asset;
        uint256 maturity;
        address owner; // necessary?
        address assetFrom; // change name to from?
        address payable collateralTo;
        uint256[] ids;
        uint112[] debtsIn;
        uint256 deadline;
    }
}
