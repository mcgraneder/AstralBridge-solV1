import { ethers } from "hardhat";
import { TestNativeERC20Asset__factory } from "../typechain-types/factories/contracts/AstralABridge/TestNativeERC20Asset__factory";
import { TestNativeERC20Asset } from "../typechain-types/contracts/AstralABridge/TestNativeERC20Asset";

type TestAsset = { name: string; symbol: string; decimals: number };

const TestNativeAssets: Array<TestAsset> = [
  {
    name: "Tether",
    symbol: "USDT",
    decimals: 6,
  },
  {
    name: "DAI",
    symbol: "DAI",
    decimals: 18,
  },
];

async function main() {
  let [deployer] = await ethers.getSigners();

  const TestNativeERC20Asset = (await ethers.getContractFactory(
    "TestNativeERC20Asset"
  )) as TestNativeERC20Asset__factory;

  TestNativeAssets.forEach(async (testAsset: TestAsset) => {
    const amountToMint = ethers.utils.parseUnits("1000", testAsset.decimals)

    const testNativeERC20Asset = (await TestNativeERC20Asset.connect(
      deployer
    ).deploy(
      testAsset.symbol,
      testAsset.name,
      testAsset.decimals,
      amountToMint
    )) as TestNativeERC20Asset;

    await testNativeERC20Asset.deployTransaction.wait(6);

    console.log(
      `deployed ${await testNativeERC20Asset.name()} to address ${
        testNativeERC20Asset.address
      } with decimals ${await testNativeERC20Asset.decimals()}`
    );
     const deployerBalance = await testNativeERC20Asset.balanceOf(deployer.address);

     console.log(`deployer balance: ${deployerBalance} ${testNativeERC20Asset.symbol()}`)
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
