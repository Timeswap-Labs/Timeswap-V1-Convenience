// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IDue} from './interfaces/IDue.sol';
import {IERC721Receiver} from './interfaces/IERC721Receiver.sol';
import {IConvenience} from './interfaces/IConvenience.sol';
import {IPair} from './interfaces/IPair.sol';

contract CollateralizedDebt is IDue {
    IConvenience public immutable override convenience;
    IPair public immutable override pair;
    uint256 public immutable override maturity;

    mapping(address => uint256) public override balanceOf;
    mapping(uint256 => address) public override ownerOf;
    mapping(uint256 => address) public override getApproved;
    mapping(address => mapping(address => bool)) public override isApprovedForAll;

    function dueOf(uint256 id) external view override returns (IPair.Due memory) {
        return pair.duesOf(maturity, address(this))[id];
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

    constructor(
        IConvenience _convenience,
        IPair _pair,
        uint256 _maturity
    ) {
        convenience = _convenience;
        pair = _pair;
        maturity = _maturity;
    }

    function mint(address to, uint256 id) external override onlyConvenience {
        _safeMint(to, id);
    }

    function burn(
        address from,
        address to,
        uint256[] memory ids,
        uint112[] memory assetsPay
    ) external override onlyConvenience returns (uint128 collateralOut) {
        require(ids.length == assetsPay.length, 'Invalid');
        for (uint256 i; i < ids.length; i++) require(ownerOf[ids[i]] == from, 'Forbidden');
        collateralOut = pair.pay(maturity, to, address(this), ids, assetsPay);
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
        address _from,
        address _to,
        uint256 _id
    ) external override isApproved(_from, _id) {
        _transfer(_from, _to, _id);
    }

    function approve(address _to, uint256 _id) external override {
        address _owner = ownerOf[_id];
        require(
            _owner == msg.sender || isApprovedForAll[_owner][msg.sender],
            'ERC721 :: approve : Approve caller is not owner nor approved for all'
        );
        require(_to != _owner, 'ERC721 :: approve : Approval to current owner');
        _approve(_to, _id);
    }

    function setApprovalForAll(address _operator, bool _approved) external override {
        require(_operator != msg.sender, 'ERC721 :: setApprovalForAll : Approve to caller');
        _setApprovalForAll(_operator, _approved);
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function _safeTransfer(
        address _from,
        address _to,
        uint256 _id,
        bytes memory _data
    ) private {
        _transfer(_from, _to, _id);
        require(_checkOnERC721Received(_from, _to, _id, _data), 'ERC721 :: _safeTransfer : Not Safe Transfer');
    }

    function _approve(address _approved, uint256 _id) private {
        getApproved[_id] = _approved;
        emit Approval(ownerOf[_id], _approved, _id);
    }

    function _setApprovalForAll(address _operator, bool _approved) private {
        isApprovedForAll[msg.sender][_operator] = _approved;
    }

    function _safeMint(address _to, uint256 _id) internal virtual {
        _mint(_to, _id);
        require(
            _checkOnERC721Received(address(0), _to, _id, ''),
            'ERC721 :: _safeMint : Transfer to non ERC721Receiver implementer'
        );
    }

    function _mint(address _to, uint256 _id) private {
        require(_to != address(0), 'ERC721 :: _mint : Mint to the address(0) address');
        require(ownerOf[_id] == address(0), 'ERC721 :: _mint : Already minted');

        balanceOf[_to] += 1;
        ownerOf[_id] = _to;

        emit Transfer(address(0), _to, _id);
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _id
    ) private {
        require(_to != address(0), 'ERC721 :: _transfer : Transfer to the address(0) address');

        ownerOf[_id] = _to;
        balanceOf[_from] -= 1;
        balanceOf[_to] += 1;
        getApproved[_id] = address(0);

        emit Transfer(_from, _to, _id);
    }

    function _checkOnERC721Received(
        address _from,
        address _to,
        uint256 _id,
        bytes memory _data
    ) private returns (bool) {
        uint256 _size;
        assembly {
            _size := extcodesize(_to)
        }
        if (_size == 0) {
            return true;
        } else {
            bytes memory _returnData;
            (bool _success, bytes memory _return) = _to.call(
                abi.encodeWithSelector(IERC721Receiver(_to).onERC721Received.selector, msg.sender, _from, _id, _data)
            );
            if (_success) {
                _returnData = _return;
            } else if (_return.length > 0) {
                assembly {
                    let _returnDataSize := mload(_return)
                    revert(add(32, _return), _returnDataSize)
                }
            } else {
                revert('ERC721 :: _checkOnERC721Received : Transfer to non ERC721Receiver implementer');
            }
            bytes4 _retval = abi.decode(_returnData, (bytes4));
            return (_retval == 0x150b7a02);
        }
    }
}
