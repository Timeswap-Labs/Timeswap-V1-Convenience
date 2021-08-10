// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IFactory} from '../interfaces/IFactory.sol';
import {IWETH} from '../interfaces/IWETH.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {IPair} from '../interfaces/IPair.sol';
import {IMint} from '../interfaces/IMint.sol';
import {MintMath} from './MintMath.sol';
import {SafeTransfer} from './SafeTransfer.sol';
import {Deploy} from './Deploy.sol';
import {MsgValue} from './MsgValue.sol';
import {ETH} from './ETH.sol';

library Mint {
    using MintMath for IPair;
    using SafeTransfer for IERC20;
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
        (liquidityOut, id, dueOut) = newLiquidityBothERC20(
            natives,
            convenience,
            factory,
            IMint.NewLiquidityBothERC20(
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
        weth.deposit{value: assetIn}();

        (liquidityOut, id, dueOut) = newLiquidityBothERC20(
            natives,
            convenience,
            factory,
            IMint.NewLiquidityBothERC20(
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
        weth.deposit{value: collateralIn}();

        (liquidityOut, id, dueOut) = newLiquidityBothERC20(
            natives,
            convenience,
            factory,
            IMint.NewLiquidityBothERC20(
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

    function newLiquidityBothERC20(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IMint.NewLiquidityBothERC20 memory params
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

        (liquidityOut, id, dueOut) = mintBothERC20(
            natives,
            convenience,
            pair,
            IMint.MintBothERC20(
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
        (liquidityOut, id, dueOut) = addLiquidityBothERC20(
            natives,
            convenience,
            factory,
            IMint.AddLiquidityBothERC20(
                params.asset,
                params.collateral,
                params.maturity,
                msg.sender,
                msg.sender,
                params.liquidityTo,
                params.dueTo,
                params.assetIn,
                IWETH(address(0)),
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
        weth.deposit{value: assetIn}();

        (liquidityOut, id, dueOut) = addLiquidityBothERC20(
            natives,
            convenience,
            factory,
            IMint.AddLiquidityBothERC20(
                weth,
                params.collateral,
                params.maturity,
                address(this),
                msg.sender,
                params.liquidityTo,
                params.dueTo,
                assetIn,
                IWETH(address(0)),
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

        (liquidityOut, id, dueOut) = addLiquidityBothERC20(
            natives,
            convenience,
            factory,
            IMint.AddLiquidityBothERC20(
                params.asset,
                weth,
                params.maturity,
                msg.sender,
                address(this),
                params.liquidityTo,
                params.dueTo,
                params.assetIn,
                weth,
                params.minLiquidity,
                params.maxDebt,
                maxCollateral,
                params.deadline
            )
        );

        if (maxCollateral - dueOut.collateral > 0) ETH.transfer(payable(msg.sender), maxCollateral - dueOut.collateral);
    }

    function addLiquidityBothERC20(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IMint.AddLiquidityBothERC20 memory params
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

        dueOut.collateral = MintMath.getCollateral(params.maturity, params.assetIn, interestIncrease, cdpIncrease);

        if (address(params.weth) != address(0)) params.weth.deposit{value: dueOut.collateral}();

        (liquidityOut, id, dueOut) = mintBothERC20(
            natives,
            convenience,
            pair,
            IMint.MintBothERC20(
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

    function mintBothERC20(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IPair pair,
        IMint.MintBothERC20 memory params
    )
        private
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        require(params.deadline >= block.timestamp, 'Expired');

        params.asset.safeTransferFrom(params.assetFrom, pair, params.assetIn);
        params.collateral.safeTransferFrom(params.collateralFrom, pair, dueOut.collateral);

        IConvenience.Native storage native = natives[params.asset][params.collateral][params.maturity];
        if (address(native.liquidity) == address(0))
            native.deploy(convenience, pair, params.asset, params.collateral, params.maturity);

        (liquidityOut, id, dueOut) = pair.mint(
            params.maturity,
            params.liquidityTo,
            params.dueTo,
            params.interestIncrease,
            params.cdpIncrease
        );

        native.liquidity.mint(params.liquidityTo, liquidityOut);
        native.collateralizedDebt.mint(params.dueTo, id);
    }
}
