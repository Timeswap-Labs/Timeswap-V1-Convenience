// SPDX-License-Identifier: BUSL-1.1

pragma solidity =0.8.4;

import {IConvenience} from './interfaces/IConvenience.sol';
import {IFactory} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IFactory.sol';
import {IMint} from './interfaces/IMint.sol';
import {IBurn} from './interfaces/IBurn.sol';
import {ILend} from './interfaces/ILend.sol';
import {IWithdraw} from './interfaces/IWithdraw.sol';
import {IBorrow} from './interfaces/IBorrow.sol';
import {IPay} from './interfaces/IPay.sol';
import {IWETH} from './interfaces/IWETH.sol';
import {IDue} from './interfaces/IDue.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {ITimeswapMintCallback} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/callback/ITimeswapMintCallback.sol';
import {ITimeswapLendCallback} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/callback/ITimeswapLendCallback.sol';
import {ITimeswapBorrowCallback} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/callback/ITimeswapBorrowCallback.sol';
import {ITimeswapPayCallback} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/callback/ITimeswapPayCallback.sol';
import {Mint} from './libraries/Mint.sol';
import {Burn} from './libraries/Burn.sol';
import {Lend} from './libraries/Lend.sol';
import {Withdraw} from './libraries/Withdraw.sol';
import {Borrow} from './libraries/Borrow.sol';
import {Pay} from './libraries/Pay.sol';
import {DeployNative} from './libraries/DeployNative.sol';
import {SafeTransfer} from './libraries/SafeTransfer.sol';
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";


