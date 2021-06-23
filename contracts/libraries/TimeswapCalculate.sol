// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {InterfaceTimeswapPool} from './../interfaces/InterfaceTimeswapPool.sol';
import {InterfaceTimeswapFactory} from './../interfaces/InterfaceTimeswapFactory.sol';
import {InterfaceERC20} from './../interfaces/InterfaceERC20.sol';
import {Math} from './Math.sol';
import {ConstantProduct} from './ConstantProduct.sol';

/// @title Timeswap Calculate Library
/// @author Ricsson W. Ngo
/// @dev Do all the necessary precalculation for token transfers
library TimeswapCalculate {
    using Math for uint256;

    /// @dev The base precision when dealing with transaction fee and protocol fee
    uint256 private constant BASE = 10000;
    // @dev The number of seconds in an epoch year
    uint256 private constant YEAR = 31556926;

    InterfaceTimeswapPool private constant ZERO_ADDRESS = InterfaceTimeswapPool(address(type(uint160).min));

    /// @dev Calculate the necessary parameters for the mint function in Timeswap Core contract
    /// @dev Precalculate the collateral ERC20 required to transfer
    /// @param _pool The address of the Timeswap pool
    /// @param _insuranceReceivedAndAssetIn The amount of insurance ERC20 received by the receiver and the increase in the X pool
    /// @return _bondIncreaseAndCollateralPaid The increase in the Y pool and the amount of collateral ERC20 to be deposited to the Timeswap Core contract
    /// @return _insuranceIncreaseAndDebtRequired The increase in the V pool and the amount of debt received
    /// @return _bondReceivedAndCollateralLocked The amount of bond ERC20 received by the receiver and the amount of collateral ERC20 to be locked
    function calculateMint(InterfaceTimeswapPool _pool, uint256 _insuranceReceivedAndAssetIn)
        internal
        view
        returns (
            uint256 _bondIncreaseAndCollateralPaid,
            uint256 _insuranceIncreaseAndDebtRequired,
            uint256 _bondReceivedAndCollateralLocked
        )
    {
        // Get the X pool
        uint256 _assetReserve = _pool.assetReserve(); // gas saving

        // The increase of Y pool and V pool must be the same proportional increase to the X pool
        _bondIncreaseAndCollateralPaid =
            (_insuranceReceivedAndAssetIn * _pool.bond().balanceOf(address(_pool))) /
            _assetReserve;
        _insuranceIncreaseAndDebtRequired =
            (_insuranceReceivedAndAssetIn * _pool.insurance().balanceOf(address(_pool))) /
            _assetReserve;

        // Calculate how much collateral to be locked
        _bondReceivedAndCollateralLocked = (_bondIncreaseAndCollateralPaid * _insuranceIncreaseAndDebtRequired).divUp(
            _insuranceReceivedAndAssetIn
        );
    }

    /// @dev Precalculate the collateral ERC20 required to transfer for the burn function in Timeswap Core contract
    /// @param _pool The address of the Timeswap pool
    /// @param _liquidityIn The amount of liquidity ERC20 to be burnt
    /// @param _maxCollateralLocked The maximum amount of collateral ERC20 to be locked
    /// @return _collateralLocked The actual amount of collateral ERC20 to be locked
    function calculateBurn(
        InterfaceTimeswapPool _pool,
        uint256 _liquidityIn,
        uint256 _maxCollateralLocked
    ) internal view returns (uint256 _collateralLocked) {
        // Get the Y pool
        uint256 _bondReserve = _pool.bond().balanceOf(address(_pool));
        uint256 _totalSupply = _pool.totalSupply();
        // Get the maximum collateral ERC20 that could be locked in the Timeswap core to borrow the maximum amount of asset ERC20
        _collateralLocked = (_liquidityIn * _bondReserve) / _totalSupply;
        // Restrict the amount of collateral ERC20 to be locked based on _maxCollateralLocked
        _collateralLocked = _collateralLocked < _maxCollateralLocked ? _collateralLocked : _maxCollateralLocked;
    }

    /// @dev Calculate the necessary parameters for the lend function in Timeswap Core contract given that users received desired bond amount
    /// @param _pool The address of the Timeswap pool
    /// @param _assetIn The amount of asset ERC20 to be deposited into the Timeswap Core contract
    /// @param _bondReceived The desired amount of bond ERC20 to be received from the Timeswap Core contract
    /// @return _bondDecrease The decrease in the Y pool parameter for the lend function in the Timeswap Core contract
    /// @return _rateDecrease The decrease in the Z pool parameter for the lend function in the Timeswap Core contract
    function calculateLendGivenBondReceived(
        InterfaceTimeswapPool _pool,
        uint256 _assetIn,
        uint256 _bondReceived
    ) internal view returns (uint256 _bondDecrease, uint256 _rateDecrease) {
        uint256 _transactionFeeBase = BASE + _pool.transactionFee(); // gas saving
        uint256 _duration = _pool.maturity() - block.timestamp;

        // Get the X pool, Y pool, and Z pool
        (uint256 _assetReserve, uint256 _bondReserve, uint256 _rateReserve) = _viewReserves(_pool);

        // Get the bond decrease parameter
        _bondDecrease = (_bondReceived * _assetReserve).divUp((_rateReserve * _duration) / YEAR + _assetReserve);

        // Adjust the bond decrease and bond reserve with the transaction fee
        uint256 _bondBalanceAdjusted = _bondReserve * BASE;
        _bondBalanceAdjusted -= _bondDecrease * _transactionFeeBase;
        _bondBalanceAdjusted /= BASE;

        // Get the adjusted rate balance following the constant product formula
        uint256 _rateBalanceAdjusted = ConstantProduct.calculate(
            _assetReserve,
            _bondReserve * _rateReserve,
            _assetReserve + _assetIn,
            _bondBalanceAdjusted
        );

        // Derive the rate decrease from the adjusted rate balance with the transaction fee
        _rateDecrease = _rateReserve - _rateBalanceAdjusted;
        _rateDecrease *= BASE;
        _rateDecrease /= _transactionFeeBase;
    }

    /// @dev Calculate the necessary parameters for the lend function in Timeswap Core contract given that users received desired insurance amount
    /// @param _pool The address of the Timeswap pool
    /// @param _assetIn The amount of asset ERC20 to be deposited into the Timeswap Core contract
    /// @param _insuranceReceived The desired amount of insurance ERC20 to be received from the Timeswap Core contract
    /// @return _bondDecrease The decrease in the Y pool parameter for the lend function in the Timeswap Core contract
    /// @return _rateDecrease The decrease in the Z pool parameter for the lend function in the Timeswap Core contract
    function calculateLendGivenInsuranceReceived(
        InterfaceTimeswapPool _pool,
        uint256 _assetIn,
        uint256 _insuranceReceived
    ) internal view returns (uint256 _bondDecrease, uint256 _rateDecrease) {
        uint256 _transactionFeeBase = BASE + _pool.transactionFee(); // gas saving
        uint256 _duration = _pool.maturity() - block.timestamp;

        // Get the X pool, Y pool, and Z pool
        (uint256 _assetReserve, uint256 _bondReserve, uint256 _rateReserve) = _viewReserves(_pool);

        // Get the rate decrease parameter
        _rateDecrease = (_insuranceReceived * _rateReserve).divUp(
            (_rateReserve * _duration) / YEAR + _assetReserve + _assetIn
        );

        // Adjust the rate decrease and rate reserve with the transaction fee
        uint256 _rateBalanceAdjusted = _rateReserve * BASE;
        _rateBalanceAdjusted -= _rateDecrease * _transactionFeeBase;
        _rateBalanceAdjusted /= BASE;

        // Get the adjusted bond balance following the constant product formula
        uint256 _bondBalanceAdjusted = ConstantProduct.calculate(
            _assetReserve,
            _bondReserve * _rateReserve,
            _assetReserve + _assetIn,
            _rateBalanceAdjusted
        );

        // Derive the bond decrease from the adjusted bond balance with the transaction fee
        _bondDecrease = (_bondReserve - _bondBalanceAdjusted);
        _bondDecrease *= BASE;
        _bondDecrease /= _transactionFeeBase;
    }

    /// @dev Calculate the necessary parameters for the burn function in Timeswap Core contract given that users lock desired collateral
    /// @dev Precalculate the actual collateral to be locked in the Timeswap Core contract
    /// @param _pool The address of the Timeswap pool
    /// @param _assetReceived The amount of asset ERC20 received by the receiver
    /// @param _desiredCollateralLocked The desired amount of collateral ERC20 to be locked
    /// @return _bondIncrease The increase in the Y pool parameter for the burn function in the Timeswap Core contract
    /// @return _rateIncrease The increase in the Z pool parameter for the burn function in the Timeswap Core contract
    /// @return _collateralLocked The actual amount of collateral ERC20 to be locked
    function calculateBorrowGivenDesiredCollateralLocked(
        InterfaceTimeswapPool _pool,
        uint256 _assetReceived,
        uint256 _desiredCollateralLocked
    )
        internal
        view
        returns (
            uint256 _bondIncrease,
            uint256 _rateIncrease,
            uint256 _collateralLocked
        )
    {
        uint256 _transactionFeeBase = BASE - _pool.transactionFee(); // gas saving
        uint256 _duration = _pool.maturity() - block.timestamp;

        // Get the X pool, Y pool, and Z pool
        (uint256 _assetReserve, uint256 _bondReserve, uint256 _rateReserve) = _viewReserves(_pool);

        {
            // avoids stack too deep error
            (uint256 _bondMax, uint256 _bondMaxUp) = (_assetReceived * _bondReserve).divDownAndUp(
                _assetReserve - _assetReceived
            );
            uint256 _collateralAdditionalUp = _desiredCollateralLocked - _bondMax;
            uint256 _collateralAdditional = _desiredCollateralLocked - _bondMaxUp;
            // Use round down and round up in division to minimize the bond increase
            _bondIncrease = _collateralAdditional * _bondMax;
            _bondIncrease /=
                ((_bondMaxUp * _rateReserve).divUp(_assetReserve) * _duration).divUp(YEAR) +
                _collateralAdditionalUp;

            // Use round down and round up in division to maximize the return to the Timeswap Core pool contract
            _collateralLocked = (_bondMaxUp * _bondIncrease).divUp(_bondMax - _bondIncrease);
            _collateralLocked = (_collateralLocked * _rateReserve).divUp(_assetReserve);
            _collateralLocked = (_collateralLocked * _duration).divUp(YEAR);
            _collateralLocked += _bondMaxUp;
        }

        // Adjust the bond increase and bond reserve with the transaction fee
        uint256 _bondBalanceAdjusted = _bondReserve * BASE;
        _bondBalanceAdjusted += _bondIncrease * _transactionFeeBase;
        _bondBalanceAdjusted /= BASE;

        // Get the adjusted rate balance following the constant product formula
        uint256 _rateBalanceAdjusted = ConstantProduct.calculate(
            _assetReserve,
            _bondReserve * _rateReserve,
            _bondBalanceAdjusted,
            _assetReserve - _assetReceived
        );

        // Derive the rate increase from the adjusted rate balance with the transaction fee
        _rateIncrease = _rateBalanceAdjusted - _rateReserve;
        _rateIncrease *= BASE;
        _rateIncrease = _rateIncrease.divUp(_transactionFeeBase);
    }

    /// @dev Calculate the necessary parameters for the burn function in Timeswap Core contract given that users receive desired interest
    /// @dev Precalculate the actual collateral to be locked in the Timeswap Core contract
    /// @param _pool The address of the Timeswap pool
    /// @param _assetReceived The amount of asset ERC20 received by the receiver
    /// @param _interestRequired The desired amount of interest required
    /// @return _bondIncrease The increase in the Y pool parameter for the burn function in the Timeswap Core contract
    /// @return _rateIncrease The increase in the Z pool parameter for the burn function in the Timeswap Core contract
    /// @return _collateralLocked The actual amount of collateral ERC20 to be locked
    function calculateBorrowGivenInterestRequired(
        InterfaceTimeswapPool _pool,
        uint256 _assetReceived,
        uint256 _interestRequired
    )
        internal
        view
        returns (
            uint256 _bondIncrease,
            uint256 _rateIncrease,
            uint256 _collateralLocked
        )
    {
        uint256 _transactionFeeBase = BASE - _pool.transactionFee(); // gas saving
        uint256 _duration = _pool.maturity() - block.timestamp;

        // Get the X pool, Y pool, and Z pool
        (uint256 _assetReserve, uint256 _bondReserve, uint256 _rateReserve) = _viewReserves(_pool);

        {
            // avoids stack too deep error
            (uint256 _rateMax, uint256 _rateMaxUp) = (_assetReceived * _rateReserve).divDownAndUp(
                _assetReserve - _assetReceived
            );
            // Use round down and round up in division to minimize the rate increase
            _rateIncrease = _interestRequired * _rateMax;
            _rateIncrease /= (_rateMaxUp * _duration).divUp(YEAR) + _interestRequired;
        }

        {
            // avoids stack too deep error
            // Adjust the rate increase and rate reserve with the transaction fee
            uint256 _rateBalanceAdjusted = _rateReserve * BASE;
            _rateBalanceAdjusted += _rateIncrease * _transactionFeeBase;
            _rateBalanceAdjusted /= BASE;

            // Get the adjusted bond balance following the constant product formula
            uint256 _bondBalanceAdjusted = ConstantProduct.calculate(
                _assetReserve,
                _bondReserve * _rateReserve,
                _rateBalanceAdjusted,
                _assetReserve - _assetReceived
            );

            // Derive the bond increase from the adjusted bond balance with the transaction fee
            _bondIncrease = _bondBalanceAdjusted - _bondReserve;
            _bondIncrease *= BASE;
            _bondIncrease = _bondIncrease.divUp(_transactionFeeBase);
        }

        uint256 _bondMax = (_assetReceived * _bondReserve) / (_assetReserve - _assetReceived);
        uint256 _bondMaxUp = (_assetReceived * _bondReserve).divUp(_assetReserve - _assetReceived);
        // Use round down and round up in division to maximize the return to the Timeswap Core pool contract
        _collateralLocked = (_bondMaxUp * _bondIncrease).divUp(_bondMax - _bondIncrease);
        _collateralLocked = (_collateralLocked * _rateReserve).divUp(_assetReserve);
        _collateralLocked = (_collateralLocked * _duration).divUp(YEAR);
        _collateralLocked += _bondMaxUp;
    }

    // HELPER

    /// @dev Return the X pool, Y pool, and the Z pool
    function _viewReserves(InterfaceTimeswapPool _pool)
        private
        view
        returns (
            uint256 _assetReserve,
            uint256 _bondReserve,
            uint256 _rateReserve
        )
    {
        _assetReserve = _pool.assetReserve();
        _bondReserve = _pool.bond().balanceOf(address(_pool));
        _rateReserve = _pool.rateReserve();
    }
}
