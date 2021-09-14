// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20Permit} from '../interfaces/IERC20Permit.sol';
import {ERC20} from './ERC20.sol';

abstract contract ERC20Permit is IERC20Permit, ERC20 {}
