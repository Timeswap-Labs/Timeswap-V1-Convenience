// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IClaim} from './interfaces/IClaim.sol';
import {IConvenience} from './interfaces/IConvenience.sol';
import {IPair} from './interfaces/IPair.sol';

contract Insurance is IClaim {
    IConvenience public immutable override convenience;
    IPair public immutable override pair;
    uint256 public immutable override maturity;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    modifier onlyConvenience() {
        require(msg.sender == address(convenience), 'Forbidden');
        _;
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

    function totalSupply() external view override returns (uint256) {
        return pair.claimsOf(maturity, address(this)).insurance;
    }

    function mint(address to, uint128 amount) external override onlyConvenience {
        require(to != address(0), 'Zero');

        balanceOf[to] += amount;

        emit Transfer(address(0), to, amount);
    }

    function burn(
        address from,
        address to,
        uint128 amount
    ) external override onlyConvenience returns (uint128 tokenOut) {
        balanceOf[from] -= amount;
        tokenOut = pair.withdraw(maturity, to, to, IPair.Claims(0, amount)).collateral;

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
