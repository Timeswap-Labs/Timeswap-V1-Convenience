// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IFactory} from './IFactory.sol';
import {IERC20} from './IERC20.sol';
import {IERC721Receiver} from './IERC721Receiver.sol';

/// @title Timeswap Convenience Interface
/// @author Ricsson W. Ngo
interface IConvenience is IERC721Receiver {
    struct Parameter {
        IERC20 asset;
        IERC20 collateral;
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

    function factory() external view returns (IFactory);

    /* ===== UPDATE ===== */

    function newLiquidity(
        Parameter memory _parameter,
        address _to,
        uint256 _insuranceReceivedAndAssetIn,
        uint256 _bondIncreaseAndCollateralPaid,
        uint256 _bondReceivedAndCollateralLocked,
        uint256 _deadline
    )
        external
        returns (
            uint256 _tokenId,
            uint256 _insuranceIncreaseAndDebtRequired,
            uint256 _liquidityReceived
        );

    function addLiquidity(
        Parameter memory _parameter,
        address _to,
        uint256 _insuranceReceivedAndAssetIn,
        SafeMint memory _safe,
        uint256 _deadline
    )
        external
        returns (
            uint256 _tokenId,
            uint256 _bondIncreaseAndCollateralPaid,
            uint256 _insuranceIncreaseAndDebtRequired,
            uint256 _bondReceivedAndCollateralLocked,
            uint256 _liquidityReceived
        );

    function removeLiquidityBeforeMaturity(
        Parameter memory _parameter,
        address _to,
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

    function removeLiquidityAfterMaturity(
        Parameter memory _parameter,
        address _to,
        uint256 _liquidityIn
    ) external returns (uint256 _bondReceived, uint256 _insuranceReceived);

    function lendGivenBondReceived(
        Parameter memory _parameter,
        address _to,
        uint256 _assetIn,
        uint256 _givenBondReceived,
        SafeLend memory _safe,
        uint256 _deadline
    ) external returns (uint256 _bondReceived, uint256 _insuranceReceived);

    function lendGivenInsuranceReceived(
        Parameter memory _parameter,
        address _to,
        uint256 _assetIn,
        uint256 _givenInsuranceReceived,
        SafeLend memory _safe,
        uint256 _deadline
    ) external returns (uint256 _bondReceived, uint256 _insuranceReceived);

    function borrowGivenCollateralLocked(
        Parameter memory _parameter,
        address _to,
        uint256 _assetReceived,
        uint256 _givenCollateralLocked,
        SafeBorrow memory _safe,
        uint256 _deadline
    )
        external
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequired
        );

    function borrowGivenInterestRequired(
        Parameter memory _parameter,
        address _to,
        uint256 _assetReceived,
        uint256 _givenInterestRequired,
        SafeBorrow memory _safe,
        uint256 _deadline
    )
        external
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequired
        );

    function repay(
        Parameter memory _parameter,
        address _to,
        uint256 _tokenId,
        uint256 _assetIn,
        uint256 _deadline
    ) external returns (uint256 _collateralReceived);

    function repayMultiple(
        Parameter memory _parameter,
        address _to,
        uint256[] memory _tokenIds,
        uint256[] memory _assetsIn,
        uint256 _deadline
    ) external returns (uint256 _collateralReceived);
}
