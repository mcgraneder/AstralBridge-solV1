import chaiAsPromised from "chai-as-promised";
import chai, { use, expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { PopulatedTransaction, Wallet } from "ethers";
import BigNumber from "bignumber.js";
import { it } from "mocha";
import { AstralBridgeFactory__factory } from "../typechain-types/factories/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory__factory";
import { AstralBridgeFactory } from "../typechain-types/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory";
import { AstralERC20Logic } from "../typechain-types/contracts/AstralABridge/AstralERC20Asset/AstralERC20.sol/AstralERC20Logic";
import { BridgeBase } from "../typechain-types";
import { randomBytes, Ox } from "../utils/testHelpers";
import { ecrecover, ecsign, pubToAddress } from "ethereumjs-util";
import { BN } from "bn.js";
import Web3 from "web3";
import { ethers } from "hardhat";
import config from "hardhat";
// import { Account } from "web3-eth-accounts";
import { TestNativeAssetRegistry } from "../typechain-types/contracts/AstralABridge/tesNativeAssetRegistry.sol/TestNativeAssetRegistry";
import { TestNativeAssetRegistry__factory } from "../typechain-types/factories/contracts/AstralABridge/tesNativeAssetRegistry.sol/TestNativeAssetRegistry__factory";
import { TestNativeERC20Asset__factory } from "../typechain-types/factories/contracts/AstralABridge/TestNativeERC20Asset__factory";
import { TestNativeERC20Asset } from "../typechain-types/contracts/AstralABridge/TestNativeERC20Asset";

chai.use(chaiAsPromised);

let astralUSDT: AstralERC20Logic;
let astralUSDTBridge: BridgeBase;
let bridgeFACTORY: AstralBridgeFactory;
let mainAccount: any;
let privKey: Buffer;
let mnemonicWallet: Wallet;
let OWNER_PRIVKEY: Buffer;
let nativeAssetRegistry: TestNativeAssetRegistry;
let testNativeERC20Asset: TestNativeERC20Asset;

describe("CatalogRen", function () {
  // Users
  let ALICE: SignerWithAddress;
  let BOB: SignerWithAddress;
  let CHARLIE: SignerWithAddress;

  // Owner
  let OWNER: SignerWithAddress;

  before(async () => {
    [OWNER, ALICE, BOB, CHARLIE] = await ethers.getSigners();
  });

  beforeEach(async () => {
    // const signer = new Wallet(account.privateKey, provider);
    const accounts = config?.network.config.accounts as any;
    // let mnemonicWallet = ethers.Wallet.fromMnemonic(
    //   "test test test test test test test test test test test junk"
    // );
    const index = 0; // first wallet, increment for next wallets
    const wallet = ethers.Wallet.fromMnemonic(
      accounts?.mnemonic,
      accounts.path + `/${index}`
    );

    OWNER_PRIVKEY = Buffer.from(wallet.privateKey.slice(2), "hex");

    const TestNativeERC20Asset = (await ethers.getContractFactory(
      "TestNativeERC20Asset"
    )) as TestNativeERC20Asset__factory;

    testNativeERC20Asset = (await TestNativeERC20Asset.connect(ALICE).deploy(
      "USDT",
      "USDT Tether",
      18,
      "100000000000000000000"
    )) as TestNativeERC20Asset;

    await testNativeERC20Asset.deployed();

    //deploy testNative asset registry
    const NativeAssetRegistry = (await ethers.getContractFactory(
      "TestNativeAssetRegistry"
    )) as TestNativeAssetRegistry__factory;

    nativeAssetRegistry = (await NativeAssetRegistry.connect(OWNER).deploy([
      testNativeERC20Asset.address,
    ])) as TestNativeAssetRegistry;

    await nativeAssetRegistry.deployed();

    //deploy bridge factory
    const BridgeFACTORY = (await ethers.getContractFactory(
      "AstralBridgeFactory"
    )) as AstralBridgeFactory__factory;

    const bridgeFACTORY = (await BridgeFACTORY.connect(OWNER).deploy(
      OWNER.address
    )) as AstralBridgeFactory;

    console.log("OWNER ADDDDDD  ", OWNER.address);

    await bridgeFACTORY.deployed();

    //deploy astral asset and corresponding bridge
    await bridgeFACTORY.deployAssetAndBridge(
      "testAstralUSDT",
      "astralUSDT",
      "aUSDT",
      18
    );

    //get deployed bridge instance
    const allBridgesAndAssets =
      await bridgeFACTORY.getAllAstralAndBridgesAssets();

    astralUSDT = (await ethers.getContractAt(
      "AstralERC20Logic",
      allBridgesAndAssets[0][0]
    )) as AstralERC20Logic;

    astralUSDTBridge = (await ethers.getContractAt(
      "BridgeBase",
      allBridgesAndAssets[1][0]
    )) as BridgeBase;

    console.log(`generated private key ${OWNER_PRIVKEY}`);
    console.log(
      `bridge factory deployed to address ${bridgeFACTORY.address}\n`
    );
    console.log(
      `Sucessfully deployed token ${await astralUSDT.name()} to address ${
        astralUSDT.address
      }, with bridge at address ${astralUSDTBridge.address}`
    );
    console.log(
      `owner balance of ${await astralUSDT.symbol()} is ${Number(
        await astralUSDT.balanceOf(OWNER.address)
      )}`
    );
  });

  describe("Testing Isolated Mint", () => {
    it("Should be able to mint from valid signature", async () => {
      const nHash = randomBytes(32);
      const pHash = randomBytes(32);

      const hash = await astralUSDTBridge.hashForSignature(
        pHash,
        "1000",
        ALICE.address,
        nHash
      );
      const sig = ecsign(Buffer.from(hash.slice(2), "hex"), OWNER_PRIVKEY);

      const publicKeyToAddress = pubToAddress(
        ecrecover(Buffer.from(hash.slice(2), "hex"), sig.v, sig.r, sig.s)
      ).toString("hex");

      expect(publicKeyToAddress).to.equal(OWNER.address.slice(2).toLowerCase());

      const sigString = Ox(
        `${sig.r.toString("hex")}${sig.s.toString("hex")}${sig.v.toString(16)}`
      );

      const veririedSignature = await astralUSDTBridge.verifySignature(
        hash,
        sigString
      );

      expect(veririedSignature).to.be.true;

      const balanceBeforeUser = await astralUSDT.balanceOf(ALICE.address);
      const balanceBeforeSigner = await astralUSDT.balanceOf(OWNER.address);

      await astralUSDTBridge
        .connect(ALICE)
        .mint(pHash, nHash, sigString, "1000", 0);

      const balanceAfrerUser = await astralUSDT.balanceOf(ALICE.address);
      const balanceAfrerSigner = await astralUSDT.balanceOf(OWNER.address);

      console.log(`Alice balance before: ${balanceBeforeUser}`);
      console.log(`Alice After before: ${balanceAfrerUser}`);

      console.log(`Owner balance before: ${balanceBeforeSigner}`);
      console.log(`Owner After before: ${balanceAfrerSigner}`);
    });
    it("Should be able to lock", async () => {
      const balanceBeforeUser = await testNativeERC20Asset.balanceOf(
        ALICE.address
      );
      const balanceBeforeSigner = await testNativeERC20Asset.balanceOf(
        astralUSDTBridge.address
      );

      //approve bridge to tranfer asset
      await testNativeERC20Asset
        .connect(ALICE)
        .approve(astralUSDTBridge.address, 1000);
      await astralUSDTBridge
        .connect(ALICE)
        .lock(nativeAssetRegistry.address, testNativeERC20Asset.address, 1000);

      const balanceAfrerUser = await testNativeERC20Asset.balanceOf(
        ALICE.address
      );
      const balanceAfrerSigner = await testNativeERC20Asset.balanceOf(
        astralUSDTBridge.address
      );

      console.log(`Alice balance before: ${balanceBeforeUser}`);
      console.log(`Alice After before: ${balanceAfrerUser}`);

      console.log(`Owner balance before: ${balanceBeforeSigner}`);
      console.log(`Owner After before: ${balanceAfrerSigner}`);
    });
  });

  //    describe("Testing Isolated Lock", () => {
  //      it("Should be able to lock", async () => {
  //        const balanceBeforeUser = await astralUSDT.balanceOf(ALICE.address);
  //        console.log(`Alice balance before: ${balanceBeforeUser}`);
  //      });
  //    });
});
