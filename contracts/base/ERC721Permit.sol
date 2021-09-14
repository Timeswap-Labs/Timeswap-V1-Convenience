// SPDX-License-Identifier: MIT
pragma solidity =0.8.1;

import '@openzeppelin/contracts/utils/Address.sol';
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import '../libraries/ChainId.sol';
import {IERC721Permit} from '../interfaces/IERC721Permit.sol';
import {ERC721} from './ERC721.sol';
import '../interfaces/IERC1271.sol';
import '../interfaces/IERC721Permit.sol';
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

abstract contract ERC721Permit is ERC721, IERC721Permit, EIP712 {
    using Counters for Counters.Counter;
    
    mapping(uint256 => Counters.Counter) private _nonces;

    bytes32 public immutable override _PERMIT_TYPEHASH =
        keccak256("Permit(address spender,uint256 tokenId,uint256 nonce,uint256 deadline)");


    constructor(
        string memory name_
    ) EIP712(name_, "1"){}

    
    /// @inheritdoc IERC721Permit
    function permit(
        address spender,
        uint256 tokenId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable override {
        require(block.timestamp <= deadline, 'Permit expired');

        bytes32 structHash = keccak256(abi.encode(_PERMIT_TYPEHASH, spender, tokenId, _useNonce(tokenId), deadline));

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(hash, v, r, s);
        require(signer == owner, "ERC20Permit: invalid signature");
        
        address owner = ownerOf[tokenId];
        require(spender != owner, 'ERC721Permit: approval to current owner');

        //TODO: to check on isValidSignature
        if (Address.isContract(owner)) {
            require(IERC1271(owner).isValidSignature(digest, abi.encodePacked(r, s, v)) == 0x1626ba7e, 'Unauthorized');
        } else {
            address recoveredAddress = ecrecover(digest, v, r, s);
            require(recoveredAddress != address(0), 'Invalid signature');
            require(recoveredAddress == owner, 'Unauthorized');
        }

        _approve(spender, tokenId);
    }

    function nonces(uint256 tokenId) public view virtual returns (uint256) {
        return _nonces[tokenId].current();
    }

    function DOMAIN_SEPARATOR() external view override returns (bytes32) {
        return _domainSeparatorV4();
    }

    function _useNonce(uint256 tokenId) internal virtual returns (uint256 current) {
        Counters.Counter storage nonce = _nonces[tokenId];
        current = nonce.current();
        nonce.increment();
    }



}
