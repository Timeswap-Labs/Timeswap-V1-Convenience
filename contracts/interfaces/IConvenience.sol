// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IFactory} from './IFactory.sol';
import {IPair} from './IPair.sol';
import {IERC20} from './IERC20.sol';
import {IERC721Receiver} from './IERC721Receiver.sol';

/// @title Timeswap Convenience Interface
/// @author Ricsson W. Ngo
interface IConvenience {
    struct Parameter {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
    }

    struct ETHAsset {
        IERC20 collateral;
        uint256 maturity;
    }

    struct ETHCollateral {
        IERC20 asset;
        uint256 maturity;
    }

    struct MintTo {
        address liquidity;
        address due;
    }

    struct MintSafe {
        uint128 minLiquidity;
        uint112 maxDebt;
        uint112 maxCollateral;
    }

    struct BurnTo {
        address asset;
        address collateral;
    }

    struct LendGivenBond {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address bondTo;
        address insuranceTo;
        uint128 assetIn;
        uint128 bondOut;
        uint128 minBond;
        uint128 minInsurance;
        uint256 deadline;
    }

    struct LendGivenBondETHAsset {
        IERC20 collateral;
        uint256 maturity;
        address bondTo;
        address insuranceTo;
        uint128 bondOut;
        uint128 minBond;
        uint128 minInsurance;
        uint256 deadline;
    }

    struct LendGivenBondETHCollateral {
        IERC20 asset;
        uint256 maturity;
        address bondTo;
        address insuranceTo;
        uint128 assetIn;
        uint128 bondOut;
        uint128 minBond;
        uint128 minInsurance;
        uint256 deadline;
    }

    struct _LendGivenBond {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address from;
        address bondTo;
        address insuranceTo;
        uint128 assetIn;
        uint128 bondOut;
        uint128 minBond;
        uint128 minInsurance;
        uint256 deadline;
    }

    struct LendGivenInsurance {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address bondTo;
        address insuranceTo;
        uint128 assetIn;
        uint128 insuranceOut;
        uint128 minBond;
        uint128 minInsurance;
        uint256 deadline;
    }

    struct LendGivenInsuranceETHAsset {
        IERC20 collateral;
        uint256 maturity;
        address bondTo;
        address insuranceTo;
        uint128 insuranceOut;
        uint128 minBond;
        uint128 minInsurance;
        uint256 deadline;
    }

    struct LendGivenInsuranceETHCollateral {
        IERC20 asset;
        uint256 maturity;
        address bondTo;
        address insuranceTo;
        uint128 assetIn;
        uint128 insuranceOut;
        uint128 minBond;
        uint128 minInsurance;
        uint256 deadline;
    }

    struct _LendGivenInsurance {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address from;
        address bondTo;
        address insuranceTo;
        uint128 assetIn;
        uint128 insuranceOut;
        uint128 minBond;
        uint128 minInsurance;
        uint256 deadline;
    }

    struct _Lend {
        IPair pair;
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address from;
        address bondTo;
        address insuranceTo;
        uint128 assetIn;
        uint128 interestDecrease;
        uint128 cdpDecrease;
        uint128 minBond;
        uint128 minInsurance;
        uint256 deadline;
    }

    struct Collect {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address assetTo;
        address collateralTo;
        IPair.Claims claimsIn;
    }

    struct CollectETHAsset {
        IERC20 collateral;
        uint256 maturity;
        address payable assetTo;
        address collateralTo;
        IPair.Claims claimsIn;
    }

    struct CollectETHCollateral {
        IERC20 asset;
        uint256 maturity;
        address assetTo;
        address payable collateralTo;
        IPair.Claims claimsIn;
    }

    struct _Collect {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
        address assetTo;
        address collateralTo;
        IPair.Claims claimsIn;
    }

    struct BorrowTo {
        address asset;
        address due;
    }

    struct BorrowSafe {
        uint112 maxDebt;
        uint112 maxCollateral;
    }
}
