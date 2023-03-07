import { ethers } from "hardhat";
import { AstralERC20Logic__factory } from '../typechain-types/factories/contracts/AstralABridge/AstralERC20Asset/AstralERC20.sol/AstralERC20Logic__factory';
import { AstralERC20Logic } from '../typechain-types/contracts/AstralABridge/AstralERC20Asset/AstralERC20.sol/AstralERC20Logic';

async function main() {
  let [deployer] = await ethers.getSigners();
  const AstralERC20 = await ethers.getContractFactory("AstralERC20Logic") as AstralERC20Logic__factory;
  const astralERC20 = await AstralERC20.connect(deployer).deploy("ASTRAL_TEST", "TEST", 8) as AstralERC20Logic;
  await astralERC20.deployed();

  console.log(`deployed ${await astralERC20.name()} to address ${astralERC20.address} with decimals ${await astralERC20.decimals()}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
