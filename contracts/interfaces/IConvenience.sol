// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity =0.8.4;

import {IFactory} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IFactory.sol';
import {IPair} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/IPair.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IMint} from './IMint.sol';
import {IBurn} from './IBurn.sol';
import {ILend} from './ILend.sol';
import {IWithdraw} from './IWithdraw.sol';
import {IBorrow} from './IBorrow.sol';
import {IPay} from './IPay.sol';
import {ILiquidity} from './ILiquidity.sol';
import {IClaim} from './IClaim.sol';
import {IDue} from './IDue.sol';
import {IWETH} from './IWETH.sol';
import {ITimeswapMintCallback} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/callback/ITimeswapMintCallback.sol';
import {ITimeswapLendCallback} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/callback/ITimeswapLendCallback.sol';
import {ITimeswapBorrowCallback} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/callback/ITimeswapBorrowCallback.sol';
import {ITimeswapPayCallback} from '@timeswap-labs/timeswap-v1-core/contracts/interfaces/callback/ITimeswapPayCallback.sol';
import {IDeployNatives} from './IDeployNatives.sol';
import {IDeployPair} from './IDeployPair.sol';

/// @title Timeswap Convenience Interface
/// @author Ricsson W. Ngo
interface IConvenience is
    ITimeswapMintCallback,
    ITimeswapLendCallback,
    ITimeswapBorrowCallback,
    ITimeswapPayCallback,
    IDeployPair,
    IDeployNatives
{
    struct Native {
        ILiquidity liquidity;
        IClaim bondInterest;
        IClaim bondPrincipal;
        IClaim insuranceInterest;
        IClaim insurancePrincipal;
        IDue collateralizedDebt;
    }

    /* ===== VIEW ===== */

    /// @dev Return the address of the factory contract used by this contract.
    /// @return The address of the factory contract.
    function factory() external returns (IFactory);

    /// @dev Return the address of the Wrapped ETH contract.
    /// @return The address of WETH.
    function weth() external returns (IWETH);

    /// @dev Return the addresses of the Liquidty, Bond, Insurance, Collateralized Debt token contracts.
    /// @return The addresses of the native token contracts.
    function getNative(
        IERC20 asset,
        IERC20 collateral,
        uint256 maturity
    ) external view returns (Native memory);

    /// @dev Create pair contracts.
    /// @param params The parameters for this function found in IDeployPair interface.
    function deployPair(IDeployPair.DeployPair calldata params) external;

    /// @dev Create native token contracts.
    /// @param params The parameters for this function found in IDeployNative interface.
    function deployNatives(IDeployNatives.DeployNatives calldata params) external;

    /// @dev Calls the mint function and creates a new pool.
    /// @dev If the pair does not exist, creates a new pair first.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function newLiquidity(IMint.NewLiquidity calldata params)
        external
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the mint function and creates a new pool.
    /// @dev If the pair does not exist, creates a new pair first.
    /// @dev The asset deposited is ETH which will be wrapped as WETH.
    /// @dev Msg.value is the assetIn amount.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function newLiquidityETHAsset(IMint.NewLiquidityETHAsset calldata params)
        external
        payable
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the mint function and creates a new pool.
    /// @dev If the pair does not exist, creates a new pair first.
    /// @dev The collateral locked is ETH which will be wrapped as WETH.
    /// @dev Msg.value is the collateralIn amount.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function newLiquidityETHCollateral(IMint.NewLiquidityETHCollateral calldata params)
        external
        payable
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the mint function and add more liquidity to an existing pool.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function liquidityGivenAsset(IMint.LiquidityGivenAsset calldata params)
        external
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the mint function and add more liquidity to an existing pool.
    /// @dev The asset deposited is ETH which will be wrapped as WETH.
    /// @dev Msg.value is the assetIn amount.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function liquidityGivenAssetETHAsset(IMint.LiquidityGivenAssetETHAsset calldata params)
        external
        payable
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the mint function and add more liquidity to an existing pool.
    /// @dev The collateral ERC20 is the WETH contract.
    /// @dev The collateral locked is ETH which will be wrapped as WETH.
    /// @dev Msg.value is the maxCollateral amount. Any excess ETH will be returned to Msg.sender.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function liquidityGivenAssetETHCollateral(IMint.LiquidityGivenAssetETHCollateral calldata params)
        external
        payable
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the mint function and add more liquidity to an existing pool.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function liquidityGivenDebt(IMint.LiquidityGivenDebt calldata params)
        external
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the mint function and add more liquidity to an existing pool.
    /// @dev The asset deposited is ETH which will be wrapped as WETH.
    /// @dev Msg.value is the assetIn amount.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function liquidityGivenDebtETHAsset(IMint.LiquidityGivenDebtETHAsset calldata params)
        external
        payable
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the mint function and add more liquidity to an existing pool.
    /// @dev The collateral ERC20 is the WETH contract.
    /// @dev The collateral locked is ETH which will be wrapped as WETH.
    /// @dev Msg.value is the maxCollateral amount. Any excess ETH will be returned to Msg.sender.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function liquidityGivenDebtETHCollateral(IMint.LiquidityGivenDebtETHCollateral calldata params)
        external
        payable
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the mint function and add more liquidity to an existing pool.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function liquidityGivenCollateral(IMint.LiquidityGivenCollateral calldata params)
        external
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the mint function and add more liquidity to an existing pool.
    /// @dev The asset deposited is ETH which will be wrapped as WETH.
    /// @dev Msg.value is the assetIn amount.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function liquidityGivenCollateralETHAsset(IMint.LiquidityGivenCollateralETHAsset calldata params)
        external
        payable
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the mint function and add more liquidity to an existing pool.
    /// @dev The collateral ERC20 is the WETH contract.
    /// @dev The collateral locked is ETH which will be wrapped as WETH.
    /// @dev Msg.value is the maxCollateral amount. Any excess ETH will be returned to Msg.sender.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IMint interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return liquidityOut The amount of liquidity balance received by liquidityTo.
    /// @return id The array index of the collateralized debt received by dueTo.
    /// @return dueOut The collateralized debt received by dueTo.
    function liquidityGivenCollateralETHCollateral(IMint.LiquidityGivenCollateralETHCollateral calldata params)
        external
        payable
        returns (
            uint256 assetIn,
            uint256 liquidityOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the burn funtion and withdraw liquiidty from a pool.
    /// @param params The parameters for this function found in IBurn interface.
    /// @return assetOut The amount of asset ERC20 received by assetTo.
    /// @return collateralOut The amount of collateral ERC20 received by collateralTo.
    function removeLiquidity(IBurn.RemoveLiquidity calldata params)
        external
        returns (uint256 assetOut, uint128 collateralOut);

    /// @dev Calls the burn funtion and withdraw liquiidty from a pool.
    /// @dev The asset received is ETH which will be unwrapped from WETH.
    /// @param params The parameters for this function found in IBurn interface.
    /// @return assetOut The amount of asset ERC20 received by assetTo.
    /// @return collateralOut The amount of collateral ERC20 received by collateralTo.
    function removeLiquidityETHAsset(IBurn.RemoveLiquidityETHAsset calldata params)
        external
        returns (uint256 assetOut, uint128 collateralOut);

    /// @dev Calls the burn funtion and withdraw liquiidty from a pool.
    /// @dev The collateral received is ETH which will be unwrapped from WETH.
    /// @param params The parameters for this function found in IBurn interface.
    /// @return assetOut The amount of asset ERC20 received by assetTo.
    /// @return collateralOut The amount of collateral ERC20 received by collateralTo.
    function removeLiquidityETHCollateral(IBurn.RemoveLiquidityETHCollateral calldata params)
        external
        returns (uint256 assetOut, uint128 collateralOut);

    /// @dev Calls the lend function and deposit asset into a pool.
    /// @dev Calls given the bond received by bondTo.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in ILend interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return claimsOut The amount of bond ERC20 and insurance ERC20 received by bondTo and insuranceTo.
    function lendGivenBond(ILend.LendGivenBond calldata params)
        external
        returns (uint256 assetIn, IPair.Claims memory claimsOut);

    /// @dev Calls the lend function and deposit asset into a pool.
    /// @dev Calls given the bond received by bondTo.
    /// @dev The asset deposited is ETH which will be wrapped as WETH.
    /// @param params The parameters for this function found in ILend interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return claimsOut The amount of bond ERC20 and insurance ERC20 received by bondTo and insuranceTo.
    function lendGivenBondETHAsset(ILend.LendGivenBondETHAsset calldata params)
        external
        payable
        returns (uint256 assetIn, IPair.Claims memory claimsOut);

    /// @dev Calls the lend function and deposit asset into a pool.
    /// @dev Calls given the bond received by bondTo.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in ILend interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return claimsOut The amount of bond ERC20 and insurance ERC20 received by bondTo and insuranceTo.
    function lendGivenBondETHCollateral(ILend.LendGivenBondETHCollateral calldata params)
        external
        returns (uint256 assetIn, IPair.Claims memory claimsOut);

    /// @dev Calls the lend function and deposit asset into a pool.
    /// @dev Calls given the insurance received by insuranceTo.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in ILend interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return claimsOut The amount of bond ERC20 and insurance ERC20 received by bondTo and insuranceTo.
    function lendGivenInsurance(ILend.LendGivenInsurance calldata params)
        external
        returns (uint256 assetIn, IPair.Claims memory claimsOut);

    /// @dev Calls the lend function and deposit asset into a pool.
    /// @dev Calls given the insurance received by insuranceTo.
    /// @dev The asset deposited is ETH which will be wrapped as WETH.
    /// @param params The parameters for this function found in ILend interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return claimsOut The amount of bond ERC20 and insurance ERC20 received by bondTo and insuranceTo.
    function lendGivenInsuranceETHAsset(ILend.LendGivenInsuranceETHAsset calldata params)
        external
        payable
        returns (uint256 assetIn, IPair.Claims memory claimsOut);

    /// @dev Calls the lend function and deposit asset into a pool.
    /// @dev Calls given the insurance received by insuranceTo.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in ILend interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return claimsOut The amount of bond ERC20 and insurance ERC20 received by bondTo and insuranceTo.
    function lendGivenInsuranceETHCollateral(ILend.LendGivenInsuranceETHCollateral calldata params)
        external
        returns (uint256 assetIn, IPair.Claims memory claimsOut);

    /// @dev Calls the lend function and deposit asset into a pool.
    /// @dev Calls given percentage ratio of bond and insurance.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in ILend interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return claimsOut The amount of bond ERC20 and insurance ERC20 received by bondTo and insuranceTo.
    function lendGivenPercent(ILend.LendGivenPercent calldata params)
        external
        returns (uint256 assetIn, IPair.Claims memory claimsOut);

    /// @dev Calls the lend function and deposit asset into a pool.
    /// @dev Calls given percentage ratio of bond and insurance.
    /// @dev The asset deposited is ETH which will be wrapped as WETH.
    /// @param params The parameters for this function found in ILend interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return claimsOut The amount of bond ERC20 and insurance ERC20 received by bondTo and insuranceTo.
    function lendGivenPercentETHAsset(ILend.LendGivenPercentETHAsset calldata params)
        external
        payable
        returns (uint256 assetIn, IPair.Claims memory claimsOut);

    /// @dev Calls the lend function and deposit asset into a pool.
    /// @dev Calls given percentage ratio of bond and insurance.
    /// @dev Must have the asset ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in ILend interface.
    /// @return assetIn The amount of asset ERC20 deposited.
    /// @return claimsOut The amount of bond ERC20 and insurance ERC20 received by bondTo and insuranceTo.
    function lendGivenPercentETHCollateral(ILend.LendGivenPercentETHCollateral calldata params)
        external
        returns (uint256 assetIn, IPair.Claims memory claimsOut);

    /// @dev Calls the withdraw function and withdraw asset and collateral from a pool.
    /// @param params The parameters for this function found in IWithdraw interface.
    /// @return tokensOut The amount of asset ERC20 and collateral ERC20 received by assetTo and collateralTo.
    function collect(IWithdraw.Collect calldata params) external returns (IPair.Tokens memory tokensOut);

    /// @dev Calls the withdraw function and withdraw asset and collateral from a pool.
    /// @dev The asset received is ETH which will be unwrapped from WETH.
    /// @param params The parameters for this function found in IWithdraw interface.
    /// @return tokensOut The amount of asset ERC20 and collateral ERC20 received by assetTo and collateralTo.
    function collectETHAsset(IWithdraw.CollectETHAsset calldata params)
        external
        returns (IPair.Tokens memory tokensOut);

    /// @dev Calls the withdraw function and withdraw asset and collateral from a pool.
    /// @dev The collateral received is ETH which will be unwrapped from WETH.
    /// @param params The parameters for this function found in IWithdraw interface.
    /// @return tokensOut The amount of asset ERC20 and collateral ERC20 received by assetTo and collateralTo.
    function collectETHCollateral(IWithdraw.CollectETHCollateral calldata params)
        external
        returns (IPair.Tokens memory tokensOut);

    /// @dev Calls the borrow function and borrow asset from a pool and locking collateral into the pool.
    /// @dev Calls given the debt received by dueTo.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IBorrow interface.
    /// @return assetOut The amount of asset ERC20 received by assetTo.
    /// @return id The token id of collateralized debt ERC721 received by dueTo.
    /// @return dueOut The collateralized debt ERC721 received by dueTo.
    function borrowGivenDebt(IBorrow.BorrowGivenDebt calldata params)
        external
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the borrow function and borrow asset from a pool and locking collateral into the pool.
    /// @dev Calls given the debt received by dueTo.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IBorrow interface.
    /// @return assetOut The amount of asset ERC20 received by assetTo.
    /// @return id The token id of collateralized debt ERC721 received by dueTo.
    /// @return dueOut The collateralized debt ERC721 received by dueTo.
    function borrowGivenDebtETHAsset(IBorrow.BorrowGivenDebtETHAsset calldata params)
        external
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the borrow function and borrow asset from a pool and locking collateral into the pool.
    /// @dev Calls given the debt received by dueTo.
    /// @dev The collateral locked is ETH which will be wrapped as WETH.
    /// @param params The parameters for this function found in IBorrow interface.
    /// @return assetOut The amount of asset ERC20 received by assetTo.
    /// @return id The token id of collateralized debt ERC721 received by dueTo.
    /// @return dueOut The collateralized debt ERC721 received by dueTo.
    function borrowGivenDebtETHCollateral(IBorrow.BorrowGivenDebtETHCollateral calldata params)
        external
        payable
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the borrow function and borrow asset from a pool and locking collateral into the pool.
    /// @dev Calls given the collateral locked.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IBorrow interface.
    /// @return assetOut The amount of asset ERC20 received by assetTo.
    /// @return id The token id of collateralized debt ERC721 received by dueTo.
    /// @return dueOut The collateralized debt ERC721 received by dueTo.
    function borrowGivenCollateral(IBorrow.BorrowGivenCollateral calldata params)
        external
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the borrow function and borrow asset from a pool and locking collateral into the pool.
    /// @dev Calls given the collateral locked.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IBorrow interface.
    /// @return assetOut The amount of asset ERC20 received by assetTo.
    /// @return id The token id of collateralized debt ERC721 received by dueTo.
    /// @return dueOut The collateralized debt ERC721 received by dueTo.
    function borrowGivenCollateralETHAsset(IBorrow.BorrowGivenCollateralETHAsset calldata params)
        external
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the borrow function and borrow asset from a pool and locking collateral into the pool.
    /// @dev Calls given the collateral locked.
    /// @dev The collateral locked is ETH which will be wrapped as WETH.
    /// @param params The parameters for this function found in IBorrow interface.
    /// @return assetOut The amount of asset ERC20 received by assetTo.
    /// @return id The token id of collateralized debt ERC721 received by dueTo.
    /// @return dueOut The collateralized debt ERC721 received by dueTo.
    function borrowGivenCollateralETHCollateral(IBorrow.BorrowGivenCollateralETHCollateral calldata params)
        external
        payable
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the borrow function and borrow asset from a pool and locking collateral into the pool.
    /// @dev Calls given percentage ratio of debt and collateral.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IBorrow interface.
    /// @return assetOut The amount of asset ERC20 received by assetTo.
    /// @return id The token id of collateralized debt ERC721 received by dueTo.
    /// @return dueOut The collateralized debt ERC721 received by dueTo.
    function borrowGivenPercent(IBorrow.BorrowGivenPercent calldata params)
        external
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the borrow function and borrow asset from a pool and locking collateral into the pool.
    /// @dev Calls given percentage ratio of debt and collateral.
    /// @dev Must have the collateral ERC20 approve this contract before calling this function.
    /// @param params The parameters for this function found in IBorrow interface.
    /// @return assetOut The amount of asset ERC20 received by assetTo.
    /// @return id The token id of collateralized debt ERC721 received by dueTo.
    /// @return dueOut The collateralized debt ERC721 received by dueTo.
    function borrowGivenPercentETHAsset(IBorrow.BorrowGivenPercentETHAsset calldata params)
        external
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the borrow function and borrow asset from a pool and locking collateral into the pool.
    /// @dev Calls given percentage ratio of debt and collateral.
    /// @dev The collateral locked is ETH which will be wrapped as WETH.
    /// @param params The parameters for this function found in IBorrow interface.
    /// @return assetOut The amount of asset ERC20 received by assetTo.
    /// @return id The token id of collateralized debt ERC721 received by dueTo.
    /// @return dueOut The collateralized debt ERC721 received by dueTo.
    function borrowGivenPercentETHCollateral(IBorrow.BorrowGivenPercentETHCollateral calldata params)
        external
        payable
        returns (
            uint256 assetOut,
            uint256 id,
            IPair.Due memory dueOut
        );

    /// @dev Calls the pay function and withdraw collateral from a pool given debt is paid or being paid.
    /// @dev If there is debt being paid, must have the asset ERC20 approve this contract before calling this function.
    /// @dev Possible to pay debt of collateralized debt not owned by msg.sender, which means no collateral is withdraw.
    /// @param params The parameters for this function found in IPay interface.
    /// @return assetIn The total amount of asset ERC20 paid.
    /// @return collateralOut The total amount of collateral ERC20 receceived by to;
    function repay(IPay.Repay calldata params) external returns (uint128 assetIn, uint128 collateralOut);

    /// @dev Calls the pay function and withdraw collateral from a pool given debt is paid or being paid.
    //// @dev The asset being paid is ETH which will be wrapped as WETH.
    /// @dev Possible to pay debt of collateralized debt not owned by msg.sender, which means no collateral is withdraw.
    /// @param params The parameters for this function found in IPay interface.
    /// @return assetIn The total amount of asset ERC20 paid.
    /// @return collateralOut The total amount of collateral ERC20 receceived by to;
    function repayETHAsset(IPay.RepayETHAsset calldata params)
        external
        payable
        returns (uint128 assetIn, uint128 collateralOut);

    /// @dev Calls the pay function and withdraw collateral from a pool given debt is paid or being paid.
    /// @dev The collateral received is ETH which will be unwrapped from WETH.
    /// @dev If there is debt being paid, must have the asset ERC20 approve this contract before calling this function.
    /// @dev Possible to pay debt of collateralized debt not owned by msg.sender, which means no collateral is withdraw.
    /// @param params The parameters for this function found in IPay interface.
    /// @return assetIn The total amount of asset ERC20 paid.
    /// @return collateralOut The total amount of collateral ERC20 receceived by to;
    function repayETHCollateral(IPay.RepayETHCollateral calldata params)
        external
        returns (uint128 assetIn, uint128 collateralOut);
}
