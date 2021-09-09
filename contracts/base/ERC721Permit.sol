// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC721Permit} from '../interfaces/IERC721Permit.sol';
import {ERC721} from './ERC721.sol';

abstract contract ERC721Permit is IERC721Permit, ERC721 {}
