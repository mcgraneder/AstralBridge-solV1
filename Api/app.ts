const Web3 = require("web3");
import {
  BinanceSmartChain,
  Ethereum,
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
  BridgeBase,
  IERC20,
  TestNativeAssetRegistry,
  TestNativeERC20Asset,
} from "../typechain-types";
import { ERC20ABI } from "@renproject/chains-ethereum/contracts";
import { BigNumber as BN } from "ethers";
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

let astralUSDT: AstralERC20Logic;
let astralUSDTBridge: BridgeBase;
let bridgeFACTORY: AstralBridgeFactory;
let nativeAssetRegistry: TestNativeAssetRegistry;
let testNativeERC20Asset: TestNativeERC20Asset;

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
  const { provider } = getChain(
    RenJSProvider,
    Ethereum.chain,
    RenNetwork.Testnet
  );

  const nativeUSDTContract = (await returnContract(
    testNativeAssetDeployments[Ethereum.chain]["USDT"],
    TestNativeERC20AssetABI,
    provider
  )) as TestNativeERC20Asset;

  const nativeAssetRegistry = (await returnContract(
    registries[Ethereum.chain],
    TestNativeAssetRegistryABI,
    provider
  )) as TestNativeAssetRegistry;

  const bridgeFactory = (await returnContract(
    BridgeFactory[Ethereum.chain],
    BridgeFactoryABI,
    provider
  )) as AstralBridgeFactory;

  const astralUSDT = (await returnContract(
    BridgeAssets[Ethereum.chain]["aUSDT"].tokenAddress,
    AstralERC20AssetABI,
    provider
  )) as AstralERC20Logic;

  const astralUSDTBridge = (await returnContract(
    BridgeAssets[Ethereum.chain]["aUSDT"].bridgeAddress,
    AstralERC20AssetABI,
    provider
  )) as BridgeBase;

  BridgeWorker(
    RenJSProvider,
    nativeUSDTContract,
    nativeAssetRegistry,
    bridgeFactory,
    astralUSDT,
    astralUSDTBridge
  );
}

setup().then(() =>
  app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`);
  })
);
