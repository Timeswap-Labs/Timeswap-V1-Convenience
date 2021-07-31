// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC20} from './interfaces/IERC20.sol';
import {IConvenience} from './interfaces/IConvenience.sol';
import {IPair} from './interfaces/IPair.sol';

contract Bond is IERC20 {
    IConvenience public immutable convenience;
    IPair public immutable pair;
    uint256 public immutable maturity;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

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

    function totalSupply() external view returns (uint256) {
        return pair.claimsOf(maturity, address(this)).bond;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);

        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        _approve(from, msg.sender, allowance[from][msg.sender] - amount);
        _transfer(from, to, amount);

        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
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

    function mint(address to, uint128 amount) external onlyConvenience {
        require(to != address(0), 'Zero');

        balanceOf[to] += amount;

        emit Transfer(address(0), owner, amount);
    }

    function burn(
        address to,
        address owner,
        uint128 amount
    ) external onlyConvenience returns (uint128 assetOut) {
        balanceOf[owner] -= amount;
        assetOut = pair.withdraw(maturity, to, to, Claims(amount, 0)).asset;

        emit Transfer(owner, address(0), amount);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) private {
        require(to != address(0), 'Zero');

        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, owner, amount);
    }

    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) private {
        allowance[owner][spender] = amount;

        emit Approval(owner, spender, value);
    }
}
