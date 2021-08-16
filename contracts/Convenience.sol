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
import {DeployNatives} from './libraries/DeployNatives.sol';

contract Convenience is IConvenience {
    using Mint for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));
    using Burn for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));
    using Lend for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));
    using Withdraw for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));
    using Borrow for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));
    using Pay for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));
    using DeployNatives for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native)));


    IFactory public immutable override factory;
    IWETH public immutable weth;

    mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native))) public natives;

    constructor(IFactory _factory, IWETH _weth) {
        factory = _factory;
        weth = _weth;
    }

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

    function newLiquidityETHAsset(NewLiquidityETHAsset calldata params)
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = natives.newLiquidityETHAsset(this, factory, weth, params);
    }

    function newLiquidityETHCollateral(NewLiquidityETHCollateral calldata params)
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = natives.newLiquidityETHCollateral(this, factory, weth, params);
    }

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

    function addLiquidityETHAsset(AddLiquidityETHAsset calldata params)
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = natives.addLiquidityETHAsset(this, factory, weth, params);
    }

    function addLiquidityETHCollateral(AddLiquidityETHCollateral calldata params)
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = natives.addLiquidityETHCollateral(this, factory, weth, params);
    }

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
        (id, dueOut) = natives.borrowGivenDebt(factory, this, params);
    }

    function borrowGivenDebtETHAsset(BorrowGivenDebtETHAsset calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = natives.borrowGivenDebtETHAsset(factory, this, weth, params);
    }

    function borrowGivenDebtETHCollateral(BorrowGivenDebtETHCollateral calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = natives.borrowGivenDebtETHCollateral(factory, this, weth, params);
    }

    function borrowGivenCollateral(BorrowGivenCollateral calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = natives.borrowGivenCollateral(factory, this, params);
    }

    function borrowGivenCollateralETHAsset(BorrowGivenCollateralETHAsset calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = natives.borrowGivenCollateralETHAsset(factory, this, weth, params);
    }

    function borrowGivenCollateralETHCollateral(BorrowGivenCollateralETHCollateral calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = natives.borrowGivenCollateralETHCollateral(factory, this,weth, params);
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
         natives.deployIfNoNatives(factory, this, params);
    }
}
