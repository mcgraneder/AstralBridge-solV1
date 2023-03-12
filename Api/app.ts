const Web3 = require("web3");
import {
  BinanceSmartChain,
  Ethereum,
  EthSigner,
  Goerli,
} from "@renproject/chains-ethereum";
import { RenJS } from "@renproject/ren";
import { RenNetwork } from "@renproject/utils";
import cors from "cors";
import { config } from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import hre, { ethers } from "hardhat";
import { ADMIN_KEY } from "../utils/config";
import { APIError } from "./utils/APIError";
import { getEVMProvider, getEVMChain, getChain } from "./utils/getProvider";
import { EthereumBaseChain } from "@renproject/chains-ethereum/base";
import { returnContract } from "./utils/getContract";
import {
  AstralBridgeFactory,
  IERC20,
  TestNativeAssetRegistry,
  TestNativeERC20Asset,
} from "../typechain-types";
import { ERC20ABI } from "@renproject/chains-ethereum/contracts";
import { BigNumber as BN, utils, Wallet, Signer } from "ethers";
import { AstralERC20Logic } from "../typechain-types/contracts/AstralABridge/AstralERC20Asset/AstralERC20.sol/AstralERC20Logic";
import AstralERC20AssetABI from "../constants/ABIs/AstralERC20AssetABI.json";
import BridgeAdapterABI from "../constants/ABIs/BridgeAdapterABI.json";
import BridgeFactoryABI from "../constants/ABIs/BridgeFactoryABI.json";
import TestNativeAssetRegistryABI from "../constants/ABIs/TestNativeAssetRegistryABI.json";
import TestNativeERC20AssetABI from "../constants/ABIs/TestNativeERC20AssetABI.json";
import {
  BridgeAssets,
  testNativeAssetDeployments,
  registries,
  BridgeFactory,
} from "../constants/deployments";
import { BridgeWorker } from "./bridge/bridgeWorker";
import { ecrecover, ecsign, pubToAddress } from "ethereumjs-util";
import { randomBytes, Ox } from "../utils/testHelpers";
import { BridgeBase } from "../typechain-types/contracts/AstralABridge/BridgeBaseAdapter.sol/BridgeBase";
import { keccak256 } from "web3-utils";

const isAddressValid = (address: string): boolean => {
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return true;
  return false;
};

config();

const app = express();
const port = 4000;

let EthereumChain: Ethereum;
let BinanceSmartChainChain: BinanceSmartChain;
let RenJSProvider: RenJS;

let astralUSDTBridgeEth: BridgeBase;
let astralUSDTBridgeBsc: BridgeBase;
// let astralUSDTBridgeEth: BridgeBase

app.use(express.json());
app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.status(200).send({ result: "ok" });
});

app.use((err: APIError, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  err.status = err.status || 500;
  if (!(err instanceof APIError)) {
    err = new APIError((err as any).message, null, (err as any).status);
  }
  res.status(err.status).send(err.toJson());
});

app.use((req, res, next) => {
  res.status(404).send("Nothing here :)");
});

async function setup() {
  const network = RenNetwork.Testnet;

  //set up chain providers
  BinanceSmartChainChain = getEVMChain(BinanceSmartChain, network, {
    privateKey: ADMIN_KEY,
  });
  EthereumChain = new Ethereum({
    network,
    defaultTestnet: "goerli",
    // ...getEVMProvider(Ethereum, network, catalogAdminKey),
    ...getEVMProvider(Goerli, network, { privateKey: ADMIN_KEY }),
  });

  RenJSProvider = new RenJS(RenNetwork.Testnet).withChains(
    BinanceSmartChainChain,
    EthereumChain
  );

  EthereumChain.signer
    ?.getAddress()
    .then((address: string) => {
      console.log(`Fetching ${address} balances...`);
    })
    .catch(() => {});
  [BinanceSmartChainChain, EthereumChain].forEach(
    async (chain: EthereumBaseChain) => {
      try {
        console.log(
          `${chain.chain} balance: ${ethers.utils.formatEther(
            await chain.signer!.getBalance()
          )} ${chain.network.config.nativeCurrency.symbol}`
        );
      } catch (error) {
        console.error(`Unable to fetch ${chain.chain} balance.`);
      }
    }
  );

  //set up chain contracts for now just using eth and bsc
  const { provider, signer } = getChain(
    RenJSProvider,
    Ethereum.chain,
    RenNetwork.Testnet
  );

  const { provider: pBsc, signer: sBsc } = getChain(
    RenJSProvider,
    BinanceSmartChain.chain,
    RenNetwork.Testnet
  );

  console.log(provider);

  astralUSDTBridgeEth = (await returnContract(
    BridgeAssets[Ethereum.chain]["aUSDT"].bridgeAddress,
    BridgeAdapterABI,
    provider
  )) as BridgeBase;

  astralUSDTBridgeBsc = (await returnContract(
    BridgeAssets[BinanceSmartChain.chain]["aUSDT"].bridgeAddress,
    BridgeAdapterABI,
    pBsc
  )) as BridgeBase;

  //    await BridgeWorker(
  //     RenJSProvider,
  //     nativeUSDTContract,
  //     nativeAssetRegistry,
  //     bridgeFactoryEth,
  //     astralUSDTEth,
  //     astralUSDTBridgeEth
  //   );
}

setup().then(() => {
  const filter = {
    address: "0x1127fd0543D8e748F914D814084552516661a1EB",
    topics: [
      // the name of the event, parnetheses containing the data type of each event, no spaces
      utils.id("AssetLocked(address,uint256,uint256)"),
    ],
  };

  console.log(astralUSDTBridgeEth.address);
  const { provider, signer } = getChain(
    RenJSProvider,
    BinanceSmartChain.chain,
    RenNetwork.Testnet
  );

  astralUSDTBridgeEth.on(
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

      const veririedSignature = await astralUSDTBridgeEth.verifySignature(
        hash,
        sigString
      );

      console.log(`verified signature: ${veririedSignature}`);
      console.log(`sig string: ${sigString}`);
      console.log(`public key to address: ${publicKeyToAddress}`);
      console.log(`hash: ${hash}`);

      const mintTransaction = await astralUSDTBridgeBsc
        .connect(signer)
        .mint(pHash, nHash, sigString, _value, _nonce, _from);
      const mintTxReceipt = await mintTransaction.wait(1);

      console.log(mintTxReceipt);
    }
  );
});
