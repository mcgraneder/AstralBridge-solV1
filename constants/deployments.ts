import { BinanceSmartChain, Ethereum } from "@renproject/chains-ethereum";

export type BridgeAsset = {
  tokenAddress: string;
  bridgeAddress: string;
};

export enum Chains  {
  Ethereum = "Ethereum",
  BinanceSmartChain = "BinanceSmartChain"
}

export const testNativeAssetDeployments: {
  [chain in Chains]: { [asset: string]: string };
} = {
  [Ethereum.chain]: {
    ["USDT"]: "0x5e10C7e0B2d0cCCe0De1DF789516ad248E71cb0c",
  },
  [BinanceSmartChain.chain]: {
    ["USDT"]: "0x523Fb6B0d3E5f655100c08DAeB507A253Fae71ab",
  },
};

export const registries: { [chain: string]: string } = {
  [Ethereum.chain]: "0x86F02fCf2B45e7B788e478A58C4F1CdBEE54B644",
  [BinanceSmartChain.chain]: "0x0935D9e9a294D5D3219f94009EcB374e6716f6bB",
};

export const BridgeFactory: { [chain: string]: string } = {
  [Ethereum.chain]: "0x83Ee128bAeF586E8004363e51D94bee09Ea5d7f7",
  [BinanceSmartChain.chain]: "0x76914f539851001b33189473A9EB57cCbE2853C7",
};

export const BridgeAssets: {
  [chain in Chains]: { [asset: string]: BridgeAsset };
} = {
  [Ethereum.chain]: {
    ["aUSDT"]: {
      tokenAddress: "0xa83D9F59AE193641F8C53df7A43222c2A30d8A6f",
      bridgeAddress: "0x46793585718ad4D54B724f0453fAE697c4915e5e",
    },
  },
  [BinanceSmartChain.chain]: {
    ["aUSDT"]: {
      tokenAddress: "0x00222fc4611C4961c17D831c16dB81f37E46905c",
      bridgeAddress: "0x94b9eC5270694dcAA19B0468865eF4Ed99d315bD",
    },
  },
};
