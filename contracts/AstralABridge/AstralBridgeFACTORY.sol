// SPDX-License-Identifier: GPL-3.0

// solhint-disable-next-line
pragma solidity ^0.8.0;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {BridgeBase} from "./BridgeBaseAdapter.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


contract RenAssetFactory {
    event AstralAssetProxyDeployed(
        uint256 chainId,
        string asset,
        string name,
        string symbol,
        uint8 decimals,
        string version
    );
    event MintGatewayProxyDeployed(string asset, address signatureVerifier, address token, string version);
    event LockGatewayProxyDeployed(string asset, address signatureVerifier, address token, string version);

    constructor() public {

    }

    function _deployRenAsset(
        uint256 chainId,
        string calldata asset,
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        string calldata version
    ) internal {
        bytes memory encodedParameters = abi.encodeWithSignature(
            "__RenAsset_init(uint256,string,string,string,uint8,address)",
            chainId,
            version,
            name,
            symbol,
            decimals,
            // Owner will be transferred to gateway
            address(this)
        );

        bytes32 create2Salt = keccak256(abi.encodePacked(asset, version));

        // address astralAsset = deployProxy(create2Salt, encodedParameters);

        // emit RenAssetProxyDeployed(chainId, asset, name, symbol, decimals, version);

        // return IERC20(renAsset);
    }

    function _deployAssetBridge(
        string calldata asset,
        address signatureVerifier,
        address token,
        string calldata version
    ) internal {
        bytes memory encodedParameters = abi.encodeWithSignature(
            "__MintGateway_init(string,address,address)",
            asset,
            signatureVerifier,
            token
        );

        bytes32 create2Salt = keccak256(abi.encodePacked(asset, version));

        // address mintGateway = getMintGatewayProxyBeacon().deployProxy(create2Salt, encodedParameters);

        // emit MintGatewayProxyDeployed(asset, signatureVerifier, token, version);

        // return IMintGateway(mintGateway);
    }

}