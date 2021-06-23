import chai from "chai";
import helper from "./Helper";

import { web3, ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { TimeswapFactory } from "../typechain/TimeswapFactory";
import { TimeswapPool } from "../typechain/TimeswapPool";
import { Insurance } from "../typechain/Insurance";
import { Bond } from "../typechain/Bond";
import { CollateralizedDebt } from "../typechain/CollateralizedDebt";
import { TestToken } from "../typechain/TestToken";
import { TimeswapConvenience } from "../typechain/TimeswapConvenience";

chai.use(solidity);
const { expect } = chai;
const { advanceTimeAndBlock, now, getTimestamp, setTime } = helper;

const transactionFee = 30n;
const protocolFee = 30n;

const base = 10000n;
const deadlineDuration = 600n * 3n;
const duration = 86400;
const year = 31556926n;

let accounts: SignerWithAddress[];
let timeswapFactory: TimeswapFactory;
let timeswapPool: TimeswapPool;
let insurance: Insurance;
let bond: Bond;
let collateralizedDebt: CollateralizedDebt;

let feeTo: string;
let feeToSetter: string;
let receiver: SignerWithAddress;

const decimals1 = 8;
const decimals2 = 18;

let testToken1: TestToken;
let testToken2: TestToken;

let maturity: bigint;
let deadline: bigint;

let parameter: { asset: string; collateral: string; maturity: bigint };
let pool: TimeswapPool;
let timestamp: number;

let timeswapConvenience: TimeswapConvenience;

const divUp = (x: bigint, y: bigint) => {
  const z =  x / y;
  if (y * z == x) {
    return z
  } else {
    return z + 1n
  }
};

const insuranceAt = async (address: string) => {
  const insuranceFactory = await ethers.getContractFactory("Insurance");
  const insurance = insuranceFactory.attach(address) as Insurance;

  return insurance;
};

const bondAt = async (address: string) => {
  const bondFactory = await ethers.getContractFactory("Bond");
  const bond = bondFactory.attach(address) as Bond;

  return bond;
};

const collateralizedDebtAt = async (address: string) => {
  const collateralizedDebtFactory = await ethers.getContractFactory(
    "CollateralizedDebt"
  );
  const collateralizedDebt = collateralizedDebtFactory.attach(
    address
  ) as CollateralizedDebt;

  return collateralizedDebt;
};

const testTokenNew = async (value: number) => {
  const testTokenFactory = await ethers.getContractFactory("TestToken");
  const testToken = (await testTokenFactory.deploy(value)) as TestToken;
  await testToken.deployed();

  return testToken;
};

const checkBigIntEquality = (x: bigint, y: bigint) => {
  expect(x.toString()).to.equal(y.toString());
}

const deploy = async () => {
  accounts = await ethers.getSigners();

  const timeswapPoolFactory = await ethers.getContractFactory("TimeswapPool");
  timeswapPool = (await timeswapPoolFactory.deploy()) as TimeswapPool;
  await timeswapPool.deployed();

  const bondFactory = await ethers.getContractFactory("Bond");
  bond = (await bondFactory.deploy()) as Bond;
  await bond.deployed();

  const insuranceFactory = await ethers.getContractFactory("Insurance");
  insurance = (await insuranceFactory.deploy()) as Insurance;
  await insurance.deployed();

  const collateralizedDebtFactory = await ethers.getContractFactory(
    "CollateralizedDebt"
  );
  collateralizedDebt =
    (await collateralizedDebtFactory.deploy()) as CollateralizedDebt;
  await collateralizedDebt.deployed();

  feeTo = accounts[1].address;
  feeToSetter = accounts[2].address;

  const timeswapFactoryFactory = await ethers.getContractFactory(
    "TimeswapFactory"
  );
  timeswapFactory = (await timeswapFactoryFactory.deploy(
    feeTo,
    feeToSetter,
    timeswapPool.address,
    insurance.address,
    bond.address,
    collateralizedDebt.address,
    transactionFee,
    protocolFee
  )) as TimeswapFactory;
  await timeswapFactory.deployed();

  testToken1 = await testTokenNew(decimals1);
  testToken2 = await testTokenNew(decimals2);

  maturity = BigInt((await now()) + duration);
  deadline = BigInt(await now()) + deadlineDuration;

  parameter = {
    asset: testToken1.address,
    collateral: testToken2.address,
    maturity: maturity,
  };

  await timeswapFactory.createPool(
    testToken1.address,
    testToken2.address,
    maturity
  );

  const timeswapConvenienceFactory = await ethers.getContractFactory(
    "TimeswapConvenience"
  );
  timeswapConvenience = (await timeswapConvenienceFactory.deploy(
    timeswapFactory.address
  )) as TimeswapConvenience;
  await timeswapConvenience.deployed();
};

const deployAndMint = async (
  assetIn: bigint,
  collateralPaid: bigint,
  collateralLocked: bigint
) => {
  await deploy();

  receiver = accounts[3];

  await mintToken(assetIn, collateralPaid + collateralLocked);
  await approve(0n, assetIn, collateralPaid + collateralLocked);

  const transaction = await timeswapConvenience
    .connect(receiver)
    ["mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"](
      parameter,
      receiver.address,
      assetIn,
      collateralPaid,
      collateralLocked,
      deadline
    );

  timestamp = await getTimestamp(transaction.blockHash!);

  const timeswapPoolFactory = await ethers.getContractFactory("TimeswapPool");
  pool = timeswapPoolFactory.attach(
    await timeswapFactory.getPool(
      testToken1.address,
      testToken2.address,
      maturity
    )
  ) as TimeswapPool;
};

describe("constructor", () => {
  describe("success case", () => {
    before(async () => {
      await deploy();
    });

    it("Should be a proper address", async () => {
      expect(timeswapConvenience.address).to.be.properAddress;
    });

    it("Should have a correct factory", async () => {
      const result = await timeswapConvenience.factory();

      expect(result).to.equal(timeswapFactory.address);
    });
  });
});

const mintToken = async (token1Amount: bigint, token2Amount: bigint) => {
  if (token1Amount > 0) await testToken1.mint(receiver.address, token1Amount);
  if (token2Amount > 0) await testToken2.mint(receiver.address, token2Amount);
};

const approve = async (
  liquidityAmount: bigint,
  token1Amount: bigint,
  token2Amount: bigint
) => {
  if (liquidityAmount > 0)
    await pool
      .connect(receiver)
      .approve(timeswapConvenience.address, liquidityAmount);

  if (token1Amount > 0)
    await testToken1
      .connect(receiver)
      .approve(timeswapConvenience.address, token1Amount);

  if (token2Amount > 0)
    await testToken2
      .connect(receiver)
      .approve(timeswapConvenience.address, token2Amount);
};

describe("mint", () => {
  describe("mint initial", () => {
    const assetIn = 100n;
    const bondIncrease = 20n;
    const insuranceIncrease = 1100n;
    const collateralIn = 240n;

    const bondReceived = 220n;
    const insuranceReceived = 100n;

    const liquidityBurn = 1000n;
    const liquidityReceived = 99n;
    const liquidityFeeTo = 1n;

    const bondTotalSupply = 240n;
    const insuranceTotalSupply = 1200n;
    const liquidityTotalSupply = 1100n;

    describe("success case", () => {
      before(async () => {
        await deployAndMint(assetIn, bondIncrease, bondReceived);
      });

      it("Should be a proper address", () => {
        expect(pool.address).to.be.properAddress;
      });

      it("Should have a correct maturity", async () => {
        const resultHex = await pool.maturity();
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, maturity);
      });

      it("Should have a correct factory", async () => {
        const result = await pool.factory();

        expect(result).to.equal(timeswapFactory.address);
      });

      it("Should have a correct asset", async () => {
        const result = await pool.asset();

        expect(result).to.equal(testToken1.address);
      });

      it("Should have a correct collateral", async () => {
        const result = await pool.collateral();

        expect(result).to.equal(testToken2.address);
      });

      it("Should have a correct transaction fee", async () => {
        const resultHex = await pool.transactionFee();
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, transactionFee);
      });

      it("Should have a correct protocol fee", async () => {
        const resultHex = await pool.protocolFee();
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, protocolFee);
      });

      it("Should have a correct decimals", async () => {
        const decimalsHex = await testToken1.decimals();
        const decimals = web3.utils.hexToNumber(decimalsHex);

        const resultHex = await pool.decimals();
        const result = web3.utils.hexToNumber(resultHex);

        expect(result).to.equal(decimals);
      });

      it("Should have receiver have correct amount of liquidity tokens", async () => {
        const resultHex = await pool.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, liquidityReceived);
      });

      it("Should have receiver have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, bondReceived);
      });

      it("Should have receiver have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, insuranceReceived);
      });

      it("Should have receiver have a correct collateralized debt token", async () => {
        const debtRequired =
          divUp(liquidityReceived * (base + protocolFee), base) + 1000n;

        const collateralizedDebtERC721 = await collateralizedDebtAt(
          await pool.collateralizedDebt()
        );

        const tokenId = await collateralizedDebtERC721.totalSupply();
        const result = await collateralizedDebtERC721.ownerOf(tokenId);
        const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(
          tokenId
        );
        const resultDebt = resultHex.debt.toBigInt();
        const resultCollateral = resultHex.collateral.toBigInt();

        expect(result).to.equal(receiver.address);
        checkBigIntEquality(resultDebt, insuranceIncrease);
        checkBigIntEquality(resultCollateral, bondReceived);
      });

      it("Should have pool have a correct assets reserve and balance", async () => {
        const resultHex = await testToken1.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.assetReserve();
        const resultReserve = resultReserveHex.toBigInt();

        checkBigIntEquality(result, assetIn);
        checkBigIntEquality(resultReserve, assetIn);
      });

      it("Should have pool have correct collateral reserve and balance", async () => {
        const resultHex = await testToken2.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.collateralReserve();
        const resultReserve = resultReserveHex.toBigInt();

        checkBigIntEquality(result, collateralIn);
        checkBigIntEquality(resultReserve, collateralIn);
      });

      it("Should have pool have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, bondIncrease);
      });

      it("Should have pool have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, insuranceIncrease);
      });

      it("Should burn 1000 liquidity tokens", async () => {
        const zero = "0x0000000000000000000000000000000000000000";

        const resultHex = await pool.balanceOf(zero);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, liquidityBurn);
      });

      it("Should have feeTo receive correct amount of liquidity tokens", async () => {
        const resultHex = await pool.balanceOf(feeTo);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, liquidityFeeTo);
      });

      // FIXME!!
      // it("Should have a correct invariance", async () => {
      //   const resultHex = await pool.invariance();
      //   const result = resultHex.toBigInt();

      //   const invariance =
      //     assetIn *
      //     bondIncrease *
      //     ((insuranceIncrease * year) / (maturity - BigInt(timestamp)));

      //   checkBigIntEquality(result, invariance);
      // });

      it("Should have the correct bond total supply", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.totalSupply();
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, bondTotalSupply);
      });

      it("Should have the correct insurance total supply", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.totalSupply();
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, insuranceTotalSupply);
      });

      it("Should have the correct liquidity total supply", async () => {
        const resultHex = await pool.totalSupply();
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, liquidityTotalSupply);
      });
    });

    describe("fail case", async () => {
      beforeEach(async () => {
        await deploy();
      });

      it("Should revert if the pool already exist", async () => {
        await mintToken(assetIn, collateralIn);

        await approve(0n, assetIn, collateralIn);

        timeswapConvenience
          .connect(receiver)
          [
            "mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"
          ](
            parameter,
            receiver.address,
            assetIn,
            bondIncrease,
            bondReceived,
            deadline
          );

        await mintToken(assetIn, collateralIn);

        await approve(0n, assetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"
            ](
              parameter,
              receiver.address,
              assetIn,
              bondIncrease,
              bondReceived,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if no asset input amount", async () => {
        const wrongAssetIn = 0n;

        await mintToken(wrongAssetIn, collateralIn);

        await approve(0n, wrongAssetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"
            ](
              parameter,
              receiver.address,
              wrongAssetIn,
              bondIncrease,
              bondReceived,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if no collateral input amount", async () => {
        const wrongCollateralPaid = 0n;

        await mintToken(assetIn, bondReceived);

        await approve(0n, assetIn, bondReceived);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"
            ](
              parameter,
              receiver.address,
              assetIn,
              wrongCollateralPaid,
              bondReceived,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if there is no output amount", async () => {
        const wrongCollateralLocked = 0n;

        await mintToken(assetIn, bondIncrease);

        await approve(0n, assetIn, bondIncrease);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"
            ](
              parameter,
              receiver.address,
              assetIn,
              bondIncrease,
              wrongCollateralLocked,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if pool matured", async () => {
        await advanceTimeAndBlock(duration);

        await mintToken(assetIn, collateralIn);

        await approve(0n, assetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"
            ](
              parameter,
              receiver.address,
              assetIn,
              bondIncrease,
              bondReceived,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if pool already exist or have liquidity", async () => {
        await mintToken(assetIn, collateralIn);

        await approve(0n, assetIn, collateralIn);

        await timeswapConvenience
          .connect(receiver)
          [
            "mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"
          ](
            parameter,
            receiver.address,
            assetIn,
            bondIncrease,
            bondReceived,
            deadline
          );

        await mintToken(assetIn, collateralIn);

        await approve(0n, assetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"
            ](
              parameter,
              receiver.address,
              assetIn,
              bondIncrease,
              bondReceived,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if not enough asset", async () => {
        const wrongAssetIn = assetIn - 1n;

        await mintToken(wrongAssetIn, collateralIn);

        await approve(0n, wrongAssetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"
            ](
              parameter,
              receiver.address,
              assetIn,
              bondIncrease,
              bondReceived,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if not enough collateral", async () => {
        const wrongCollateralIn = collateralIn - 1n;

        await mintToken(assetIn, wrongCollateralIn);

        await approve(0n, assetIn, wrongCollateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"
            ](
              parameter,
              receiver.address,
              assetIn,
              bondIncrease,
              bondReceived,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if wrong deadline", async () => {
        const wrongDeadline = deadline - deadlineDuration;

        await mintToken(assetIn, collateralIn);

        await approve(0n, assetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,uint256,uint256,uint256)"
            ](
              parameter,
              receiver.address,
              assetIn,
              bondIncrease,
              bondReceived,
              wrongDeadline
            )
        ).to.be.reverted;
      });
    });
  });

  describe("mint proportional", () => {
    const assetReserve = 100n;
    const bondReserve = 20n;
    const insuranceReserve = 1100n;
    const collateralReserve = 240n;
    const feeToBalance = 1n;

    let rateReserve: bigint;

    const assetIn = 10n;
    const bondIncrease = 2n;
    const insuranceIncrease = 110n;
    const bondReceived = 22n;
    const insuranceReceived = 10n;
    const collateralIn = 24n;

    const liquidityReceived = 109n;
    const liquidityFeeTo = 1n;

    const bondTotalSupplyBefore = 240n;
    const insuranceTotalSupplyBefore = 1200n;
    const liquidityTotalSupplyBefore = 1100n;

    const safeMint = {
      maxDebt: divUp(110n * 11n, 10n),
      maxCollateralPaid: divUp(2n * 11n, 10n),
      maxCollateralLocked: divUp(22n * 11n, 10n),
    };

    describe("success case", () => {
      before(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        receiver = accounts[4];

        rateReserve = (await pool.rateReserve()).toBigInt();

        await mintToken(assetIn, collateralIn);

        await approve(0n, assetIn, collateralIn);

        await timeswapConvenience
          .connect(receiver)
          [
            "mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"
          ](parameter, receiver.address, assetIn, safeMint, deadline);
      });

      it("Should have receiver have correct amount of liquidity tokens", async () => {
        const resultHex = await pool.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, liquidityReceived);
      });

      it("Should have receiver have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, bondReceived);
      });

      it("Should have receiver have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, assetIn);
      });

      it("Should have receiver have a correct collateralized debt token", async () => {
        const collateralizedDebtERC721 = await collateralizedDebtAt(
          await pool.collateralizedDebt()
        );

        const tokenId = await collateralizedDebtERC721.totalSupply();
        const result = await collateralizedDebtERC721.ownerOf(tokenId);
        const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(
          tokenId
        );
        const resultDebt = resultHex.debt.toBigInt();
        const resultCollateral = resultHex.collateral.toBigInt();

        expect(result).to.equal(receiver.address);
        checkBigIntEquality(resultDebt, insuranceIncrease);
        checkBigIntEquality(resultCollateral, bondReceived);
      });

      it("Should have pool have a correct assets", async () => {
        const resultHex = await testToken1.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.assetReserve();
        const resultReserve = resultReserveHex.toBigInt();

        const assetBalance = assetReserve + assetIn;

        checkBigIntEquality(result, assetBalance);
        checkBigIntEquality(resultReserve, assetBalance);
      });

      it("Should have pool have correct collateral", async () => {
        const resultHex = await testToken2.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.collateralReserve();
        const resultReserve = resultReserveHex.toBigInt();

        const collateralBalance = collateralReserve + collateralIn;

        checkBigIntEquality(result, collateralBalance);
        checkBigIntEquality(resultReserve, collateralBalance);
      });

      it("Should have pool have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const bondBalance = bondReserve + bondIncrease;

        checkBigIntEquality(result, bondBalance);
      });

      it("Should have pool have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const insuranceBalance = insuranceReserve + insuranceIncrease;

        checkBigIntEquality(result, insuranceBalance);
      });

      it("Should have factory receive correct amount of liquidity tokens", async () => {
        const resultHex = await pool.balanceOf(feeTo);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, feeToBalance + liquidityFeeTo);
      });

      // FIXME!!
      // it("Should have a correct invariance", async () => {
      //   const resultHex = await pool.invariance();
      //   const result = resultHex.toBigInt();

      //   const rateIncrease = divUp(
      //     rateReserve * (liquidityReceived + liquidityFeeTo),
      //     1100n
      //   );

      //   const invariance =
      //     (assetReserve + assetIn) *
      //     (bondReserve + bondIncrease) *
      //     (rateReserve + rateIncrease);

      //   checkBigIntEquality(10n, 10n);
      // });

      it("Should have the correct ratio on its asset reserves", async () => {
        const totalSupply = (await pool.totalSupply()).toBigInt();
        const ratioLiquidity =
          totalSupply / (liquidityReceived + liquidityFeeTo);
        const ratioLiquidityNumber = parseInt(ratioLiquidity.toString());

        const resultAssetHex = await testToken1.balanceOf(pool.address);
        const resultAsset = resultAssetHex.toBigInt();
        const ratioAsset = resultAsset / assetIn;
        const ratioAssetNumber = parseInt(ratioAsset.toString());

        expect(ratioLiquidityNumber).to.gte(ratioAssetNumber);
      });

      it("Should have the correct ratio on its bond reserves", async () => {
        const totalSupply = (await pool.totalSupply()).toBigInt();
        const ratioLiquidity =
          totalSupply / (liquidityReceived + liquidityFeeTo);
        const ratioLiquidityNumber = parseInt(ratioLiquidity.toString());

        const bondERC20 = await bondAt(await pool.bond());

        const resultBondHex = await bondERC20.balanceOf(pool.address);
        const resultBond = resultBondHex.toBigInt();
        const ratioBond = resultBond / bondIncrease;
        const ratioBondNumber = parseInt(ratioBond.toString());

        expect(ratioLiquidityNumber).to.gte(ratioBondNumber);
      });

      it("Should have the correct ratio on its insurance reserves", async () => {
        const totalSupply = (await pool.totalSupply()).toBigInt();
        const ratioLiquidity =
          totalSupply / (liquidityReceived + liquidityFeeTo);
        const ratioLiquidityNumber = parseInt(ratioLiquidity.toString());

        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultInsuranceHex = await insuranceERC20.balanceOf(pool.address);
        const resultInsurance = resultInsuranceHex.toBigInt();
        const ratioInsurance = resultInsurance / insuranceIncrease;
        const ratioInsuranceNumber = parseInt(ratioInsurance.toString());

        expect(ratioLiquidityNumber).to.gte(ratioInsuranceNumber);
      });

      it("Should have the correct bond total supply", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.totalSupply();
        const result = resultHex.toBigInt();

        const bondTotalSupply =
          bondTotalSupplyBefore + bondIncrease + bondReceived;

        checkBigIntEquality(result, bondTotalSupply);
      });

      it("Should have the correct insurance total supply", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.totalSupply();
        const result = resultHex.toBigInt();

        const insuranceTotalSupply =
          insuranceTotalSupplyBefore + insuranceIncrease + insuranceReceived;

        checkBigIntEquality(result, insuranceTotalSupply);
      });

      it("Should have the correct liquidity total supply", async () => {
        const resultHex = await pool.totalSupply();
        const result = resultHex.toBigInt();

        const liquidityTotalSupply =
          liquidityTotalSupplyBefore + liquidityReceived + liquidityFeeTo;

        checkBigIntEquality(result, liquidityTotalSupply);
      });
    });

    describe("fail case", async () => {
      beforeEach(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        receiver = accounts[4];
      });

      it("Should revert if the pool does not exist", async () => {
        const wrongToken = await testTokenNew(0);

        const wrongParameter = {
          asset: wrongToken.address,
          collateral: testToken2.address,
          maturity: maturity,
        };

        await mintToken(assetIn, collateralIn);

        await approve(0n, assetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"
            ](wrongParameter, receiver.address, assetIn, safeMint, deadline)
        ).to.be.reverted;
      });

      it("Should revert if no asset input amount", async () => {
        const wrongAssetIn = 0n;

        await mintToken(wrongAssetIn, collateralIn);

        await approve(0n, wrongAssetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"
            ](parameter, receiver.address, wrongAssetIn, safeMint, deadline)
        ).to.be.reverted;
      });

      it("Should revert if no collateral input amount", async () => {
        const wrongCollateralIn = 0n;

        await mintToken(assetIn, wrongCollateralIn);

        await approve(0n, assetIn, wrongCollateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"
            ](parameter, receiver.address, assetIn, safeMint, deadline)
        ).to.be.reverted;
      });

      it("Should revert if pool matured", async () => {
        await advanceTimeAndBlock(duration);

        await mintToken(assetIn, collateralIn);

        await approve(0n, assetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"
            ](parameter, receiver.address, assetIn, safeMint, deadline)
        ).to.be.reverted;
      });

      it("Should revert if not enough asset", async () => {
        const wrongAssetIn = assetIn - 1n;

        await mintToken(wrongAssetIn, collateralIn);

        await approve(0n, wrongAssetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"
            ](parameter, receiver.address, assetIn, safeMint, deadline)
        ).to.be.reverted;
      });

      it("Should revert if not enough collateral", async () => {
        const wrongCollateralIn = collateralIn - 1n;

        await mintToken(assetIn, wrongCollateralIn);

        await approve(0n, assetIn, wrongCollateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"
            ](parameter, receiver.address, assetIn, safeMint, deadline)
        ).to.be.reverted;
      });

      it("Should revert if reached maxDebt", async () => {
        const wrongSafeMint = {
          maxDebt: 110n - 1n,
          maxCollateralPaid: divUp(2n * 11n, 10n),
          maxCollateralLocked: divUp(22n * 11n, 10n),
        };

        await mintToken(assetIn, collateralIn);

        await approve(0n, assetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"
            ](parameter, receiver.address, assetIn, wrongSafeMint, deadline)
        ).to.be.reverted;
      });

      it("Should revert if reached maxCollateralPaid", async () => {
        const wrongSafeMint = {
          maxDebt: divUp(110n * 11n, 10n),
          maxCollateralPaid: 2n - 1n,
          maxCollateralLocked: divUp(22n * 11n, 10n),
        };

        await mintToken(assetIn, collateralIn);

        await approve(0n, assetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"
            ](parameter, receiver.address, assetIn, wrongSafeMint, deadline)
        ).to.be.reverted;
      });

      it("Should revert if reached maxCollateralLocked", async () => {
        const wrongSafeMint = {
          maxDebt: divUp(110n * 11n, 10n),
          maxCollateralPaid: divUp(2n * 11n, 10n),
          maxCollateralLocked: 22n - 1n,
        };

        await mintToken(assetIn, collateralIn);

        await approve(0n, assetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"
            ](parameter, receiver.address, assetIn, wrongSafeMint, deadline)
        ).to.be.reverted;
      });

      it("Should revert if wrong deadline", async () => {
        const wrongDeadline = deadline - deadlineDuration;

        await mintToken(assetIn, collateralIn);

        await approve(0n, assetIn, collateralIn);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"
            ](parameter, receiver.address, assetIn, safeMint, wrongDeadline)
        ).to.be.reverted;
      });
    });
  });
});

