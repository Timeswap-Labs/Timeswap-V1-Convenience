// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

interface IPair {
    // STRUCT

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

    struct State {
        Tokens reserves;
        uint128 interest;
        uint128 cdp;
    }

    struct Pool {
        State state;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidityOf;
        Claims totalClaims;
        mapping(address => Claims) claimsOf;
        mapping(address => Debt[]) debtsOf;
    }

    // VIEW

    function fee() external view returns (uint16);

    function state(uint256 maturity) external view returns (State memory);

    function totalLiquidity(uint256 maturity) external view returns (uint256);

    function claimsOf(uint256 maturity, address owner) external view returns (Claims memory);

    // UPDATE

    function burn(
        uint256 maturity,
        address assetTo,
        address collateralTo,
        uint256 liquidityIn
    ) external returns (Tokens memory tokensOut);

    function lend(
        uint256 maturity,
        address bondTo,
        address insuranceTo,
        uint128 interestDecrease,
        uint128 cdpDecrease
    ) external returns (Claims memory claimsOut);

    function withdraw(
        uint256 maturity,
        address assetTo,
        address collateralTo,
        Claims memory claimsIn
    ) external returns (Tokens memory tokensOut);
}
