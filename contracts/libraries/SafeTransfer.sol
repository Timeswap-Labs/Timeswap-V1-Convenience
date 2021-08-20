// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from '../interfaces/IERC20.sol';
import {IPair} from '../interfaces/IPair.sol';
import {Contract} from './Contract.sol';

library SafeTransfer {
    using Contract for address;

    function safeTransfer(
        IERC20 token,
        IPair to,
        uint256 amount
    ) internal {
        address(token).requireContract;
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transfer.selector, address(to), amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TF');
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        IPair to,
        uint256 amount
    ) internal {
        address(token).requireContract;
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, address(to), amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TF');
    }
}
