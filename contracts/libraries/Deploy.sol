// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IPair} from '../interfaces/IPair.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {Liquidity} from '../Liquidity.sol';
import {Bond} from '../Bond.sol';
import {Insurance} from '../Insurance.sol';
import {CollateralizedDebt} from '../CollateralizedDebt.sol';

library Deploy {
    function deploy(
        IConvenience.Native storage native,
        IConvenience convenience,
        IPair pair,
        IERC20 asset,
        IERC20 collateral,
        uint256 maturity
    ) external {
        bytes32 salt = keccak256(abi.encode(asset, collateral, maturity));
        native.liquidity = new Liquidity{salt: salt}(convenience, pair, maturity);
        native.bond = new Bond{salt: salt}(convenience, pair, maturity);
        native.insurance = new Insurance{salt: salt}(convenience, pair, maturity);
        native.collateralizedDebt = new CollateralizedDebt{salt: salt}(convenience, pair, maturity);
    }
}
