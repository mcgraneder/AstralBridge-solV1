import { keccak256 } from 'web3-utils';
import { randomBytes } from '../utils/testHelpers';
import { ethers } from 'ethers';

import AbiCoder from "web3-eth-abi";

export const encodeCallData = (
  functioName: any,
  parameterTypes: any,
  parameters: any
) => {
  const coder = AbiCoder as unknown as AbiCoder.AbiCoder;
  return (
    coder.encodeFunctionSignature(
      `${functioName}(${parameterTypes.join(",")})`
    ) + coder.encodeParameters(parameterTypes, parameters).slice(2)
  );
};

const x = ethers.utils.defaultAbiCoder.encode([ "uint", "string" ], [ 1234, "Hello World" ]);
const nHash = randomBytes(32)
const pHash = x;

const encoded = encodeCallData(
  "initialize",
  ["uint256", "address", "uint256", "string", "string", "string", "uint8"],
  [
    5,
    "0x081B3edA60f50631E5e966ED75bf6598cF69ee3C",
    "1000000000000000000",
    "1",
    "aUSDT",
    "aUSDT",
    8,
  ]
);

console.log(encoded)
