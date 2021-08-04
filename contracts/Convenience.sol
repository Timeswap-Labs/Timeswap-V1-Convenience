// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from './interfaces/IConvenience.sol';
import {IFactory} from './interfaces/IFactory.sol';
import {IPair} from './interfaces/IPair.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {IClaim} from './interfaces/IClaim.sol';
import {IDue} from './interfaces/IDue.sol';
import {ILiquidity} from './interfaces/ILiquidity.sol';
import {LendMath} from './libraries/LendMath.sol';
import {BorrowMath} from './libraries/BorrowMath.sol';
import {SafeTransfer} from './libraries/SafeTransfer.sol';

contract Convenience {
    using LendMath for IPair;
    using BorrowMath for IPair;
    using SafeTransfer for IERC20;

    struct Parameter {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
    }

    struct LendTo {
        address bond;
        address insurance;
    }

    struct LendSafe {
        uint256 minBond;
        uint256 minInsurance;
    }

    struct WithdrawTo {
        address asset;
        address collateral;
    }

    struct BorrowTo {
        address asset;
        address due;
    }

    struct BorrowSafe {
        uint256 maxDebt;
        uint256 maxCollateral;
    }

    IFactory public immutable factory;

    struct Native {
        ILiquidity liquiidty;
        IClaim bond;
        IClaim insurance;
        IDue debt;
    }

    mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native))) public natives;

    constructor(IFactory _factory) {
        factory = _factory;
    }

    function lendGivenBond(
        Parameter memory parameter,
        LendTo memory to,
        uint128 assetIn,
        uint128 bondOut,
        LendSafe memory safe,
        uint256 deadline
    ) external returns (IPair.Claims memory claims) {
        require(deadline >= block.timestamp, 'Expired');

        IPair pair = factory.getPair(parameter.asset, parameter.collateral);

        require(address(pair) != address(0), 'Zero');

        (uint128 interestDecrease, uint128 cdpDecrease) = pair.givenBond(parameter.maturity, assetIn, bondOut);

        parameter.asset.safeTransferFrom(msg.sender, pair, assetIn);

        Native memory native = natives[parameter.asset][parameter.collateral][parameter.maturity];

        claims = pair.lend(
            parameter.maturity,
            address(native.bond),
            address(native.insurance),
            interestDecrease,
            cdpDecrease
        );

        native.bond.mint(to.bond, claims.bond);
        native.insurance.mint(to.insurance, claims.insurance);

        require(claims.bond >= safe.minBond, 'Safety');
        require(claims.insurance >= safe.minInsurance, 'Safety');
    }

    function lendGivenInsurance(
        Parameter memory parameter,
        LendTo memory to,
        uint128 assetIn,
        uint128 insuranceOut,
        LendSafe memory safe,
        uint256 deadline
    ) external returns (IPair.Claims memory claims) {
        require(deadline >= block.timestamp, 'Expired');

        IPair pair = factory.getPair(parameter.asset, parameter.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint128 interestDecrease, uint128 cdpDecrease) = pair.givenInsurance(
            parameter.maturity,
            assetIn,
            insuranceOut
        );

        parameter.asset.safeTransferFrom(msg.sender, pair, assetIn);

        Native memory native = natives[parameter.asset][parameter.collateral][parameter.maturity];

        claims = pair.lend(
            parameter.maturity,
            address(native.bond),
            address(native.insurance),
            interestDecrease,
            cdpDecrease
        );

        native.bond.mint(to.bond, claims.bond);
        native.insurance.mint(to.insurance, claims.insurance);

        require(claims.bond >= safe.minBond, 'Safety');
        require(claims.insurance >= safe.minInsurance, 'Safety');
    }

    function collect(
        Parameter memory parameter,
        WithdrawTo memory to,
        IPair.Claims memory claimsIn
    ) external returns (IPair.Tokens memory tokens) {
        IPair pair = factory.getPair(parameter.asset, parameter.collateral);
        require(address(pair) != address(0), 'Zero');

        Native memory native = natives[parameter.asset][parameter.collateral][parameter.maturity];

        tokens.asset = native.bond.burn(msg.sender, to.asset, claimsIn.bond);
        tokens.collateral = native.insurance.burn(msg.sender, to.collateral, claimsIn.insurance);
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
