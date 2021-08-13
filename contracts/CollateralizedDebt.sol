// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IDue} from './interfaces/IDue.sol';
import {IERC721Receiver} from './interfaces/IERC721Receiver.sol';
import {IConvenience} from './interfaces/IConvenience.sol';
import {IPair} from './interfaces/IPair.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {SafeMetadata} from './libraries/SafeMetadata.sol';
import {String} from './libraries/String.sol';

contract CollateralizedDebt is IDue {
    using SafeMetadata for IERC20;
    using String for uint256;

    IConvenience public immutable override convenience;
    IPair public immutable override pair;
    uint256 public immutable override maturity;

    mapping(address => uint256) public override balanceOf;
    mapping(uint256 => address) public override ownerOf;
    mapping(uint256 => address) public override getApproved;
    mapping(address => mapping(address => bool)) public override isApprovedForAll;

    function name() external view override returns (string memory) {
        string memory assetName = pair.asset().safeName();
        string memory collateralName = pair.collateral().safeName();
        return
            string(
                abi.encodePacked(
                    'Timeswap Collateralized Debt - ',
                    assetName,
                    ' - ',
                    collateralName,
                    ' - ',
                    maturity.toString()
                )
            );
    }

    function symbol() external view override returns (string memory) {
        string memory assetSymbol = pair.asset().safeSymbol();
        string memory collateralSymbol = pair.collateral().safeSymbol();
        return string(abi.encodePacked('TS-CLDT-', assetSymbol, '-', collateralSymbol, '-', maturity.toString()));
    }

    function tokenURI(uint256 id) external view override returns (string memory) {}

    function assetDecimals() external view override returns (uint8) {
        return pair.asset().safeDecimals();
    }

    function collateralDecimals() external view override returns (uint8) {
        return pair.collateral().safeDecimals();
    }

    function dueOf(uint256 id) external view override returns (IPair.Due memory) {
        return pair.duesOf(maturity, address(this))[id];
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

    modifier isApproved(address owner, uint256 id) {
        require(
            owner == msg.sender || getApproved[id] == msg.sender || isApprovedForAll[owner][msg.sender],
            'Forrbidden'
        );
        _;
    }

    function mint(address to, uint256 id) external override onlyConvenience {
        _safeMint(to, id);
    }

    function burn(
        address from,
        address to,
        uint256[] memory ids,
        uint112[] memory debtsIn
    ) external override onlyConvenience returns (uint128 collateralOut) {
        for (uint256 i; i < ids.length; i++) require(ownerOf[ids[i]] == from, 'Forbidden');
        collateralOut = pair.pay(maturity, to, address(this), ids, debtsIn);

        IPair.Due[] memory dues = pair.duesOf(maturity, address(this));
        for (uint256 i; i < ids.length; i++) {
            uint256 id = ids[i];
            if (dues[id].collateral == 0) _burn(from, id);
        }
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id
    ) external override isApproved(from, id) {
        _safeTransfer(from, to, id, '');
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        bytes memory data
    ) external override isApproved(from, id) {
        _safeTransfer(from, to, id, data);
    }

    function transferFrom(
        address from,
        address to,
        uint256 id
    ) external override isApproved(from, id) {
        _transfer(from, to, id);
    }

    function approve(address to, uint256 id) external override {
        address owner = ownerOf[id];
        require(
            owner == msg.sender || isApprovedForAll[owner][msg.sender],
            'ERC721 :: approve : Approve caller is not owner nor approved for all'
        );
        require(to != owner, 'ERC721 :: approve : Approval to current owner');

        _approve(to, id);
    }

    function setApprovalForAll(address operator, bool approved) external override {
        require(operator != msg.sender, 'ERC721 :: setApprovalForAll : Approve to caller');

        _setApprovalForAll(operator, approved);
    }

    function _safeTransfer(
        address from,
        address to,
        uint256 id,
        bytes memory data
    ) private {
        _transfer(from, to, id);

        require(_checkOnERC721Received(from, to, id, data), 'ERC721 :: _safeTransfer : Not Safe Transfer');
    }

    function _approve(address to, uint256 id) private {
        getApproved[id] = to;

        emit Approval(ownerOf[id], to, id);
    }

    function _setApprovalForAll(address operator, bool approved) private {
        isApprovedForAll[msg.sender][operator] = approved;

        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function _safeMint(address to, uint256 id) internal virtual {
        _mint(to, id);

        require(
            _checkOnERC721Received(address(0), to, id, ''),
            'ERC721 :: _safeMint : Transfer to non ERC721Receiver implementer'
        );
    }

    function _mint(address to, uint256 id) private {
        require(to != address(0), 'ERC721 :: _mint : Mint to the address(0) address');
        require(ownerOf[id] == address(0), 'ERC721 :: _mint : Already minted');

        balanceOf[to]++;
        ownerOf[id] = to;

        emit Transfer(address(0), to, id);
    }

    function _burn(address from, uint256 id) private {
        require(from != address(0), 'ERC721 :: _burn : Zero address');
        require(ownerOf[id] == from, 'ERC721 :: _burn : Not owner of token');

        balanceOf[from]--;
        ownerOf[id] = address(0);

        emit Transfer(from, address(0), id);
    }

    function _transfer(
        address from,
        address to,
        uint256 id
    ) private {
        require(to != address(0), 'ERC721 :: _transfer : Transfer to the address(0) address');

        ownerOf[id] = to;
        balanceOf[from]--;
        balanceOf[to]++;

        _approve(address(0), id);

        emit Transfer(from, to, id);
    }

    function _checkOnERC721Received(
        address from,
        address to,
        uint256 id,
        bytes memory data
    ) private returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(to)
        }
        if (size == 0) {
            return true;
        } else {
            bytes memory returnData;
            (bool success, bytes memory _return) = to.call(
                abi.encodeWithSelector(IERC721Receiver(to).onERC721Received.selector, msg.sender, from, id, data)
            );
            if (success) {
                returnData = _return;
            } else if (_return.length > 0) {
                assembly {
                    let returnDataSize := mload(_return)
                    revert(add(32, _return), returnDataSize)
                }
            } else {
                revert('ERC721 :: _checkOnERC721Received : Transfer to non ERC721Receiver implementer');
            }
            bytes4 retval = abi.decode(returnData, (bytes4));
            return (retval == 0x150b7a02);
        }
    }
}
