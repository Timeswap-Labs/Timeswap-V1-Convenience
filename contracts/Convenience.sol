// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from './interfaces/IConvenience.sol';
import {IFactory} from './interfaces/IFactory.sol';
import {IPair} from './interfaces/IPair.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {IClaim} from './interfaces/IClaim.sol';
import {IDebt} from './interfaces/IDebt.sol';
import {ILiquidity} from './interfaces/ILiquidity.sol';
import {LendMath} from './libraries/LendMath.sol';
import {SafeTransfer} from './libraries/SafeTransfer.sol';

contract Convenience {
    using LendMath for IPair;
    using SafeTransfer for IERC20;

    struct Parameter {
        IERC20 asset;
        IERC20 collateral;
        uint256 maturity;
    }

    struct SafeLend {
        uint256 minBond;
        uint256 minInsurance;
    }

    IFactory public immutable factory;

    struct Native {
        ILiquidity liquiidty;
        IClaim bond;
        IClaim insurance;
        IDebt debt;
    }

    mapping(IERC20 => mapping(IERC20 => mapping(uint256 => Native))) public natives;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, 'Expired');
        _;
    }

    constructor(IFactory _factory) {
        factory = _factory;
    }

    function lendGivenBond(
        Parameter memory parameter,
        uint256 maturity,
        address to,
        uint128 assetIn,
        uint128 bondOut,
        SafeLend memory safe,
        uint256 deadline
    ) external ensure(deadline) returns (IPair.Claims memory claims) {
        IPair pair = factory.getPair(parameter.asset, parameter.collateral);

        require(address(pair) != address(0), 'Zero');
        require(pair.totalLiquidity(maturity) > 0, 'Forbidden');

        (uint128 interestDecrease, uint128 cdpDecrease) = pair.givenBond(maturity, assetIn, bondOut);

        parameter.asset.safeTransferFrom(msg.sender, pair, assetIn);

        Native memory native = natives[parameter.asset][parameter.collateral][maturity];

        claims = pair.lend(maturity, address(native.bond), address(native.insurance), interestDecrease, cdpDecrease);

        native.bond.mint(to, claims.bond);
        native.insurance.mint(to, claims.insurance);

        require(claims.bond >= safe.minBond, 'Safety');
        require(claims.insurance >= safe.minInsurance, 'Safety');
    }
}
