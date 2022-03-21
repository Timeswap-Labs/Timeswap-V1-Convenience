// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity =0.8.4;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/// @title WETH9 Interface
/// @author Ricsson W. Ngo
interface IWETH is IERC20 {
    /* ===== UPDATE ===== */

    function deposit() external payable;

    function withdraw(uint256 amount) external;
}
