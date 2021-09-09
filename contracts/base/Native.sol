// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {INative} from '../interfaces/INative.sol';
import {IConvenience} from '../interfaces/IConvenience.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';

contract Native is INative {
    IConvenience public immutable override convenience;
    IPair public immutable override pair;
    uint256 public immutable override maturity;

    constructor(
        IConvenience _convenience,
        IPair _pair,
        uint256 _maturity
    ) {
        convenience = _convenience;
        pair = _pair;
        maturity = _maturity;
    }

    modifier onlyConvenience() {
        require(msg.sender == address(convenience), 'Forbidden');
        _;
    }
}
