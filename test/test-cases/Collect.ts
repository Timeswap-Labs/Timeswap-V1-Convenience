import {CollectParams } from "./types";

export function collectTests():CollectParams[]{
    return [{
        claims: {bond: 1n,
        insurance:1n}
    }]
}
