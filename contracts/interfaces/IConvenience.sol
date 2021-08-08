// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IFactory} from './IFactory.sol';
import {IPair} from './IPair.sol';
import {IERC20} from './IERC20.sol';
import {IMint} from './IMint.sol';
import {IBurn} from './IBurn.sol';
import {ILend} from './ILend.sol';
import {IWithdraw} from './IWithdraw.sol';
import {IERC721Receiver} from './IERC721Receiver.sol';
import {ILiquidity} from './ILiquidity.sol';
import {IClaim} from './IClaim.sol';
import {IDue} from './IDue.sol';

/// @title Timeswap Convenience Interface
/// @author Ricsson W. Ngo
interface IConvenience is IMint, IBurn, ILend, IWithdraw {
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
