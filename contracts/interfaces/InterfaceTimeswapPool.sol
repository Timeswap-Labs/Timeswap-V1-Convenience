// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceERC20} from "./InterfaceERC20.sol";
import {InterfaceTimeswapERC721} from "./InterfaceTimeswapERC721.sol";

/// @title Timeswap Pool Interface
/// @author Ricsson W. Ngo
interface InterfaceTimeswapPool is InterfaceERC20 {

    /* ===== VIEW ===== */

    function maturity() external view returns (uint256);

    function asset() external view returns (InterfaceERC20);

    function collateral() external view returns (InterfaceERC20);

    function insurance() external view returns (InterfaceERC20);

    function bond() external view returns (InterfaceERC20);

    function collateralizedDebt() external view returns (InterfaceTimeswapERC721);

    function assetReserve() external view returns (uint128);

    function rateReserve() external view returns (uint128);

    function collateralReserve() external view returns (uint256);

    function transactionFee() external view returns (uint128);

    function protocolFee() external view returns (uint128);

    /* ===== UPDATE ===== */

    function mint(
        address _to,
        uint256 _bondIncreaseAndCollateralPaid,
        uint256 _insuranceIncreaseAndDebtRequired
    )
        external
        returns (
            uint256 _tokenId,
            uint256 _bondReceivedAndCollateralLocked,
            uint256 _insuranceReceivedAndAssetIn,
            uint256 _liquidityReceived
        );

    function burn(
        address _to
    )
        external
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequiredAndAssetReceived,
            uint256 _bondReceived,
            uint256 _insuranceReceived
        );

    function lend(
        address _to,
        uint256 _bondDecrease,
        uint256 _rateDecrease
    )
        external
        returns (
            uint256 _bondReceived,
            uint256 _insuranceReceived
        );

    function borrow(
        address _to,
        uint256 _assetReceived,
        uint256 _bondIncrease,
        uint256 _rateIncrease
    )
        external
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequired
        );

    function withdraw(
        address _to,
        uint256 _bondIn,
        uint256 _insuranceIn
    )
        external
        returns (
            uint256 _assetReceived,
            uint256 _collateralReceived
        );

    function pay(
        uint256 _tokenId
    )
        external
        returns (
            uint256 _collateralReceived
        );
}
