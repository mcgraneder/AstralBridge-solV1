import { ethers } from "hardhat";
import { TestNativeAssetRegistry } from "../typechain-types/contracts/utils/tesNativeAssetRegistry.sol/TestNativeAssetRegistry";
import { registries } from '../constants/deployments';
import { Ethereum } from '@renproject/chains-ethereum';

async function main() {
  const registry = (await ethers.getContractAt(
    "TestNativeAssetRegistry",
    registries[Ethereum.chain]
  )) as TestNativeAssetRegistry;

  const assets = await registry.getAllNaitveERC20Asset();
  console.log(assets)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
