// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IDue} from './interfaces/IDue.sol';
import {IERC721Receiver} from '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import {IConvenience} from './interfaces/IConvenience.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {ERC721Permit} from './base/ERC721Permit.sol';
import {Native} from './base/Native.sol';
import {SafeMetadata} from './libraries/SafeMetadata.sol';
import {Strings} from '@openzeppelin/contracts/utils/Strings.sol';

contract CollateralizedDebt is IDue, ERC721Permit, Native {
    using Strings for uint256;
    using SafeMetadata for IERC20;

    function name() external view override returns (string memory) {
        string memory assetName = pair.asset().safeName();
        string memory collateralName = pair.collateral().safeName();
        return
            string(
                abi.encodePacked(
                    'Timeswap Collateralized Debt - ',
                    assetName,
                    ' - ',
                    collateralName,
                    ' - ',
                    maturity.toString()
                )
            );
    }

    function symbol() external view override returns (string memory) {
        string memory assetSymbol = pair.asset().safeSymbol();
        string memory collateralSymbol = pair.collateral().safeSymbol();
        return string(abi.encodePacked('TS-CDT-', assetSymbol, '-', collateralSymbol, '-', maturity.toString()));
    }

    function tokenURI(uint256 id) external view override returns (string memory) {}

    function assetDecimals() external view override returns (uint8) {
        return pair.asset().safeDecimals();
    }

    function collateralDecimals() external view override returns (uint8) {
        return pair.collateral().safeDecimals();
    }

    function dueOf(uint256 id) external view override returns (IPair.Due memory) {
        return pair.duesOf(maturity, address(this))[id];
    }

    constructor(
        IConvenience _convenience,
        IPair _pair,
        uint256 _maturity
    ) Native(_convenience, _pair, _maturity) {}

    function mint(address to, uint256 id) external override onlyConvenience {
        _safeMint(to, id);
    }

    function burn(
        address from,
        address to,
        uint256[] memory ids,
        uint112[] memory debtsIn,
        uint112[] memory collateralsOut,
        bytes calldata data
    ) external override onlyConvenience returns (uint128 assetIn, uint128 collateralOut) {
        (assetIn, collateralOut) = pair.pay(maturity, to, address(this), ids, debtsIn, collateralsOut, data);

        IPair.Due[] memory dues = pair.duesOf(maturity, address(this));
        for (uint256 i; i < ids.length; i++) {
            uint256 id = ids[i];

            if (dues[id].collateral == 0 && ownerOf[id] == from) _burn(from, id);
        }
    }

    function timeswapPayCallback(uint128 assetIn, bytes calldata data) external override {
        require(msg.sender == address(pair), 'Invalid sender');

        convenience.collateralizedDebtCallback(pair, maturity, assetIn, data);
    }
}