describe("burn", () => {
  const assetReserve = 100n;
  const bondReserve = 20n;
  const insuranceReserve = 1100n;
  const collateralReserve = 240n;

  let rateReserve: bigint;

  const liquidityIn = 90n;
  const bondReceived = 1n;
  const insuranceReceived = 90n;

  const bondTotalSupplyBefore = 240n;
  const insuranceTotalSupplyBefore = 1200n;
  const liquidityTotalSupplyBefore = 1100n;

  const collateralIn = 1n;
  const assetMax = 8n;
  const assetReceived = 8n;

  const safeBurn = {
    minAsset: (8n * 9n) / 10n,
    minBond: (1n * 9n) / 10n,
    minInsurance: (90n * 9n) / 10n,
  };

  describe("burn before maturity", () => {
    describe("success case", () => {
      before(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        await mintToken(0n, collateralIn);

        await approve(liquidityIn, 0n, collateralIn);

        const owner = accounts[3];
        receiver = accounts[4];

        rateReserve = (await pool.rateReserve()).toBigInt();

        await timeswapConvenience
          .connect(owner)
          [
            "burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"
          ](
            parameter,
            receiver.address,
            liquidityIn,
            collateralIn,
            safeBurn,
            deadline
          );
      });

      it("Should have receiver have correct amount of asset", async () => {
        const resultHex = await testToken1.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, assetReceived);
      });

      it("Should have receiver have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, bondReceived);
      });

      it("Should have receiver have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, insuranceReceived);
      });

      it("Should have receiver have a correct collateralized debt token", async () => {
        const collateralizedDebtERC721 = await collateralizedDebtAt(
          await pool.collateralizedDebt()
        );

        const tokenId = await collateralizedDebtERC721.totalSupply();
        const result = await collateralizedDebtERC721.ownerOf(tokenId);
        const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(
          tokenId
        );
        const resultDebt = resultHex.debt.toBigInt();
        const resultCollateral = resultHex.collateral.toBigInt();

        expect(result).to.equal(receiver.address);
        checkBigIntEquality(resultDebt, assetReceived);
        checkBigIntEquality(resultCollateral, collateralIn);
      });

      it("Should have pool have a correct assets", async () => {
        const resultHex = await testToken1.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.assetReserve();
        const resultReserve = resultReserveHex.toBigInt();

        const assetBalance = assetReserve - assetReceived;

        checkBigIntEquality(result, assetBalance);
        checkBigIntEquality(resultReserve, assetBalance);
      });

      it("Should have pool have correct collateral", async () => {
        const resultHex = await testToken2.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.collateralReserve();
        const resultReserve = resultReserveHex.toBigInt();

        const collateralBalance = collateralReserve + collateralIn;

        checkBigIntEquality(result, collateralBalance);
        checkBigIntEquality(resultReserve, collateralBalance);
      });

      it("Should have pool have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const bondBalance = bondReserve - bondReceived;

        checkBigIntEquality(result, bondBalance);
      });

      it("Should have pool have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const insuranceBalance = insuranceReserve - insuranceReceived;

        checkBigIntEquality(result, insuranceBalance);
      });

      // FIXME!!
      // it("Should have a correct invariance", async () => {
      //   const resultHex = await pool.invariance();
      //   const result = resultHex.toBigInt();

      //   const rateDecrease =
      //     (rateReserve * liquidityIn) / liquidityTotalSupplyBefore;

      //   const invariance =
      //     (assetReserve - assetMax) *
      //     (bondReserve - bondReceived) *
      //     (rateReserve - rateDecrease);

      //   checkBigIntEquality(result, invariance);
      // });

      it("Should have the correct ratio on its bond reserves", async () => {
        const resultLiquidityHex = await pool.balanceOf(receiver.address);
        const resultLiquidity = resultLiquidityHex.toBigInt();
        const ratioLiquidity = resultLiquidity / liquidityIn;
        const ratioLiquidityNumber = parseInt(ratioLiquidity.toString());

        const bondERC20 = await bondAt(await pool.bond());

        const resultBondHex = await bondERC20.balanceOf(pool.address);
        const resultBond = resultBondHex.toBigInt();
        const ratioBond = resultBond / bondReceived;
        const ratioBondNumber = parseInt(ratioBond.toString());

        expect(ratioLiquidityNumber).to.lte(ratioBondNumber);
      });

      it("Should have the correct ratio on its insurance reserves", async () => {
        const resultLiquidityHex = await pool.balanceOf(receiver.address);
        const resultLiquidity = resultLiquidityHex.toBigInt();
        const ratioLiquidity = resultLiquidity / liquidityIn;
        const ratioLiquidityNumber = parseInt(ratioLiquidity.toString());

        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultInsuranceHex = await insuranceERC20.balanceOf(pool.address);
        const resultInsurance = resultInsuranceHex.toBigInt();
        const ratioInsurance = resultInsurance / insuranceReceived;
        const ratioInsuranceNumber = parseInt(ratioInsurance.toString());

        expect(ratioLiquidityNumber).to.lte(ratioInsuranceNumber);
      });

      it("Should have the correct bond total supply", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.totalSupply();
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, bondTotalSupplyBefore);
      });

      it("Should have the correct insurance total supply", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.totalSupply();
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, insuranceTotalSupplyBefore);
      });

      it("Should have the correct liquidity total supply", async () => {
        const resultHex = await pool.totalSupply();
        const result = resultHex.toBigInt();

        const liquidityTotalSupply = liquidityTotalSupplyBefore - liquidityIn;

        checkBigIntEquality(result, liquidityTotalSupply);
      });
    });

    describe("fail case", () => {
      beforeEach(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        rateReserve = (await pool.rateReserve()).toBigInt();
      });

      it("Should revert if the pool does not exist", async () => {
        const wrongToken = await testTokenNew(0);

        const wrongParameter = {
          asset: wrongToken.address,
          collateral: testToken2.address,
          maturity: maturity,
        };

        await mintToken(0n, collateralIn);

        await approve(liquidityIn, 0n, collateralIn);

        const owner = accounts[3];
        receiver = accounts[4];

        await expect(
          timeswapConvenience
            .connect(owner)
            [
              "burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"
            ](
              wrongParameter,
              receiver.address,
              liquidityIn,
              collateralIn,
              safeBurn,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if no liquidity input amount", async () => {
        const wrongLiquidityIn = 0n;

        await mintToken(0n, collateralIn);

        await approve(wrongLiquidityIn, 0n, collateralIn);

        const owner = accounts[3];
        receiver = accounts[4];

        await expect(
          timeswapConvenience
            .connect(owner)
            [
              "burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"
            ](
              parameter,
              receiver.address,
              wrongLiquidityIn,
              collateralIn,
              safeBurn,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if pool matured", async () => {
        await advanceTimeAndBlock(duration);

        await mintToken(0n, collateralIn);

        await approve(liquidityIn, 0n, collateralIn);

        const owner = accounts[3];
        receiver = accounts[4];

        await expect(
          timeswapConvenience
            .connect(owner)
            [
              "burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"
            ](
              parameter,
              receiver.address,
              liquidityIn,
              collateralIn,
              safeBurn,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if not enough liquidity tokens", async () => {
        const wrongLiquidityIn = 2001n;

        await mintToken(0n, collateralIn);

        await approve(wrongLiquidityIn, 0n, collateralIn);

        const owner = accounts[3];
        receiver = accounts[4];

        await expect(
          timeswapConvenience
            .connect(owner)
            [
              "burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"
            ](
              parameter,
              receiver.address,
              wrongLiquidityIn,
              collateralIn,
              safeBurn,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if dipped minAsset", async () => {
        const wrongSafeBurn = {
          minAsset: 8n + 1n,
          minBond: (1n * 9n) / 10n,
          minInsurance: (90n * 9n) / 10n,
        };

        await mintToken(0n, collateralIn);

        await approve(liquidityIn, 0n, collateralIn);

        const owner = accounts[3];
        receiver = accounts[4];

        await expect(
          timeswapConvenience
            .connect(owner)
            [
              "burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"
            ](
              parameter,
              receiver.address,
              liquidityIn,
              collateralIn,
              wrongSafeBurn,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if dipped minInsurance", async () => {
        const wrongSafeBurn = {
          minAsset: (8n * 9n) / 10n,
          minBond: 9n + 1n,
          minInsurance: (90n * 9n) / 10n,
        };

        await mintToken(0n, collateralIn);

        await approve(liquidityIn, 0n, collateralIn);

        const owner = accounts[3];
        receiver = accounts[4];

        await expect(
          timeswapConvenience
            .connect(owner)
            [
              "burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"
            ](
              parameter,
              receiver.address,
              liquidityIn,
              collateralIn,
              wrongSafeBurn,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if dipped minBond", async () => {
        const wrongSafeBurn = {
          minAsset: (8n * 9n) / 10n,
          minBond: (1n * 9n) / 10n,
          minInsurance: 90n + 1n,
        };

        await mintToken(0n, collateralIn);

        await approve(liquidityIn, 0n, collateralIn);

        const owner = accounts[3];
        receiver = accounts[4];

        await expect(
          timeswapConvenience
            .connect(owner)
            [
              "burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"
            ](
              parameter,
              receiver.address,
              liquidityIn,
              collateralIn,
              wrongSafeBurn,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if wrong deadline", async () => {
        const wrongDeadline = deadline - deadlineDuration;

        await mintToken(0n, collateralIn);

        await approve(liquidityIn, 0n, collateralIn);

        const owner = accounts[3];
        receiver = accounts[4];

        await expect(
          timeswapConvenience
            .connect(owner)
            [
              "burn((address,address,uint256),address,uint256,uint256,(uint256,uint256,uint256),uint256)"
            ](
              parameter,
              receiver.address,
              liquidityIn,
              collateralIn,
              safeBurn,
              wrongDeadline
            )
        ).to.be.reverted;
      });
    });
  });

  describe("burn after maturity", () => {
    describe("success case", () => {
      before(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        await advanceTimeAndBlock(duration);

        await approve(liquidityIn, 0n, 0n);

        const owner = accounts[3];
        receiver = accounts[4];

        await timeswapConvenience
          .connect(owner)
          ["burn((address,address,uint256),address,uint256)"](
            parameter,
            receiver.address,
            liquidityIn
          );
      });

      it("Should have receiver have correct amount of asset", async () => {
        const resultHex = await testToken1.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, 0n);
      });

      it("Should have receiver have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, bondReceived);
      });

      it("Should have receiver have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, insuranceReceived);
      });

      it("Should have pool have a correct assets", async () => {
        const resultHex = await testToken1.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.assetReserve();
        const resultReserve = resultReserveHex.toBigInt();

        checkBigIntEquality(result, assetReserve);
        checkBigIntEquality(resultReserve, assetReserve);
      });

      it("Should have pool have correct collateral", async () => {
        const resultHex = await testToken2.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.collateralReserve();
        const resultReserve = resultReserveHex.toBigInt();

        checkBigIntEquality(result, collateralReserve);
        checkBigIntEquality(resultReserve, collateralReserve);
      });

      it("Should have pool have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const bondBalance = bondReserve - bondReceived;

        checkBigIntEquality(result, bondBalance);
      });

      it("Should have pool have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const insuranceBalance = insuranceReserve - insuranceReceived;

        checkBigIntEquality(result, insuranceBalance);
      });

      it("Should have the correct ratio on its bond reserves", async () => {
        const resultLiquidityHex = await pool.balanceOf(receiver.address);
        const resultLiquidity = resultLiquidityHex.toBigInt();
        const ratioLiquidity = resultLiquidity / liquidityIn;
        const ratioLiquidityNumber = parseInt(ratioLiquidity.toString());

        const bondERC20 = await bondAt(await pool.bond());

        const resultBondHex = await bondERC20.balanceOf(pool.address);
        const resultBond = resultBondHex.toBigInt();
        const ratioBond = resultBond / bondReceived;
        const ratioBondNumber = parseInt(ratioBond.toString());

        expect(ratioLiquidityNumber).to.lte(ratioBondNumber);
      });

      it("Should have the correct ratio on its insurance reserves", async () => {
        const resultLiquidityHex = await pool.balanceOf(receiver.address);
        const resultLiquidity = resultLiquidityHex.toBigInt();
        const ratioLiquidity = resultLiquidity / liquidityIn;
        const ratioLiquidityNumber = parseInt(ratioLiquidity.toString());

        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultInsuranceHex = await insuranceERC20.balanceOf(pool.address);
        const resultInsurance = resultInsuranceHex.toBigInt();
        const ratioInsurance = resultInsurance / insuranceReceived;
        const ratioInsuranceNumber = parseInt(ratioInsurance.toString());

        expect(ratioLiquidityNumber).to.lte(ratioInsuranceNumber);
      });

      it("Should have the correct bond total supply", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.totalSupply();
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, bondTotalSupplyBefore);
      });

      it("Should have the correct insurance total supply", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.totalSupply();
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, insuranceTotalSupplyBefore);
      });

      it("Should have the correct liquidity total supply", async () => {
        const resultHex = await pool.totalSupply();
        const result = resultHex.toBigInt();

        const liquidityTotalSupply = liquidityTotalSupplyBefore - liquidityIn;

        checkBigIntEquality(result, liquidityTotalSupply);
      });
    });

    describe("fail case", () => {
      beforeEach(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );
      });

      it("Should revert if the pool does not exist", async () => {
        const wrongToken = await testTokenNew(0);

        const wrongParameter = {
          asset: wrongToken.address,
          collateral: testToken2.address,
          maturity: maturity,
        };

        await advanceTimeAndBlock(duration);

        await approve(liquidityIn, 0n, 0n);

        const owner = accounts[3];
        receiver = accounts[4];

        await expect(
          timeswapConvenience
            .connect(owner)
            ["burn((address,address,uint256),address,uint256)"](
              wrongParameter,
              receiver.address,
              liquidityIn
            )
        ).to.be.reverted;
      });

      it("Should revert if no liquidity input amount", async () => {
        const wrongLiquidityIn = 0;

        await advanceTimeAndBlock(duration);

        const owner = accounts[3];
        receiver = accounts[4];

        await expect(
          timeswapConvenience
            .connect(owner)
            ["burn((address,address,uint256),address,uint256)"](
              parameter,
              receiver.address,
              wrongLiquidityIn
            )
        ).to.be.reverted;
      });

      it("Should revert if pool not matured", async () => {
        await approve(liquidityIn, 0n, 0n);

        const owner = accounts[3];
        receiver = accounts[4];

        await expect(
          timeswapConvenience
            .connect(owner)
            ["burn((address,address,uint256),address,uint256)"](
              parameter,
              receiver.address,
              liquidityIn
            )
        ).to.be.reverted;
      });

      it("Should revert if not enough liquidity tokens", async () => {
        const wrongLiquidityIn = 2001;

        await advanceTimeAndBlock(duration);

        await approve(liquidityIn, 0n, 0n);

        const owner = accounts[3];
        receiver = accounts[4];

        await expect(
          timeswapConvenience
            .connect(owner)
            ["burn((address,address,uint256),address,uint256)"](
              parameter,
              receiver.address,
              wrongLiquidityIn
            )
        ).to.be.reverted;
      });
    });
  });
});

