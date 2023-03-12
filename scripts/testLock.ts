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
import { BridgeAssets, testNativeAssetDeployments, registries } from '../constants/deployments';
import { Ethereum } from '@renproject/chains-ethereum';

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
    BridgeAssets[Ethereum.chain]["aUSDT"].bridgeAddress
  )) as BridgeBase;

   const registry = (await ethers.getContractAt(
     "TestNativeAssetRegistry",
     registries[Ethereum.chain]
   )) as TestNativeAssetRegistry;

   console.log(await registry.getAllNaitveERC20Asset())
   console.log(testNativeERC20Asset.address)

   console.log(Number(await testNativeERC20Asset.balanceOf(ALICE.address)))

  const tx = await testNativeERC20Asset
    .connect(ALICE)
    .approve(astralUSDTBridge.address, "10000000000000000000");

    const r1 = await tx.wait(1)

    console.log(r1)

  const tx2 = await astralUSDTBridge
    .connect(ALICE)
    .lock(
      registries[Ethereum.chain],
      testNativeERC20Asset.address,
      "10000000000000000000"
    );

    const r2 = await tx2.wait(1)

    console.log(r2)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
