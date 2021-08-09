// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IClaim} from '../interfaces/IClaim.sol';
import {IConvenience} from '../interfaces/IConvenience.sol';
import {IPair} from '../interfaces/IPair.sol';
import {AERC20} from './AERC20.sol';

abstract contract AClaim is AERC20, IClaim {
    IConvenience public immutable override convenience;
    IPair public immutable override pair;
    uint256 public immutable override maturity;

    modifier onlyConvenience() {
        require(msg.sender == address(convenience), 'Forbidden');
        _;
    }

    constructor(
        IConvenience _convenience,
        IPair _pair,
        uint256 _maturity
    ) {
        convenience = _convenience;
        pair = _pair;
        maturity = _maturity;
    }

    function mint(address to, uint128 amount) external override onlyConvenience {
        require(to != address(0), 'Zero');

        balanceOf[to] += amount;

        emit Transfer(address(0), to, amount);
    }
}
