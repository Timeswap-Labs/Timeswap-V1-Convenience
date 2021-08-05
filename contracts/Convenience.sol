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
import {Param} from './libraries/Param.sol'; // change name
import {ETH} from './libraries/ETH.sol';
import {Liquidity} from './Liquidity.sol';
import {Bond} from './Bond.sol';
import {Insurance} from './Insurance.sol';

contract Convenience is IConvenience {
    using MintMath for IPair;
    using LendMath for IPair;
    using BorrowMath for IPair;
    using SafeTransfer for IERC20;
    using Param for ETHAsset;
    using Param for ETHCollateral;

    IFactory public immutable factory;
    IWETH public immutable weth;

    struct Native {
        ILiquidity liquidity;
        IClaim bond;
        IClaim insurance;
        IDue debt;
    }

    mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native))) public natives;

    constructor(IFactory _factory, IWETH _weth) {
        factory = _factory;
        weth = _weth;
    }

    function newLiquidity(
        Parameter memory parameter,
        MintTo memory to,
        uint128 assetIn,
        uint112 debtOut,
        uint112 collateralIn,
        uint256 deadline
    )
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        require(deadline >= block.timestamp, 'Expired');

        IPair pair = factory.getPair(parameter.asset, parameter.collateral);

        if (address(pair) == address(0)) pair = factory.createPair(parameter.asset, parameter.collateral);

        require(pair.totalLiquidity(parameter.maturity) == 0, 'Forbidden');

        (uint128 interestIncrease, uint128 cdpIncrease) = MintMath.givenNew(
            parameter.maturity,
            assetIn,
            debtOut,
            collateralIn
        );

        parameter.asset.safeTransferFrom(msg.sender, pair, assetIn);
        parameter.collateral.safeTransferFrom(msg.sender, pair, collateralIn);

        Native storage native = natives[parameter.asset][parameter.collateral][parameter.maturity];

        native.liquidity = new Liquidity{
            salt: keccak256(abi.encode(parameter.asset, parameter.collateral, parameter.maturity))
        }(this, pair, parameter.maturity);
        native.bond = new Bond{salt: keccak256(abi.encode(parameter.asset, parameter.collateral, parameter.maturity))}(
            this,
            pair,
            parameter.maturity
        );
        native.insurance = new Insurance{
            salt: keccak256(abi.encode(parameter.asset, parameter.collateral, parameter.maturity))
        }(this, pair, parameter.maturity);
        // native.debt

        (liquidityOut, id, dueOut) = pair.mint(parameter.maturity, to.liquidity, to.due, interestIncrease, cdpIncrease);

        native.liquidity.mint(to.liquidity, liquidityOut);
        native.debt.mint(to.due, id);
    }

    function addLiquidity(
        Parameter memory parameter,
        MintTo memory to,
        uint128 assetIn,
        MintSafe memory safe,
        uint256 deadline
    )
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        )
    {
        require(deadline >= block.timestamp, 'Expired');

        IPair pair = factory.getPair(parameter.asset, parameter.collateral);
        require(address(pair) != address(0), 'Zero');
        require(pair.totalLiquidity(parameter.maturity) > 0, 'Forbidden');

        (uint128 interestIncrease, uint128 cdpIncrease) = pair.givenAdd(parameter.maturity, assetIn);

        Native memory native = natives[parameter.asset][parameter.collateral][parameter.maturity];

        (liquidityOut, id, dueOut) = pair.mint(parameter.maturity, to.liquidity, to.due, interestIncrease, cdpIncrease);

        native.liquidity.mint(to.liquidity, liquidityOut);
        native.debt.mint(to.due, id);

        require(liquidityOut >= safe.minLiquidity, 'Safety');
        require(dueOut.debt <= safe.maxDebt, 'Safety');
        require(dueOut.collateral <= safe.maxCollateral, 'Safety');
    }

    function removeLiquidity(
        Parameter memory parameter,
        BurnTo memory to,
        uint256 liquidityIn
    ) external returns (IPair.Tokens memory tokensOut) {
        IPair pair = factory.getPair(parameter.asset, parameter.collateral);
        require(address(pair) != address(0), 'Zero');

        Native memory native = natives[parameter.asset][parameter.collateral][parameter.maturity];

        tokensOut = native.liquidity.burn(msg.sender, to.asset, to.collateral, liquidityIn);
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
                params.minBond,
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
        uint128 value = MsgValue.getUint128();
        weth.deposit{value: value}();

        claimsOut = _lendGivenBond(
            _LendGivenBond(
                weth,
                params.collateral,
                params.maturity,
                address(this),
                params.bondTo,
                params.insuranceTo,
                value,
                params.bondOut,
                params.minBond,
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
                params.minBond,
                params.minInsurance,
                params.deadline
            )
        );
    }

    function _lendGivenBond(_LendGivenBond memory params) private returns (IPair.Claims memory claimsOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint128 interestDecrease, uint128 cdpDecrease) = pair.givenBond(
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
                params.minBond,
                params.minInsurance,
                params.deadline
            )
        );
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
                params.minInsurance,
                params.deadline
            )
        );
    }

    function lendGivenInsuranceETHAsset(LendGivenInsuranceETHAsset calldata params)
        external
        returns (IPair.Claims memory claimsOut)
    {
        uint128 value = MsgValue.getUint128();
        weth.deposit{value: value}();

        claimsOut = _lendGivenInsurance(
            _LendGivenInsurance(
                weth,
                params.collateral,
                params.maturity,
                address(this),
                params.bondTo,
                params.insuranceTo,
                value,
                params.insuranceOut,
                params.minBond,
                params.minInsurance,
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
                params.minInsurance,
                params.deadline
            )
        );
    }

    function _lendGivenInsurance(_LendGivenInsurance memory params) private returns (IPair.Claims memory claimsOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint128 interestDecrease, uint128 cdpDecrease) = pair.givenInsurance(
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
                params.minBond,
                params.minInsurance,
                params.deadline
            )
        );
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

        require(claimsOut.bond >= params.minBond, 'Safety');
        require(claimsOut.insurance >= params.minInsurance, 'Safety');
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
            ETH.transfer(params.assetTo, tokensOut.asset); // fix
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
            ETH.transfer(params.collateralTo, tokensOut.collateral); // fix
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

    function borrowGivenDebt(
        Parameter memory parameter,
        BorrowTo memory to,
        uint128 assetOut,
        uint128 debtOut,
        BorrowSafe memory safe,
        uint256 deadline
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        require(deadline >= block.timestamp, 'Expired');

        IPair pair = factory.getPair(parameter.asset, parameter.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint128 interestIncrease, uint128 cdpIncrease) = pair.givenDebt(parameter.maturity, assetOut, debtOut);

        dueOut.collateral = pair.getCollateral(parameter.maturity, assetOut, cdpIncrease);

        parameter.collateral.safeTransferFrom(msg.sender, pair, dueOut.collateral);

        Native memory native = natives[parameter.asset][parameter.collateral][parameter.maturity];

        (id, dueOut) = pair.borrow(
            parameter.maturity,
            to.asset,
            address(native.debt),
            assetOut,
            interestIncrease,
            cdpIncrease
        );

        native.debt.mint(to.due, id);

        require(dueOut.debt <= safe.maxDebt, 'Safety');
        require(dueOut.collateral <= safe.maxCollateral, 'Safety');
    }

     function borrowGivenCollateral(
        Parameter memory parameter,
        BorrowTo memory to,
        uint128 assetOut,
        uint128 collateralLocked,
        BorrowSafe memory safe,
        uint256 deadline
    ) external returns (uint256 id, IPair.Due memory dueOut) {
        require(deadline >= block.timestamp, 'Expired');

        IPair pair = factory.getPair(parameter.asset, parameter.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint128 interestIncrease, uint128 cdpIncrease) = pair.givenCollateral(parameter.maturity, assetOut, collateralLocked);

        dueOut.collateral = pair.getCollateral(parameter.maturity, assetOut, cdpIncrease);

        parameter.collateral.safeTransferFrom(msg.sender, pair, dueOut.collateral);

        Native memory native = natives[parameter.asset][parameter.collateral][parameter.maturity];

        (id, dueOut) = pair.borrow(
            parameter.maturity,
            to.asset,
            address(native.debt),
            assetOut,
            interestIncrease,
            cdpIncrease
        );

        native.debt.mint(to.due, id);

        require(dueOut.debt <= safe.maxDebt, 'Safety');
        require(dueOut.collateral <= safe.maxCollateral, 'Safety');
    }

    function repay(
        Parameter memory parameter,
        address to,
        address owner,
        uint256[] memory ids,
        uint112[] memory assetsPay,
        uint256 deadline
    ) external returns (uint128 collateralOut) {
        require(deadline >= block.timestamp, 'Expired');

        IPair pair = factory.getPair(parameter.asset, parameter.collateral);
        require(address(pair) != address(0), 'Zero');

        Native memory native = natives[parameter.asset][parameter.collateral][parameter.maturity];

        collateralOut = native.debt.burn(owner, to, ids, assetsPay);
    }
}
