// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from './interfaces/IConvenience.sol';
import {IFactory} from './interfaces/IFactory.sol';
import {IWETH} from './interfaces/IWETH.sol';
import {IPair} from './interfaces/IPair.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {Mint} from './libraries/Mint.sol';
import {Burn} from './libraries/Burn.sol';
import {Lend} from './libraries/Lend.sol';
import {Withdraw} from './libraries/Withdraw.sol';
import {Borrow} from './libraries/Borrow.sol';
import {Pay} from './libraries/Pay.sol';
import {SafeTransfer} from './libraries/SafeTransfer.sol';
import {DeployNatives} from './libraries/DeployNatives.sol';

/// @title Timeswap Convenience
/// @author Timeswap Labs
/// @notice It is recommnded to use this contract to interact with Timeswap Core contract.
/// @notice All error messages are abbreviated and can be found in the documentation.
contract TimeswapConvenience is IConvenience {
    using SafeTransfer for IERC20;
    using Mint for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));
    using Burn for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));
    using Lend for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));
    using Withdraw for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));
    using Borrow for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));
    using Pay for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));
    using DeployNatives for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));

    /* ===== MODEL ===== */

    /// @dev The address of the factory contract used by this contract.
    IFactory public immutable override factory;
    /// @dev The address of the Wrapped ETH contract.
    IWETH public immutable weth;

    /// @dev Stores the addresses of the Liquiidty, Bond, Insurance, Collateralized Debt token contract.
    mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native))) public natives;

    /* ===== INIT ===== */

    /// @dev Initializes the Convenience contract.
    /// @param _factory The address of factory contract used by this contract.
    /// @param _weth The address of the Wrapped ETH contract.
    constructor(IFactory _factory, IWETH _weth) {
        factory = _factory;
        weth = _weth;
    }

    /// @dev Calls the mint function and creates a new pool.
    /// @dev If the pair does not exist, creates a new pair first.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function newLiquidity(NewLiquidity calldata params)
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = natives.newLiquidity(this, factory, params);
    }

    /// @dev Calls the mint function and creates a new pool.
    /// @dev If the pair does not exist, creates a new pair first.
    /// @dev The asset deposited is ETH which is wrapped as WETH.
    /// @dev Msg.value is the assetIn amount.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function newLiquidityETHAsset(NewLiquidityETHAsset calldata params)
        external
        payable
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = natives.newLiquidityETHAsset(this, factory, weth, params);
    }

    /// @dev Calls the mint function and creates a new pool.
    /// @dev If the pair does not exist, creates a new pair first.
    /// @dev The collateral locked is ETH which is wrapped as WETH.
    /// @dev Msg.value is the collateralIn amount.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function newLiquidityETHCollateral(NewLiquidityETHCollateral calldata params)
        external
        payable
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = natives.newLiquidityETHCollateral(this, factory, weth, params);
    }

    /// @dev Calls the mint function and add more liquidity to an existing pool.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function addLiquidity(AddLiquidity calldata params)
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = natives.addLiquidity(this, factory, params);
    }

    /// @dev Calls the mint function and add more liquidity to an existing pool.
    /// @dev The asset deposited is ETH which is wrapped as WETH.
    /// @dev Msg.value is the assetIn amount.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function addLiquidityETHAsset(AddLiquidityETHAsset calldata params)
        external
        payable
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = natives.addLiquidityETHAsset(this, factory, weth, params);
    }

    /// @dev Calls the mint function and add more liquidity to an existing pool.
    /// @dev The collateral ERC20 is the WETH contract.
    /// @dev The collateral locked is ETH which is wrapped as WETH.
    /// @dev Msg.value is the maxCollateral amount. Any excess ETH will be returned to Msg.sender.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function addLiquidityETHCollateral(AddLiquidityETHCollateral calldata params)
        external
        payable
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = natives.addLiquidityETHCollateral(this, factory, weth, params);
    }

    /// @dev Calls the burn funtion and withdraw liquiidty from a pool.
    /// @param params The parameters for this function found in IBurn interface.
    function removeLiquidity(RemoveLiquidity calldata params) external returns (IPair.Tokens memory tokensOut) {
        tokensOut = natives.removeLiquidity(factory, params);
    }

    function removeLiquidityETHAsset(RemoveLiquidityETHAsset calldata params)
        external
        returns (IPair.Tokens memory tokensOut)
    {
        tokensOut = natives.removeLiquidityETHAsset(factory, weth, params);
    }

    function removeLiquidityETHCollateral(RemoveLiquidityETHCollateral calldata params)
        external
        returns (IPair.Tokens memory tokensOut)
    {
        tokensOut = natives.removeLiquidityETHCollateral(factory, weth, params);
    }

    function lendGivenBond(LendGivenBond calldata params) external returns (IPair.Claims memory claimsOut) {
        claimsOut = natives.lendGivenBond(this, factory, params);
    }

    function lendGivenBondETHAsset(LendGivenBondETHAsset calldata params)
        external
        payable
        returns (IPair.Claims memory claimsOut)
    {
        claimsOut = natives.lendGivenBondETHAsset(this, factory, weth, params);
    }

    function lendGivenBondETHCollateral(LendGivenBondETHCollateral calldata params)
        external
        payable
        returns (IPair.Claims memory claimsOut)
    {
        claimsOut = natives.lendGivenBondETHCollateral(this, factory, weth, params);
    }

    function lendGivenInsurance(LendGivenInsurance calldata params) external returns (IPair.Claims memory claimsOut) {
        claimsOut = natives.lendGivenInsurance(this, factory, params);
    }

    function lendGivenInsuranceETHAsset(LendGivenInsuranceETHAsset calldata params)
        external
        returns (IPair.Claims memory claimsOut)
    {
        claimsOut = natives.lendGivenInsuranceETHAsset(this, factory, weth, params);
    }

    function lendGivenInsuranceETHCollateral(LendGivenInsuranceETHCollateral calldata params)
        external
        returns (IPair.Claims memory claimsOut)
    {
        claimsOut = natives.lendGivenInsuranceETHCollateral(this, factory, weth, params);
    }

    function collect(Collect calldata params) external returns (IPair.Tokens memory tokensOut) {
        tokensOut = natives.collect(factory, params);
    }

    function collectETHAsset(CollectETHAsset calldata params) external returns (IPair.Tokens memory tokensOut) {
        tokensOut = natives.collectETHAsset(factory, weth, params);
    }

    function collectETHCollateral(CollectETHCollateral calldata params)
        external
        returns (IPair.Tokens memory tokensOut)
    {
        tokensOut = natives.collectETHCollateral(factory, weth, params);
    }

    function borrowGivenDebt(BorrowGivenDebt calldata params) external returns (uint256 id, IPair.Due memory dueOut) {
        (id, dueOut) = natives.borrowGivenDebt(this, factory, params);
    }

    function borrowGivenDebtETHAsset(BorrowGivenDebtETHAsset calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = natives.borrowGivenDebtETHAsset(this, factory, weth, params);
    }

    function borrowGivenDebtETHCollateral(BorrowGivenDebtETHCollateral calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = natives.borrowGivenDebtETHCollateral(this, factory, weth, params);
    }

    function borrowGivenCollateral(BorrowGivenCollateral calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = natives.borrowGivenCollateral(this, factory, params);
    }

    function borrowGivenCollateralETHAsset(BorrowGivenCollateralETHAsset calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = natives.borrowGivenCollateralETHAsset(this, factory, weth, params);
    }

    function borrowGivenCollateralETHCollateral(BorrowGivenCollateralETHCollateral calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = natives.borrowGivenCollateralETHCollateral(this, factory, weth, params);
    }

    function borrowGivenPercent(BorrowGivenPercent calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = natives.borrowGivenPercent(this, factory, params);
    }

    function borrowGivenPercentETHAsset(BorrowGivenPercentETHAsset calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = natives.borrowGivenPercentETHAsset(this, factory, weth, params);
    }

    function borrowGivenPercentETHCollateral(BorrowGivenPercentETHCollateral calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = natives.borrowGivenPercentETHCollateral(this, factory, weth, params);
    }

    function repay(Repay memory params) external returns (uint128 collateralOut) {
        collateralOut = natives.pay(factory, params);
    }

    function repayETHAsset(RepayETHAsset memory params) external returns (uint128 collateralOut) {
        collateralOut = natives.payETHAsset(factory, weth, params);
    }

    function repayETHCollateral(RepayETHCollateral memory params) external returns (uint128 collateralOut) {
        collateralOut = natives.payETHCollateral(factory, weth, params);
    }

    function deployNatives(Deploy memory params) external {
        natives.deployIfNoNatives(this, factory, params);
    }

    function timeswapLendCallback(
        uint256 amountOwed,
        bytes calldata data
    ) external override {
        // validate msg.sender
        (IERC20 asset, IERC20 collateral, address from) = abi.decode(data, (IERC20, IERC20, address));
        IPair pair = factory.getPair(asset, collateral);
        require (address(pair) != address(0), 'Invalid pair');
        require (msg.sender == address(pair), 'Invalid sender');
        asset.safeTransferFrom(from, pair, amountOwed);
    }
}
