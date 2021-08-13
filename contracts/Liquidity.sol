// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {ILiquidity} from './interfaces/ILiquidity.sol';
import {IConvenience} from './interfaces/IConvenience.sol';
import {IPair} from './interfaces/IPair.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {SafeMetadata} from './libraries/SafeMetadata.sol';
import {String} from './libraries/String.sol';

contract Liquidity is ILiquidity {
    using SafeMetadata for IERC20;
    using String for uint256;

    uint8 public constant override decimals = 18;

    IConvenience public immutable override convenience;
    IPair public immutable override pair;
    uint256 public immutable override maturity;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    function name() external view override returns (string memory) {
        string memory assetName = pair.asset().safeName();
        string memory collateralName = pair.collateral().safeName();
        return
            string(
                abi.encodePacked('Timeswap Liquidity - ', assetName, ' - ', collateralName, ' - ', maturity.toString())
            );
    }

    function symbol() external view override returns (string memory) {
        string memory assetSymbol = pair.asset().safeSymbol();
        string memory collateralSymbol = pair.collateral().safeSymbol();
        return string(abi.encodePacked('TS-LIQ-', assetSymbol, '-', collateralSymbol, '-', maturity.toString()));
    }

    function totalSupply() external view override returns (uint256) {
        return pair.liquidityOf(maturity, address(this));
    }

    constructor(
        IConvenience _convenience,
        IPair _pair,
        uint256 _maturity
    ) {
        convenience = _convenience;
        pair = _pair;
        maturity = _maturity;
    }

    modifier onlyConvenience() {
        require(msg.sender == address(convenience), 'Forbidden');
        _;
    }

    function mint(address to, uint256 amount) external override onlyConvenience {
        require(to != address(0), 'Zero');

        balanceOf[to] += amount;

        emit Transfer(address(0), to, amount);
    }

    function burn(
        address from,
        address assetTo,
        address collateralTo,
        uint256 amount
    ) external override onlyConvenience returns (IPair.Tokens memory tokensOut) {
        balanceOf[from] -= amount;
        tokensOut = pair.burn(maturity, assetTo, collateralTo, amount);

        emit Transfer(from, address(0), amount);
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, to, amount);

        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external override returns (bool) {
        _approve(from, msg.sender, allowance[from][msg.sender] - amount);
        _transfer(from, to, amount);

        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(msg.sender, spender, amount);

        return true;
    }

    function increaseAllowance(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, allowance[msg.sender][spender] + amount);

        return true;
    }

    function decreaseAllowance(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, allowance[msg.sender][spender] - amount);

        return true;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) private {
        require(to != address(0), 'Zero');

        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);
    }

    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) private {
        allowance[owner][spender] = amount;

        emit Approval(owner, spender, amount);
    }
}
