import { ethers } from "hardhat";
import { TestNativeAssetRegistry__factory } from "../typechain-types/factories/contracts/utils/tesNativeAssetRegistry.sol/TestNativeAssetRegistry__factory";
import { TestNativeAssetRegistry } from "../typechain-types/contracts/utils/tesNativeAssetRegistry.sol/TestNativeAssetRegistry";
import { AstralBridgeFactory } from '../typechain-types/contracts/AstralABridge/AstralBridgeFACTORY.sol/AstralBridgeFactory';
import { AstralERC20Logic } from '../typechain-types/contracts/AstralABridge/AstralERC20Asset/AstralERC20.sol/AstralERC20Logic';

async function main() {
  let [deployer] = await ethers.getSigners();

   const asset = (await ethers.getContractAt(
     "AstralERC20Logic",
     "0x92Df248D935CbFdE8178A7d91993354F2E562e58"
   )) as AstralERC20Logic;

     const factory = (await ethers.getContractAt(
       "AstralBridgeFactory",
       "0x55c3508e5Ef4ec2E5C3845739269D943DA6012D1"
     )) as AstralBridgeFactory;

//    const astralUSDTAddress = await factory.getAssetBySymbol("testAstralUSDT");
//    const astralUSDTBridgeAddress = await factory.getBridgeBySymbol("aUSDT");


  console.log(
    await factory.getNumAssets()
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
