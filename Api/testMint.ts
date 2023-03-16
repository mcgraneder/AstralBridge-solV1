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
import { BigNumber as BN, utils, Wallet, Signer, Contract } from "ethers";
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
const web3 = new Web3();

let EthereumChain: Ethereum;
let BinanceSmartChainChain: BinanceSmartChain;
let RenJSProvider: RenJS;

let astralUSDTBridgeEth: BridgeBase;
let astralUSDTBridgeBsc: BridgeBase;
let testNativeERC20Asset: TestNativeERC20Asset;
let registry: TestNativeAssetRegistry;
let registryEth: TestNativeAssetRegistry;

let astralUSDTEth: AstralERC20Logic;
let astralUSDTBsc: AstralERC20Logic;

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
  astralUSDTBridgeEth = (await returnContract(
    BridgeAssets[Ethereum.chain]["aUSDT"].bridgeAddress,
    BridgeAdapterABI,
    signer
  )) as BridgeBase;

  astralUSDTBridgeBsc = (await returnContract(
    BridgeAssets[BinanceSmartChain.chain]["aUSDT"].bridgeAddress,
    BridgeAdapterABI,
    pBsc
  )) as BridgeBase;

  // testNativeERC20Asset = (await ethers.getContractAt(
  //    "TestNativeERC20Asset",
  //    testNativeAssetDeployments[Ethereum.chain]["USDT"]
  //  )) as TestNativeERC20Asset;

  testNativeERC20Asset = (await new Contract(
    testNativeAssetDeployments[Ethereum.chain]["USDT"],
    ERC20ABI,
    provider
  )) as TestNativeERC20Asset;

  registry = (await ethers.getContractAt(
    "TestNativeAssetRegistry",
    registries[BinanceSmartChain.chain]
  )) as TestNativeAssetRegistry;

  registryEth = (await ethers.getContractAt(
    "TestNativeAssetRegistry",
    registries[Ethereum.chain]
  )) as TestNativeAssetRegistry;

  astralUSDTEth = (await returnContract(
    BridgeAssets[Ethereum.chain]["aUSDT"].tokenAddress,
    AstralERC20AssetABI,
    provider
  )) as AstralERC20Logic;

  astralUSDTBsc = (await returnContract(
    BridgeAssets[BinanceSmartChain.chain]["aUSDT"].tokenAddress,
    AstralERC20AssetABI,
    pBsc
  )) as AstralERC20Logic;

  //    await BridgeWorker(
  //     RenJSProvider,
  //     nativeUSDTContract,
  //     nativeAssetRegistry,
  //     bridgeFactoryEth,
  //     astralUSDTEth,
  //     astralUSDTBridgeEth
  //   );
}

