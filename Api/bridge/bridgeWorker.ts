// worker1 will submit firebase[swapId].txs.0.tx

// after submitting the txworker 1 just submits transaction like the existing catalog relayer, and then
// stores the transaction hash into firebase[swapId].txs.1.inputTx

import RenJS, { GatewayTransaction } from "@renproject/ren";
import { RenNetwork, utils } from "@renproject/utils";
import chalk from "chalk";
import { providers, Wallet } from "ethers";

import Firebase from "../../db/firebase-admin";
import { Postgres } from "../../services/postgres";
import { BLStatus, Hop } from "../../util/bl/blTypes";
import { getChain } from "../../util/bl/getProvider";
import {
  buildRenVMGatewayTransaction,
  detectRenEventsInTransaction,
} from "../../util/detectRenEvents";
import { didTransactionFail } from "./buildGatewayFromRenVMTx";

const loop = async (
) => {
  
  
};

async function main(renJS: RenJS, network: RenNetwork) {
  console.log(`${chalk.blue("[bl/worker1]")} listening...`);

  while (1) {
    try {
      await loop();
    } catch (error) {
      console.error(error);
    }
  }
}

export const BLWorker1 = (renJS: RenJS, network: RenNetwork) =>
  main(renJS, network)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
