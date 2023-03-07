pragma solidity >= 0.8.9;

import {LinkedList} from "./LinkedList.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";



abstract contract testNativeAssetRegistry is Ownable {

    uint8 numOfAssets = 0;
    LinkedList.List public testNativeERC20Assets;

    constructor(string[] memory _initialTokens) {
        for (uint i = 0; i < _initialTokens.length; i++) {
            require(
                !LinkedList.isInList(testNativeERC20Assets, _initialTokens[i], 
                "asset already registered")
            );
            LinkedList.append(testNativeERC20Assets,  _initialTokens[i]);
            numOfAssets++;
        }
    }

    //do other checks such as does address exist or is it valid ERC20 token.
    //this is a mock so not really important to do this here
    function registerNativeERC20Asset(string memory asset) public onlyOwner {
        require(
                !LinkedList.isInList(testNativeERC20Assets,asset, 
                "asset already registered")
        );
        LinkedList.append(testNativeERC20Assets,  asset);
        numOfAssets++;

    }

    function getNaitveERC20Asset(address asset) public view returns (address memory) {
        require(
            LinkedList.isInList(testNativeERC20Assets, asset,
            "asset not registered")
        );
        address[] memory allAssets = LinkedList.elements(testNativeERC20Assets, asset, 0);

        for (uint i = 0; i < allAssets.length; i++) {
            if (allAssets[i] == asset) return asset;
        }
        
    }

    // function getAllNaitveERC20Asset() public view returns (address[] memory) {
    //     return LinkedList.elements(testNativeERC20Assets, 0, numOfAssets);
    // }

}