setup().then(async () => {
  // console.log(await registry.getAllNaitveERC20Asset());
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
  const [OWNER, ALICE] = await ethers.getSigners();
  const USDTBalBeforeMint = await testNativeERC20Asset.balanceOf(
    "0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149"
  );
  const aUSDTBalBeforeMint = await astralUSDTBsc.balanceOf(
    "0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149"
  );

  console.log(
    "starting bridge to mint and burn asset aUSDT on Binance from Etereum"
  );
  console.log(
    `The users balance of USDT on Ethereum before Minting is ${ethers.utils.formatUnits(
      USDTBalBeforeMint,
      "6"
    )}`
  );
  console.log(
    `The users balance of aUSDT on Binance before Minting on Binance is ${ethers.utils.formatUnits(
      aUSDTBalBeforeMint,
      "6"
    )}\n`
  );

  const ownerEthWal = new Wallet(process.env.PK1!, pBsc);
  const ownerBscWal = new Wallet(process.env.PK1!, provider);

  const aliceWalletEth = new Wallet(process.env.PK2!, provider);
  const aliceWalletBsc = new Wallet(process.env.PK2!, pBsc);

  const tx = await testNativeERC20Asset
    .connect(aliceWalletEth)
    .approve(astralUSDTBridgeEth.address, ethers.utils.parseUnits("1", "6"));
  const r1 = await tx.wait(1);
  console.log(`approved asset for bridging.`);
  console.log(r1.transactionHash);

  await astralUSDTBridgeEth
    .connect(aliceWalletEth)
    .lock(
      registries[Ethereum.chain],
      testNativeERC20Asset.address,
      ethers.utils.parseUnits("1", "6")
    )
    .then(async (lockTx) => {
      console.log("USDT asset has been sucessfully locked on ethereum\n");

      const _from = "0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149";
      const _value = ethers.utils.parseUnits("1", "6");
      const timestamp = "134252";
      const _nonce = "6064512213";

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
        .connect(ownerEthWal)
        .mint(pHash, nHash, sigString, _value, _nonce, _from);
      const mintTxReceipt = await mintTransaction.wait(1);
      console.log(mintTransaction);

      const USDTBalAfterMint = await testNativeERC20Asset.balanceOf(
        "0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149"
      );
      const aUSDTBalAfterMint = await astralUSDTBsc.balanceOf(
        "0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149"
      );

      console.log(
        `\nThe users balance of USDT on Ethereum after Minting is ${ethers.utils.formatUnits(
          USDTBalAfterMint,
          "6"
        )}`
      );
      console.log(
        `The users balance of aUSDT on Binance after Minting on Binance is ${ethers.utils.formatUnits(
          aUSDTBalAfterMint,
          "6"
        )}\n`
      );

      // console.log(`verified signature: ${veririedSignature}`);
      // console.log(`sig string: ${sigString}`);
      // console.log(`public key to address: ${publicKeyToAddress}`);
      // console.log(`hash: ${hash}`);

      await astralUSDTBridgeBsc
        .connect(aliceWalletBsc)
        .burn(testNativeERC20Asset.address, ethers.utils.parseUnits("0.5", "6"))
        .then(async (burnTx) => {
          const _from = "0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149";
          const _value = ethers.utils.parseUnits("0.5", "6");
          const timestamp = "134252";
          const _nonce = "735311";
          console.log(burnTx);

          console.log(`\n asset has been sucessfully burned`);

          const USDTBalBeforeBurn = await testNativeERC20Asset.balanceOf(
            "0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149"
          );
          const aUSDTBalBeforeBurn = await astralUSDTBsc.balanceOf(
            "0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149"
          );

          console.log(
            `The users balance of USDT on Ethereum before Burning is ${ethers.utils.formatUnits(
              USDTBalBeforeBurn,
              "6"
            )}`
          );
          console.log(
            `The users balance of aUSDT on Binance before Minting on Burning is ${ethers.utils.formatUnits(
              aUSDTBalBeforeBurn,
              "6"
            )}\n`
          );
          console.log(_from, _value, timestamp);
          console.log(
            "releasing asset on the source chain to send back to the user\n"
          );
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
          const hash = await astralUSDTBridgeEth.hashForSignature(
            pHash,
            _value,
            _from,
            nHash
          );
          const sig = ecsign(
            Buffer.from(hash.slice(2), "hex"),
            ADMIN_PRIVATE_KEY
          );
          const publicKeyToAddress = pubToAddress(
            ecrecover(Buffer.from(hash.slice(2), "hex"), sig.v, sig.r, sig.s)
          ).toString("hex");
          const sigString = Ox(
            `${sig.r.toString("hex")}${sig.s.toString("hex")}${sig.v.toString(
              16
            )}`
          );
          const veririedSignature = await astralUSDTBridgeBsc.verifySignature(
            hash,
            sigString
          );
          //   console.log(`verified signature: ${veririedSignature}`);
          //   console.log(`sig string: ${sigString}`);
          //   console.log(`public key to address: ${publicKeyToAddress}`);
          //   console.log(`hash: ${hash}`);
          const mintTransaction = await astralUSDTBridgeEth
            .connect(ownerBscWal)
            .release(
              pHash,
              nHash,
              sigString,
              _value,
              testNativeERC20Asset.address,
              _from,
              _nonce,
              registryEth.address
            );
          const mintTxReceipt = await mintTransaction.wait(1);

          console.log(`\n${mintTxReceipt}`);
          console.log(`\n${mintTransaction}`);

          const USDTBalAfterBurn = await testNativeERC20Asset.balanceOf(
            "0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149"
          );
          const aUSDTBalAfterBurn = await astralUSDTBsc.balanceOf(
            "0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149"
          );

          console.log(
            `The users balance of USDT on Ethereum After Burning is ${ethers.utils.formatUnits(
              USDTBalAfterBurn,
              "6"
            )}`
          );
          console.log(
            `The users balance of aUSDT on Binance After Burning on Binance is ${ethers.utils.formatUnits(
              aUSDTBalAfterBurn,
              "6"
            )}\n`
          );

          console.log("asset sucessfully released");
        });
    });
});

