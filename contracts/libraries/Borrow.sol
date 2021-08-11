// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IFactory} from '../interfaces/IFactory.sol';
import {IWETH} from '../interfaces/IWETH.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {IERC721} from '../interfaces/IERC721.sol';
import {IPair} from '../interfaces/IPair.sol';
import {IBorrow} from '../interfaces/IBorrow.sol';
import {IDue} from '../interfaces/IDue.sol';
import {BorrowMath} from './BorrowMath.sol';
import {SafeTransfer} from './SafeTransfer.sol';
import {Deploy} from './Deploy.sol';
import {MsgValue} from './MsgValue.sol';
import {ETH} from './ETH.sol';

library Borrow {
    using BorrowMath for IPair;
    using SafeTransfer for IERC20;
    using Deploy for IConvenience.Native;

    // Store the IConvenience as a parameter for the Deploy library

    // No need to have IWETH weth as a parameter for borrowGivenDebt
    function borrowGivenDebt(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IBorrow.BorrowGivenDebt calldata params
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        (id, dueOut) = _borrowGivenDebt(
            natives,
            factory,
            weth, // no need for weth here
            IBorrow._BorrowGivenDebt(
                params.asset,
                params.collateral,
                params.maturity,
                msg.sender,
                params.assetTo,
                params.dueTo,
                params.assetOut,
                params.debtIn,
                params.maxCollateral,
                IWETH(address(0)),
                params.deadline
            )
        );
    }

    function borrowGivenDebtETHAsset(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IBorrow.BorrowGivenDebtETHAsset calldata params
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        (id, dueOut) = _borrowGivenDebt(
            natives,
            factory,
            weth, // no need for weth here
            IBorrow._BorrowGivenDebt(
                weth,
                params.collateral,
                params.maturity,
                msg.sender,
                params.assetTo, // You want to transfer it to address(this), so that you can change it to ETH
                params.dueTo,
                params.assetOut,
                params.debtIn,
                params.maxCollateral,
                IWETH(address(0)),
                params.deadline
            )
        );

        weth.withdraw(params.assetOut);
        ETH.transfer(payable(params.dueTo), params.assetOut); // should send to assetTo not dueTo, no need to wrap payable here
    }

    function borrowGivenDebtETHCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IBorrow.BorrowGivenDebtETHCollateral calldata params
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        uint112 maxCollateral = MsgValue.getUint112();

        (id, dueOut) = _borrowGivenDebt(
            natives,
            factory,
            weth, // no need for weth here
            IBorrow._BorrowGivenDebt(
                params.asset,
                weth,
                params.maturity,
                address(this),
                params.assetTo,
                params.dueTo,
                params.assetOut,
                params.debtIn,
                maxCollateral,
                weth,
                params.deadline
            )
        );

        if (maxCollateral - dueOut.collateral > 0) ETH.transfer(payable(msg.sender), maxCollateral - dueOut.collateral);
    }

    // No need for IWETH weth as the parameter
    function _borrowGivenDebt(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IBorrow._BorrowGivenDebt memory params
    ) private returns (uint256 id, IPair.Due memory dueOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint112 interestIncrease, uint112 cdpIncrease) = pair.givenDebt(
            params.maturity,
            params.assetOut,
            params.debtIn
        );

        uint112 collateralIn = pair.getCollateral(params.maturity, params.assetOut, cdpIncrease);

        IDue collateralizedDebt = natives[params.asset][params.collateral][params.maturity].collateralizedDebt; // Remove this and move it to _borrow so that it's not repeated

        if (address(params.weth) != address(0)) weth.deposit{value: collateralIn}(); // should be params.weth.deposit ... For efficient weth usage

        // feed the natives and pair here to _borrow instead of collateralizedDebt
        (id, dueOut) = _borrow(
            collateralizedDebt,
            IBorrow._Borrow(
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
                params.deadline
            )
        );

        require(dueOut.collateral <= params.maxCollateral, 'Safety');
    }

    // No need for IWETH weth as parameter
    function borrowGivenCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IBorrow.BorrowGivenCollateral calldata params
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        (id, dueOut) = _borrowGivenCollateral(
            natives,
            factory,
            weth, // no need for weth
            IBorrow._BorrowGivenCollateral(
                params.asset,
                params.collateral,
                params.maturity,
                msg.sender,
                params.assetTo,
                params.dueTo,
                params.assetOut,
                params.collateralIn,
                params.maxDebt,
                IWETH(address(0)), // no need
                params.deadline
            )
        );
    }

    function borrowGivenCollateralETHAsset(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IBorrow.BorrowGivenCollateralETHAsset calldata params
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        (id, dueOut) = _borrowGivenCollateral(
            natives,
            factory,
            weth, // no need for weth here
            IBorrow._BorrowGivenCollateral(
                weth,
                params.collateral,
                params.maturity,
                msg.sender,
                params.assetTo, // should be sent to this address(this) to transform to ETH
                params.dueTo,
                params.assetOut,
                params.collateralIn,
                params.maxDebt,
                IWETH(address(0)), // no need
                params.deadline
            )
        );

        weth.withdraw(params.assetOut);
        ETH.transfer(payable(params.dueTo), params.assetOut); // should be sent to assetTo no dueTo, also no need to wrap assetTo, make it payable
    }

    function borrowGivenCollateralETHCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IBorrow.BorrowGivenCollateralETHCollateral calldata params
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        uint128 maxCollateral = MsgValue.getUint112(); // This should be collateralIn
        // Do the weth deposit here since we already know collateralIn

        (id, dueOut) = _borrowGivenCollateral(
            natives,
            factory,
            weth,
            IBorrow._BorrowGivenCollateral(
                params.asset,
                weth,
                params.maturity,
                msg.sender,
                params.assetTo,
                params.dueTo,
                params.assetOut,
                params.collateralIn, // collateralIn as msg.value
                params.maxDebt,
                weth, // mo need
                params.deadline
            )
        );

        if (maxCollateral - dueOut.collateral > 0) ETH.transfer(payable(msg.sender), maxCollateral - dueOut.collateral); // no need for this
    }

    function _borrowGivenCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IWETH weth,
        IBorrow._BorrowGivenCollateral memory params
    ) private returns (uint256 id, IPair.Due memory dueOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint112 interestIncrease, uint112 cdpIncrease) = pair.givenCollateral(
            params.maturity,
            params.assetOut,
            params.collateralIn
        );

        IDue collateralizedDebt = natives[params.asset][params.collateral][params.maturity].collateralizedDebt; // No need to repeat this

        if (address(params.weth) != address(0)) weth.deposit{value: params.collateralIn}(); // no need for this

        // parameter should be natives and pair
        (id, dueOut) = _borrow(
            collateralizedDebt,
            IBorrow._Borrow(
                pair,
                params.asset,
                params.collateral,
                params.maturity,
                params.from,
                params.assetTo,
                params.dueTo,
                params.assetOut,
                params.collateralIn,
                interestIncrease,
                cdpIncrease,
                params.deadline
            )
        );
        require(dueOut.collateral <= params.maxDebt, 'Safety');
    }

    function _borrow(IDue collateralizedDebt, IBorrow._Borrow memory params)
        private
        returns (uint256 id, IPair.Due memory dueOut)
    {
        require(params.deadline >= block.timestamp, 'Expired');

        // Do the get native here
        // Also if native does not exist deploy the Bond, Insurnace, Collaterlized Debt, and Liquidity with Deploy library, check Lend and Mint library for reference

        params.collateral.safeTransferFrom(params.from, params.pair, params.collateralIn);

        (id, dueOut) = params.pair.borrow(
            params.maturity,
            params.assetTo,
            address(collateralizedDebt),
            params.assetOut,
            params.interestIncrease,
            params.cdpIncrease
        );

        collateralizedDebt.mint(params.dueTo, id);
    }
}
