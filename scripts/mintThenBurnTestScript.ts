import hre from "hardhat";
import { AstralBridgeFactory__factory } from "../typechain-types/factories/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory__factory";
import { AstralBridgeFactory } from "../typechain-types/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory";
import { AstralERC20Logic } from "../typechain-types/contracts/AstralABridge/AstralERC20Asset/AstralERC20.sol/AstralERC20Logic";
import { BridgeBase } from "../typechain-types";
import { ethers, Contract } from "ethers";
import { ethers as etherss } from "hardhat";
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
import {
  Ethereum,
  BinanceSmartChain,
  Goerli,
} from "@renproject/chains-ethereum";
import { ADMIN_KEY } from "../utils/config";
import { keccak256 } from "web3-utils";
import { ecsign, pubToAddress, ecrecover } from "ethereumjs-util";
import { Ox } from "../utils/testHelpers";
import { getEVMChain, getChain } from "../Api/utils/getProvider";
import { RenNetwork } from "@renproject/utils";
import { getEVMProvider } from "../Api/utils/getProvider";
import { returnContract } from "../Api/utils/getContract";
import AstralERC20AssetABI from "../constants/ABIs/AstralERC20AssetABI.json";
import BridgeAdapterABI from "../constants/ABIs/BridgeAdapterABI.json";
import BridgeFactoryABI from "../constants/ABIs/BridgeFactoryABI.json";
import TestNativeAssetRegistryABI from "../constants/ABIs/TestNativeAssetRegistryABI.json";
import TestNativeERC20AssetABI from "../constants/ABIs/TestNativeERC20AssetABI.json";
import RenJS from "@renproject/ren";
import { ERC20ABI } from "@renproject/chains-ethereum/contracts";

let astralUSDT: AstralERC20Logic;
let astralUSDTBridge: BridgeBase;
let astralUSDTBridgeBsc: BridgeBase;
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
  [OWNER, ALICE] = await etherss.getSigners();

  const BinanceSmartChainChain = getEVMChain(
    BinanceSmartChain,
    RenNetwork.Testnet,
    {
      privateKey: ADMIN_KEY,
    }
  );
  // const EthereumChain = new Ethereum({
  //   network: RenNetwork.Testnet,
  //   defaultTestnet: "goerli",
  //   // ...getEVMProvider(Ethereum, network, catalogAdminKey),
  //   ...getEVMProvider(Goerli, RenNetwork.Testnet, { privateKey: ADMIN_KEY }),
  // });

  const RenJSProvider = new RenJS(RenNetwork.Testnet).withChains(
    BinanceSmartChainChain
  );

  const ethereumProvider = new ethers.providers.JsonRpcProvider(
    "https://goerli.infura.io/v3/28b4ddb00ce5496394ed6259bf810b99"
  );
  const { provider: binanceProvider } = getChain(
    RenJSProvider,
    BinanceSmartChain.chain,
    RenNetwork.Testnet
  );

  const testNativeERC20Asset = (await new Contract(
    testNativeAssetDeployments[Ethereum.chain]["USDT"],
    ERC20ABI,
    ethereumProvider
  )) as TestNativeERC20Asset;

  astralUSDTBridge = (await new Contract(
    BridgeAssets[Ethereum.chain]["aUSDT"].bridgeAddress,
    BridgeAdapterABI,
    ethereumProvider
  )) as BridgeBase;

  astralUSDTBridgeBsc = (await new Contract(
    BridgeAssets[BinanceSmartChain.chain]["aUSDT"].bridgeAddress,
    BridgeAdapterABI,
    binanceProvider
  )) as BridgeBase;

  const registry = (await new Contract(
    registries[Ethereum.chain],
    TestNativeAssetRegistryABI,
    ethereumProvider
  )) as TestNativeAssetRegistry;

  console.log(await registry.getAllNaitveERC20Asset());
  console.log(testNativeERC20Asset.address);

  console.log(Number(await testNativeERC20Asset.balanceOf(ALICE.address)));

  const userNativeBalance = await testNativeERC20Asset.balanceOf(
    "0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149"
  );

  console.log(
    `user ${await testNativeERC20Asset.symbol()} balanve: ${userNativeBalance}`
  );

  const tx = await testNativeERC20Asset
    .connect(ALICE)
    .approve(astralUSDTBridge.address, "1000000000000000000");

  const r1 = await tx.wait(6);
  console.log(`approved asset for bridging.`);

  console.log(r1);

  const tx2 = await astralUSDTBridge
    .connect(ALICE)
    .lock(
      registries[Ethereum.chain],
      testNativeERC20Asset.address,
      "1000000000000000000"
    );

  const r2 = await tx2.wait(2);
  console.log(r2);
  console.log("asset locked");

  astralUSDTBridge.on(
    "AssetLocked",
    async (_from, _value, timestamp, _nonce) => {
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

      const tx2 = await astralUSDTBridgeBsc
        .connect(ALICE)
        .burn(testNativeERC20Asset.address, "100000000000000000");

      const r2 = await tx2.wait(1);

      console.log(r2);
    }
  );

  astralUSDTBridgeBsc.on(
    "AssetBurnt",
    async (_from, _value, timestamp, _nonce) => {
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

      const hash = await astralUSDTBridge.hashForSignature(
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

      const veririedSignature = await astralUSDTBridgeBsc.verifySignature(
        hash,
        sigString
      );

      console.log(`verified signature: ${veririedSignature}`);
      console.log(`sig string: ${sigString}`);
      console.log(`public key to address: ${publicKeyToAddress}`);
      console.log(`hash: ${hash}`);

      const mintTransaction = await astralUSDTBridge
        .connect(OWNER)
        .release(
          pHash,
          nHash,
          sigString,
          _value,
          testNativeERC20Asset.address,
          _from,
          _nonce,
          registry.address
        );
      const mintTxReceipt = await mintTransaction.wait(1);

      console.log(mintTxReceipt);
    }
  );

  //    const r2 = await tx2.wait(1);

  //    console.log(r2);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
