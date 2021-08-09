// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {AClaim} from './abstracts/AClaim.sol';
import {IConvenience} from './interfaces/IConvenience.sol';
import {IPair} from './interfaces/IPair.sol';

contract Insurance is AClaim {
    constructor(
        IConvenience _convenience,
        IPair _pair,
        uint256 _maturity
    ) AClaim(_convenience, _pair, _maturity) {}

    function totalSupply() external view override returns (uint256) {
        return pair.claimsOf(maturity, address(this)).insurance;
    }

    function burn(
        address from,
        address to,
        uint128 amount
    ) external override onlyConvenience returns (uint128 tokenOut) {
        balanceOf[from] -= amount;
        tokenOut = pair.withdraw(maturity, to, to, IPair.Claims(0, amount)).collateral;

        emit Transfer(from, address(0), amount);
    }
}
