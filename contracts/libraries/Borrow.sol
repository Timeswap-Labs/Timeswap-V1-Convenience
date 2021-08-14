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

    function borrowGivenDebt(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IConvenience convenience,
        IBorrow.BorrowGivenDebt calldata params
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        (id, dueOut) = _borrowGivenDebt(
            natives,
            factory,
            convenience,
            IBorrow._BorrowGivenDebt(
                params.asset,
                params.collateral,
                params.maturity,
                msg.sender,
                params.assetTo,
                params.dueTo,
                params.assetOut,
                params.debtIn,
                IWETH(address(0)),
                params.maxCollateral,
                params.deadline
            )
        );
    }

    function borrowGivenDebtETHAsset(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IConvenience convenience,
        IWETH weth,
        IBorrow.BorrowGivenDebtETHAsset calldata params
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        (id, dueOut) = _borrowGivenDebt(
            natives,
            factory,
            convenience,
            IBorrow._BorrowGivenDebt(
                weth,
                params.collateral,
                params.maturity,
                msg.sender,
                address(this),
                params.dueTo,
                params.assetOut,
                params.debtIn,
                weth,
                params.maxCollateral,
                params.deadline
            )
        );

        weth.withdraw(params.assetOut);
        ETH.transfer(params.assetTo, params.assetOut);
    }

    function borrowGivenDebtETHCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IConvenience convenience,
        IWETH weth,
        IBorrow.BorrowGivenDebtETHCollateral calldata params
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        uint112 maxCollateral = MsgValue.getUint112();

        (id, dueOut) = _borrowGivenDebt(
            natives,
            factory,
            convenience,
            IBorrow._BorrowGivenDebt(
                params.asset,
                weth,
                params.maturity,
                address(this),
                params.assetTo,
                params.dueTo,
                params.assetOut,
                params.debtIn,
                weth,
                maxCollateral,
                params.deadline
            )
        );

        if (maxCollateral - dueOut.collateral > 0) ETH.transfer(payable(msg.sender), maxCollateral - dueOut.collateral);
    }

    function _borrowGivenDebt(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IConvenience convenience,
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

        
        if (address(params.collateral) != address(0)) params.weth.deposit{value: collateralIn}();

        (id, dueOut) = _borrow(
            natives,
            convenience,
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

    function borrowGivenCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IConvenience convenience,
        IBorrow.BorrowGivenCollateral calldata params
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        (id, dueOut) = _borrowGivenCollateral(
            natives,
            factory,
            convenience,
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
                params.deadline
            )
        );
    }

    function borrowGivenCollateralETHAsset(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IConvenience convenience,
        IWETH weth,
        IBorrow.BorrowGivenCollateralETHAsset calldata params
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        (id, dueOut) = _borrowGivenCollateral(
            natives,
            factory,
            convenience,
            IBorrow._BorrowGivenCollateral(
                weth,
                params.collateral,
                params.maturity,
                msg.sender,
                address(this),
                params.dueTo,
                params.assetOut,
                params.collateralIn,
                params.maxDebt,
                params.deadline
            )
        );

        weth.withdraw(params.assetOut);
        ETH.transfer(payable(msg.sender), params.assetOut);
    }

    function borrowGivenCollateralETHCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IConvenience convenience,
        IWETH weth,

        IBorrow.BorrowGivenCollateralETHCollateral calldata params
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        uint112 collateralIn = MsgValue.getUint112();
        weth.deposit{value: collateralIn}();

        (id, dueOut) = _borrowGivenCollateral(
            natives,
            factory,
            convenience,
            IBorrow._BorrowGivenCollateral(
                params.asset,
                weth,
                params.maturity,
                msg.sender,
                params.assetTo,
                params.dueTo,
                params.assetOut,
                collateralIn,
                params.maxDebt,
                params.deadline
            )
        );

    }

    function _borrowGivenCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IConvenience convenience,
        IBorrow._BorrowGivenCollateral memory params
    ) private returns (uint256 id, IPair.Due memory dueOut) {
        
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint112 interestIncrease, uint112 cdpIncrease) = pair.givenCollateral(
            params.maturity,
            params.assetOut,
            params.collateralIn
        );

        (id, dueOut) = _borrow(
            natives,
            convenience,
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

    function _borrow( 
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IBorrow._Borrow memory params)
        private
        returns (uint256 id, IPair.Due memory dueOut)
    {
        require(params.deadline >= block.timestamp, 'Expired');

        IConvenience.Native storage native = natives[params.asset][params.collateral][params.maturity];
        if (address(native.liquidity) == address(0))
            native.deploy(convenience, params.pair, params.asset, params.collateral, params.maturity);

        params.collateral.safeTransferFrom(params.from, params.pair, params.collateralIn);

        (id, dueOut) = params.pair.borrow(
            params.maturity,
            params.assetTo,
            address(native.collateralizedDebt),
            params.assetOut,
            params.interestIncrease,
            params.cdpIncrease
        );

        native.collateralizedDebt.mint(params.dueTo, id);
    }
}
