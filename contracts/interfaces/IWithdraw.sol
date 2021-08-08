// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from './IERC20.sol';
import {IData} from './IData.sol';

interface IWithdraw {
    struct Collect {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address assetTo;
        address collateralTo;
        IData.Claims claimsIn;
    }

    struct CollectETHAsset {
        IERC20 collateral;
        uint256 maturity;
        address payable assetTo;
        address collateralTo;
        IData.Claims claimsIn;
    }

    struct CollectETHCollateral {
        IERC20 asset;
        uint256 maturity;
        address assetTo;
        address payable collateralTo;
        IData.Claims claimsIn;
    }

    struct _Collect {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address assetTo;
        address collateralTo;
        IData.Claims claimsIn;
    }
}
