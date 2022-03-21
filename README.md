# Timeswap V1 Convenience

[![Build](https://github.com/Timeswap-Labs/Timeswap-V1-Convenience/actions/workflows/build.yml/badge.svg)](https://github.com/Timeswap-Labs/Timeswap-V1-Convenience/actions/workflows/build.yml)
[![Lint](https://github.com/Timeswap-Labs/Timeswap-V1-Convenience/actions/workflows/lint.yml/badge.svg)](https://github.com/Timeswap-Labs/Timeswap-V1-Convenience/actions/workflows/lint.yml)

This repository contains the convenience smart contracts of the Timeswap-V1 protocol.

# Initial Setup

- Ensure yarn, npx and node.js is installed, if not install the same
- Run yarn to download the required dependncies

# Steps to build & deploy the factory

## On Hardhat Network

- Run `npx hardhat node` in one shell
- Run `npx hardhat --network localhost run scripts/deploy.js `

# Steps to run the tests

## On Hardhat Network

- Run `npx hardhat test `
