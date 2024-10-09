import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

 import { Bundle } from "jito-ts/dist/sdk/block-engine/types";
import { isError } from "jito-ts/dist/sdk/block-engine/utils";
import { ClientReadableStream } from "@grpc/grpc-js";
   
import bs58 from "bs58";
import { getRandomTipAccount } from "../clients/config";
import { searcherClient } from "../clients/jito";
import { connection } from "./utils";


export const bundleBuilder = async (transaction: VersionedTransaction,wallet :Keypair) => {

  const _tipAccount = getRandomTipAccount();
  console.log("tip account:", _tipAccount);
  const tipAccount = new PublicKey(_tipAccount);
  const bund = new Bundle([transaction], 5);
  const resp = await connection.getLatestBlockhash("confirmed");

  let  bundleAccepted=false;
  let maybeBundle = bund.addTipTx(
    wallet,
    1000000,
    _tipAccount,
    resp.blockhash
  );

  if (isError(maybeBundle)) {
    throw maybeBundle;
  } 
 
searcherClient
.sendBundle(maybeBundle)
.then((bundleId) => {
  console.info(
    `Bundle ${bundleId} sent, backrunning ${bs58.encode(
      transaction.signatures[0],
    )}`,
  );

}).catch((error) => {

  console.log(error, 'Error sending bundle');
  if (
    error?.message?.includes(
      'Bundle Dropped, no connected leader up soon',
    )
  ) {
    console.log(
      'Error sending bundle: Bundle Dropped, no connected leader up soon.',
    );
  } else {
    console.log(error, 'Error sending bundle');
  }

});

searcherClient.onBundleResult(
(bundleResult: any) => {

  console.log(bundleResult);

  const bundleId = bundleResult.bundleId;
  const isAccepted = bundleResult.accepted;
  const isRejected = bundleResult.rejected;
  if (isAccepted) {
    console.info(
      `Bundle ${bundleId} accepted in slot ${bundleResult?.accepted.slot}`,
    );
    bundleAccepted=true;
    return;
  }
  if (isRejected && !bundleAccepted) {
    console.info(bundleResult.rejected, `Bundle ${bundleId} rejected:`);

  }
},
(error) => {
  console.log(error);
   return;
},
);

return bs58.encode(transaction.signatures[0])

}

