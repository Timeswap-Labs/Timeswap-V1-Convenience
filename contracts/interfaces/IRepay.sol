// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from './IERC20.sol';
import {IPair} from './IPair.sol';

// Change name from IRepay to IPay
interface IRepay {
    struct Repay {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address owner;
        address collateralTo;
        uint256[] ids;
        uint112[] assetsPay; // change name to debtsIn
        uint256 deadline;
    }
    struct _Repay {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address owner;
        address collateralTo;
        uint256[] ids;
        uint112[] assetsPay; // see above
        // put deadline
    }
    struct RepayETHAsset {
        IERC20 collateral;
        uint256 maturity;
        address owner;
        address collateralTo;
        uint256[] ids;
        uint112[] assetsPay; // see above
        uint256 deadline;
    }
    struct RepayETHCollateral {
        IERC20 asset;
        uint256 maturity;
        address owner;
        address collateralTo; // put payable, since this collateralTo will receive ETH
        uint256[] ids;
        uint112[] assetsPay; // see above
        uint256 deadline;
    }
}
