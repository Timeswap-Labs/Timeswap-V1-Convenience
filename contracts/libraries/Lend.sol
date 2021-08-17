// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IFactory} from '../interfaces/IFactory.sol';
import {IWETH} from '../interfaces/IWETH.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {IPair} from '../interfaces/IPair.sol';
import {ILend} from '../interfaces/ILend.sol';
import {LendMath} from './LendMath.sol';
import {SafeTransfer} from './SafeTransfer.sol';
import {Deploy} from './Deploy.sol';
import {MsgValue} from './MsgValue.sol';

library Lend {
    using LendMath for IPair;
    using SafeTransfer for IERC20;
    using Deploy for IConvenience.Native;

    function lendGivenBond(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        ILend.LendGivenBond calldata params
    ) external returns (IPair.Claims memory claimsOut) {
        claimsOut = _lendGivenBond(
            natives,
            convenience,
            factory,
            ILend._LendGivenBond(
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

    function lendGivenBondETHAsset(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IWETH weth,
        ILend.LendGivenBondETHAsset calldata params
    ) external returns (IPair.Claims memory claimsOut) {
        uint112 assetIn = MsgValue.getUint112();
        weth.deposit{value: assetIn}();

        claimsOut = _lendGivenBond(
            natives,
            convenience,
            factory,
            ILend._LendGivenBond(
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

    function lendGivenBondETHCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IWETH weth,
        ILend.LendGivenBondETHCollateral calldata params
    ) external returns (IPair.Claims memory claimsOut) {
        claimsOut = _lendGivenBond(
            natives,
            convenience,
            factory,
            ILend._LendGivenBond(
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

    function lendGivenInsurance(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        ILend.LendGivenInsurance calldata params
    ) external returns (IPair.Claims memory claimsOut) {
        claimsOut = _lendGivenInsurance(
            natives,
            convenience,
            factory,
            ILend._LendGivenInsurance(
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

    function lendGivenInsuranceETHAsset(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IWETH weth,
        ILend.LendGivenInsuranceETHAsset calldata params
    ) external returns (IPair.Claims memory claimsOut) {
        uint112 assetIn = MsgValue.getUint112();
        weth.deposit{value: assetIn}();

        claimsOut = _lendGivenInsurance(
            natives,
            convenience,
            factory,
            ILend._LendGivenInsurance(
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

    function lendGivenInsuranceETHCollateral(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        IWETH weth,
        ILend.LendGivenInsuranceETHCollateral calldata params
    ) external returns (IPair.Claims memory claimsOut) {
        claimsOut = _lendGivenInsurance(
            natives,
            convenience,
            factory,
            ILend._LendGivenInsurance(
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

    function _lendGivenBond(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        ILend._LendGivenBond memory params
    ) private returns (IPair.Claims memory claimsOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint112 interestDecrease, uint112 cdpDecrease) = pair.givenBond(
            params.maturity,
            params.assetIn,
            params.bondOut
        );

        claimsOut = _lend(
            natives,
            convenience,
            pair,
            ILend._Lend(
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

    function _lendGivenInsurance(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IFactory factory,
        ILend._LendGivenInsurance memory params
    ) private returns (IPair.Claims memory claimsOut) {
        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        (uint112 interestDecrease, uint112 cdpDecrease) = pair.givenInsurance(
            params.maturity,
            params.assetIn,
            params.insuranceOut
        );

        claimsOut = _lend(
            natives,
            convenience,
            pair,
            ILend._Lend(
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

    function _lend(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IConvenience convenience,
        IPair pair,
        ILend._Lend memory params
    ) private returns (IPair.Claims memory claimsOut) {
        require(params.deadline >= block.timestamp, 'Expired');

        params.asset.safeTransferFrom(params.from, pair, params.assetIn);

        IConvenience.Native storage native = natives[params.asset][params.collateral][params.maturity];
        if (address(native.liquidity) == address(0))
            native.deploy(convenience, pair, params.asset, params.collateral, params.maturity);

        claimsOut = pair.lend(
            params.maturity,
            address(native.bond),
            address(native.insurance),
            params.interestDecrease,
            params.cdpDecrease
        );

        native.bond.mint(params.bondTo, claimsOut.bond);
        native.insurance.mint(params.insuranceTo, claimsOut.insurance);
    }
}
