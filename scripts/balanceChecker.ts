
import { AstralERC20Logic } from "../typechain-types/contracts/AstralABridge/AstralERC20Asset/AstralERC20.sol/AstralERC20Logic";
import { ethers } from "hardhat";
import { TestNativeERC20Asset } from "../typechain-types/contracts/AstralABridge/TestNativeERC20Asset";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";;
import {
  BridgeAssets,
  testNativeAssetDeployments,
} from "../constants/deployments";
import { Ethereum, BinanceSmartChain } from '@renproject/chains-ethereum';

let astralUSDT: AstralERC20Logic;

async function main(address: string) {
  // const signer = new Wallet(account.privateKey, provider);
  const [OWNER, ALICE] = await ethers.getSigners();

  const testNativeERC20Asset = (await ethers.getContractAt(
    "TestNativeERC20Asset",
    testNativeAssetDeployments[Ethereum.chain]["USDT"]
  )) as TestNativeERC20Asset;

  console.log(testNativeERC20Asset.address)

  astralUSDT = (await ethers.getContractAt(
    "AstralERC20Logic",
    BridgeAssets[Ethereum.chain]["aUSDT"].tokenAddress
  )) as AstralERC20Logic;

  const userNativeBalance = await testNativeERC20Asset.balanceOf(ALICE.address)
  const userAstralBalance = await astralUSDT.balanceOf(ALICE.address)

  console.log(`user ${await testNativeERC20Asset.symbol()} balanve: ${userNativeBalance}`);
  console.log(`user ${await testNativeERC20Asset.symbol()} balanve: ${userAstralBalance}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main("0xD2E9ba02300EdfE3AfAe675f1c72446D5d4bD149").catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
