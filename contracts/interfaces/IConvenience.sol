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
import {IBorrow} from './IBorrow.sol';
import {IPay} from './IPay.sol';

/// @title Timeswap Convenience Interface
/// @author Ricsson W. Ngo
interface IConvenience is IMint, ILend, IWithdraw, IBorrow, IPay, IBurn {
    struct Native {
        ILiquidity liquidity;
        IClaim bond;
        IClaim insurance;
        IDue collateralizedDebt;
    }

    function factory() external returns (IFactory);
}
