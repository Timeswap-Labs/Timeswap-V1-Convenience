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
import {MintMath} from './libraries/MintMath.sol';
import {LendMath} from './libraries/LendMath.sol';
import {BorrowMath} from './libraries/BorrowMath.sol';
import {SafeTransfer} from './libraries/SafeTransfer.sol';
import {MsgValue} from './libraries/MsgValue.sol';
import {ETH} from './libraries/ETH.sol';
import {Native} from './libraries/Native.sol';
import {Liquidity} from './Liquidity.sol';
import {Bond} from './Bond.sol';
import {Insurance} from './Insurance.sol';
import {CollateralizedDebt} from './CollateralizedDebt.sol';

contract Convenience is IConvenience {
    using MintMath for IPair;
    using LendMath for IPair;
    using BorrowMath for IPair;
    using SafeTransfer for IERC20;

    IFactory public immutable factory;
    IWETH public immutable weth;

    mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native))) public natives;

    constructor(IFactory _factory, IWETH _weth) {
        factory = _factory;
        weth = _weth;
    }

    function _getOrCreateNative(
        IPair pair,
        IERC20 asset,
        IERC20 collateral,
        uint256 maturity
    ) private returns (Native memory native) {
        Native storage _native = natives[asset][collateral][maturity];
        if (address(_native.liquidity) == address(0)) {
            _native.liquidity = new Liquidity{salt: keccak256(abi.encode(asset, collateral, maturity))}(
                this,
                pair,
                maturity
            );
            _native.bond = new Bond{salt: keccak256(abi.encode(asset, collateral, maturity))}(this, pair, maturity);
            _native.insurance = new Insurance{salt: keccak256(abi.encode(asset, collateral, maturity))}(
                this,
                pair,
                maturity
            );
            _native.collateralizedDebt = new CollateralizedDebt{
                salt: keccak256(abi.encode(asset, collateral, maturity))
            }(this, pair, maturity);
        }
        native = _native;
    }

    function _getNative(
        IERC20 asset,
        IERC20 collateral,
        uint256 maturity
    ) private view returns (Native memory native) {
        native = natives[asset][collateral][maturity];
        require(address(native.liquidity) != address(0), 'Forbidden');
    }

    function newLiquidity(NewLiquidity calldata params)
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = _newLiquidity(
            _NewLiquidity(
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

    function newLiquidityETHAsset(NewLiquidityETHAsset calldata params)
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        uint128 assetIn = MsgValue.getUint128();
        weth.deposit{value: assetIn}();

        (liquidityOut, id, dueOut) = _newLiquidity(
            _NewLiquidity(
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

    function newLiquidityETHCollateral(NewLiquidityETHCollateral calldata params)
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        uint112 collateralIn = MsgValue.getUint112();
        weth.deposit{value: collateralIn}();

        (liquidityOut, id, dueOut) = _newLiquidity(
            _NewLiquidity(
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

    function _newLiquidity(_NewLiquidity memory params)
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
            _Mint(
                pair,
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

    function addLiquidity(AddLiquidity calldata params)
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        (liquidityOut, id, dueOut) = _addLiquidity(
            _AddLiquidity(
                params.asset,
                params.collateral,
                params.maturity,
                msg.sender,
                msg.sender,
                params.liquidityTo,
                params.dueTo,
                params.assetIn,
                false,
                params.minLiquidity,
                params.maxDebt,
                params.maxCollateral,
                params.deadline
            )
        );
    }

    function addLiquidityETHAsset(AddLiquidityETHAsset calldata params)
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        uint128 assetIn = MsgValue.getUint128();
        weth.deposit{value: assetIn}();

        (liquidityOut, id, dueOut) = _addLiquidity(
            _AddLiquidity(
                weth,
                params.collateral,
                params.maturity,
                address(this),
                msg.sender,
                params.liquidityTo,
                params.dueTo,
                assetIn,
                false,
                params.minLiquidity,
                params.maxDebt,
                params.maxCollateral,
                params.deadline
            )
        );
    }

    function addLiquidityETHCollateral(AddLiquidityETHCollateral calldata params)
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        uint112 maxCollateral = MsgValue.getUint112();

        (liquidityOut, id, dueOut) = _addLiquidity(
            _AddLiquidity(
                params.asset,
                weth,
                params.maturity,
                msg.sender,
                address(this),
                params.liquidityTo,
                params.dueTo,
                params.assetIn,
                true,
                params.minLiquidity,
                params.maxDebt,
                maxCollateral,
                params.deadline
            )
        );

        if (maxCollateral - dueOut.collateral > 0) ETH.transfer(payable(msg.sender), maxCollateral - dueOut.collateral);
    }

    function _addLiquidity(_AddLiquidity memory params)
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

        if (params.isWeth) weth.deposit{value: dueOut.collateral}();

        (liquidityOut, id, dueOut) = _mint(
            _Mint(
                pair,
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

    function _mint(_Mint memory params)
        private
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        require(params.deadline >= block.timestamp, 'Expired');

        params.asset.safeTransferFrom(params.assetFrom, params.pair, params.assetIn);
        params.collateral.safeTransferFrom(params.collateralFrom, params.pair, dueOut.collateral);

        Native memory native = natives[params.asset][params.collateral][params.maturity];

        (liquidityOut, id, dueOut) = params.pair.mint(
            params.maturity,
            params.liquidityTo,
            params.dueTo,
            params.interestIncrease,
            params.cdpIncrease
        );

        native.liquidity.mint(params.liquidityTo, liquidityOut);
        native.collateralizedDebt.mint(params.dueTo, id);
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

        Native memory native = natives[params.asset][params.collateral][params.maturity];

        tokensOut = native.liquidity.burn(msg.sender, params.assetTo, params.collateralTo, params.liquidityIn);
    }

    function lendGivenBond(LendGivenBond calldata params) external returns (IPair.Claims memory claimsOut) {
        claimsOut = _lendGivenBond(
            _LendGivenBond(
                params.asset,
                params.collateral,
                params.maturity,
                msg.sender,
                params.bondTo,
                params.insuranceTo,
                params.assetIn,
                params.bondOut,
                params.minInsurance,
                params.deadline
            )
        );
    }

    function lendGivenBondETHAsset(LendGivenBondETHAsset calldata params)
        external
        payable
        returns (IPair.Claims memory claimsOut)
    {
        uint128 assetIn = MsgValue.getUint128();
        weth.deposit{value: assetIn}();

        claimsOut = _lendGivenBond(
            _LendGivenBond(
                weth,
                params.collateral,
                params.maturity,
                address(this),
                params.bondTo,
                params.insuranceTo,
                assetIn,
                params.bondOut,
                params.minInsurance,
                params.deadline
            )
        );
    }

    function lendGivenBondETHCollateral(LendGivenBondETHCollateral calldata params)
        external
        payable
        returns (IPair.Claims memory claimsOut)
    {
        claimsOut = _lendGivenBond(
            _LendGivenBond(
                params.asset,
                weth,
                params.maturity,
                msg.sender,
                params.bondTo,
                params.insuranceTo,
                params.assetIn,
                params.bondOut,
                params.minInsurance,
                params.deadline
            )
        );
    }

    function _lendGivenBond(_LendGivenBond memory params) private returns (IPair.Claims memory claimsOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint112 interestDecrease, uint112 cdpDecrease) = pair.givenBond(
            params.maturity,
            params.assetIn,
            params.bondOut
        );

        claimsOut = _lend(
            _Lend(
                pair,
                params.asset,
                params.collateral,
                params.maturity,
                params.from,
                params.bondTo,
                params.insuranceTo,
                params.assetIn,
                interestDecrease,
                cdpDecrease,
                params.deadline
            )
        );

        require(claimsOut.insurance >= params.minInsurance, 'Safety');
    }

    function lendGivenInsurance(LendGivenInsurance calldata params) external returns (IPair.Claims memory claimsOut) {
        claimsOut = _lendGivenInsurance(
            _LendGivenInsurance(
                params.asset,
                params.collateral,
                params.maturity,
                msg.sender,
                params.bondTo,
                params.insuranceTo,
                params.assetIn,
                params.insuranceOut,
                params.minBond,
                params.deadline
            )
        );
    }

    function lendGivenInsuranceETHAsset(LendGivenInsuranceETHAsset calldata params)
        external
        returns (IPair.Claims memory claimsOut)
    {
        uint128 assetIn = MsgValue.getUint128();
        weth.deposit{value: assetIn}();

        claimsOut = _lendGivenInsurance(
            _LendGivenInsurance(
                weth,
                params.collateral,
                params.maturity,
                address(this),
                params.bondTo,
                params.insuranceTo,
                assetIn,
                params.insuranceOut,
                params.minBond,
                params.deadline
            )
        );
    }

    function lendGivenInsuranceETHCollateral(LendGivenInsuranceETHCollateral calldata params)
        external
        returns (IPair.Claims memory claimsOut)
    {
        claimsOut = _lendGivenInsurance(
            _LendGivenInsurance(
                params.asset,
                weth,
                params.maturity,
                msg.sender,
                params.bondTo,
                params.insuranceTo,
                params.assetIn,
                params.insuranceOut,
                params.minBond,
                params.deadline
            )
        );
    }

    function _lendGivenInsurance(_LendGivenInsurance memory params) private returns (IPair.Claims memory claimsOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint112 interestDecrease, uint112 cdpDecrease) = pair.givenInsurance(
            params.maturity,
            params.assetIn,
            params.insuranceOut
        );

        claimsOut = _lend(
            _Lend(
                pair,
                params.asset,
                params.collateral,
                params.maturity,
                params.from,
                params.bondTo,
                params.insuranceTo,
                params.assetIn,
                interestDecrease,
                cdpDecrease,
                params.deadline
            )
        );

        require(claimsOut.bond >= params.minBond, 'Safety');
    }

    function _lend(_Lend memory params) private returns (IPair.Claims memory claimsOut) {
        require(params.deadline >= block.timestamp, 'Expired');

        params.asset.safeTransferFrom(params.from, params.pair, params.assetIn);

        Native memory native = natives[params.asset][params.collateral][params.maturity];

        claimsOut = params.pair.lend(
            params.maturity,
            address(native.bond),
            address(native.insurance),
            params.interestDecrease,
            params.cdpDecrease
        );

        native.bond.mint(params.bondTo, claimsOut.bond);
        native.insurance.mint(params.insuranceTo, claimsOut.insurance);
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

        Native memory native = natives[params.asset][params.collateral][params.maturity];

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

        if (dueOut.debt > 0) {
            weth.withdraw(params.assetOut);
            ETH.transfer(payable(params.dueTo), params.assetOut);
        }
    }

    function borrowGivenDebtETHCollateral(BorrowGivenDebtETHCollateral calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        uint128 value = MsgValue.getUint128();
        weth.deposit{value: value}();
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
    }

    function _borrowGivenDebt(_BorrowGivenDebt memory params) private returns (uint256 id, IPair.Due memory dueOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint112 interestIncrease, uint112 cdpIncrease) = pair.givenDebt(params.maturity, params.assetOut, params.debt);

        uint128 collateralIn = pair.getCollateral(params.maturity, params.assetOut, cdpIncrease);

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

        if (dueOut.debt > 0) {
            weth.withdraw(params.assetOut);
            ETH.transfer(payable(params.dueTo), params.assetOut);
        }
    }

    function borrowGivenCollateralETHCollateral(BorrowGivenCollateralETHCollateral calldata params)
        external
        returns (uint256 id, IPair.Due memory dueOut)
    {
        uint128 maxCollateral = MsgValue.getUint128();

        IPair pair = factory.getPair(params.asset, weth);
        require(address(pair) != address(0), 'Zero');

        (uint112 interestIncrease, uint112 cdpIncrease) = pair.givenCollateral(
            params.maturity,
            params.assetOut,
            params.collateralLocked
        );

        uint128 collateralIn = pair.getCollateral(params.maturity, params.assetOut, cdpIncrease);

        weth.deposit{value: collateralIn}();

        require(params.deadline >= block.timestamp, 'Expired');

        IERC20(weth).safeTransferFrom(msg.sender, pair, collateralIn);

        Native memory native = natives[params.asset][weth][params.maturity];

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

        if (maxCollateral - dueOut.collateral > 0) {
            ETH.transfer(payable(msg.sender), maxCollateral - dueOut.collateral);
        }
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

        uint128 collateralIn = pair.getCollateral(params.maturity, params.assetOut, cdpIncrease);

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
    }

    function _borrow(_Borrow memory params) private returns (uint256 id, IPair.Due memory dueOut) {
        require(params.deadline >= block.timestamp, 'Expired');

        params.collateral.safeTransferFrom(params.from, params.pair, params.collateralIn);

        Native memory native = natives[params.asset][params.collateral][params.maturity];

        (id, dueOut) = params.pair.borrow(
            params.maturity,
            params.assetTo,
            address(native.collateralizedDebt),
            params.assetOut,
            params.interestIncrease,
            params.cdpIncrease
        );

        native.collateralizedDebt.mint(params.dueTo, id);

        if (params.isMaxCollateral == true) {
            require(dueOut.collateral <= params.maxCollateralOrDebt, 'Safety');
        } else {
            require(dueOut.debt <= params.maxCollateralOrDebt, 'Safety');
        }
    }

    function repay(Repay memory params) external returns (uint128 collateralOut) {
        require(params.deadline >= block.timestamp, 'Expired');

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
        require(params.deadline >= block.timestamp, 'Expired');
        uint256 wethToBeDeposited = 0;
        for (uint256 i = 0; i < params.ids.length; i++) wethToBeDeposited += params.assetsPay[i];
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
    }

    function repayETHCollateral(RepayETHCollateral memory params) external returns (uint128 collateralOut) {
        require(params.deadline >= block.timestamp, 'Expired');

        collateralOut = _repay(
            _Repay(params.asset, weth, params.maturity, params.owner, params.collateralTo, params.ids, params.assetsPay)
        );

        if (collateralOut > 0) {
            weth.withdraw(collateralOut);
            ETH.transfer(payable(params.owner), collateralOut);
        }
    }

    function _repay(_Repay memory params) private returns (uint128 collateralOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        Native memory native = natives[params.asset][params.collateral][params.maturity];
        collateralOut = native.collateralizedDebt.burn(params.owner, params.collateralTo, params.ids, params.assetsPay);
    }
}