/// @title Timeswap Convenience
/// @author Timeswap Labs
/// @notice It is recommnded to use this contract to interact with Timeswap Core contract.
/// @notice All error messages are abbreviated and can be found in the documentation.
contract TimeswapConvenience is IConvenience, ERC2771Context {
    using SafeTransfer for IERC20;

    /* ===== MODEL ===== */

    /// @inheritdoc IConvenience
    IFactory public immutable override factory;
    /// @inheritdoc IConvenience
    IWETH public immutable override weth;

    /// @dev Stores the addresses of the Liquidty, Bond, Insurance, Collateralized Debt token contracts.
    mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native))) private natives;

    /* ===== VIEW ===== */

    /// @inheritdoc IConvenience
    function getNative(
        IERC20 asset,
        IERC20 collateral,
        uint256 maturity
    ) external view override returns (Native memory) {
        return natives[asset][collateral][maturity];
    }

    /* ===== INIT ===== */

    /// @dev Initializes the Convenience contract.
    /// @param _factory The address of factory contract used by this contract.
    /// @param _weth The address of the Wrapped ETH contract.
    constructor(IFactory _factory, IWETH _weth, address _trustedForwarder) public ERC2771Context(_trustedForwarder) {
        require(address(_factory) != address(0), 'E601');
        require(address(_weth) != address(0), 'E601');
        require(address(_factory) != address(_weth), 'E612');

        factory = _factory;
        weth = _weth;
    }

    /* ===== UPDATE ===== */

    receive() external payable {
        require(msg.sender == address(weth), 'E615');
    }

    /// @inheritdoc IConvenience
    function deployPair(DeployPair calldata params) external override {
        factory.createPair(params.asset, params.collateral);
    }

    /// @inheritdoc IConvenience
    function deployNatives(DeployNatives calldata params) external override {
        DeployNative.deploy(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function newLiquidity(IMint.NewLiquidity calldata params)
        external
        override
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetIn, liquidityOut, id, dueOut) = Mint.newLiquidity(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function newLiquidityETHAsset(IMint.NewLiquidityETHAsset calldata params)
        external
        payable
        override
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetIn, liquidityOut, id, dueOut) = Mint.newLiquidityETHAsset(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function newLiquidityETHCollateral(IMint.NewLiquidityETHCollateral calldata params)
        external
        payable
        override
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetIn, liquidityOut, id, dueOut) = Mint.newLiquidityETHCollateral(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function liquidityGivenAsset(IMint.LiquidityGivenAsset calldata params)
        external
        override
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetIn, liquidityOut, id, dueOut) = Mint.liquidityGivenAsset(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function liquidityGivenAssetETHAsset(IMint.LiquidityGivenAssetETHAsset calldata params)
        external
        payable
        override
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetIn, liquidityOut, id, dueOut) = Mint.liquidityGivenAssetETHAsset(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function liquidityGivenAssetETHCollateral(IMint.LiquidityGivenAssetETHCollateral calldata params)
        external
        payable
        override
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetIn, liquidityOut, id, dueOut) = Mint.liquidityGivenAssetETHCollateral(
            natives,
            this,
            factory,
            weth,
            params
        );
    }

    /// @inheritdoc IConvenience
    function liquidityGivenDebt(IMint.LiquidityGivenDebt calldata params)
        external
        override
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetIn, liquidityOut, id, dueOut) = Mint.liquidityGivenDebt(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function liquidityGivenDebtETHAsset(IMint.LiquidityGivenDebtETHAsset calldata params)
        external
        payable
        override
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetIn, liquidityOut, id, dueOut) = Mint.liquidityGivenDebtETHAsset(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function liquidityGivenDebtETHCollateral(IMint.LiquidityGivenDebtETHCollateral calldata params)
        external
        payable
        override
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetIn, liquidityOut, id, dueOut) = Mint.liquidityGivenDebtETHCollateral(
            natives,
            this,
            factory,
            weth,
            params
        );
    }

    /// @inheritdoc IConvenience
    function liquidityGivenCollateral(IMint.LiquidityGivenCollateral calldata params)
        external
        override
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetIn, liquidityOut, id, dueOut) = Mint.liquidityGivenCollateral(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function liquidityGivenCollateralETHAsset(IMint.LiquidityGivenCollateralETHAsset calldata params)
        external
        payable
        override
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetIn, liquidityOut, id, dueOut) = Mint.liquidityGivenCollateralETHAsset(
            natives,
            this,
            factory,
            weth,
            params
        );
    }

    /// @inheritdoc IConvenience
    function liquidityGivenCollateralETHCollateral(IMint.LiquidityGivenCollateralETHCollateral calldata params)
        external
        payable
        override
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetIn, liquidityOut, id, dueOut) = Mint.liquidityGivenCollateralETHCollateral(
            natives,
            this,
            factory,
            weth,
            params
        );
    }

    /// @inheritdoc IConvenience
    function removeLiquidity(IBurn.RemoveLiquidity calldata params)
        external
        override
        returns (uint256 assetOut, uint128 collateralOut)
    {
        (assetOut, collateralOut) = Burn.removeLiquidity(natives, factory, params);
    }

    /// @inheritdoc IConvenience
    function removeLiquidityETHAsset(IBurn.RemoveLiquidityETHAsset calldata params)
        external
        override
        returns (uint256 assetOut, uint128 collateralOut)
    {
        (assetOut, collateralOut) = Burn.removeLiquidityETHAsset(natives, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function removeLiquidityETHCollateral(IBurn.RemoveLiquidityETHCollateral calldata params)
        external
        override
        returns (uint256 assetOut, uint128 collateralOut)
    {
        (assetOut, collateralOut) = Burn.removeLiquidityETHCollateral(natives, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenBond(ILend.LendGivenBond calldata params)
        external
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenBond(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenBondETHAsset(ILend.LendGivenBondETHAsset calldata params)
        external
        payable
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenBondETHAsset(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenBondETHCollateral(ILend.LendGivenBondETHCollateral calldata params)
        external
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenBondETHCollateral(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenInsurance(ILend.LendGivenInsurance calldata params)
        external
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenInsurance(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenInsuranceETHAsset(ILend.LendGivenInsuranceETHAsset calldata params)
        external
        payable
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenInsuranceETHAsset(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenInsuranceETHCollateral(ILend.LendGivenInsuranceETHCollateral calldata params)
        external
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenInsuranceETHCollateral(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenPercent(ILend.LendGivenPercent calldata params)
        external
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenPercent(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenPercentETHAsset(ILend.LendGivenPercentETHAsset calldata params)
        external
        payable
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenPercentETHAsset(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenPercentETHCollateral(ILend.LendGivenPercentETHCollateral calldata params)
        external
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenPercentETHCollateral(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function collect(IWithdraw.Collect calldata params) external override returns (IPair.Tokens memory tokensOut) {
        tokensOut = Withdraw.collect(natives, factory, params);
    }

    /// @inheritdoc IConvenience
    function collectETHAsset(IWithdraw.CollectETHAsset calldata params)
        external
        override
        returns (IPair.Tokens memory tokensOut)
    {
        tokensOut = Withdraw.collectETHAsset(natives, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function collectETHCollateral(IWithdraw.CollectETHCollateral calldata params)
        external
        override
        returns (IPair.Tokens memory tokensOut)
    {
        tokensOut = Withdraw.collectETHCollateral(natives, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function borrowGivenDebt(IBorrow.BorrowGivenDebt calldata params)
        external
        override
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetOut, id, dueOut) = Borrow.borrowGivenDebt(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function borrowGivenDebtETHAsset(IBorrow.BorrowGivenDebtETHAsset calldata params)
        external
        override
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetOut, id, dueOut) = Borrow.borrowGivenDebtETHAsset(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function borrowGivenDebtETHCollateral(IBorrow.BorrowGivenDebtETHCollateral calldata params)
        external
        payable
        override
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetOut, id, dueOut) = Borrow.borrowGivenDebtETHCollateral(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function borrowGivenCollateral(IBorrow.BorrowGivenCollateral calldata params)
        external
        override
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetOut, id, dueOut) = Borrow.borrowGivenCollateral(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function borrowGivenCollateralETHAsset(IBorrow.BorrowGivenCollateralETHAsset calldata params)
        external
        override
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetOut, id, dueOut) = Borrow.borrowGivenCollateralETHAsset(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function borrowGivenCollateralETHCollateral(IBorrow.BorrowGivenCollateralETHCollateral calldata params)
        external
        payable
        override
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetOut, id, dueOut) = Borrow.borrowGivenCollateralETHCollateral(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function borrowGivenPercent(IBorrow.BorrowGivenPercent calldata params)
        external
        override
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetOut, id, dueOut) = Borrow.borrowGivenPercent(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function borrowGivenPercentETHAsset(IBorrow.BorrowGivenPercentETHAsset calldata params)
        external
        override
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetOut, id, dueOut) = Borrow.borrowGivenPercentETHAsset(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function borrowGivenPercentETHCollateral(IBorrow.BorrowGivenPercentETHCollateral calldata params)
        external
        payable
        override
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (assetOut, id, dueOut) = Borrow.borrowGivenPercentETHCollateral(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function repay(IPay.Repay calldata params) external override returns (uint128 assetIn, uint128 collateralOut) {
        (assetIn, collateralOut) = Pay.pay(natives, factory, params);
    }

    /// @inheritdoc IConvenience
    function repayETHAsset(IPay.RepayETHAsset calldata params)
        external
        payable
        override
        returns (uint128 assetIn, uint128 collateralOut)
    {
        (assetIn, collateralOut) = Pay.payETHAsset(natives, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function repayETHCollateral(IPay.RepayETHCollateral calldata params)
        external
        override
        returns (uint128 assetIn, uint128 collateralOut)
    {
        (assetIn, collateralOut) = Pay.payETHCollateral(natives, factory, weth, params);
    }

    /// @inheritdoc ITimeswapMintCallback
    function timeswapMintCallback(
        uint256 assetIn,
        uint112 collateralIn,
        bytes calldata data
    ) external override {
        (IERC20 asset, IERC20 collateral, address assetFrom, address collateralFrom) = abi.decode(
            data,
            (IERC20, IERC20, address, address)
        );
        IPair pair = getPairAndVerify(asset, collateral);
        callbackTransfer(asset, assetFrom, pair, assetIn);
        callbackTransfer(collateral, collateralFrom, pair, collateralIn);
    }

    /// @inheritdoc ITimeswapLendCallback
    function timeswapLendCallback(uint256 assetIn, bytes calldata data) external override {
        (IERC20 asset, IERC20 collateral, address from) = abi.decode(data, (IERC20, IERC20, address));
        IPair pair = getPairAndVerify(asset, collateral);
        callbackTransfer(asset, from, pair, assetIn);
    }

    /// @inheritdoc ITimeswapBorrowCallback
    function timeswapBorrowCallback(uint112 collateralIn, bytes calldata data) external override {
        (IERC20 asset, IERC20 collateral, address from) = abi.decode(data, (IERC20, IERC20, address));
        IPair pair = getPairAndVerify(asset, collateral);
        callbackTransfer(collateral, from, pair, collateralIn);
    }

    /// @inheritdoc ITimeswapPayCallback
    function timeswapPayCallback(uint128 assetIn, bytes calldata data) external override {
        (IERC20 asset, IERC20 collateral, address from) = abi.decode(data, (IERC20, IERC20, address));
        IPair pair = getPairAndVerify(asset, collateral);
        callbackTransfer(asset, from, pair, assetIn);
    }

    function getPairAndVerify(IERC20 asset, IERC20 collateral) private view returns (IPair pair) {
        pair = factory.getPair(asset, collateral);
        require(msg.sender == address(pair), 'E701');
    }

    function callbackTransfer(
        IERC20 token,
        address from,
        IPair pair,
        uint256 tokenIn
    ) private {
        if (from == address(this)) {
            weth.deposit{value: tokenIn}();
            token.safeTransfer(pair, tokenIn);
        } else {
            token.safeTransferFrom(from, pair, tokenIn);
        }
    }
}
