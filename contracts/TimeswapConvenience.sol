// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {IConvenience} from './interfaces/IConvenience.sol';
import {IFactory} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IFactory.sol';
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
import 'hardhat/console.sol';

/// @title Timeswap Convenience
/// @author Timeswap Labs
/// @notice It is recommnded to use this contract to interact with Timeswap Core contract.
/// @notice All error messages are abbreviated and can be found in the documentation.
contract TimeswapConvenience is IConvenience {
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
    constructor(IFactory _factory, IWETH _weth) {
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
    function newLiquidity(NewLiquidity calldata params)
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
    function newLiquidityETHAsset(NewLiquidityETHAsset calldata params)
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
    function newLiquidityETHCollateral(NewLiquidityETHCollateral calldata params)
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
    function liquidityGivenAsset(LiquidityGivenAsset calldata params)
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
    function liquidityGivenAssetETHAsset(LiquidityGivenAssetETHAsset calldata params)
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
    function liquidityGivenAssetETHCollateral(LiquidityGivenAssetETHCollateral calldata params)
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
    function liquidityGivenDebt(LiquidityGivenDebt calldata params)
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
    function liquidityGivenDebtETHAsset(LiquidityGivenDebtETHAsset calldata params)
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
    function liquidityGivenDebtETHCollateral(LiquidityGivenDebtETHCollateral calldata params)
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
    function liquidityGivenCollateral(LiquidityGivenCollateral calldata params)
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
    function liquidityGivenCollateralETHAsset(LiquidityGivenCollateralETHAsset calldata params)
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
    function liquidityGivenCollateralETHCollateral(LiquidityGivenCollateralETHCollateral calldata params)
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
    function removeLiquidity(RemoveLiquidity calldata params)
        external
        override
        returns (uint256 assetOut, uint128 collateralOut)
    {
        (assetOut, collateralOut) = Burn.removeLiquidity(natives, factory, params);
    }

    /// @inheritdoc IConvenience
    function removeLiquidityETHAsset(RemoveLiquidityETHAsset calldata params)
        external
        override
        returns (uint256 assetOut, uint128 collateralOut)
    {
        (assetOut, collateralOut) = Burn.removeLiquidityETHAsset(natives, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function removeLiquidityETHCollateral(RemoveLiquidityETHCollateral calldata params)
        external
        override
        returns (uint256 assetOut, uint128 collateralOut)
    {
        (assetOut, collateralOut) = Burn.removeLiquidityETHCollateral(natives, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenBond(LendGivenBond calldata params)
        external
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenBond(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenBondETHAsset(LendGivenBondETHAsset calldata params)
        external
        payable
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenBondETHAsset(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenBondETHCollateral(LendGivenBondETHCollateral calldata params)
        external
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenBondETHCollateral(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenInsurance(LendGivenInsurance calldata params)
        external
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenInsurance(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenInsuranceETHAsset(LendGivenInsuranceETHAsset calldata params)
        external
        payable
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenInsuranceETHAsset(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenInsuranceETHCollateral(LendGivenInsuranceETHCollateral calldata params)
        external
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenInsuranceETHCollateral(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenPercent(LendGivenPercent calldata params)
        external
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenPercent(natives, this, factory, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenPercentETHAsset(LendGivenPercentETHAsset calldata params)
        external
        payable
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenPercentETHAsset(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function lendGivenPercentETHCollateral(LendGivenPercentETHCollateral calldata params)
        external
        override
        returns (uint256 assetIn, IPair.Claims memory claimsOut)
    {
        (assetIn, claimsOut) = Lend.lendGivenPercentETHCollateral(natives, this, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function collect(Collect calldata params) external override returns (IPair.Tokens memory tokensOut) {
        tokensOut = Withdraw.collect(natives, factory, params);
    }

    /// @inheritdoc IConvenience
    function collectETHAsset(CollectETHAsset calldata params)
        external
        override
        returns (IPair.Tokens memory tokensOut)
    {
        tokensOut = Withdraw.collectETHAsset(natives, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function collectETHCollateral(CollectETHCollateral calldata params)
        external
        override
        returns (IPair.Tokens memory tokensOut)
    {
        tokensOut = Withdraw.collectETHCollateral(natives, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function borrowGivenDebt(BorrowGivenDebt calldata params)
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
    function borrowGivenDebtETHAsset(BorrowGivenDebtETHAsset calldata params)
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
    function borrowGivenDebtETHCollateral(BorrowGivenDebtETHCollateral calldata params)
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
    function borrowGivenCollateral(BorrowGivenCollateral calldata params)
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
    function borrowGivenCollateralETHAsset(BorrowGivenCollateralETHAsset calldata params)
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
    function borrowGivenCollateralETHCollateral(BorrowGivenCollateralETHCollateral calldata params)
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
    function borrowGivenPercent(BorrowGivenPercent calldata params)
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
    function borrowGivenPercentETHAsset(BorrowGivenPercentETHAsset calldata params)
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
    function borrowGivenPercentETHCollateral(BorrowGivenPercentETHCollateral calldata params)
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
    function repay(Repay calldata params) external override returns (uint128 assetIn, uint128 collateralOut) {
        (assetIn, collateralOut) = Pay.pay(natives, factory, params);
    }

    /// @inheritdoc IConvenience
    function repayETHAsset(RepayETHAsset calldata params)
        external
        payable
        override
        returns (uint128 assetIn, uint128 collateralOut)
    {
        (assetIn, collateralOut) = Pay.payETHAsset(natives, factory, weth, params);
    }

    /// @inheritdoc IConvenience
    function repayETHCollateral(RepayETHCollateral calldata params)
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
