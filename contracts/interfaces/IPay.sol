// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from './IERC20.sol';
import {IPair} from './IPair.sol';

interface IPay {
    struct Repay {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address collateralTo;
        uint256[] ids;
        uint112[] maxAssetsIn;
        uint256 deadline;
    }

    struct RepayETHAsset {
        IERC20 collateral;
        uint256 maturity;
        address collateralTo;
        uint256[] ids;
        uint112[] maxAssetsIn;
        uint256 deadline;
    }

    struct RepayETHCollateral {
        IERC20 asset;
        uint256 maturity;
        address payable collateralTo;
        uint256[] ids;
        uint112[] maxAssetsIn;
        uint256 deadline;
    }

    struct _Repay {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address from;
        address collateralTo;
        uint256[] ids;
        uint112[] maxAssetsIn;
        uint256 deadline;
    }
}
