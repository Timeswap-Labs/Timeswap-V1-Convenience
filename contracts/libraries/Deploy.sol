// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IPair} from '../interfaces/IPair.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {String} from './String.sol';
import {DeployERC20} from './DeployERC20.sol';
import {DeployERC721} from './DeployERC721.sol';

library Deploy {
    using String for uint256;
    using DeployERC20 for IConvenience.Native;
    using DeployERC721 for IConvenience.Native;

    event DeployNative(IERC20 asset, IERC20 collateral, uint256 maturity, IConvenience.Native native);

    function deploy(
        IConvenience.Native storage native,
        IConvenience convenience,
        IPair pair,
        IERC20 asset,
        IERC20 collateral,
        uint256 maturity
    ) internal {
        bytes32 salt = keccak256(abi.encode(asset, collateral, maturity.toString()));
        native.deployERC20(salt, convenience, pair, maturity);
        native.deployERC721(salt, convenience, pair, maturity);

        emit DeployNative(asset, collateral, maturity, native);
    }
}
