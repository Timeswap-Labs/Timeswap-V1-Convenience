// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IPair} from '../interfaces/IPair.sol';
import {IConvenience} from '../interfaces/IConvenience.sol';

import {SafeMetadata} from './libraries/SafeMetadata.sol';
import {String} from './libraries/String.sol';


library NFTTokenURIScaffold {

    using SafeMetadata for IERC20;
    using String for uint256;

    function tokensUri (
        uint256 id, 
        IPair pair, 
        IConvenience convenience,
        IPair.Due due
    ) public view returns (string) {

        string name = "Timeswap Collateralized Debt NFT";
        
        /// TODO - add more details, paraphrase this description
        string description = "Timelord has blessed us with this holy NFT";

        string uri = constructTokenSVG(
            id.toString(),
            pair.asset().safeSymbol(),
            due.debt.toString(),
            address(pair.asset),
            pair.collateral().safeSymbol(),
            due.collateral.toString(),
            address(pair.collateral),
            maturity,
            maturity.toDate()
        );
    
    }

    function constructTokenUri (string name, string description, string imageSVG) internal pure returns (string) {

        return
            string(
                abi.encodePacked(
                    'data:application/json;base64,',
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name,
                                '", "description":"',
                                descriptionPartOne,
                                descriptionPartTwo,
                                '", "image": "',
                                'data:image/svg+xml;base64,',
                                image,
                                '"}'
                            )
                        )
                    )
                )
            );
    }


    function constructTokenSVG (
        string tokenId,
        string assetSymbol, 
        string assetAmount, 
        string assetAddress, 
        string collatteralSymbol, 
        string collatteralAmount, 
        string collatteralAddress,
        string maturityDate,
        string maturityTimestamp,
    ) internal pure returns (string) {

        /// TODO - finalize SVG
    }
}