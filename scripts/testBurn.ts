import { AstralBridgeFactory__factory } from "../typechain-types/factories/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory__factory";
import { AstralBridgeFactory } from "../typechain-types/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory";
import { AstralERC20Logic } from "../typechain-types/contracts/AstralABridge/AstralERC20Asset/AstralERC20.sol/AstralERC20Logic";
import { BridgeBase } from "../typechain-types";
import { ethers } from "hardhat";
import config from "hardhat";
import { TestNativeAssetRegistry } from "../typechain-types/contracts/AstralABridge/tesNativeAssetRegistry.sol/TestNativeAssetRegistry";
import { TestNativeAssetRegistry__factory } from "../typechain-types/factories/contracts/AstralABridge/tesNativeAssetRegistry.sol/TestNativeAssetRegistry__factory";
import { TestNativeERC20Asset__factory } from "../typechain-types/factories/contracts/AstralABridge/TestNativeERC20Asset__factory";
import { TestNativeERC20Asset } from "../typechain-types/contracts/AstralABridge/TestNativeERC20Asset";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Test__factory } from "../typechain-types/factories/contracts/test.sol/Test__factory";
import { Test } from "../typechain-types/contracts/test.sol/Test";
import {
  BridgeAssets,
  testNativeAssetDeployments,
  registries,
} from "../constants/deployments";
import { Ethereum, BinanceSmartChain } from '@renproject/chains-ethereum';

let astralUSDT: AstralERC20Logic;
let astralUSDTBridge: BridgeBase;
let bridgeFACTORY: AstralBridgeFactory;
let mainAccount: any;
let privKey: Buffer;
let OWNER_PRIVKEY: Buffer;
let nativeAssetRegistry: TestNativeAssetRegistry;
let testNativeERC20Asset: TestNativeERC20Asset;

let ALICE: SignerWithAddress;
let BOB: SignerWithAddress;
let CHARLIE: SignerWithAddress;


// Owner
let OWNER: SignerWithAddress;

async function main() {
  // const signer = new Wallet(account.privateKey, provider);
  [OWNER, ALICE] = await ethers.getSigners();

  const testNativeERC20Asset = (await ethers.getContractAt(
    "TestNativeERC20Asset",
    testNativeAssetDeployments[Ethereum.chain]["USDT"]
  )) as TestNativeERC20Asset;

  const astralUSDTBridge = (await ethers.getContractAt(
    "BridgeBase",
    BridgeAssets[BinanceSmartChain.chain]["aUSDT"].bridgeAddress
  )) as BridgeBase;

  astralUSDT = (await ethers.getContractAt(
    "AstralERC20Logic",
    "0xEf8525d62713CB58638DB331553FCf7ed84F6B49"
  )) as AstralERC20Logic;

  console.log(Number(await astralUSDT.balanceOf(ALICE.address)));

  const tx2 = await astralUSDTBridge
    .connect(ALICE)
    .burn(testNativeERC20Asset.address, ethers.utils.parseEther("1"));

  const r2 = await tx2.wait(1);

  console.log(r2);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
