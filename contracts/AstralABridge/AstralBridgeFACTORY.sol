// SPDX-License-Identifier: GPL-3.0

// solhint-disable-next-line
pragma solidity ^0.8.0;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AstralERC20Logic} from "./AstralERC20Asset/AstralERC20.sol";
import {BridgeBase} from "./BridgeBaseAdapter.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {LinkedList} from "../utils/LinkedList.sol";
import {BridgeBase} from "./BridgeBaseAdapter.sol";
import {IBaseBridge} from "../interfaces/AstralBridge/IBaseBridge.sol";
import "hardhat/console.sol";

contract AstralBridgeFactory is Ownable {

    uint8 numAstralAssets = 0;
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

    // constructor() public {
    //    //will add sig and access control params later
    // }

    function deployAssetAndBridge(
        string calldata asset, 
        string calldata name, 
        string calldata symbol,
         uint8 decimals 
    ) public onlyOwner {
        //check if asset exists
        address a = symbolToAstralAsset[symbol];
        console.log(a);

        address token = address(_deployAstralAsset(block.chainid, asset, name, symbol, decimals));
        _deployAssetBridge(asset, symbol, address(this), token, block.chainid);
        numAstralAssets++;
    }

    function _deployAstralAsset(
        uint256 chainId,
        string calldata asset,
        string calldata name,
        string calldata symbol,
        uint8 decimals
    ) internal returns (IERC20) {
        bytes memory encodedParameters = abi.encodeWithSignature(
            // chainId,
            name,
            symbol,
            decimals
        );

        // bytes32 create2Salt = keccak256(abi.encodePacked(asset, version));
        AstralERC20Logic astralAsset = new AstralERC20Logic(name, symbol, decimals, chainId);
        symbolToAstralAsset[symbol] = address(astralAsset);
        LinkedList.append(AstralAssetAddresses, address(astralAsset));

        emit AstralAssetDeployed(chainId, name, symbol, decimals, block.timestamp);

        return IERC20(astralAsset);
    }

    function _deployAssetBridge(
        string calldata asset,
        string calldata symbol,
        address signatureVerifier,
        address token,
        uint256 chainId
    ) internal returns (IBaseBridge) {
        bytes memory encodedParameters = abi.encodeWithSignature(
            asset,
            signatureVerifier,
            token
        );

        // bytes32 create2Salt = keccak256(abi.encodePacked(asset, version));

        BridgeBase assetBridge = new BridgeBase(address(this), token);
        symbolToAstralBridge[symbol] = address(assetBridge);
        addressToAstralBridge[token] = address(assetBridge);
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

    function getNumAssets() public view returns(uint8) {
        return numAstralAssets;
    }

}