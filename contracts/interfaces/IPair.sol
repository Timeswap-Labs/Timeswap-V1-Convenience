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

    struct Due {
        uint112 debt;
        uint112 collateral;
        uint32 startBlock;
    }

    struct State {
        Tokens reserves;
        uint128 interest;
        uint128 cdp;
    }

    // VIEW

    function fee() external view returns (uint16);

    function state(uint256 maturity) external view returns (State memory);

    function totalLiquidity(uint256 maturity) external view returns (uint256);

    function claimsOf(uint256 maturity, address owner) external view returns (Claims memory);

    function duesOf(uint256 maturity, address owner) external view returns (Due[] memory);

    // UPDATE

    function mint(
        uint256 maturity,
        address liquidityTo,
        address dueTo,
        uint112 interestIncrease,
        uint112 cdpIncrease
    )
        external
        returns (
            uint256 liquidityOut,
            uint256 id,
            Due memory dueOut
        );

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
        uint112 interestDecrease,
        uint112 cdpDecrease
    ) external returns (Claims memory claimsOut);

    function withdraw(
        uint256 maturity,
        address assetTo,
        address collateralTo,
        Claims memory claimsIn
    ) external returns (Tokens memory tokensOut);

    function borrow(
        uint256 maturity,
        address assetTo,
        address dueTo,
        uint128 assetOut,
        uint112 interestIncrease,
        uint112 cdpIncrease
    ) external returns (uint256 id, Due memory dueOut);

    function pay(
        uint256 maturity,
        address to,
        address owner,
        uint256[] memory ids,
        uint112[] memory assetsPay
    ) external returns (uint128 collateralOut);
}
