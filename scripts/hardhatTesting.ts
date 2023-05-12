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
import { Ethereum } from "@renproject/chains-ethereum";

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

//bridge factory deployed to address 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
//Sucessfully deployed token  to address 0x75537828f2ce51be7289709686A69CbFDbB714F1, with bridge at address 0xE451980132E65465d0a498c53f0b5227326Dd73F
//deployed USDT to address 0x5FbDB2315678afecb367f032d93F642f64180aa3 with decimals 6
//deployed DAI to address 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 with decimals 18

async function main() {
  // const signer = new Wallet(account.privateKey, provider);
  [OWNER] = await ethers.getSigners();

  console.log(OWNER.address);
  console.log(await ethers.provider.getBalance(OWNER.address));

  const TestUSDT = (await ethers.getContractAt(
    "TestNativeERC20Asset",
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  )) as TestNativeERC20Asset;

  const TestDAI = (await ethers.getContractAt(
    "TestNativeERC20Asset",
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  )) as TestNativeERC20Asset;

  [TestDAI, TestUSDT].forEach(async (asset: TestNativeERC20Asset) => {
    console.log(
      `owners balance of ${await asset.symbol()} is ${await asset.balanceOf(
        OWNER.address
      )}`
    );
  });

  const Registry = (await ethers.getContractFactory(
    "TestNativeAssetRegistry"
  )) as TestNativeAssetRegistry__factory;

  const registry = (await Registry.connect(OWNER).deploy([
    TestUSDT.address,
  ])) as TestNativeAssetRegistry;

  await registry.deployed();

  console.log(`deployed  test registry to address ${registry.address}`);

  const astralUSDTBridge = (await ethers.getContractAt(
    "BridgeBase",
    "0xE451980132E65465d0a498c53f0b5227326Dd73F"
  )) as BridgeBase;

  const tx = await TestUSDT.connect(OWNER).approve(
    astralUSDTBridge.address,
    "1000"
  );

  const r1 = await tx.wait(1);

  console.log(await TestUSDT.allowance(OWNER.address, astralUSDTBridge.address))

//   console.log(r1);


  const tx2 = await astralUSDTBridge
    .connect(OWNER)
    .lock(
      registry.address,
      TestUSDT.address,
      "1000"
    );

    const r2 = await tx2.wait(1)

    // console.log(r2)

    astralUSDTBridge.on("AssetLocked", async (_from, _value, timestamp) => {
      console.log(_from, _value, timestamp);
    });

    
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
