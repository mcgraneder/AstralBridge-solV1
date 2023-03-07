import { ethers } from "hardhat";
import { TestNativeAssetRegistry } from "../typechain-types/contracts/utils/tesNativeAssetRegistry.sol/TestNativeAssetRegistry";

async function main() {
  const registry = (await ethers.getContractAt(
    "TestNativeAssetRegistry",
    "0x8402C2f910Df1C14E30A54469C2140FF1e20ec5d"
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
