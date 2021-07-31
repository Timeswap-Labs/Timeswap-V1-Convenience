// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

interface IPair {
    struct Tokens {
        uint128 asset;
        uint128 collateral;
    }

    struct Claims {
        uint128 bond;
        uint128 insurance;
    }

    struct Debt {
        uint112 debt;
        uint112 collateral;
        uint32 startBlock;
    }

    struct Parameter {
        Tokens reserves;
        uint128 interest;
        uint128 cdp;
    }

    struct Pool {
        Parameter parameter;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidityOf;
        Claims totalClaims;
        mapping(address => Claims) claimsOf;
        mapping(address => Debt[]) debtsOf;
    }

    function withdraw(
        uint256 maturity,
        address assetTo,
        address collateralTo,
        Claims memory claimsIn
    ) external returns (Tokens memory tokensOut);

    function claimsOf(uint256 maturity, address owner) external view returns (Claims memory);
}
