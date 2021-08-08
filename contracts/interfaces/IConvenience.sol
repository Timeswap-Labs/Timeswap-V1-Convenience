// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IFactory} from './IFactory.sol';
import {IPair} from './IPair.sol';
import {IERC20} from './IERC20.sol';
import {IMint} from './IMint.sol';
import {ILend} from './ILend.sol';
import {IWithdraw} from './IWithdraw.sol';
import {IERC721Receiver} from './IERC721Receiver.sol';
import {ILiquidity} from './ILiquidity.sol';
import {IClaim} from './IClaim.sol';
import {IDue} from './IDue.sol';
import {IBorrow} from './IBorrow.sol';
import {IRepay} from './IRepay.sol';

/// @title Timeswap Convenience Interface
/// @author Ricsson W. Ngo
interface IConvenience is IMint, ILend, IWithdraw, IBorrow, IRepay {
    struct Parameter {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
    }

    struct Native {
        ILiquidity liquidity;
        IClaim bond;
        IClaim insurance;
        IDue collateralizedDebt;
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

    struct BorrowTo {
        address asset;
        address due;
    }

    struct BorrowSafe {
        uint112 maxDebt;
        uint112 maxCollateral;
    }
}
