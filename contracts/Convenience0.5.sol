// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from './interfaces/IConvenience.sol';
import {IFactory} from './interfaces/IFactory.sol';
import {IPair} from './interfaces/IPair.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {IERC721} from './interfaces/IERC721.sol';
import {TimeswapCalculate} from './libraries/TimeswapCalculate.sol';

/// @title Timeswap Convenience
/// @author Ricsson W. Ngo
/// @dev Conveniently call the core functions in Timeswap Core contract
/// @dev Precalculate and transfer necessarys tokens to the Timeswap Core contract
/// @dev Does safety checks in regards to slippage and deadline
contract TimeswapConvenience is IConvenience {
    using TimeswapCalculate for IPair;

    /* ===== MODEL ===== */

    bytes4 private constant TRANSFER_FROM = bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
    IPair private constant ZERO = IPair(address(type(uint160).min));

    /// @dev The address of the Timeswap Core factory contract that deploys Timeswap pools
    IFactory public immutable override factory;

    /// @dev Set deadlines for when the transactions are not executed fast enough
    modifier ensure(uint256 _deadline) {
        require(_deadline >= block.timestamp, 'TimeswapConvenience :: ensure : Expired');
        _;
    }

    /* ===== INIT ===== */

    /// @dev First deploy the Timeswap Core factory contract
    /// @dev Then deploy the Timeswap Convenience contract
    /// @param _factory The address of the Timeswap Core factory contract
    constructor(IFactory _factory) {
        factory = _factory;
    }

    /* ===== UPDATE ===== */

    /// @dev Deploy a new Timeswap pool contract and initialize the liquidity with the first mint function in the Timeswap Core contract
    /// @param _parameter The three parameters for the Timeswap pool
    /// @param _to The receiver of the mint function
    /// @param _insuranceReceivedAndAssetIn The amount of insurance ERC20 received by the receiver and the increase in the X pool
    /// @param _bondIncreaseAndCollateralPaid The increase in the Y pool and the amount of collateral ERC20 to be deposited to the pool contract
    /// @param _bondReceivedAndCollateralLocked The amount of bond ERC20 received by the receiver and the amount of collateral ERC20 to be locked
    /// @param _deadline The unix timestamp where the transactions must revert after
    /// @return _tokenId The id of the newly minted collateralized debt ERC721 token contract
    /// @return _insuranceIncreaseAndDebtRequired The increase in the V pool and the amount of debt received
    /// @return _liquidityReceived The amount of liquidity ERC20 received
    function newLiquidity(
        Parameter memory _parameter,
        address _to,
        uint256 _insuranceReceivedAndAssetIn,
        uint256 _bondIncreaseAndCollateralPaid,
        uint256 _bondReceivedAndCollateralLocked,
        uint256 _deadline
    )
        external
        override
        ensure(_deadline)
        returns (
            uint256 _tokenId,
            uint256 _insuranceIncreaseAndDebtRequired,
            uint256 _liquidityReceived
        )
    {
        // Get the address of the pool
        IPair _pair = _getPair(_parameter);

        // Deploy a new Timeswap pool if the pool does not exist
        if (_pair == ZERO) _pair = _createPool(_parameter);

        // Check if pool have liquidity
        require(_pair.totalSupply() == 0, 'TimeswapConvenience :: newLiquidity : Pool already have Liquidity');

        // Calculate one of the parameter for the mint function in the Timeswap Core contract
        _insuranceIncreaseAndDebtRequired =
            (_insuranceReceivedAndAssetIn * _bondReceivedAndCollateralLocked) /
            _bondIncreaseAndCollateralPaid;

        // Safely transfer the necessary tokens to the Timeswap Core pool
        _safeTransferFrom(_parameter.asset, msg.sender, _pool, _insuranceReceivedAndAssetIn);
        _safeTransferFrom(
            _parameter.collateral,
            msg.sender,
            _pool,
            _bondIncreaseAndCollateralPaid + _bondReceivedAndCollateralLocked
        );

        // Call the mint function in the Timeswap Core
        (_tokenId, , , _liquidityReceived) = _pool.mint(
            _to,
            _bondIncreaseAndCollateralPaid,
            _insuranceIncreaseAndDebtRequired
        );
    }

    /// @dev Add more liquidity into an existing Timeswap pool with the mint function in the Timeswap Core contract
    /// @param _parameter The three parameters for the Timeswap pool
    /// @param _to The receiver of the mint function
    /// @param _insuranceReceivedAndAssetIn The amount of insurance ERC20 received by the receiver and the increase in the X pool
    /// @param _safe The slippage protections of the mint transaction
    /// @param _deadline The unix timestamp where the transactions must revert after
    /// @return _tokenId The id of the newly minted collateralized debt ERC721 token contract
    /// @return _bondIncreaseAndCollateralPaid The increase in the Y pool and the amount of collateral ERC20 to be deposited to the pool contract
    /// @return _insuranceIncreaseAndDebtRequired The increase in the V pool and the amount of debt received
    /// @return _bondReceivedAndCollateralLocked The amount of bond ERC20 received by the receiver and the amount of collateral ERC20 to be locked
    /// @return _liquidityReceived The amount of liquidity ERC20 received
    function addLiquidity(
        Parameter memory _parameter,
        address _to,
        uint256 _insuranceReceivedAndAssetIn,
        SafeMint memory _safe,
        uint256 _deadline
    )
        external
        override
        ensure(_deadline)
        returns (
            uint256 _tokenId,
            uint256 _bondIncreaseAndCollateralPaid,
            uint256 _insuranceIncreaseAndDebtRequired,
            uint256 _bondReceivedAndCollateralLocked,
            uint256 _liquidityReceived
        )
    {
        // Get the address of the pool
        IPair _pool = _getPool(_parameter);
        // Sanity checks
        require(_pool != ZERO, 'TimeswapConvenience :: addLiquidity : Pool Does Not Exist');
        require(_pool.maturity() > block.timestamp, 'TimeswapConvenience :: addLiquidity : Pool Matured');
        require(_pool.totalSupply() > 0, 'TimeswapConvenience :: addLiquidity : No Liquidity');

        // Calculate the necessary parameters for the mint function in the Timeswap Core contract
        (_bondIncreaseAndCollateralPaid, _insuranceIncreaseAndDebtRequired, _bondReceivedAndCollateralLocked) = _pool
            .calculateMint(_insuranceReceivedAndAssetIn);

        // Safely transfer the necessary tokens to the Timeswap Core pool
        _safeTransferFrom(_parameter.asset, msg.sender, _pool, _insuranceReceivedAndAssetIn);
        _safeTransferFrom(
            _parameter.collateral,
            msg.sender,
            _pool,
            _bondIncreaseAndCollateralPaid + _bondReceivedAndCollateralLocked
        );

        // Call the mint function in the Timeswap Core
        (_tokenId, _bondReceivedAndCollateralLocked, , _liquidityReceived) = _pool.mint(
            _to,
            _bondIncreaseAndCollateralPaid,
            _insuranceIncreaseAndDebtRequired
        );

        // Check slippage protection
        require(
            _insuranceIncreaseAndDebtRequired <= _safe.maxDebt,
            'TimeswapConvenience :: addLiquidity : Over the maxDebt'
        );
        require(
            _bondIncreaseAndCollateralPaid <= _safe.maxCollateralPaid,
            'TimeswapConvenience :: addLiquidity : Over the maxCollateralPaid'
        );
        require(
            _bondReceivedAndCollateralLocked <= _safe.maxCollateralLocked,
            'TimeswapConvenience :: addLiquidity : Over the maxCollateralLocked'
        );
    }

    /// @dev Withdraw liquidity from a Timeswap pool before maturity with the burn function in the Timeswap Core contract
    /// @dev Precalculate the collateral ERC20 to be locked
    /// @param _parameter The three parameters for the Timeswap pool
    /// @param _to The receiver of the burn function
    /// @param _liquidityIn The amount of liquidity ERC20 to be burnt
    /// @param _maxCollateralLocked The maximum amount of collateral ERC20 willing to be locked
    /// @param _safe The slippage protections of the burn transaction
    /// @param _deadline The unix timestamp where the transactions must revert after
    /// @return _tokenId The id of the newly minted collateralized debt ERC721 token contract, returns zero if no Collateralized Debt ERC721 is minted
    /// @return _collateralLocked The actual collateral ERC20 locked in the Timeswap Core
    /// @return _debtRequiredAndAssetReceived The debt required and the asset ERC20 received by the receiver
    /// @return _bondReceived The amount of bond ERC20 received by the receiver
    /// @return _insuranceReceived The amount of insurance ERC20 received by the receiver
    function removeLiquidityBeforeMaturity(
        Parameter memory _parameter,
        address _to,
        uint256 _liquidityIn,
        uint256 _maxCollateralLocked,
        SafeBurn memory _safe,
        uint256 _deadline
    )
        external
        override
        ensure(_deadline)
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequiredAndAssetReceived,
            uint256 _bondReceived,
            uint256 _insuranceReceived
        )
    {
        // Get the address of the pool
        IPair _pool = _getPool(_parameter);
        // Sanity checks
        require(_pool != ZERO, 'TimeswapConvenience :: removeLiquidityBeforeMaturity : Pool Does Not Exist');
        require(
            _pool.maturity() > block.timestamp,
            'TimeswapConvenience :: removeLiquidityBeforeMaturity : Pool Matured'
        );
        require(_pool.totalSupply() > 0, 'TimeswapConvenience :: removeLiquidityBeforeMaturity : No Liquidity');

        // Safely transfer liquidity ERC20 to the Timeswap Core pool
        _safeTransferFrom(_pool, msg.sender, _pool, _liquidityIn);

        if (_maxCollateralLocked > 0) {
            // Calculate the collateral ERC20 required to lock
            _collateralLocked = _pool.calculateBurn(_liquidityIn, _maxCollateralLocked);

            // Safely transfer collateral ERC20 to the Timeswap Core pool
            _safeTransferFrom(_parameter.collateral, msg.sender, _pool, _collateralLocked);
        }

        // Call the burn function in the Timeswap Core
        (_tokenId, _collateralLocked, _debtRequiredAndAssetReceived, _bondReceived, _insuranceReceived) = _pool.burn(
            _to
        );

        // Check slippage protection
        require(
            _debtRequiredAndAssetReceived >= _safe.minAsset,
            'TimeswapConvenience :: removeLiquidityBeforeMaturity : Under the minAsset'
        );
        require(
            _bondReceived >= _safe.minBond,
            'TimeswapConvenience :: removeLiquidityBeforeMaturity : Under the minBond'
        );
        require(
            _insuranceReceived >= _safe.minInsurance,
            'TimeswapConvenience :: removeLiquidityBeforeMaturity : Under the minInsurance'
        );
    }

    /// @dev Withdraw liquidity from a Timeswap pool after maturity with the burn function in the Timeswap Core contract
    /// @dev No need for deadline and slippage protection as no slippage can happen after maturity of the pool
    /// @dev No Collateralized Debt ERC721 will be minted anymore after maturity of the pool
    /// @param _parameter The three parameters for the Timeswap pool
    /// @param _to The receiver of the burn function
    /// @param _liquidityIn The amount of liquidity ERC20 to be burnt
    /// @return _bondReceived The amount of bond ERC20 received by the receiver
    /// @return _insuranceReceived The amount of insurance ERC20 received by the receiver
    function removeLiquidityAfterMaturity(
        Parameter memory _parameter,
        address _to,
        uint256 _liquidityIn
    ) external override returns (uint256 _bondReceived, uint256 _insuranceReceived) {
        // Get the address of the pool
        IPair _pool = _getPool(_parameter);
        // Sanity checks
        require(_pool != ZERO, 'TimeswapConvenience :: removeLiquidityAfterMaturity : Pool Does Not Exist');
        require(
            _pool.maturity() <= block.timestamp,
            'TimeswapConvenience :: removeLiquidityAfterMaturity : Pool Not Matured'
        );
        require(_pool.totalSupply() > 0, 'TimeswapConvenience :: removeLiquidityAfterMaturity : No Liquidity');

        // Safely transfer liquidity ERC20 to the Timeswap Core pool
        _safeTransferFrom(_pool, msg.sender, _pool, _liquidityIn);

        // Call the burn function in the Timeswap Core
        (, , , _bondReceived, _insuranceReceived) = _pool.burn(_to);
    }

    /// @dev Lend asset ERC20 with the lend function in the Timeswap Core contract by giving bond received
    /// @param _parameter The three parameters for the Timeswap pool
    /// @param _to The receiver of the lend function
    /// @param _assetIn The amount of asset ERC20 to be lent
    /// @param _givenBondReceived The desired amount of bond ERC20 received
    /// @param _safe The slippage protections of the lend transaction
    /// @param _deadline The unix timestamp where the transactions must revert after
    /// @return _bondReceived The actual amount of bond ERC20 received by the receiver
    /// @return _insuranceReceived The actual amount of insurance ERC20 received by the receiver
    function lendGivenBondReceived(
        Parameter memory _parameter,
        address _to,
        uint256 _assetIn,
        uint256 _givenBondReceived,
        SafeLend memory _safe,
        uint256 _deadline
    ) external override ensure(_deadline) returns (uint256 _bondReceived, uint256 _insuranceReceived) {
        // Get the address of the pool
        IPair _pool = _getPool(_parameter);
        // Sanity checks
        require(_pool != ZERO, 'TimeswapConvenience :: lendGivenBondReceived : Pool Does Not Exist');
        require(_pool.maturity() > block.timestamp, 'TimeswapConvenience :: lendGivenBondReceived : Pool Matured');
        require(_pool.totalSupply() > 0, 'TimeswapConvenience :: lendGivenBondReceived : No Liquidity');

        // Calculate the necessary parameters for the lend function in the Timeswap Core contract
        uint256 _bondDecrease;
        uint256 _rateDecrease;

        (_bondDecrease, _rateDecrease) = _pool.calculateLendGivenBondReceived(_assetIn, _givenBondReceived);

        // Safely transfer asset ERC20 to the Timeswap Core pool
        _safeTransferFrom(_parameter.asset, msg.sender, _pool, _assetIn);

        // Call the lend function in the Timeswap Core
        (_bondReceived, _insuranceReceived) = _pool.lend(_to, _bondDecrease, _rateDecrease);

        // Check slippage protection
        require(_bondReceived >= _safe.minBond, 'TimeswapConvenience :: lendGivenBondReceived : Under the minBond');
        require(
            _insuranceReceived >= _safe.minInsurance,
            'TimeswapConvenience :: lendGivenBondReceived : Under the minInsurance'
        );
    }

    /// @dev Lend asset ERC20 with the lend function in the Timeswap Core contract by giving insurance received
    /// @param _parameter The three parameters for the Timeswap pool
    /// @param _to The receiver of the lend function
    /// @param _assetIn The amount of asset ERC20 to be lent
    /// @param _givenInsuranceReceived The desired amount of insurance ERC20 received
    /// @param _safe The slippage protections of the lend transaction
    /// @param _deadline The unix timestamp where the transactions must revert after
    /// @return _bondReceived The actual amount of bond ERC20 received by the receiver
    /// @return _insuranceReceived The actual amount of insurance ERC20 received by the receiver
    function lendGivenInsuranceReceived(
        Parameter memory _parameter,
        address _to,
        uint256 _assetIn,
        uint256 _givenInsuranceReceived,
        SafeLend memory _safe,
        uint256 _deadline
    ) external override ensure(_deadline) returns (uint256 _bondReceived, uint256 _insuranceReceived) {
        // Get the address of the pool
        IPair _pool = _getPool(_parameter);
        // Sanity checks
        require(_pool != ZERO, 'TimeswapConvenience :: lendGivenInsuranceReceived : Pool Does Not Exist');
        require(_pool.maturity() > block.timestamp, 'TimeswapConvenience :: lendGivenInsuranceReceived : Pool Matured');
        require(_pool.totalSupply() > 0, 'TimeswapConvenience :: lendGivenInsuranceReceived : No Liquidity');

        // Calculate the necessary parameters for the lend function in the Timeswap Core contract
        uint256 _bondDecrease;
        uint256 _rateDecrease;

        (_bondDecrease, _rateDecrease) = _pool.calculateLendGivenInsuranceReceived(_assetIn, _givenInsuranceReceived);

        // Safely transfer asset ERC20 to the Timeswap Core pool
        _safeTransferFrom(_parameter.asset, msg.sender, _pool, _assetIn);

        // Call the lend function in the Timeswap Core
        (_bondReceived, _insuranceReceived) = _pool.lend(_to, _bondDecrease, _rateDecrease);

        // Check slippage protection
        require(
            _bondReceived >= _safe.minBond,
            'TimeswapConvenience :: lendGivenInsuranceReceived : Under the minBond'
        );
        require(
            _insuranceReceived >= _safe.minInsurance,
            'TimeswapConvenience :: lendGivenInsuranceReceived : Under the minInsurance'
        );
    }

    /// @dev Borrw asset ERC20 and lock collateral with the borrow function in the Timeswap Core contract given collateral locked
    /// @param _parameter The three parameters for the Timeswap pool
    /// @param _to The receiver of the borrow function
    /// @param _assetReceived The amount of asset ERC20 to be borrowed
    /// @param _givenCollateralLocked The desired amount of interest required
    /// @param _safe The slippage protections of the borrow transaction
    /// @param _deadline The unix timestamp where the transactions must revert after
    /// @return _tokenId The id of the newly minted collateralized debt ERC721 token contract
    /// @return _collateralLocked The actual amount of collateral ERC20 locked by the receiver
    /// @return _debtRequired The actual amount of debt required
    function borrowGivenCollateralLocked(
        Parameter memory _parameter,
        address _to,
        uint256 _assetReceived,
        uint256 _givenCollateralLocked,
        SafeBorrow memory _safe,
        uint256 _deadline
    )
        external
        override
        ensure(_deadline)
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequired
        )
    {
        // Get the address of the pool
        IPair _pool = _getPool(_parameter);
        // Sanity checks
        require(_pool != ZERO, 'TimeswapConvenience :: borrowGivenCollateralLocked : Pool Does Not Exist');
        require(
            _pool.maturity() > block.timestamp,
            'TimeswapConvenience :: borrowGivenCollateralLocked : Pool Matured'
        );
        require(_pool.totalSupply() > 0, 'TimeswapConvenience :: borrowGivenCollateralLocked : No Liquidity');

        // Calculate the necessary parameters for the borrow function in the Timeswap Core contract
        uint256 _bondIncrease;
        uint256 _rateIncrease;
        (_bondIncrease, _rateIncrease, _collateralLocked) = _pool.calculateBorrowGivenDesiredCollateralLocked(
            _assetReceived,
            _givenCollateralLocked
        );

        // Safely transfer collateral ERC20 to the Timeswap Core pool
        _safeTransferFrom(_parameter.collateral, msg.sender, _pool, _collateralLocked);

        // Call the borrow function in the Timeswap Core
        (_tokenId, _collateralLocked, _debtRequired) = _pool.borrow(_to, _assetReceived, _bondIncrease, _rateIncrease);

        // Check slippage protection
        require(
            _collateralLocked <= _safe.maxCollateralLocked,
            'TimeswapConvenience :: borrowGivenCollateralLocked : Over the maxCollateralLocked'
        );
        require(
            _debtRequired - _assetReceived <= _safe.maxInterestRequired,
            'TimeswapConvenience :: borrowGivenCollateralLocked : Over the maxInterestRequired'
        );
    }

    /// @dev Borrw asset ERC20 and lock collateral with the borrow function in the Timeswap Core contract given interest required
    /// @param _parameter The three parameters for the Timeswap pool
    /// @param _to The receiver of the borrow function
    /// @param _assetReceived The amount of asset ERC20 to be borrowed
    /// @param _givenInterestRequired The desired amount of interest required
    /// @param _safe The slippage protections of the borrow transaction
    /// @param _deadline The unix timestamp where the transactions must revert after
    /// @return _tokenId The id of the newly minted collateralized debt ERC721 token contract
    /// @return _collateralLocked The actual amount of collateral ERC20 locked by the receiver
    /// @return _debtRequired The actual amount of debt required
    function borrowGivenInterestRequired(
        Parameter memory _parameter,
        address _to,
        uint256 _assetReceived,
        uint256 _givenInterestRequired,
        SafeBorrow memory _safe,
        uint256 _deadline
    )
        external
        override
        ensure(_deadline)
        returns (
            uint256 _tokenId,
            uint256 _collateralLocked,
            uint256 _debtRequired
        )
    {
        // Get the address of the pool
        IPair _pool = _getPool(_parameter);
        // Sanity checks
        require(_pool != ZERO, 'TimeswapConvenience :: borrowGivenInterestRequired : Pool Does Not Exist');
        require(
            _pool.maturity() > block.timestamp,
            'TimeswapConvenience :: borrowGivenInterestRequired : Pool Matured'
        );
        require(_pool.totalSupply() > 0, 'TimeswapConvenience :: borrowGivenInterestRequired : No Liquidity');

        // Calculate the necessary parameters for the borrow function in the Timeswap Core contract
        uint256 _bondIncrease;
        uint256 _rateIncrease;
        (_bondIncrease, _rateIncrease, _collateralLocked) = _pool.calculateBorrowGivenInterestRequired(
            _assetReceived,
            _givenInterestRequired
        );

        // Safely transfer collateral ERC20 to the Timeswap Core pool
        _safeTransferFrom(_parameter.collateral, msg.sender, _pool, _collateralLocked);

        // Call the borrow function in the Timeswap Core
        (_tokenId, _collateralLocked, _debtRequired) = _pool.borrow(_to, _assetReceived, _bondIncrease, _rateIncrease);

        // Check slippage protection
        require(
            _collateralLocked <= _safe.maxCollateralLocked,
            'TimeswapConvenience :: borrowGivenInterestRequired : Over the maxCollateralLocked'
        );
        require(
            _debtRequired - _assetReceived <= _safe.maxInterestRequired,
            'TimeswapConvenience :: borrowGivenInterestRequired : Over the maxInterestRequired'
        );
    }

    /// @dev Pay back the debt of the collateralized debt ERC721 with the pay function in the Tiemswap Core contract
    /// @dev No need for slippage protection as no slippage can happen with debt payment
    /// @param _parameter The three parameters for the Timeswap pool
    /// @param _to The receiver of the pay function
    /// @param _tokenId The id of the collateralized debt ERC721, the receiver is the owner of the token
    /// @param _assetIn The amount of asset ERC20 to be deposited to pay back debt
    /// @param _deadline The unix timestamp where the transactions must revert after
    /// @return _collateralReceived The amount of collateral ERC20 to be unlocked and received by the receiver
    function repay(
        Parameter memory _parameter,
        address _to,
        uint256 _tokenId,
        uint256 _assetIn,
        uint256 _deadline
    ) external override ensure(_deadline) returns (uint256 _collateralReceived) {
        // Get the address of the pool
        IPair _pool = _getPool(_parameter);
        // Sanity checks
        require(_pool != ZERO, 'TimeswapConvenience :: repay : Pool Does Not Exist');
        require(_pool.maturity() > block.timestamp, 'TimeswapConvenience :: repay : Pool Matured');
        require(_pool.totalSupply() > 0, 'TimeswapConvenience :: repay : No Liquidity');

        IERC721 _collateralizedDebt = _pool.collateralizedDebt();

        // Safely transfer collateralized debt ERC721 to this contract
        _collateralizedDebt.safeTransferFrom(msg.sender, address(this), _tokenId);

        // Safely transfer asset ERC20 to the Timeswap Core pool
        _safeTransferFrom(_parameter.asset, msg.sender, _pool, _assetIn);

        // Call the pay function in the Timeswap Core
        _collateralReceived = _pool.pay(_to, _tokenId);

        // Safely transfer back the collateralized debt ERC721 to msg.sender
        _collateralizedDebt.safeTransferFrom(address(this), msg.sender, _tokenId);
    }

    /// @dev Pay back the debt of multiple collateralized debt ERC721 with the multiple pay function in the Tiemswap Core contract
    /// @dev No need for slippage protection as no slippage can happen with debt payment
    /// @param _parameter The three parameters for the Timeswap pool
    /// @param _to The receiver of the pay function
    /// @param _tokenIds The array of ids of the collateralized debt ERC721, the receiver is the owner of the token
    /// @param _assetsIn The array of amount of asset ERC20 to be deposited to pay back debt per collateralized debt ERC721
    /// @param _deadline The unix timestamp where the transactions must revert after
    /// @return _collateralReceived The total amount of collateral ERC20 to be unlocked
    function repayMultiple(
        Parameter memory _parameter,
        address _to,
        uint256[] memory _tokenIds,
        uint256[] memory _assetsIn,
        uint256 _deadline
    ) external override ensure(_deadline) returns (uint256 _collateralReceived) {
        // Must have equal lengths array
        require(_tokenIds.length == _assetsIn.length, 'TimeswapConvenience :: repayMultiple : Unequal Length');

        // Get the address of the pool
        IPair _pool = _getPool(_parameter);
        // Sanity checks
        require(_pool != ZERO, 'TimeswapConvenience :: repayMultiple : Pool Does Not Exist');
        require(_pool.maturity() > block.timestamp, 'TimeswapConvenience :: repayMultiple : Pool Matured');
        require(_pool.totalSupply() > 0, 'TimeswapConvenience :: repayMultiple : No Liquidity');

        IERC721 _collateralizedDebt = _pool.collateralizedDebt();

        for (uint256 _index = 0; _index < _tokenIds.length; _index++) {
            uint256 _tokenId = _tokenIds[_index]; // gas saving

            // Safely transfer collateralized debt ERC721 to this contract
            _collateralizedDebt.safeTransferFrom(msg.sender, address(this), _tokenId);

            // Safely transfer asset ERC20 to the Timeswap Core pool
            _safeTransferFrom(_parameter.asset, msg.sender, _pool, _assetsIn[_index]);

            // Call the pay function in the Timeswap Core
            _collateralReceived += _pool.pay(_to, _tokenId);

            // Safely transfer back the collateralized debt ERC721 to msg.sender
            _collateralizedDebt.safeTransferFrom(address(this), msg.sender, _tokenId);
        }
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /* ===== HELPER ===== */

    /// @dev Safely transfer the tokens of an ERC20 token contract
    /// @dev Will revert if failed at calling the transfer function
    function _safeTransferFrom(
        IERC20 _token,
        address _from,
        IPair _to,
        uint256 _value
    ) private {
        (bool _success, bytes memory _data) = address(_token).call(
            abi.encodeWithSelector(TRANSFER_FROM, _from, address(_to), _value)
        );
        require(
            _success && (_data.length == 0 || abi.decode(_data, (bool))),
            'TimeswapConvenience :: _safeTransfer : Transfer Failed'
        );
    }

    /// @dev Get the address of the Timeswap Core pool given the parameters
    function _getPair(Parameter memory _parameter) private view returns (IPair _pair) {
        _pair = factory.getPair(_parameter.asset, _parameter.collateral);
    }

    /// @dev Deploy a new Timeswap Core pool given the parameters
    function _createPair(Parameter memory _parameter) private returns (IPair _pair) {
        _pair = factory.createPair(_parameter.asset, _parameter.collateral);
    }
}
