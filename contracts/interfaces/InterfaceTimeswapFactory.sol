// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceTimeswapPool} from './InterfaceTimeswapPool.sol';
import {InterfaceERC20} from './InterfaceERC20.sol';

/// @title Timeswap Factory Interface
/// @author Ricsson W. Ngo
interface InterfaceTimeswapFactory {
    /* ===== VIEW ===== */

    function transactionFee() external view returns (uint128);

    function protocolFee() external view returns (uint128);

    function getPool(
        InterfaceERC20 _asset,
        InterfaceERC20 _collateral,
        uint256 _maturity
    ) external view returns (InterfaceTimeswapPool);

    /* ===== UPDATE ===== */

    function createPool(
        InterfaceERC20 _asset,
        InterfaceERC20 _collateral,
        uint256 _maturity
    ) external returns (InterfaceTimeswapPool _pool);
}
