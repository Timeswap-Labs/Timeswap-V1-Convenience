// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import {IERC721} from './interfaces/IERC721.sol';
import {IERC721Receiver} from './interfaces/IERC721Receiver.sol';
import {IConvenience} from './interfaces/IConvenience.sol';
import {IPair} from './interfaces/IPair.sol';

contract CollateralizedDebt is IERC721 {
    IConvenience public immutable convenience;
    IPair public immutable pair;
    uint256 public immutable maturity;

    struct CollateralizedDebt {
        uint128 collateral;
        uint128 debt;
    }

    uint256 internal tokenId;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public ownerOf;
    mapping(address => CollateralizedDebt) public collateralizedDebtOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    modifier onlyConvenience() {
        require(msg.sender == address(convenience), 'Forbidden');
        _;
    }

    // modifier onlyConvenience(address _owner, uint256 _tokenId) {
    //     require(
    //         _owner == msg.sender || getApproved[_tokenId] == msg.sender || isApprovedForAll[_owner][msg.sender],
    //         'Forrbidden'
    //     );
    //     _;
    // }

    constructor(
        IConvenience _convenience,
        IPair _pair,
        uint256 _maturity
    ) {
        convenience = _convenience;
        pair = _pair;
        maturity = _maturity;
    }

    function mint(
        address _to,
        uint256 _collateral,
        uint256 _debt
    ) external onlyConvenience {
        tokenId++;
        uint256 _tokenId = tokenId;
        collateralizedDebtOf[_tokenId] = CollateralizedDebt(uint128(_collateral), uint128(_debt));
        _safeMint(_to, _tokenId);
    }

    function burn(
        uint256 _tokenId,
        uint256 _collateral,
        uint256 _debt
    ) external onlyConvenience {
        collateralizedDebtOf[_tokenId].collateral -= uint128(_collateral);
        collateralizedDebtOf[_tokenId].debt -= uint128(_debt);
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external  onlyConvenience(ownerOf[_tokenId], _tokenId) {
        _safeTransfer(_from, _to, _tokenId, '');
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) external onlyConvenience(ownerOf[_tokenId], _tokenId) {
        _safeTransfer(_from, _to, _tokenId, _data);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external  onlyConvenience(ownerOf[_tokenId], _tokenId) {
        _transfer(_from, _to, _tokenId);
    }

    function approve(address _to, uint256 _tokenId) external override {
        address _owner = ownerOf[_tokenId];
        require(
            _owner == msg.sender || isApprovedForAll[_owner][msg.sender],
            'ERC721 :: approve : Approve caller is not owner nor approved for all'
        );
        require(_to != _owner, 'ERC721 :: approve : Approval to current owner');
        _approve(_to, _tokenId);
    }

    function setApprovalForAll(address _operator, bool _approved) external override {
        require(_operator != msg.sender, 'ERC721 :: setApprovalForAll : Approve to caller');
        _setApprovalForAll(_operator, _approved);
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

       function _safeTransfer(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) private {
        _transfer(_from, _to, _tokenId);
        require(_checkOnERC721Received(_from, _to, _tokenId, _data), 'ERC721 :: _safeTransfer : Not Safe Transfer');
    }

    function _approve(address _approved, uint256 _tokenId) private {
        getApproved[_tokenId] = _approved;
        emit Approval(ownerOf[_tokenId], _approved, _tokenId);
    }

    function _setApprovalForAll(address _operator, bool _approved) private {
        isApprovedForAll[msg.sender][_operator] = _approved;
    }

    function _safeMint(address _to, uint256 _tokenId) internal virtual {
        _mint(_to, _tokenId);
        require(
            _checkOnERC721Received(address(0), _to, _tokenId, ''),
            'ERC721 :: _safeMint : Transfer to non ERC721Receiver implementer'
        );
    }

    function _mint(address _to, uint256 _tokenId) private {
        require(_to != address(0), 'ERC721 :: _mint : Mint to the address(0) address');
        require(ownerOf[_tokenId] == address(0), 'ERC721 :: _mint : Already minted');

        balanceOf[_to] += 1;
        ownerOf[_tokenId] = _to;

        emit Transfer(address(0), _to, _tokenId);
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) private {
        require(_to != address(0), 'ERC721 :: _transfer : Transfer to the address(0) address');

        ownerOf[_tokenId] = _to;
        balanceOf[_from] -= 1;
        balanceOf[_to] += 1;
        getApproved[_tokenId] = address(0);

        emit Transfer(_from, _to, _tokenId);
    }

    function _checkOnERC721Received(
        address _from,
        address _to,
        uint256 _tokenId,
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
                abi.encodeWithSelector(
                    IERC721Receiver(_to).onERC721Received.selector,
                    msg.sender,
                    _from,
                    _tokenId,
                    _data
                )
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
