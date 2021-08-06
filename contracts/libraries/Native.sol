// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IPair} from '../interfaces/IPair.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {Liquidity} from '../Liquidity.sol';
import {Bond} from '../Bond.sol';
import {Insurance} from '../Insurance.sol';
import {CollateralizedDebt} from '../CollateralizedDebt.sol';

library Native {
    function exist(IConvenience.Native storage native) internal view returns (bool) {
        return address(native.liquidity) != address(0);
    }

    function createNative(
        IConvenience.Native storage native,
        IERC20 asset,
        IERC20 collateral,
        uint256 maturity,
        IConvenience convenience,
        IPair pair
    ) internal {
        native.liquidity = new Liquidity{salt: keccak256(abi.encode(asset, collateral, maturity))}(
            convenience,
            pair,
            maturity
        );
        native.bond = new Bond{salt: keccak256(abi.encode(asset, collateral, maturity))}(convenience, pair, maturity);
        native.insurance = new Insurance{salt: keccak256(abi.encode(asset, collateral, maturity))}(
            convenience,
            pair,
            maturity
        );
        native.collateralizedDebt = new CollateralizedDebt{salt: keccak256(abi.encode(asset, collateral, maturity))}(
            convenience,
            pair,
            maturity
        );
    }
}
