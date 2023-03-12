import { BinanceSmartChain, Ethereum } from "@renproject/chains-ethereum";

export type BridgeAsset = {
  tokenAddress: string;
  bridgeAddress: string;
};

export const testNativeAssetDeployments: {
  [chain: string]: { [asset: string]: string };
} = {
  [Ethereum.chain]: {
    ["USDT"]: "0x8E3bb0d99928E293348182d586c598aB73c0E0dc",
  },
  [BinanceSmartChain.chain]: {
    ["USDT"]: "0xc17f91e9Dd972f70568E273B639C91654dEF9da3",
  },
};

export const registries: { [chain: string]: { [asset: string]: string } } = {
  [Ethereum.chain]: {
    ["TesNativeAssetRegistry"]: "0xacD416e4bE6820dB2A9e6c36b122E1767e2Aeacb",
  },
  [BinanceSmartChain.chain]: {
    ["TesNativeAssetRegistry"]: "0x877841aEa7C68f4F9f96012bc69ad8F49965ffE9",
  },
};

export const BridgeFactory: { [chain: string]: string } = {
  [Ethereum.chain]: "0x276Ecb061eB2A10F4C732Dde8d08bB13D6F40e06",
  [BinanceSmartChain.chain]: "0x8244D00c597Efb4b588AC2d6CAc54B2eeD0Ec350",
};

export const BridgeAssets: {
  [chain: string]: { [asset: string]: BridgeAsset };
} = {
  [Ethereum.chain]: {
    ["aUSDT"]: {
      tokenAddress: "0x93D1Ad49DaD1d24956ffd6C91c0218903E4Fc823",
      bridgeAddress: "0x1127fd0543D8e748F914D814084552516661a1EB",
    },
  },
  [BinanceSmartChain.chain]: {
    ["aUSDT"]: {
      tokenAddress: "0x2b0D6fE138edEb15c997bFf6e9FdD22Cb0C0C92c",
      bridgeAddress: "0x10BEB3CAe2c85779Ca6971248903181d3a48A578",
    },
  },
};
