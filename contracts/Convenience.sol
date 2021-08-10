// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from './interfaces/IConvenience.sol';
import {IFactory} from './interfaces/IFactory.sol';
import {IWETH} from './interfaces/IWETH.sol';
import {IPair} from './interfaces/IPair.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {IClaim} from './interfaces/IClaim.sol';
import {IDue} from './interfaces/IDue.sol';
import {ILiquidity} from './interfaces/ILiquidity.sol';
import {IDeploy} from './interfaces/IDeploy.sol';
import {Mint} from './libraries/Mint.sol';
import {Lend} from './libraries/Lend.sol';
import {BorrowMath} from './libraries/BorrowMath.sol';
import {SafeTransfer} from './libraries/SafeTransfer.sol';
import {MsgValue} from './libraries/MsgValue.sol';
import {ETH} from './libraries/ETH.sol';

contract Convenience is IConvenience {
    using Mint for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native)));
    using Lend for mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native)));
    using BorrowMath for IPair;
    using SafeTransfer for IERC20;

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
        tokensOut = _removeLiquidity(
            _RemoveLiquidity(
                params.asset,
                params.collateral,
                params.maturity,
                params.assetTo,
                params.collateralTo,
                params.liquidityIn
            )
        );
    }

    function removeLiquidityETHAsset(RemoveLiquidityETHAsset calldata params)
        external
        returns (IPair.Tokens memory tokensOut)
    {
        tokensOut = _removeLiquidity(
            _RemoveLiquidity(
                weth,
                params.collateral,
                params.maturity,
                address(this),
                params.collateralTo,
                params.liquidityIn
            )
        );

        if (tokensOut.asset > 0) {
            weth.withdraw(tokensOut.asset);
            ETH.transfer(params.assetTo, tokensOut.asset);
        }
    }

    function removeLiquidityETHCollateral(RemoveLiquidityETHCollateral calldata params)
        external
        returns (IPair.Tokens memory tokensOut)
    {
        tokensOut = _removeLiquidity(
            _RemoveLiquidity(params.asset, weth, params.maturity, params.assetTo, address(this), params.liquidityIn)
        );

        if (tokensOut.collateral > 0) {
            weth.withdraw(tokensOut.collateral);
            ETH.transfer(params.collateralTo, tokensOut.collateral);
        }
    }

    function _removeLiquidity(_RemoveLiquidity memory params) private returns (IPair.Tokens memory tokensOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        Native memory native; // = _getNative(params.asset, params.collateral, params.maturity);

        tokensOut = native.liquidity.burn(msg.sender, params.assetTo, params.collateralTo, params.liquidityIn);
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
        tokensOut = _collect(
            _Collect(
                params.asset,
                params.collateral,
                params.maturity,
                params.assetTo,
                params.collateralTo,
                params.claimsIn
            )
        );
    }

    function collectETHAsset(CollectETHAsset calldata params) external returns (IPair.Tokens memory tokensOut) {
        tokensOut = _collect(
            _Collect(weth, params.collateral, params.maturity, address(this), params.collateralTo, params.claimsIn)
        );

        if (tokensOut.asset > 0) {
            weth.withdraw(tokensOut.asset);
            ETH.transfer(params.assetTo, tokensOut.asset);
        }
    }

    function collectETHCollateral(CollectETHCollateral calldata params)
        external
        returns (IPair.Tokens memory tokensOut)
    {
        tokensOut = _collect(
            _Collect(params.asset, weth, params.maturity, params.assetTo, address(this), params.claimsIn)
        );

        if (tokensOut.collateral > 0) {
            weth.withdraw(tokensOut.collateral);
            ETH.transfer(params.collateralTo, tokensOut.collateral);
        }
    }

    function _collect(_Collect memory params) private returns (IPair.Tokens memory tokensOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        Native memory native; // = _getNative(params.asset, params.collateral, params.maturity);

        if (params.claimsIn.bond > 0)
            tokensOut.asset = native.bond.burn(msg.sender, params.assetTo, params.claimsIn.bond);
        if (params.claimsIn.insurance > 0)
            tokensOut.collateral = native.insurance.burn(msg.sender, params.collateralTo, params.claimsIn.insurance);
    }

    function borrowGivenDebt(BorrowGivenDebt calldata params) external returns (uint256 id, IPair.Due memory dueOut) {
        (id, dueOut) = _borrowGivenDebt(
            _BorrowGivenDebt(
                params.asset,
                params.collateral,
                params.maturity,
                msg.sender,
                params.assetTo,
                params.dueTo,
                params.assetOut,
                params.debt,
                params.maxCollateral,
                params.deadline
            )
        );
    }

    function borrowGivenDebtETHAsset(BorrowGivenDebtETHAsset calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = _borrowGivenDebt(
            _BorrowGivenDebt(
                weth,
                params.collateral,
                params.maturity,
                msg.sender,
                params.assetTo,
                params.dueTo,
                params.assetOut,
                params.debt,
                params.maxCollateral,
                params.deadline
            )
        );

        if (params.assetOut > 0) {
            // I think you can remove the if, since params.asset > 0 check has been done in the core contract already
            weth.withdraw(params.assetOut);
            ETH.transfer(payable(params.dueTo), params.assetOut);
        }
    }

    function borrowGivenDebtETHCollateral(BorrowGivenDebtETHCollateral calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        uint128 value = MsgValue.getUint128(); // change name of value to maxCollateral
        weth.deposit{value: value}(); // remove this

        // Implement this similar to how addLiquiidytGivenETHCollateral

        (id, dueOut) = _borrowGivenDebt(
            _BorrowGivenDebt(
                params.asset,
                weth,
                params.maturity,
                address(this),
                params.assetTo,
                params.dueTo,
                params.assetOut,
                params.debt,
                params.maxCollateral,
                params.deadline
            )
        );

        // Add the return ETH change transfer here
    }

    function _borrowGivenDebt(_BorrowGivenDebt memory params) private returns (uint256 id, IPair.Due memory dueOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint112 interestIncrease, uint112 cdpIncrease) = pair.givenDebt(params.maturity, params.assetOut, params.debt);

        uint112 collateralIn = pair.getCollateral(params.maturity, params.assetOut, cdpIncrease);

        // if (params.isWeth) weth.deposit{value: dueOut.collateral}(); implement something like this for the borrowGivenDebtETHCollateral

        (id, dueOut) = _borrow(
            _Borrow(
                pair,
                params.asset,
                params.collateral,
                params.maturity,
                params.from,
                params.assetTo,
                params.dueTo,
                params.assetOut,
                collateralIn,
                interestIncrease,
                cdpIncrease,
                true,
                params.maxCollateral,
                params.deadline
            )
        );

        // put the safey check here
    }

    function borrowGivenCollateral(BorrowGivenCollateral calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = _borrowGivenCollateral(
            _BorrowGivenCollateral(
                params.asset,
                params.collateral,
                params.maturity,
                msg.sender,
                params.assetTo,
                params.dueTo,
                params.assetOut,
                params.collateralLocked,
                params.maxDebt,
                params.deadline
            )
        );
    }

    function borrowGivenCollateralETHAsset(BorrowGivenCollateralETHAsset calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        (id, dueOut) = _borrowGivenCollateral(
            _BorrowGivenCollateral(
                weth,
                params.collateral,
                params.maturity,
                msg.sender,
                params.assetTo,
                params.dueTo,
                params.assetOut,
                params.collateralLocked,
                params.maxDebt,
                params.deadline
            )
        );

        if (params.assetOut > 0) {
            // remove this if , since we know that assetOut is always > 0
            weth.withdraw(params.assetOut);
            ETH.transfer(payable(params.dueTo), params.assetOut);
        }
    }

    function borrowGivenCollateralETHCollateral(BorrowGivenCollateralETHCollateral calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        uint112 collateralIn = MsgValue.getUint112();
        weth.deposit{value: collateralIn}();

        // abstract this to _borrowGivenCollateral

        IPair pair = factory.getPair(params.asset, weth);
        require(address(pair) != address(0), 'Zero');

        (uint112 interestIncrease, uint112 cdpIncrease) = pair.givenCollateral(
            params.maturity,
            params.assetOut,
            params.collateralLocked
        );

        require(params.deadline >= block.timestamp, 'Expired');

        IERC20(weth).safeTransferFrom(msg.sender, pair, collateralIn);

        Native memory native; // = _getOrCreateNative(pair, params.asset, weth, params.maturity);

        (id, dueOut) = pair.borrow(
            params.maturity,
            params.assetTo,
            address(native.collateralizedDebt),
            params.assetOut,
            interestIncrease,
            cdpIncrease
        );

        native.collateralizedDebt.mint(params.dueTo, id);

        require(dueOut.debt <= params.maxDebt, 'Safety');
    }

    function _borrowGivenCollateral(_BorrowGivenCollateral memory params)
        private
        returns (uint256 id, IPair.Due memory dueOut)
    {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint112 interestIncrease, uint112 cdpIncrease) = pair.givenCollateral(
            params.maturity,
            params.assetOut,
            params.collateralLocked
        );

        uint112 collateralIn = pair.getCollateral(params.maturity, params.assetOut, cdpIncrease); // no need for this

        (id, dueOut) = _borrow(
            _Borrow(
                pair,
                params.asset,
                params.collateral,
                params.maturity,
                params.from,
                params.assetTo,
                params.dueTo,
                params.assetOut,
                collateralIn,
                interestIncrease,
                cdpIncrease,
                false,
                params.maxDebt,
                params.deadline
            )
        );

        // put the safety check here
    }

    function _borrow(_Borrow memory params) private returns (uint256 id, IPair.Due memory dueOut) {
        require(params.deadline >= block.timestamp, 'Expired');

        params.collateral.safeTransferFrom(params.from, params.pair, params.collateralIn);

        Native memory native; // = _getOrCreateNative(params.pair, params.asset, params.collateral, params.maturity);

        (id, dueOut) = params.pair.borrow(
            params.maturity,
            params.assetTo,
            address(native.collateralizedDebt),
            params.assetOut,
            params.interestIncrease,
            params.cdpIncrease
        );

        native.collateralizedDebt.mint(params.dueTo, id);

        // remove this
        if (params.isMaxCollateral == true) {
            require(dueOut.collateral <= params.maxCollateralOrDebt, 'Safety');
        } else {
            require(dueOut.debt <= params.maxCollateralOrDebt, 'Safety');
        }
    }

    function repay(Repay memory params) external returns (uint128 collateralOut) {
        require(params.deadline >= block.timestamp, 'Expired'); // move to _repay

        collateralOut = _repay(
            _Repay(
                params.asset,
                params.collateral,
                params.maturity,
                params.owner,
                params.collateralTo,
                params.ids,
                params.assetsPay
            )
        );
    }

    function repayETHAsset(RepayETHAsset memory params) external returns (uint128 collateralOut) {
        require(params.deadline >= block.timestamp, 'Expired'); // move to _repay
        uint256 wethToBeDeposited; // change name to assetIn, also use uint128
        for (uint256 i = 0; i < params.ids.length; i++) wethToBeDeposited += params.assetsPay[i];

        //Get the MsgValue at uint128 type here
        // Do the require check that there are enough ETH

        weth.deposit{value: wethToBeDeposited}();

        collateralOut = _repay(
            _Repay(
                weth,
                params.collateral,
                params.maturity,
                params.owner,
                params.collateralTo,
                params.ids,
                params.assetsPay
            )
        );

        // Any excess ETH in the Msg.Value, return back to user, use an if impelementation to check if there is any excess
    }

    function repayETHCollateral(RepayETHCollateral memory params) external returns (uint128 collateralOut) {
        require(params.deadline >= block.timestamp, 'Expired'); // move to _repay

        collateralOut = _repay(
            _Repay(params.asset, weth, params.maturity, params.owner, params.collateralTo, params.ids, params.assetsPay)
        );

        if (collateralOut > 0) {
            weth.withdraw(collateralOut);
            ETH.transfer(payable(params.owner), collateralOut);
        }
    }

    function _repay(_Repay memory params) private returns (uint128 collateralOut) {
        // pu the params.deadline require here
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        // Add here a safeTransfer implementation of sending the assetIn

        Native memory native; // = _getNative(params.asset, params.collateral, params.maturity);

        collateralOut = native.collateralizedDebt.burn(params.owner, params.collateralTo, params.ids, params.assetsPay);
    }
}
