// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from '../interfaces/IERC20.sol';
import {IPair} from '../interfaces/IPair.sol';

library SafeTransfer {
    function safeTransfer(
        IERC20 token,
        address to,
        uint256 amount
    ) internal {
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TF');
    } // needed?

    function safeTransferFrom(
        IERC20 token,
        address from,
        IPair to,
        uint256 amount
    ) internal {
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, address(to), amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TF');
    }
}
