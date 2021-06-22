// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceTimeswapFactory} from "./InterfaceTimeswapFactory.sol";
import {InterfaceTimeswapPool} from "./InterfaceTimeswapPool.sol";
import {InterfaceERC20} from "./InterfaceERC20.sol";
import {InterfaceERC721Receiver} from "./InterfaceERC721Receiver.sol";
import {InterfaceWETH9} from "./InterfaceWETH9.sol";

/// @title Timeswap Convenience ETH Asset Interface
/// @author Ricsson W. Ngo
interface InterfaceTimeswapETHAsset is InterfaceERC721Receiver {
    
    struct Parameter {
        InterfaceERC20 collateral;
        uint256 maturity;
    }

    struct SafeMint {
        uint256 maxDebt;
        uint256 maxCollateralPaid;
        uint256 maxCollateralLocked;
    }

    struct SafeBurn {
        uint256 minAsset;
        uint256 minBond;
        uint256 minInsurance;
    }

    struct SafeLend {
        uint256 minBond;
        uint256 minInsurance;
    }

    struct SafeBorrow {
        uint256 maxCollateralLocked;
        uint256 maxInterestRequired;
    }

    /* ===== VIEW ===== */

    function factory() external returns (InterfaceTimeswapFactory);

    function weth() external returns (InterfaceWETH9);

    /* ===== UPDATE ===== */

    function mint(
        Parameter memory _parameter,
        address _to,
        uint256 _bondIncreaseAndCollateralPaid,
        uint256 _bondReceivedAndCollateralLocked,
        uint256 _deadline
    )
        external
        payable
        returns (
            uint256 _tokenId,
            uint256 _insuranceIncreaseAndDebtRequired,
            uint256 _liquidityReceived
        );

    function mint(
        Parameter memory _parameter,
        address _to,
        SafeMint memory _safe,
        uint256 _deadline
    )
        external
        payable
        returns (
            uint256 _tokenId,
            uint256 _bondIncreaseAndCollateralPaid,
            uint256 _insuranceIncreaseAndDebtRequired,
            uint256 _bondReceivedAndCollateralLocked,
            uint256 _liquidityReceived
        );

    function burn(
        Parameter memory _parameter,
        address payable _to,
        uint256 _liquidityIn,
        uint256 _maxCollateralLocked,
        SafeBurn memory _safe,
        uint256 _deadline
    )
        external
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequiredAndAssetReceived,
            uint256 _bondReceived,
            uint256 _insuranceReceived
        );

    function burn(
        Parameter memory _parameter,
        address _to,
        uint256 _liquidityIn
    )
        external
        returns (
            uint256 _bondReceived,
            uint256 _insuranceReceived
        );

    function lend(
        Parameter memory _parameter,
        address _to,
        bool _isBondReceivedGiven,
        uint256 _bondReceivedOrInsuranceReceived,
        SafeLend memory _safe,
        uint256 _deadline
    )
        external
        payable
        returns (
            uint256 _bondReceived,
            uint256 _insuranceReceived
        );

    function borrow(
        Parameter memory _parameter,
        address payable _to,
        uint256 _assetReceived,
        bool _isDesiredCollateralLockedGiven,
        uint256 _desiredCollateralLockedOrInterestRequired,
        SafeBorrow memory _safe,
        uint256 _deadline
    )
        external
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequired
        );

    function pay(
        Parameter memory _parameter,
        address _to,
        uint256 _tokenId,
        uint256 _deadline
    )
        external
        payable
        returns (
            uint256 _collateralReceived
        );

    function pay(
        Parameter memory _parameter,
        address _to,
        uint256[] memory _tokenIds,
        uint256[] memory _assetsIn,
        uint256 _deadline
    )
        external
        payable
        returns (
            uint256 _collateralReceived
        );
}
