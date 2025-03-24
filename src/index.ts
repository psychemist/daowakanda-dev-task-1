import algosdk, {
  makeAssetTransferTxnWithSuggestedParamsFromObject,
} from "algosdk";
import * as algokit from "@algorandfoundation/algokit-utils";

import { AppClient } from "@algorandfoundation/algokit-utils/types/app-client";
import { SMART_CONTRACT_ARC_32 } from "./client";
import { MNEMONIC } from "./constant";

// The app ID to interact with.
const appId = 736014374;

// Account address
// ZK2RDMKVGSFAQ3NI2QLE3SKLGDWZXC5JBSHUEZTOL62RZ5LASO7OBXHXBE

async function loadClient() {
  const client = algokit.AlgorandClient.fromConfig({
    algodConfig: {
      server: "https://testnet-api.algonode.cloud",
    },
    indexerConfig: {
      server: "https://testnet-idx.algonode.cloud",
    },
  });

  return client;
}

const main = async () => {
  const client = await loadClient();

  console.log("Loading account...");
  const account = algosdk.mnemonicToSecretKey(MNEMONIC);
  console.log("Account loaded: " + account.addr);

  const appClient = new AppClient({
    appId: BigInt(appId),
    appSpec: JSON.stringify(SMART_CONTRACT_ARC_32),
    algorand: client,
  });

  const suggestedParams = await client.client.algod.getTransactionParams().do();
  const signer = algosdk.makeBasicAccountTransactionSigner(account);
  const atomTransactionComposer = new algosdk.AtomicTransactionComposer();
  const globalState = await appClient.getGlobalState();
  const assetId = globalState.asset.value;

  const accountInfo = await client.client.algod
    .accountInformation(account.addr)
    .do();

  const isClaimed = accountInfo.assets.some(
    (a: any) =>
      Number(a["asset-id"]) === Number(assetId) && a["is-frozen"] === true
  );

  if (isClaimed) {
    console.log(
      `asset with id ${assetId} has already been claimed by addr ${account.addr}`
    );
    return;
  }

  console.log("Opting asset....");
  const optInTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
    amount: 0,
    from: account.addr,
    to: account.addr,
    suggestedParams,
    assetIndex: Number(assetId),
  });

  atomTransactionComposer.addTransaction({
    txn: optInTxn,
    signer,
  });

  console.log("Claiming asset...");
  atomTransactionComposer.addMethodCall({
    method: appClient.getABIMethod("claimAsset")!,
    suggestedParams: {
      ...suggestedParams,
      fee: 6_000,
    },
    sender: account.addr,
    signer,
    appID: appId,
    appForeignAssets: [Number(assetId)],
  });

  const response = await atomTransactionComposer.execute(
    client.client.algod,
    8
  );
  console.log(response);
  console.log("Asset claimed");
};

main().catch(console.error);
