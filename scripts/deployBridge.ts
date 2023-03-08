import { ethers } from "hardhat";
import { AstralBridgeFactory__factory } from '../typechain-types/factories/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory__factory';
import { AstralBridgeFactory } from '../typechain-types/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory';

async function main() {
  let [deployer] = await ethers.getSigners();
  const BridgeFFACTORY = (await ethers.getContractFactory(
    "AstralBridgeFactory"
  )) as AstralBridgeFactory__factory;
  const bridgeFFACTORY = (await BridgeFFACTORY.connect(
    deployer
  ).deploy()) as AstralBridgeFactory;
  await bridgeFFACTORY.deployed();

  console.log(`bridge deployed to ${bridgeFFACTORY.address}`);

  await bridgeFFACTORY.deployAssetAndBridge(
        "testAstralUSDT", 
        "astralUSDT", 
        "aUSDT",
         6
    )

    const astralBridge = await bridgeFFACTORY.getAllAstralAndBridgesAssets()

    console.log(astralBridge)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
