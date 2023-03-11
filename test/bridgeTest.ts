const { expect } = require("chai");
import chaiAsPromised from "chai-as-promised";
import chai, { use } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { PopulatedTransaction, Wallet } from "ethers";
import BigNumber from "bignumber.js";
import { it } from "mocha";
import { AstralBridgeFactory__factory } from "../typechain-types/factories/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory__factory";
import { AstralBridgeFactory } from "../typechain-types/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory";
import { AstralERC20Logic } from '../typechain-types/contracts/AstralABridge/AstralERC20Asset/AstralERC20.sol/AstralERC20Logic';
import { BridgeBase } from "../typechain-types";
import { randomBytes, Ox } from '../utils/testHelpers';
import { ecrecover, ecsign, pubToAddress } from "ethereumjs-util";
import { BN } from "bn.js";
import Web3 from "web3"
import { ethers } from "hardhat";
import config from "hardhat";
// import { Account } from "web3-eth-accounts";


chai.use(chaiAsPromised);

let astralUSDT: AstralERC20Logic
let astralUSDTBridge: BridgeBase
let bridgeFACTORY: AstralBridgeFactory;
let mainAccount: any;
let privKey: Buffer;
let mnemonicWallet: Wallet;
let OWNER_PRIVKEY: Buffer

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
    //deploy bridge factory
    const BridgeFACTORY = (await ethers.getContractFactory(
      "AstralBridgeFactory"
    )) as AstralBridgeFactory__factory;

    const bridgeFACTORY = (await BridgeFACTORY.connect(
      OWNER
    ).deploy()) as AstralBridgeFactory;

    await bridgeFACTORY.deployed();

    //deploy astral asset and corresponding bridge
    await bridgeFACTORY.deployAssetAndBridge(
      "testAstralUSDT",
      "astralUSDT",
      "aUSDT",
      6
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
  });

  describe("Testing", () => {
    it("Should be able to mint from valid signature", async() => {
      const nHash = randomBytes(32);
      const pHash = randomBytes(32);

      const hash = await astralUSDTBridge.hashForSignature(
        pHash,
        "0",
        ALICE.address,
        nHash
      );
      const sig = ecsign(Buffer.from(hash.slice(2), "hex"), OWNER_PRIVKEY);

      const pubAddress = pubToAddress(
        ecrecover(Buffer.from(hash.slice(2), "hex"), sig.v, sig.r, sig.s)
      ).toString("hex")
      console.log(pubAddress)
      
        // .toString("hex")
        // .should.equal(mintAuthority.address.slice(2).toLowerCase());

    //   const sigString = Ox(
    //     `${sig.r.toString("hex")}${sig.s.toString("hex")}${sig.v.toString(16)}`
    //   );

    //   const hashForSignature = await gateway.hashForSignature.call(
    //     pHash,
    //     value,
    //     user,
    //     nHash
    //   );
    //   (await gateway.verifySignature.call(hashForSignature, sigString)).should
    //     .be.true;

    //   const balanceBefore = new BN(
    //     (await renbtc.balanceOfUnderlying.call(user)).toString()
    //   );
    //   const _n = await gateway.nextN.call();
    //   const valueMinted = await removeMintFee(renbtc, value, mintFees);
    //   (
    //     (await gateway.mint(pHash, value, nHash, sigString, {
    //       from: user,
    //     })) as any
    //   ).should.emit.logs([
    //     log("LogMint", {
    //       _to: user,
    //       _amount: valueMinted,
    //       _n: n !== undefined ? n : _n,
    //     }),
    //   ]);
    //   // (await renbtc.balanceOfUnderlying.call(user)).should.bignumber.equal(balanceBefore.add(valueMinted));

    //   (await renbtc.balanceOfUnderlying.call(user)).should.bignumber.lte(
    //     balanceBefore
    //       .add(await removeMintFee(renbtc, value, mintFees))
    //       .add(new BN(1))
    //   );
    //   (await renbtc.balanceOfUnderlying.call(user)).should.bignumber.gte(
    //     balanceBefore
    //       .add(await removeMintFee(renbtc, value, mintFees))
    //       .sub(new BN(1))
    //   );

    //   return [pHash, nHash, valueMinted];
    });
  });
});