describe("lend", () => {
  const assetReserve = 1000000n; // 1M
  const bondReserve = 200000n; // 200k
  const insuranceReserve = 11000000n; // 11M
  const collateralReserve = 2400000n; // 2.4M

  let rateReserve: bigint;

  const assetIn = 200000n; // 200k

  let bondDecrease: bigint;
  let rateDecrease: bigint;

  let bondMint: bigint;

  let insuranceDecrease: bigint;
  let insuranceMint: bigint;

  let invariance: bigint;

  const bondTotalSupplyBefore = 2400000n; // 2.4M
  const insuranceTotalSupplyBefore = 12000000n; // 12M

  describe("lend given bond received", () => {
    const bondReceived = 199994n;
    let insuranceReceived: bigint;

    const calculateBondDecrease = () => {
      bondDecrease = divUp(
        bondReceived * assetReserve,
        (rateReserve * (maturity - BigInt(timestamp))) / year + assetReserve
        );
        // console.log("Bond Decrease", bondDecrease);
    };


    const calculate = () => {
      const bondBalanceAdjusted =
        (bondReserve * base - bondDecrease * (base + transactionFee)) / base;
        console.log("JS BondbalanceAdjusted", bondBalanceAdjusted)
      const rateBalanceAdjusted = divUp(
        divUp(invariance * base, assetReserve + assetIn),
        bondBalanceAdjusted
      );
      console.log("JS rateReserve, rateBalanceAdjusted", rateReserve, rateBalanceAdjusted);
      rateDecrease =
        (rateReserve * base - rateBalanceAdjusted) / (base + transactionFee);

        console.log("Rate Decrease at 1900", rateDecrease)
        // console.log("Timestamp at 1901 ", timestamp);

      bondMint =
        (((bondDecrease * rateReserve) / assetReserve) *
          (maturity - BigInt(timestamp))) /
        year;

      insuranceDecrease =
        (rateDecrease * (maturity - BigInt(timestamp))) / year;
      insuranceMint = (rateDecrease * (assetReserve + assetIn)) / rateReserve;
      insuranceReceived = insuranceDecrease + insuranceMint;
    };

    const safeLend = () => {
      return {
        minBond: (bondReceived * 9n) / 10n,
        minInsurance: (insuranceReceived * 9n) / 10n,
      };
    };

    describe("success case", () => {
      before(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        receiver = accounts[4];

        rateReserve = (await pool.rateReserve()).toBigInt();
        invariance = assetReserve * bondReserve * rateReserve;

        
        await mintToken(assetIn, 0n);

        await approve(0n, assetIn, 0n);
        
        timestamp = await now();

        timestamp += 50

        await setTime(timestamp);

        calculateBondDecrease();

        calculate();

        const transaction = await timeswapConvenience
          .connect(receiver)
          .lend(
            parameter,
            receiver.address,
            assetIn,
            true,
            bondReceived,
            safeLend(),
            deadline
          );

        timestamp = await getTimestamp(transaction.blockHash!)

        // console.log("timestamp after transaction ", timestamp)

        // calculateBondDecrease();

        // calculate();

      //   bondMint =
      //   (((bondDecrease * rateReserve) / assetReserve) *
      //     (maturity - BigInt(timestamp))) /
      //   year;

      // insuranceDecrease =
      //   (rateDecrease * (maturity - BigInt(timestamp))) / year;
      // insuranceMint = (rateDecrease * (assetReserve + assetIn)) / rateReserve;
      // insuranceReceived = insuranceDecrease + insuranceMint;
      });

      it("Should have receiver have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        // bondMint =
        // (((bondDecrease * rateReserve) / assetReserve) *
        //   (maturity - BigInt(timestamp))) /
        // year;

        const bondReceived = bondDecrease + bondMint;
        // console.log("TS, bd, bm", bondDecrease, bondMint);
        
        checkBigIntEquality(result, bondReceived);
      });
      
      it("Should have receiver have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());
        
        const resultHex = await insuranceERC20.balanceOf(receiver.address);
        const result = resultHex.toBigInt();
        
        // insuranceDecrease =
        // (rateDecrease * (maturity - BigInt(timestamp))) / year;
        // insuranceMint = (rateDecrease * (assetReserve + assetIn)) / rateReserve;
        
        const insuranceReceived = insuranceDecrease + insuranceMint;
        
        // console.log("From ts ", insuranceDecrease, insuranceMint);
        // console.log("Timestamp ts ", timestamp);
        console.log("Rate Decrease at 1979", rateDecrease)
        
        checkBigIntEquality(result, insuranceReceived);
      });
      
      it("Should have pool have a correct assets reserve and balance", async () => {
        const resultHex = await testToken1.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.assetReserve();
        const resultReserve = resultReserveHex.toBigInt();

        const assetBalance = assetReserve + assetIn;

        checkBigIntEquality(result, assetBalance);
        checkBigIntEquality(resultReserve, assetBalance);
      });

      it("Should have pool have correct collateral reserve and balance", async () => {
        const resultHex = await testToken2.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.collateralReserve();
        const resultReserve = resultReserveHex.toBigInt();

        checkBigIntEquality(result, collateralReserve);
        checkBigIntEquality(resultReserve, collateralReserve);
      });

      it("Should have pool have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const bondBalance = bondReserve - bondDecrease;

        checkBigIntEquality(result, bondBalance);
      });

      it("Should have pool have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const insuranceBalance = insuranceReserve - insuranceDecrease;

        checkBigIntEquality(result, insuranceBalance);
      });

      it("Should have the correct bond total supply", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.totalSupply();
        const result = resultHex.toBigInt();

        const bondTotalSupply = bondTotalSupplyBefore + bondMint;

        checkBigIntEquality(result, bondTotalSupply);
      });

      it("Should have the correct insurance total supply", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.totalSupply();
        const result = resultHex.toBigInt();

        const insuranceTotalSupply = insuranceTotalSupplyBefore + insuranceMint;

        checkBigIntEquality(result, insuranceTotalSupply);
      });
    });

    describe("fail case", () => {
      beforeEach(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        receiver = accounts[4];

        rateReserve = (await pool.rateReserve()).toBigInt();
        invariance = assetReserve * bondReserve * rateReserve;

        calculateBondDecrease();

        calculate();
      });

      it("Should revert if no asset input amount", async () => {
        const wrongAssetIn = 0;

        await expect(
          timeswapConvenience
            .connect(receiver)
            .lend(
              parameter,
              receiver.address,
              wrongAssetIn,
              true,
              bondReceived,
              safeLend(),
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if reached minBond", async () => {
        const wrongSafeLend = {
          minBond: bondReceived + 40000n,
          minInsurance: (insuranceReceived * 9n) / 10n,
        };

        await mintToken(assetIn, 0n);

        await approve(0n, assetIn, 0n);

        await expect(
          timeswapConvenience
            .connect(receiver)
            .lend(
              parameter,
              receiver.address,
              assetIn,
              true,
              bondReceived,
              wrongSafeLend,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if reached minBond", async () => {
        const wrongSafeLend = {
          minBond: (bondReceived * 9n) / 10n,
          minInsurance: insuranceReceived + 10000n,
        };

        await mintToken(assetIn, 0n);

        await approve(0n, assetIn, 0n);

        await expect(
          timeswapConvenience
            .connect(receiver)
            .lend(
              parameter,
              receiver.address,
              assetIn,
              true,
              bondReceived,
              wrongSafeLend,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if pool matured", async () => {
        await advanceTimeAndBlock(duration);

        await mintToken(assetIn, 0n);

        await approve(0n, assetIn, 0n);

        await expect(
          timeswapConvenience
            .connect(receiver)
            .lend(
              parameter,
              receiver.address,
              assetIn,
              true,
              bondReceived,
              safeLend(),
              deadline
            )
        ).to.be.reverted;
      });
    });
  });

  describe("lend given insurance received", () => {
    const insuranceReceived = 800000n;
    let bondReceived: bigint;

    const calculateRateDecrease = () => {
      rateDecrease = divUp(
        insuranceReceived * rateReserve,
        (rateReserve * (maturity - BigInt(timestamp))) / year +
          assetReserve +
          assetIn
      );
    };

    const calculate = () => {
      const rateBalanceAdjusted =
        (rateReserve * base - rateDecrease * (base + transactionFee)) / base;
      const bondBalanceAdjusted = divUp(
        divUp(invariance * base, assetReserve + assetIn),
        rateBalanceAdjusted
      );
      bondDecrease =
        (bondReserve * base - bondBalanceAdjusted) / (base + transactionFee);

      bondMint =
        (((bondDecrease * rateReserve) / assetReserve) *
          (maturity - BigInt(timestamp))) /
        year;
      bondReceived = bondDecrease + bondMint;

      insuranceDecrease =
        (rateDecrease * (maturity - BigInt(timestamp))) / year;
      insuranceMint = (rateDecrease * (assetReserve + assetIn)) / rateReserve;
    };

    const safeLend = () => {
      return {
        minBond: (bondReceived * 9n) / 10n,
        minInsurance: (insuranceReceived * 9n) / 10n,
      };
    };

    describe("success case", () => {
      before(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        receiver = accounts[4];

        rateReserve = (await pool.rateReserve()).toBigInt();
        invariance = assetReserve * bondReserve * rateReserve;
        await mintToken(assetIn, 0n);

        await approve(0n, assetIn, 0n);

        timestamp = await now();

        timestamp += 50

        await setTime(timestamp);

        calculateRateDecrease();

        calculate();

        console.log("Bond Receive", bondReceived)


        await timeswapConvenience
          .connect(receiver)
          .lend(
            parameter,
            receiver.address,
            assetIn,
            false,
            insuranceReceived,
            safeLend(),
            deadline
          );
      });

      it("Should have receiver have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        const bondReceived = bondDecrease + bondMint;

        console.log(" bd bm ts times", bondDecrease, bondMint, timestamp)

        checkBigIntEquality(result, bondReceived);
      });

      it("Should have receiver have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        const insuranceReceived = insuranceDecrease + insuranceMint;

        checkBigIntEquality(result, insuranceReceived);
      });

      it("Should have pool have a correct assets reserve and balance", async () => {
        const resultHex = await testToken1.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.assetReserve();
        const resultReserve = resultReserveHex.toBigInt();

        const assetBalance = assetReserve + assetIn;

        checkBigIntEquality(result, assetBalance);
        checkBigIntEquality(resultReserve, assetBalance);
      });

      it("Should have pool have correct collateral reserve and balance", async () => {
        const resultHex = await testToken2.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.collateralReserve();
        const resultReserve = resultReserveHex.toBigInt();

        checkBigIntEquality(result, collateralReserve);
        checkBigIntEquality(resultReserve, collateralReserve);
      });

      it("Should have pool have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const bondBalance = bondReserve - bondDecrease;

        checkBigIntEquality(result, bondBalance);
      });

      it("Should have pool have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const insuranceBalance = insuranceReserve - insuranceDecrease;

        checkBigIntEquality(result, insuranceBalance);
      });

      it("Should have the correct bond total supply", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.totalSupply();
        const result = resultHex.toBigInt();

        const bondTotalSupply = bondTotalSupplyBefore + bondMint;

        checkBigIntEquality(result, bondTotalSupply);
      });

      it("Should have the correct insurance total supply", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.totalSupply();
        const result = resultHex.toBigInt();

        const insuranceTotalSupply = insuranceTotalSupplyBefore + insuranceMint;

        checkBigIntEquality(result, insuranceTotalSupply);
      });
    });

    describe("fail case", () => {
      beforeEach(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        receiver = accounts[4];

        rateReserve = (await pool.rateReserve()).toBigInt();
        invariance = assetReserve * bondReserve * rateReserve;

        calculateRateDecrease();

        calculate();
      });

      it("Should revert if no asset input amount", async () => {
        const wrongAssetIn = 0;

        await expect(
          timeswapConvenience
            .connect(receiver)
            .lend(
              parameter,
              receiver.address,
              wrongAssetIn,
              false,
              insuranceReceived,
              safeLend(),
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if reached minBond", async () => {
        const wrongSafeLend = {
          minBond: bondReceived + 40000n,
          minInsurance: (insuranceReceived * 9n) / 10n,
        };

        await mintToken(assetIn, 0n);

        await approve(0n, assetIn, 0n);

        await expect(
          timeswapConvenience
            .connect(receiver)
            .lend(
              parameter,
              receiver.address,
              assetIn,
              false,
              insuranceReceived,
              wrongSafeLend,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if reached minBond", async () => {
        const wrongSafeLend = {
          minBond: (bondReceived * 9n) / 10n,
          minInsurance: insuranceReceived + 10000n,
        };

        await mintToken(assetIn, 0n);

        await approve(0n, assetIn, 0n);

        await expect(
          timeswapConvenience
            .connect(receiver)
            .lend(
              parameter,
              receiver.address,
              assetIn,
              false,
              insuranceReceived,
              wrongSafeLend,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if pool matured", async () => {
        await advanceTimeAndBlock(duration);

        await mintToken(assetIn, 0n);

        await approve(0n, assetIn, 0n);

        await expect(
          timeswapConvenience
            .connect(receiver)
            .lend(
              parameter,
              receiver.address,
              assetIn,
              false,
              insuranceReceived,
              safeLend(),
              deadline
            )
        ).to.be.reverted;
      });
    });
  });
});

describe("borrow", () => {
  const assetReserve = 100000n;
  const bondReserve = 20000n;
  const insuranceReserve = 1100000n;
  const collateralReserve = 240000n;

  let rateReserve: bigint;

  const assetReceived = 20000n;
  let bondIncrease: bigint;
  let rateIncrease: bigint;

  let insuranceIncrease: bigint;

  let invariance: bigint;

  const bondTotalSupplyBefore = 240000n;
  const insuranceTotalSupplyBefore = 1200000n;

  describe("borrow given collateral locked", () => {
    let collateralLocked = 300000n;
    let debtRequired: bigint;
    let interestRequired: bigint;

    const calculateBondIncrease = () => {
      const bondMax =
        (assetReceived * bondReserve) / (assetReserve - assetReceived);
      const bondMaxUp = divUp(
        assetReceived * bondReserve,
        assetReserve - assetReceived
      );

      console.log("bond max", bondMax);

      const collateralAdditionalUp = collateralLocked - bondMax;
      const collateralAdditional = collateralLocked - bondMaxUp;
      bondIncrease =
        (collateralAdditional * bondMax) /
        (divUp(
          divUp(bondMaxUp * rateReserve, assetReserve) *
            (maturity - BigInt(timestamp)),
          year
        ) +
          collateralAdditionalUp);

        console.log ("bond increase", bondIncrease)
    };

    const calculate = () => {
      const bondBalanceAdjusted =
        (bondReserve * base + bondIncrease * (base - transactionFee))/base;
      const rateBalanceAdjusted = divUp(
        divUp(invariance, assetReserve - assetReceived),
        bondBalanceAdjusted
      );
      rateIncrease = divUp(
        (rateBalanceAdjusted - rateReserve) * base,
        base - transactionFee
      );

      console.log("rateIncrease num", (rateBalanceAdjusted - rateReserve) * base)
      console.log("rateIncrease den", base - transactionFee);

      insuranceIncrease = divUp(
        rateIncrease * (maturity - BigInt(timestamp)),
        year
      );

      const rateMax =
        (assetReceived * rateReserve) / (assetReserve - assetReceived);
      const rateMaxUp = divUp(
        assetReceived * rateReserve,
        assetReserve - assetReceived
      );
      interestRequired = divUp(rateMaxUp * rateIncrease, rateMax - rateIncrease);
      interestRequired = divUp(interestRequired * (maturity - BigInt(timestamp)), year);
      debtRequired = interestRequired + assetReceived;

      console.log("rm ri mat times", rateMax, rateIncrease, maturity, timestamp);
      console.log("rate res", rateReserve)

      
    };

    const calculateCollateralLocked = () => {
      const bondMax =
        (assetReceived * bondReserve) / (assetReserve - assetReceived);
      const bondMaxUp = divUp(
        assetReceived * bondReserve,
        assetReserve - assetReceived
      );

      collateralLocked = divUp(
        bondMaxUp * bondIncrease,
        bondMax - bondIncrease
      );
      collateralLocked = divUp(collateralLocked * rateReserve, assetReserve);
      collateralLocked = divUp(
        collateralLocked * (maturity - BigInt(timestamp)),
        year
      );
      collateralLocked += bondMaxUp;
      collateralLocked--;
    };

    let safeBorrow: {
      maxCollateralLocked: bigint;
      maxInterestRequired: bigint;
    };

    describe("success case", () => {
      before(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        receiver = accounts[4];

        rateReserve = (await pool.rateReserve()).toBigInt();
        invariance = assetReserve * bondReserve * rateReserve;

        
        await mintToken(0n, divUp(collateralLocked * 110000n, 100000n));
        
        await approve(0n, 0n, divUp(collateralLocked * 110000n, 100000n));
        
        timestamp = await now();
        
        timestamp += 50
        
        await setTime(timestamp);

        console.log("timestamp before call", timestamp)
        
        calculateBondIncrease();

        calculate();
        safeBorrow = {
          maxCollateralLocked: divUp(collateralLocked * 110000n, 100000n),
          maxInterestRequired: divUp(interestRequired * 110000n, 100000n),
        };

        const transaction = await timeswapConvenience
          .connect(receiver)
          .borrow(
            parameter,
            receiver.address,
            assetReceived,
            true,
            collateralLocked,
            safeBorrow,
            deadline
          );

          timestamp = await getTimestamp(transaction.blockHash!)

          console.log("timestamp after the call", timestamp)

        calculateCollateralLocked();
      });

      // FIXME!!
      // it("Should have receiver have correct amount of asset", async () => {
      //   const resultHex = await testToken1.balanceOf(receiver.address);
      //   const result = resultHex.toBigInt();

      //   checkBigIntEquality(result, assetReceived);
      // });

      // FIXME!!
      // it("Should have receiver have a correct collateralized debt token", async () => {
      //   const collateralizedDebtERC721 = await collateralizedDebtAt(
      //     await pool.collateralizedDebt()
      //   );

      //   const tokenId = await collateralizedDebtERC721.totalSupply();
      //   const result = await collateralizedDebtERC721.ownerOf(tokenId);
      //   const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(
      //     tokenId
      //   );
      //   const resultDebt = resultHex.debt.toBigInt();
      //   const resultCollateral = resultHex.collateral.toBigInt();

      //   checkBigIntEquality(result, receiver.address);
      //   checkBigIntEquality(resultDebt, debtRequired);
      //   checkBigIntEquality(resultCollateral, collateralLocked);
      // });

      it("Should have pool have a correct assets", async () => {
        const resultHex = await testToken1.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.assetReserve();
        const resultReserve = resultReserveHex.toBigInt();

        const assetBalance = assetReserve - assetReceived;

        checkBigIntEquality(result, assetBalance);
        checkBigIntEquality(resultReserve, assetBalance);
      });

      // FIXME!!
      // it("Should have pool have correct collateral", async () => {
      //   const resultHex = await testToken2.balanceOf(pool.address);
      //   const result = resultHex.toBigInt();
      //   const resultReserveHex = await pool.collateralReserve();
      //   const resultReserve = resultReserveHex.toBigInt();

      //   const collateralBalance = collateralReserve + collateralLocked;

      //   checkBigIntEquality(result, collateralBalance);
      //   checkBigIntEquality(resultReserve, collateralBalance);
      // });

      it("Should have pool have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const bondBalance = bondReserve + bondIncrease;

        checkBigIntEquality(result, bondBalance);
      });

      it("Should have pool have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const insuranceBalance = insuranceReserve + insuranceIncrease;

        console.log("ir, ii", insuranceReserve, insuranceIncrease);

        checkBigIntEquality(result, insuranceBalance);
      });

      it("Should have the correct bond total supply", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.totalSupply();
        const result = resultHex.toBigInt();

        const bondTotalSupply = bondTotalSupplyBefore + bondIncrease;

        checkBigIntEquality(result, bondTotalSupply);
      });

      it("Should have the correct insurance total supply", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.totalSupply();
        const result = resultHex.toBigInt();

        const insuranceTotalSupply =
          insuranceTotalSupplyBefore + insuranceIncrease;

        console.log("itsb, ii", insuranceTotalSupplyBefore, insuranceIncrease);

        checkBigIntEquality(result, insuranceTotalSupply);
      });
    });

    describe("fail case", () => {
      before(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        receiver = accounts[4];

        rateReserve = (await pool.rateReserve()).toBigInt();
        invariance = assetReserve * bondReserve * rateReserve;

        calculateBondIncrease();

        calculate();

        await mintToken(0n, divUp(collateralLocked * 110000n, 100000n));

        await approve(0n, 0n, divUp(collateralLocked * 110000n, 100000n));

        safeBorrow = {
          maxCollateralLocked: divUp(collateralLocked * 110000n, 100000n),
          maxInterestRequired: divUp(interestRequired * 110000n, 100000n),
        };

        console.log(parameter, assetReceived, collateralLocked, safeBorrow, deadline);
        console.log(interestRequired);

        await timeswapConvenience
          .connect(receiver)
          .borrow(
            parameter,
            receiver.address,
            assetReceived,
            true,
            collateralLocked,
            safeBorrow,
            deadline
          );

        calculateCollateralLocked();
      });

      it("Should revert if no asset output amount", async () => {
        const wrongAssetReceived = 0n;

        await expect(
          timeswapConvenience
            .connect(receiver)
            .borrow(
              parameter,
              receiver.address,
              wrongAssetReceived,
              true,
              collateralLocked,
              safeBorrow,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if not enough collateral amount", async () => {
        const wrongCollateralLocked = collateralLocked - 1n;

        await mintToken(0n, divUp(collateralLocked * 11n, 10n));

        await approve(0n, 0n, divUp(collateralLocked * 11n, 10n));

        await expect(
          timeswapConvenience
            .connect(receiver)
            .borrow(
              parameter,
              receiver.address,
              assetReceived,
              true,
              wrongCollateralLocked,
              safeBorrow,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if reached max collateral locked", async () => {
        const wrongSafeBorrow = {
          maxCollateralLocked: collateralLocked - 1n,
          maxInterestRequired: divUp(interestRequired * 11n, 10n),
        };

        await mintToken(0n, divUp(collateralLocked * 11n, 10n));

        await approve(0n, 0n, divUp(collateralLocked * 11n, 10n));

        await expect(
          timeswapConvenience
            .connect(receiver)
            .borrow(
              parameter,
              receiver.address,
              assetReceived,
              true,
              collateralLocked,
              wrongSafeBorrow,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if not enough collateral amount", async () => {
        const wrongSafeBorrow = {
          maxCollateralLocked: divUp(collateralLocked * 11n, 10n),
          maxInterestRequired: interestRequired - 1n,
        };

        await mintToken(0n, divUp(collateralLocked * 11n, 10n));

        await approve(0n, 0n, divUp(collateralLocked * 11n, 10n));

        await expect(
          timeswapConvenience
            .connect(receiver)
            .borrow(
              parameter,
              receiver.address,
              assetReceived,
              true,
              collateralLocked,
              wrongSafeBorrow,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if pool matured", async () => {
        await advanceTimeAndBlock(duration);

        await mintToken(0n, divUp(collateralLocked * 11n, 10n));

        await approve(0n, 0n, divUp(collateralLocked * 11n, 10n));

        await expect(
          timeswapConvenience
            .connect(receiver)
            .borrow(
              parameter,
              receiver.address,
              assetReceived,
              true,
              collateralLocked,
              safeBorrow,
              deadline
            )
        ).to.be.reverted;
      });
    });
  });

  describe("borrow given interest required", () => {
    let interestRequired = 78000n;
    let collateralLocked: bigint;
    let debtRequired: bigint;

    const calculateRateIncrease = () => {
      const rateMax =
        (assetReceived * rateReserve) / (assetReserve - assetReceived);
      const rateMaxUp =
        (assetReceived * rateReserve) / (assetReserve - assetReceived);
      rateIncrease =
        (interestRequired * rateMax) /
        (divUp(rateMaxUp * (maturity - BigInt(timestamp)), year) +
          interestRequired);
    };

    const calculate = () => {
      const rateBalanceAdjusted =
        rateReserve * base + rateIncrease * (base - transactionFee);
      const bondBalanceAdjusted = divUp(
        divUp(invariance * base * base, assetReserve - assetReceived),
        rateBalanceAdjusted
      );
      bondIncrease = divUp(
        bondBalanceAdjusted - bondReserve * base,
        base - transactionFee
      );

      const bondMax =
        (assetReceived * bondReserve) / (assetReserve - assetReceived);
      const bondMaxUp = divUp(
        assetReceived * bondReserve,
        assetReserve - assetReceived
      );

      collateralLocked = divUp(
        bondMaxUp * bondIncrease,
        bondMax - bondIncrease
      );
      collateralLocked = divUp(collateralLocked * rateReserve, assetReserve);
      collateralLocked = divUp(
        collateralLocked * (maturity - BigInt(timestamp)),
        year
      );
      collateralLocked += bondMaxUp;
      collateralLocked--;

      insuranceIncrease = divUp(
        rateIncrease * (maturity - BigInt(timestamp)),
        year
      );
    };

    const calculateInterestRequired = () => {
      const rateMax =
        (assetReceived * rateReserve) / (assetReserve - assetReceived);
      const rateMaxUp = divUp(
        assetReceived * rateReserve,
        assetReserve - assetReceived
      );
      debtRequired = divUp(rateMaxUp * rateIncrease, rateMax - rateIncrease);
      debtRequired = divUp(debtRequired * (maturity - BigInt(timestamp)), year);
      interestRequired = debtRequired;
      debtRequired += assetReceived;
    };

    let safeBorrow: {
      maxCollateralLocked: bigint;
      maxInterestRequired: bigint;
    };

    describe("success case", () => {
      before(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        receiver = accounts[4];

        rateReserve = (await pool.rateReserve()).toBigInt();
        invariance = assetReserve * bondReserve * rateReserve;

        calculateRateIncrease();

        calculate();

        await mintToken(0n, divUp(collateralLocked * 11000n, 10000n));

        await approve(0n, 0n, divUp(collateralLocked * 11000n, 10000n));

        safeBorrow = {
          maxCollateralLocked: divUp(collateralLocked * 11000n, 10000n),
          maxInterestRequired: divUp(interestRequired * 11000n, 10000n),
        };

        await timeswapConvenience
          .connect(receiver)
          .borrow(
            parameter,
            receiver.address,
            assetReceived,
            false,
            interestRequired,
            safeBorrow,
            deadline
          );

        calculateInterestRequired();
      });

      it("Should have receiver have correct amount of asset", async () => {
        const resultHex = await testToken1.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, assetReceived);
      });

      // FIXME!!
      // it("Should have receiver have a correct collateralized debt token", async () => {
      //   const collateralizedDebtERC721 = await collateralizedDebtAt(
      //     await pool.collateralizedDebt()
      //   );

      //   const tokenId = await collateralizedDebtERC721.totalSupply();
      //   const result = await collateralizedDebtERC721.ownerOf(tokenId);
      //   const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(
      //     tokenId
      //   );
      //   const resultDebt = resultHex.debt.toBigInt();
      //   const resultCollateral = resultHex.collateral.toBigInt();

      //   checkBigIntEquality(result, receiver.address);
      //   checkBigIntEquality(resultDebt, debtRequired);
      //   checkBigIntEquality(resultCollateral, collateralLocked);
      // });

      it("Should have pool have a correct assets", async () => {
        const resultHex = await testToken1.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.assetReserve();
        const resultReserve = resultReserveHex.toBigInt();

        const assetBalance = assetReserve - assetReceived;

        checkBigIntEquality(result, assetBalance);
        checkBigIntEquality(resultReserve, assetBalance);
      });

      // FIXME!!
      // it("Should have pool have correct collateral", async () => {
      //   const resultHex = await testToken2.balanceOf(pool.address);
      //   const result = resultHex.toBigInt();
      //   const resultReserveHex = await pool.collateralReserve();
      //   const resultReserve = resultReserveHex.toBigInt();

      //   const collateralBalance = collateralReserve + collateralLocked;

      //   checkBigIntEquality(result, collateralBalance);
      //   checkBigIntEquality(resultReserve, collateralBalance);
      // });

      it("Should have pool have correct amount of bond tokens", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const bondBalance = bondReserve + bondIncrease;

        checkBigIntEquality(result, bondBalance);
      });

      it("Should have pool have correct amount of insurance tokens", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.balanceOf(pool.address);
        const result = resultHex.toBigInt();

        const insuranceBalance = insuranceReserve + insuranceIncrease;

        checkBigIntEquality(result, insuranceBalance);
      });

      it("Should have the correct bond total supply", async () => {
        const bondERC20 = await bondAt(await pool.bond());

        const resultHex = await bondERC20.totalSupply();
        const result = resultHex.toBigInt();

        const bondTotalSupply = bondTotalSupplyBefore + bondIncrease;

        checkBigIntEquality(result, bondTotalSupply);
      });

      it("Should have the correct insurance total supply", async () => {
        const insuranceERC20 = await insuranceAt(await pool.insurance());

        const resultHex = await insuranceERC20.totalSupply();
        const result = resultHex.toBigInt();

        const insuranceTotalSupply =
          insuranceTotalSupplyBefore + insuranceIncrease;

        checkBigIntEquality(result, insuranceTotalSupply);
      });
    });

    describe("fail case", () => {
      beforeEach(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        receiver = accounts[4];

        rateReserve = (await pool.rateReserve()).toBigInt();
        invariance = assetReserve * bondReserve * rateReserve;

        calculateRateIncrease();

        calculate();

        safeBorrow = {
          maxCollateralLocked: divUp(collateralLocked * 11n, 10n),
          maxInterestRequired: divUp(interestRequired * 11n, 10n),
        };
      });

      it("Should revert if no asset output amount", async () => {
        const wrongAssetReceived = 0;

        await expect(
          timeswapConvenience
            .connect(receiver)
            .borrow(
              parameter,
              receiver.address,
              wrongAssetReceived,
              false,
              interestRequired,
              safeBorrow,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if reached max collateral locked", async () => {
        const wrongSafeBorrow = {
          maxCollateralLocked: collateralLocked - 1000n,
          maxInterestRequired: divUp(interestRequired * 11000n, 10000n),
        };

        await mintToken(0n, divUp(collateralLocked * 11000n, 10000n));

        await approve(0n, 0n, divUp(collateralLocked * 11000n, 10000n));

        await expect(
          timeswapConvenience
            .connect(receiver)
            .borrow(
              parameter,
              receiver.address,
              assetReceived,
              false,
              interestRequired,
              wrongSafeBorrow,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if not enough collateral amount", async () => {
        const wrongSafeBorrow = {
          maxCollateralLocked: divUp(collateralLocked * 11n, 10n),
          maxInterestRequired: interestRequired - 1n,
        };

        await mintToken(0n, divUp(collateralLocked * 11n, 10n));

        await approve(0n, 0n, divUp(collateralLocked * 11n, 10n));

        await expect(
          timeswapConvenience
            .connect(receiver)
            .borrow(
              parameter,
              receiver.address,
              assetReceived,
              false,
              interestRequired,
              wrongSafeBorrow,
              deadline
            )
        ).to.be.reverted;
      });

      it("Should revert if pool matured", async () => {
        await advanceTimeAndBlock(duration);

        await mintToken(0n, divUp(collateralLocked * 11n, 10n));

        await approve(0n, 0n, divUp(collateralLocked * 11n, 10n));

        await expect(
          timeswapConvenience
            .connect(receiver)
            .borrow(
              parameter,
              receiver.address,
              assetReceived,
              false,
              interestRequired,
              safeBorrow,
              deadline
            )
        ).to.be.reverted;
      });
    });
  });
});

describe("pay", () => {
  const assetReserve = 100n;
  const bondReserve = 20n;
  const insuranceReserve = 1100n;
  const collateralReserve = 240n;

  const assetIn = 1000n;
  const collateralReceived = 200n;

  const tokenId = 1n;
  const tokenDebt = 1100n;
  const tokenCollateral = 220n;

  describe("pay single", () => {
    describe("success case", () => {
      before(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        await mintToken(assetIn, 0n);

        await approve(0n, assetIn, 0n);

        let cd = await collateralizedDebtAt(await pool.collateralizedDebt());
        await cd
          .connect(receiver)
          .setApprovalForAll(timeswapConvenience.address, true);

        await timeswapConvenience
          .connect(receiver)
          ["pay((address,address,uint256),address,uint256,uint256,uint256)"](
            parameter,
            receiver.address,
            tokenId,
            assetIn,
            deadline
          );
      });

      it("Should have receiver have correct amount of collateral", async () => {
        const resultHex = await testToken2.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        checkBigIntEquality(result, collateralReceived);
      });

      it("Should have receiver have a correct collateralized debt token", async () => {
        const collateralizedDebtERC721 = await collateralizedDebtAt(
          await pool.collateralizedDebt()
        );

        const resultHex = await collateralizedDebtERC721.collateralizedDebtOf(
          tokenId
        );
        const resultDebt = resultHex.debt.toBigInt();
        const resultCollateral = resultHex.collateral.toBigInt();

        const debtRemaining = tokenDebt - assetIn;
        const collateralRemaining = tokenCollateral - collateralReceived;

        checkBigIntEquality(resultDebt, debtRemaining);
        checkBigIntEquality(resultCollateral, collateralRemaining);
      });

      it("Should have pool have a correct assets", async () => {
        const resultHex = await testToken1.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.assetReserve();
        const resultReserve = resultReserveHex.toBigInt();

        const assetBalance = assetReserve + assetIn;

        checkBigIntEquality(result, assetBalance);
        checkBigIntEquality(resultReserve, assetBalance);
      });

      it("Should have pool have correct collateral", async () => {
        const resultHex = await testToken2.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.collateralReserve();
        const resultReserve = resultReserveHex.toBigInt();

        const collateralBalance = collateralReserve - collateralReceived;

        checkBigIntEquality(result, collateralBalance);
        checkBigIntEquality(resultReserve, collateralBalance);
      });
    });

    describe("fail case", () => {
      beforeEach(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        let cd = await collateralizedDebtAt(await pool.collateralizedDebt());
        await cd
          .connect(receiver)
          .setApprovalForAll(timeswapConvenience.address, true);
      });

      it("Should revert if pool already matured", async () => {
        await advanceTimeAndBlock(duration);

        await mintToken(assetIn, 0n);

        await approve(0n, assetIn, 0n);

        await expect(
          timeswapConvenience
            .connect(receiver)
            ["pay((address,address,uint256),address,uint256,uint256,uint256)"](
              parameter,
              receiver.address,
              tokenId,
              assetIn,
              deadline
            )
        ).to.be.reverted;
      });
    });
  });

  describe("pay multiple", () => {
    const assetInMint = 10n;
    const bondIncrease = 2;
    const insuranceIncrease = 110;
    const bondReceived = 22;
    const insuranceReceived = 10;
    const collateralIn = 24n;

    const assetsIn = [1000n, 50n];
    const collateralsReceived = [200n, 10n];

    const tokenIds = [1, 2];
    const tokenDebt2 = 110n;
    const tokenCollaterals2 = 22n;

    describe("success case", () => {
      before(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        await mintToken(assetInMint, collateralIn);
        await approve(0n, assetInMint, collateralIn);

        const safeMint = {
          maxDebt: divUp(110n * 11n, 10n),
          maxCollateralPaid: divUp(2n * 11n, 10n),
          maxCollateralLocked: divUp(22n * 11n, 10n),
        };

        await timeswapConvenience
          .connect(receiver)
          [
            "mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"
          ](parameter, receiver.address, assetInMint, safeMint, deadline);

        await mintToken(assetsIn[0] + assetsIn[1], 0n);

        await approve(0n, assetsIn[0] + assetsIn[1], 0n);

        let cd = await collateralizedDebtAt(await pool.collateralizedDebt());
        await cd
          .connect(receiver)
          .setApprovalForAll(timeswapConvenience.address, true);

        await timeswapConvenience
          .connect(receiver)
          [
            "pay((address,address,uint256),address,uint256[],uint256[],uint256)"
          ](parameter, receiver.address, tokenIds, assetsIn, deadline);
      });

      it("Should have receiver have correct amount of collateral", async () => {
        const resultHex = await testToken2.balanceOf(receiver.address);
        const result = resultHex.toBigInt();

        expect(result).to.equal(
          collateralsReceived[0] + collateralsReceived[1]
        );
      });

      it("Should have receiver have a correct collateralized debt token", async () => {
        const collateralizedDebtERC721 = await collateralizedDebtAt(
          await pool.collateralizedDebt()
        );

        const resultHex1 = await collateralizedDebtERC721.collateralizedDebtOf(
          tokenIds[0]
        );
        const resultDebt1 = resultHex1.debt.toBigInt();
        const resultCollateral1 = resultHex1.collateral.toBigInt();

        const resultHex2 = await collateralizedDebtERC721.collateralizedDebtOf(
          tokenIds[1]
        );
        const resultDebt2 = resultHex2.debt.toBigInt();
        const resultCollateral2 = resultHex2.collateral.toBigInt();

        const debtRemaining1 = tokenDebt - assetsIn[0];
        const collateralRemaining1 = tokenCollateral - collateralsReceived[0];

        const debtRemaining2 = tokenDebt2 - assetsIn[1];
        const collateralRemaining2 = tokenCollaterals2 - collateralsReceived[1];

        checkBigIntEquality(resultDebt1, debtRemaining1);
        checkBigIntEquality(resultCollateral1, collateralRemaining1);

        checkBigIntEquality(resultDebt2, debtRemaining2);
        checkBigIntEquality(resultCollateral2, collateralRemaining2);
      });

      it("Should have pool have a correct assets", async () => {
        const resultHex = await testToken1.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.assetReserve();
        const resultReserve = resultReserveHex.toBigInt();

        const assetBalance =
          assetReserve + assetInMint + assetsIn[0] + assetsIn[1];

        checkBigIntEquality(result, assetBalance);
        checkBigIntEquality(resultReserve, assetBalance);
      });

      it("Should have pool have correct collateral", async () => {
        const resultHex = await testToken2.balanceOf(pool.address);
        const result = resultHex.toBigInt();
        const resultReserveHex = await pool.collateralReserve();
        const resultReserve = resultReserveHex.toBigInt();

        const collateralBalance =
          collateralReserve +
          collateralIn -
          collateralsReceived[0] -
          collateralsReceived[1];

        checkBigIntEquality(result, collateralBalance);
        checkBigIntEquality(resultReserve, collateralBalance);
      });
    });

    describe("fail case", () => {
      beforeEach(async () => {
        await deployAndMint(
          assetReserve,
          bondReserve,
          collateralReserve - bondReserve
        );

        await mintToken(assetInMint, collateralIn);

        await approve(0n, assetInMint, collateralIn);

        const safeMint = {
          maxDebt: divUp(110n * 11n, 10n),
          maxCollateralPaid: divUp(2n * 11n, 10n),
          maxCollateralLocked: divUp(22n * 11n, 10n),
        };

        await timeswapConvenience
          .connect(receiver)
          [
            "mint((address,address,uint256),address,uint256,(uint256,uint256,uint256),uint256)"
          ](parameter, receiver.address, assetInMint, safeMint, deadline);

        await mintToken(assetsIn[0] + assetsIn[1], 0n);

        await approve(0n, assetsIn[0] + assetsIn[1], 0n);

        let cd = await collateralizedDebtAt(await pool.collateralizedDebt());
        await cd
          .connect(receiver)
          .setApprovalForAll(timeswapConvenience.address, true);

        await timeswapConvenience
          .connect(receiver)
          [
            "pay((address,address,uint256),address,uint256[],uint256[],uint256)"
          ](parameter, receiver.address, tokenIds, assetsIn, deadline);
      });

      it("Should revert if pool already matured", async () => {
        await advanceTimeAndBlock(duration);

        await mintToken(assetsIn[0] + assetsIn[1], 0n);

        await approve(0n, assetsIn[0] + assetsIn[1], 0n);

        await expect(
          timeswapConvenience
            .connect(receiver)
            [
              "pay((address,address,uint256),address,uint256[],uint256[],uint256)"
            ](parameter, receiver.address, tokenIds, assetsIn, deadline)
        ).to.be.reverted;
      });
    });
  });
});
