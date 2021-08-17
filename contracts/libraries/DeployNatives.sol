// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IFactory} from '../interfaces/IFactory.sol';
import {IPair} from '../interfaces/IPair.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {Liquidity} from '../Liquidity.sol';
import {Bond} from '../Bond.sol';
import {Insurance} from '../Insurance.sol';
import {CollateralizedDebt} from '../CollateralizedDebt.sol';
import {Deploy} from './Deploy.sol';
import {IDeployNatives} from '../interfaces/IDeployNatives.sol';

library DeployNatives {
    using Deploy for IConvenience.Native;

    function deployIfNoNatives(
        mapping(IERC20 => mapping(IERC20 => mapping(uint256 => IConvenience.Native))) storage natives,
        IFactory factory,
        IConvenience convenience,
        IDeployNatives.Deploy calldata params
    ) public {
        require(params.deadline >= block.timestamp, 'Expired');

        IPair pair = factory.getPair(params.asset, params.collateral);
        require(address(pair) != address(0), 'Zero');

        IConvenience.Native storage native = natives[params.asset][params.collateral][params.maturity];
        require(address(native.liquidity) == address(0), 'Invalid');

        native.deploy(convenience, pair, params.asset, params.collateral, params.maturity);
    }
}
