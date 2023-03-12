// worker1 will submit firebase[swapId].txs.0.tx

// after submitting the txworker 1 just submits transaction like the existing catalog relayer, and then
// stores the transaction hash into firebase[swapId].txs.1.inputTx

import RenJS from "@renproject/ren";
import { RenNetwork } from "@renproject/utils";
// import chalk from "chalk";
import { TestNativeAssetRegistry } from "../../typechain-types/contracts/AstralABridge/tesNativeAssetRegistry.sol/TestNativeAssetRegistry";
import { AstralERC20Logic } from "../../typechain-types/contracts/AstralABridge/AstralERC20Asset/AstralERC20.sol/AstralERC20Logic";
import { BridgeBase } from "../../typechain-types/contracts/AstralABridge/BridgeBaseAdapter.sol/BridgeBase";
import { TestNativeERC20Asset } from "../../typechain-types/contracts/AstralABridge/TestNativeERC20Asset";
import { AstralBridgeFactory } from "../../typechain-types/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory";

const loop = async (
  nativeAsset: TestNativeERC20Asset,
  registry: TestNativeAssetRegistry,
  bridgeFactory: AstralBridgeFactory,
  bridgeAsset: AstralERC20Logic,
  assetBridge: BridgeBase
) => {
    // console.log("hey")
    
  nativeAsset.on("Transfer", (_from, _to, _value) => {
    console.log(_from, _to, _value);
  });

  return
};

async function main(
  renJS: RenJS,
  nativeAsset: TestNativeERC20Asset,
  registry: TestNativeAssetRegistry,
  bridgeFactory: AstralBridgeFactory,
  bridgeAsset: AstralERC20Logic,
  assetBridge: BridgeBase,
  network: RenNetwork
) {
  console.log(`${("[bl/worker1]")} listening...`);

  while (1) {
    try {
      await loop(
        nativeAsset,
        registry,
        bridgeFactory,
        bridgeAsset,
        assetBridge
      );
    } catch (error) {
      console.error(error);
    }
  }
}

export const BridgeWorker = async(
  renJS: RenJS,
  nativeAsset: TestNativeERC20Asset,
  registry: TestNativeAssetRegistry,
  bridgeFactory: AstralBridgeFactory,
  bridgeAsset: AstralERC20Logic,
  assetBridge: BridgeBase
) =>
  main(
    renJS,
    nativeAsset,
    registry,
    bridgeFactory,
    bridgeAsset,
    assetBridge,
    RenNetwork.Testnet
  )
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
