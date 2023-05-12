// SPDX-License-Identifier: GPL-3.0

// solhint-disable-next-line
pragma solidity ^0.8.0;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AstralERC20Logic} from "./AstralERC20Asset/AstralERC20.sol";
import {BridgeBase} from "./BridgeBaseAdapter.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {LinkedList} from "../utils/LinkedList.sol";
import {BridgeBase} from "./BridgeBaseAdapter.sol";
import {IBaseBridge} from "../interfaces/AstralBridge/IBaseBridge.sol";
import {AstralAssetVault} from "./AstralERC20Asset/AstralAssetValut.sol";
import {AstralAssetProxyBeacon, BridgeBaseAdapterProxyBeacon} from "./AstralProxyBeacon.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";


import "hardhat/console.sol";

contract AstralBridgeFactoryState {
    AstralAssetProxyBeacon internal _astralAssetProxyBeacon;
    BridgeBaseAdapterProxyBeacon internal _bridgeBaseAdapterProxyBeacon;
}

contract AstralBridgeFactory is Initializable, ContextUpgradeable, AstralBridgeFactoryState {

    address signatureVerifier;
    uint8 numAstralAssets;
    LinkedList.List private AstralAssetAddresses;
    LinkedList.List private AstralAssetBridgeAddresses;

    event AstralAssetDeployed(
        uint256 chainId,
        string name,
        string symbol,
        uint8 decimals,
        uint256 timestamp
    );


    event AstralAssetBridgeDeployed(
        uint256 chainId,
        string asset,
        address bridge,
        uint256 timestamp
    );

    mapping(string => address) symbolToAstralAsset;
    mapping(address => address) addressToAstralBridge;
    mapping(string => address) symbolToAstralBridge;


     function initialize(
        address astralAssetProxyBeacon_,
        address bridgeBaseAdapterProxyBeacon_,
        address _signatureVerifier
    ) public initializer {
        __Context_init();
        _astralAssetProxyBeacon = AstralAssetProxyBeacon(astralAssetProxyBeacon_);
        _bridgeBaseAdapterProxyBeacon = BridgeBaseAdapterProxyBeacon(bridgeBaseAdapterProxyBeacon_);
        signatureVerifier = _signatureVerifier;
        numAstralAssets = 0;
    }

    function deployAssetAndBridge(
        string calldata asset, 
        string calldata name, 
        string calldata symbol,
        address parentAsset,
         uint8 decimals 
    ) public returns (address, address) {
        //check if asset exists
        address a = symbolToAstralAsset[symbol];
  
        AstralERC20Logic token = _deployAstralAsset(block.chainid, asset, name, symbol, decimals, parentAsset);
        address bridge = address( _deployAssetBridge(asset, symbol, signatureVerifier, address(token), block.chainid));
        token.transferOwnership(bridge);
        numAstralAssets+=1;

        return (address(token), bridge);
    }

    function _deployAstralAsset(
        uint256 chainId,
        string calldata asset,
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        address parentToken
    ) internal returns (AstralERC20Logic) {

        bytes memory encodedParameters = abi.encodeWithSignature(
            "initialize(string,string,uint8,uint256,uint256,address)",
            name, 
            symbol, 
            decimals, 
            chainId,
            300,
            parentToken
        );

        // bytes32 create2Salt = keccak256(abi.encodePacked(asset, version));
        address astralAsset = address(new BeaconProxy(address(_astralAssetProxyBeacon), ""));
        Address.functionCall(address(astralAsset), encodedParameters);

        // AstralERC20Logic astralAsset = new AstralERC20Logic(name, symbol, decimals, block.chainid, 300, parentToken);
        symbolToAstralAsset[symbol] = astralAsset;
        LinkedList.append(AstralAssetAddresses, astralAsset);

        emit AstralAssetDeployed(chainId, name, symbol, decimals, block.timestamp);

        return AstralERC20Logic(astralAsset);
    }

    function _deployAssetBridge(
        string calldata asset,
        string calldata symbol,
        address signatureVerifier,
        address token,
        uint256 chainId
    ) internal returns (IBaseBridge) {
        bytes memory encodedParameters = abi.encodeWithSignature(
            "initialize(address,address)",
            signatureVerifier,
            token
        );

        // bytes32 create2Salt = keccak256(abi.encodePacked(asset, version));
        address assetBridge = address(new BeaconProxy(address(_bridgeBaseAdapterProxyBeacon), ""));
        Address.functionCall(address(assetBridge), encodedParameters);

        symbolToAstralBridge[symbol] = assetBridge;
        addressToAstralBridge[token] = assetBridge;
        LinkedList.append(AstralAssetBridgeAddresses, address(assetBridge));

        emit AstralAssetBridgeDeployed(chainId, asset, address(assetBridge), block.timestamp);

        return IBaseBridge(address(assetBridge));
    }

    function getAllAstralAndBridgesAssets() public view returns (address[] memory, address[] memory) {
        address firstAssetAddress = LinkedList.begin(AstralAssetAddresses);
        address firstBridgeAddress = LinkedList.begin(AstralAssetBridgeAddresses);

        address[] memory allAssets = LinkedList.elements(AstralAssetAddresses, firstAssetAddress, numAstralAssets);
        address[] memory allBridges = LinkedList.elements(AstralAssetBridgeAddresses, firstBridgeAddress, numAstralAssets);
        return (allAssets, allBridges);
    }

    function setAstralAsset(string memory symbol) public {
        symbolToAstralAsset[symbol] = _msgSender();
    }
    function getNumAssets() public view returns(uint8) {
        return numAstralAssets;
    }

    function getAssetBySymbol(string memory _symbol) public view returns (address) {
        return symbolToAstralAsset[_symbol];
    }

    function getBridgeBySymbol(string memory _symbol) public view returns (address) {
        return symbolToAstralBridge[_symbol];
    }

    function getAstralAssetProxyBeacon() public view returns (AstralAssetProxyBeacon) {
        return _astralAssetProxyBeacon;
    }

    function getAstralBridgeBaseAdapterProxyBeacon() public view returns (BridgeBaseAdapterProxyBeacon) {
        return _bridgeBaseAdapterProxyBeacon;
    }

}