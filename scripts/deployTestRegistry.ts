import { ethers } from "hardhat";
import { TestNativeAssetRegistry__factory } from "../typechain-types/factories/contracts/utils/tesNativeAssetRegistry.sol/TestNativeAssetRegistry__factory";
import { TestNativeAssetRegistry } from "../typechain-types/contracts/utils/tesNativeAssetRegistry.sol/TestNativeAssetRegistry";

async function main() {
  let [deployer] = await ethers.getSigners();

  const Registry = (await ethers.getContractFactory(
    "TestNativeAssetRegistry"
  )) as TestNativeAssetRegistry__factory;

  const registry = (await Registry.connect(deployer).deploy([
    "0xA7628D506119EA9DF54CC39017C400A370311Ad1",
  ])) as TestNativeAssetRegistry;

  await registry.deployed();

  console.log(`deployed  test registry to address ${registry.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
