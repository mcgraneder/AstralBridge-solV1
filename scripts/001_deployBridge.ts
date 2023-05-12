const hre = require("hardhat");
import { AstralBridgeFactory } from "../typechain-types/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory";
import { AstralERC20Logic } from "../typechain-types/contracts/AstralABridge/AstralERC20Asset/AstralERC20.sol/AstralERC20Logic";
import {
  AstralAssetProxyBeacon,
  BridgeBase,
  BridgeBaseAdapterProxyBeacon,
  TestNativeAssetRegistry__factory,
  TestNativeERC20Asset,
  TestNativeERC20Asset__factory,
} from "../typechain-types";
import { HardhatRuntimeEnvironment, NetworkConfig } from "hardhat/types";
import { TestNativeAssetRegistry } from "../typechain-types/contracts/utils/tesNativeAssetRegistry.sol";

let astralUSDT: AstralERC20Logic;
let astralUSDTBridge: BridgeBase;

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

const Create2 = async (name: string, args: Array<any>) => {
  const { deployments, getNamedAccounts, ethers, network } =
    hre as HardhatRuntimeEnvironment;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const result = await deploy(name, {
    from: deployer,
    args: args,
    log: true,
  });

  console.log(result.address);
  const contract = await ethers.getContractAt(name, result.address, deployer);
  return contract;
};

async function main(config?: NetworkConfig) {
  const { deployments, getNamedAccounts, ethers, network, upgrades } =
    hre as HardhatRuntimeEnvironment;

  const { deployer } = await getNamedAccounts();

  // Deploy AstralAssetProxyBeacon ////////////////////////////////////////////////
  const astralAssetImplementation = (await Create2(
    "AstralERC20Logic",
    []
  )) as AstralERC20Logic;
  const astralAssetProxyBeacon = (await Create2("AstralAssetProxyBeacon", [
    astralAssetImplementation.address,
  ])) as AstralAssetProxyBeacon;

  // Deploy BridgeBaseAdapterProxyBeacon ////////////////////////////////////////////////
  const bridgeBaseImplementation = (await Create2(
    "BridgeBase",
    []
  )) as BridgeBase;
  const bridgeBaseProxyBeacon = (await Create2("BridgeBaseAdapterProxyBeacon", [
    bridgeBaseImplementation.address,
  ])) as BridgeBaseAdapterProxyBeacon;

  //deploy registry and test native asset /////////////////////////////////////////
  const TestNativeERC20Asset = (await ethers.getContractFactory(
    "TestNativeERC20Asset"
  )) as TestNativeERC20Asset__factory;

  const amountToMint = ethers.utils.parseUnits("1000", "6");

  const testNativeERC20Asset = (await TestNativeERC20Asset.deploy(
    "Tether",
    "USDT",
    6,
    amountToMint
  )) as TestNativeERC20Asset;

  await testNativeERC20Asset.deployed();

  console.log(
    `deployed ${await testNativeERC20Asset.name()} to address ${
      testNativeERC20Asset.address
    } with decimals ${await testNativeERC20Asset.decimals()}`
  );
  const deployerBalance = await testNativeERC20Asset.balanceOf(deployer);

  console.log(
    `deployer balance: ${deployerBalance} ${await testNativeERC20Asset.symbol()}`
  );

  const Registry = (await ethers.getContractFactory(
    "TestNativeAssetRegistry"
  )) as TestNativeAssetRegistry__factory;

  const registry = (await Registry.deploy([
    testNativeERC20Asset.address,
  ])) as TestNativeAssetRegistry;

  await registry.deployed();

  // Deploy GatewayRegistry ////////////////////////////////////////////////////
  const astralBridgeFactory_Factory = await ethers.getContractFactory(
    "AstralBridgeFactory"
  );
  const astralBridgeFactory = (await upgrades.deployProxy(
    astralBridgeFactory_Factory,
    [astralAssetProxyBeacon.address, bridgeBaseProxyBeacon.address, deployer], // should be changed if there's a new version
    {
      initializer: "initialize",
    }
  )) as AstralBridgeFactory;
  await astralBridgeFactory.deployed();

  console.log(await astralBridgeFactory.getNumAssets());

  const tx = await astralBridgeFactory.deployAssetAndBridge(
    "astralUSDT",
    "AstralUSDT",
    "aUSDT",
    testNativeERC20Asset.address, //USSDT
    6,
    { gasLimit: 7000000 }
  );

  await tx.wait(1);

  const astralUSDTAddress = await astralBridgeFactory.getAssetBySymbol("aUSDT");
  const astralUSDTBridgeAddress = await astralBridgeFactory.getBridgeBySymbol(
    "aUSDT"
  );

  astralUSDT = (await ethers.getContractAt(
    "AstralERC20Logic",
    astralUSDTAddress
  )) as AstralERC20Logic;

  astralUSDTBridge = (await ethers.getContractAt(
    "BridgeBase",
    astralUSDTBridgeAddress
  )) as BridgeBase;

  console.log(
    `Sucessfully deployed token  to address ${astralUSDT.address}, with bridge at address ${astralUSDTBridge.address}`
  );
  console.log(
    `owner balance of  is ${Number(await astralUSDT.balanceOf(deployer))}`
  );

  console.log(await registry.getAllNaitveERC20Asset());
  console.log(testNativeERC20Asset.address);

  console.log(Number(await testNativeERC20Asset.balanceOf(deployer)));

  const txn = await testNativeERC20Asset.approve(
    astralUSDTBridge.address,
    ethers.utils.parseUnits("1", "6")
  );

  const r1 = await tx.wait(1);

  console.log(await testNativeERC20Asset.allowance(deployer, astralUSDTBridge.address))

  const tx2 = await astralUSDTBridge
    .lock(
      registry.address,
      testNativeERC20Asset.address,
      ethers.utils.parseUnits("1", "6")
    );

  const r2 = await tx2.wait(1);

  console.log(r2);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
