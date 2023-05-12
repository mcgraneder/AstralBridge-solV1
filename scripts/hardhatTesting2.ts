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
// import { ADMIN_KEY } from '../utils/config';
import { ecrecover, ecsign, pubToAddress } from "ethereumjs-util";
import { randomBytes, Ox } from "../utils/testHelpers";
import { keccak256 } from "web3-utils";


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

//bridge factory deployed to address 0x5FbDB2315678afecb367f032d93F642f64180aa3
//Sucessfully deployed token  to address 0xa16E02E87b7454126E5E10d957A927A7F5B5d2be, with bridge at address 0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968
async function main() {
  // const OWNER = new Wallet(account.privateKey, provider);
  [OWNER] = await ethers.getSigners();

  const astralUSDTBridge = (await ethers.getContractAt(
    "BridgeBase",
    "0xE451980132E65465d0a498c53f0b5227326Dd73F"
  )) as BridgeBase;

  const astralUSDTBridgeBsc = (await ethers.getContractAt(
    "BridgeBase",
    "0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968"
  )) as BridgeBase;


  const ADMIN_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    astralUSDTBridge.on("AssetLocked", async (_from, _value, timestamp) => {
      const _nonce = 63512828635;
      console.log(_from, _value, timestamp);
      const ADMIN_PRIVATE_KEY = Buffer.from(ADMIN_KEY, "hex");

      const nHash = keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["uint256", "uint256"],
          [_nonce, _value]
        )
      );
      const pHash = keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["uint256", "address"],
          [_value, _from]
        )
      );

      const hash = await astralUSDTBridgeBsc.hashForSignature(
        pHash,
        _value,
        _from,
        nHash
      );

      const sig = ecsign(Buffer.from(hash.slice(2), "hex"), ADMIN_PRIVATE_KEY);

      const publicKeyToAddress = pubToAddress(
        ecrecover(Buffer.from(hash.slice(2), "hex"), sig.v, sig.r, sig.s)
      ).toString("hex");

      const sigString = Ox(
        `${sig.r.toString("hex")}${sig.s.toString("hex")}${sig.v.toString(16)}`
      );

      const veririedSignature = await astralUSDTBridge.verifySignature(
        hash,
        sigString
      );

      console.log(`verified signature: ${veririedSignature}`);
      console.log(`sig string: ${sigString}`);
      console.log(`public key to address: ${publicKeyToAddress}`);
      console.log(`hash: ${hash}`);

      const mintTransaction = await astralUSDTBridgeBsc
        .connect(OWNER)
        .mint(pHash, nHash, sigString, _value, _nonce, _from);
      const mintTxReceipt = await mintTransaction.wait(1);

      console.log(mintTxReceipt);
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
