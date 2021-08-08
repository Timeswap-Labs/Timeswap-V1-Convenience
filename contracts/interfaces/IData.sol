// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

interface IData {
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
}
