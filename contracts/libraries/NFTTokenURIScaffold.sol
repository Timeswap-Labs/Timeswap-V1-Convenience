// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import 'base64-sol/base64.sol';
import {IPair} from '../interfaces/IPair.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {IConvenience} from '../interfaces/IConvenience.sol';
import {SafeMetadata} from './SafeMetadata.sol';
import {String} from './String.sol';
import {NFTSVG} from './NFTSVG.sol';


library NFTTokenURIScaffold {

    using SafeMetadata for IERC20;
    using String for uint256;

    function tokenURI (
        uint256 id, 
        IPair pair, 
        IConvenience convenience,
        IPair.Due memory due,
        uint maturity
    ) public view returns (string memory) {



        string memory uri = constructTokenSVG(
            id.toString(),
            pair.asset().safeSymbol(),
            weiToPrecisionString(due.debt, pair.asset().safeDecimals()),
            addressToString(address(pair.asset())),
            pair.collateral().safeSymbol(),
            weiToPrecisionString(due.collateral, pair.collateral().safeDecimals()),
            addressToString(address(pair.collateral())),
            maturity.toString(),
            maturity
        );

        string memory name = "Timeswap Collateralized Debt NFT";
        
        string memory description = "Timelord has blessed us with this holy NFT";

        return (constructTokenURI(name, description, uri));
    
    }

    function constructTokenURI (string memory name, string memory description, string memory imageSVG) internal view returns (string memory) {

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
                                description,
                                '", "image": "',
                                'data:image/svg+xml;base64,',
                                Base64.encode(bytes(imageSVG)),
                                '"}'
                            )
                        )
                    )
                )
            );
    }




    function constructTokenSVG (
        string memory tokenId,
        string memory assetSymbol, 
        string memory assetAmount, 
        string memory assetAddress, 
        string memory collateralSymbol, 
        string memory collateralAmount, 
        string memory collateralAddress,
        string memory maturityDate,
        uint256 maturityTimestamp
    ) internal view returns (string memory) {

        /// TODO - finalize SVG
        NFTSVG.SVGParams memory params = NFTSVG.SVGParams({
            tokenId: tokenId,
            assetSymbol: assetSymbol,
            assetAmount: assetAmount,
            assetAddress: assetAddress,
            collateralSymbol: collateralSymbol,
            collateralAmount: collateralAmount,
            collateralAddress: collateralAddress,
            maturityDate: maturityDate,
            maturityTimestamp: maturityTimestamp
        });

        return NFTSVG.constructSVG(params);
    }

    function weiToPrecisionString (uint256 weiAmt, uint256 decimal) public pure returns (string memory) {
        if (decimal == 0) {
            return string(abi.encodePacked(weiAmt.toString(), '.00'));
        }
        uint256 significantDigits = weiAmt/(10 ** decimal);
        uint256 precisionDigits = weiAmt % (10 ** (decimal));
        precisionDigits = precisionDigits/(10 ** (decimal - 2));
        return string(abi.encodePacked(significantDigits.toString(), '.', precisionDigits.toString()));
    }

    function addressToString(address _addr) public pure returns(string memory) {
        bytes memory data = abi.encodePacked(_addr);
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
}