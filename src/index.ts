import algosdk from "algosdk";
import * as algokit from "@algorandfoundation/algokit-utils";

// The app ID to interact with.
const appId = 736014374;

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
