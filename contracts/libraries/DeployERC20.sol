// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {IConvenience} from '../interfaces/IConvenience.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {Liquidity} from '../Liquidity.sol';
import {BondInterest} from '../BondInterest.sol';
import {BondPrincipal} from '../BondPrincipal.sol';
import {InsuranceInterest} from '../InsuranceInterest.sol';
import {InsurancePrincipal} from '../InsurancePrincipal.sol';

library DeployERC20 {
    function deployERC20(
        IConvenience.Native storage native,
        bytes32 salt,
        IConvenience convenience,
        IPair pair,
        uint256 maturity
    ) external {
        native.liquidity = new Liquidity{salt: salt}(convenience, pair, maturity);
        native.bondInterest = new BondInterest{salt: salt}(convenience, pair, maturity);
        native.bondPrincipal = new BondPrincipal{salt: salt}(convenience,pair,maturity);
        native.insuranceInterest = new InsuranceInterest{salt: salt}(convenience, pair,maturity);
        native.insurancePrincipal = new InsurancePrincipal{salt: salt}(convenience, pair, maturity);
    }
}
