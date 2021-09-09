// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IFactory} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IFactory.sol';
import {IWETH} from '../interfaces/IWETH.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {IMint} from '../interfaces/IMint.sol';
import {MintMath} from './MintMath.sol';
import {Deploy} from './Deploy.sol';
import {MsgValue} from './MsgValue.sol';
import {ETH} from './ETH.sol';

library Mint {
    using MintMath for IPair;
    using Deploy for IConvenience.Native;

    function newLiquidity(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IMint.NewLiquidity calldata params
    )
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = _newLiquidity(
            natives,
            convenience,
            factory,
            IMint._NewLiquidity(
                params.asset,
                params.collateral,
                params.maturity,
                msg.sender,
                msg.sender,
                params.liquidityTo,
                params.dueTo,
                params.assetIn,
                params.debtOut,
                params.collateralIn,
                params.deadline
            )
        );
    }

    function newLiquidityETHAsset(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IWETH weth,
        IMint.NewLiquidityETHAsset calldata params
    )
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        uint112 assetIn = MsgValue.getUint112();

        (liquidityOut, id, dueOut) = _newLiquidity(
            natives,
            convenience,
            factory,
            IMint._NewLiquidity(
                weth,
                params.collateral,
                params.maturity,
                address(this),
                msg.sender,
                params.liquidityTo,
                params.dueTo,
                assetIn,
                params.debtOut,
                params.collateralIn,
                params.deadline
            )
        );
    }

    function newLiquidityETHCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IWETH weth,
        IMint.NewLiquidityETHCollateral calldata params
    )
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        uint112 collateralIn = MsgValue.getUint112();

        (liquidityOut, id, dueOut) = _newLiquidity(
            natives,
            convenience,
            factory,
            IMint._NewLiquidity(
                params.asset,
                weth,
                params.maturity,
                msg.sender,
                address(this),
                params.liquidityTo,
                params.dueTo,
                params.assetIn,
                params.debtOut,
                collateralIn,
                params.deadline
            )
        );
    }

    function addLiquidity(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IMint.AddLiquidity calldata params
    )
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = _addLiquidity(
            natives,
            convenience,
            factory,
            IMint._AddLiquidity(
                params.asset,
                params.collateral,
                params.maturity,
                msg.sender,
                msg.sender,
                params.liquidityTo,
                params.dueTo,
                params.assetIn,
                params.minLiquidity,
                params.maxDebt,
                params.maxCollateral,
                params.deadline
            )
        );
    }

    function addLiquidityETHAsset(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IWETH weth,
        IMint.AddLiquidityETHAsset calldata params
    )
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        uint112 assetIn = MsgValue.getUint112();

        (liquidityOut, id, dueOut) = _addLiquidity(
            natives,
            convenience,
            factory,
            IMint._AddLiquidity(
                weth,
                params.collateral,
                params.maturity,
                address(this),
                msg.sender,
                params.liquidityTo,
                params.dueTo,
                assetIn,
                params.minLiquidity,
                params.maxDebt,
                params.maxCollateral,
                params.deadline
            )
        );
    }

    function addLiquidityETHCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IWETH weth,
        IMint.AddLiquidityETHCollateral calldata params
    )
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        uint112 maxCollateral = MsgValue.getUint112();

        (liquidityOut, id, dueOut) = _addLiquidity(
            natives,
            convenience,
            factory,
            IMint._AddLiquidity(
                params.asset,
                weth,
                params.maturity,
                msg.sender,
                address(this),
                params.liquidityTo,
                params.dueTo,
                params.assetIn,
                params.minLiquidity,
                params.maxDebt,
                maxCollateral,
                params.deadline
            )
        );

        if (maxCollateral - dueOut.collateral > 0) ETH.transfer(payable(msg.sender), maxCollateral - dueOut.collateral);
    }

    function _newLiquidity(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IMint._NewLiquidity memory params
    )
        private
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        IPair pair = factory.getPair(params.asset, params.collateral);

        if (address(pair) == address(0)) pair = factory.createPair(params.asset, params.collateral);

        require(pair.totalLiquidity(params.maturity) == 0, 'Forbidden');

        (uint112 interestIncrease, uint112 cdpIncrease) = MintMath.givenNew(
            params.maturity,
            params.assetIn,
            params.debtOut,
            params.collateralIn
        );

        (liquidityOut, id, dueOut) = _mint(
            natives,
            convenience,
            pair,
            IMint._Mint(
                params.asset,
                params.collateral,
                params.maturity,
                params.assetFrom,
                params.collateralFrom,
                params.liquidityTo,
                params.dueTo,
                params.assetIn,
                interestIncrease,
                cdpIncrease,
                params.deadline
            )
        );
    }

    function _addLiquidity(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IMint._AddLiquidity memory params
    )
        private
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');
        require(pair.totalLiquidity(params.maturity) > 0, 'Forbidden');

        (uint112 interestIncrease, uint112 cdpIncrease) = pair.givenAdd(params.maturity, params.assetIn);

        (liquidityOut, id, dueOut) = _mint(
            natives,
            convenience,
            pair,
            IMint._Mint(
                params.asset,
                params.collateral,
                params.maturity,
                params.assetFrom,
                params.collateralFrom,
                params.liquidityTo,
                params.dueTo,
                params.assetIn,
                interestIncrease,
                cdpIncrease,
                params.deadline
            )
        );

        require(liquidityOut >= params.minLiquidity, 'Safety');
        require(dueOut.debt <= params.maxDebt, 'Safety');
        require(dueOut.collateral <= params.maxCollateral, 'Safety');
    }

    function _mint(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IPair pair,
        IMint._Mint memory params
    )
        private
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        require(params.deadline >= block.timestamp, 'Expired');

        IConvenience.Native storage native = natives[params.asset][params.collateral][params.maturity];
        if (address(native.liquidity) == address(0))
            native.deploy(convenience, pair, params.asset, params.collateral, params.maturity);

        (liquidityOut, id, dueOut) = pair.mint(
            params.maturity,
            params.liquidityTo,
            params.dueTo,
            params.assetIn,
            params.interestIncrease,
            params.cdpIncrease,
            bytes(abi.encode(params.asset, params.collateral, params.assetFrom, params.collateralFrom))
        );

        native.liquidity.mint(params.liquidityTo, liquidityOut);
        native.collateralizedDebt.mint(params.dueTo, id);
    }
}
