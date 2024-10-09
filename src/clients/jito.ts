import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { config, getRandomTipAccount } from './config';
import { geyserClient as jitoGeyserClient } from 'jito-ts';
import { Bundle } from 'jito-ts/dist/sdk/block-engine/types';

import {
  SearcherClient,
  searcherClient as jitoSearcherClient,
} from 'jito-ts/dist/sdk/block-engine/searcher.js';
import * as fs from 'fs';
import { isError } from 'util';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import jitofees from '../utils/utils';

const BLOCK_ENGINE_URLS = config.get('block_engine_urls');
const AUTH_KEYPAIR_PATH = config.get('auth_keypair_path');

const GEYSER_URL = config.get('geyser_url');
const GEYSER_ACCESS_TOKEN = config.get('geyser_access_token');

const decodedKey = new Uint8Array(
  JSON.parse(fs.readFileSync(AUTH_KEYPAIR_PATH).toString()) as number[],
);
const keypair = Keypair.fromSecretKey(decodedKey);

export const privateKey = keypair

const searcherClients: SearcherClient[] = [];

for (const url of BLOCK_ENGINE_URLS) {
  const client = jitoSearcherClient(url, keypair, {
    'grpc.keepalive_timeout_ms': 4000,
  });
  searcherClients.push(client);
}

const geyserClient = jitoGeyserClient(GEYSER_URL, GEYSER_ACCESS_TOKEN, {
  'grpc.keepalive_timeout_ms': 4000,
});

// all bundles sent get automatically forwarded to the other regions.
// assuming the first block engine in the array is the closest one
const searcherClient = searcherClients[0];

export { searcherClient, searcherClients, geyserClient };


export const bundleBuilder = async (connection:Connection,transactions: VersionedTransaction[],wallet:Keypair) => {

  const _tipAccount = getRandomTipAccount();
  console.log("tip account:", _tipAccount);
   const bund = new Bundle(transactions, 5);
  const resp = await connection.getLatestBlockhash("confirmed");

  let  bundleAccepted=false;
  let maybeBundle: any = bund.addTipTx(
    wallet,
    Number(jitofees)*LAMPORTS_PER_SOL,
    _tipAccount,
    resp.blockhash
  );

   

  searcherClients.forEach(searcherClientStub => {
    searcherClientStub.sendBundle(maybeBundle)
    .then((bundleId) => {
      console.info(
        `Bundle ${bundleId} sent, backrunning ${bs58.encode(
          transactions[0].signatures[0],
        )} && ${bs58.encode(
          transactions[1].signatures[0],
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
    searcherClientStub.onBundleResult(
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
        throw error;
      },
    );


  });
    

 

  let transIdA = bs58.encode(transactions[0].signatures[0])
  let transIdB = bs58.encode(transactions[1].signatures[0])

  return {transIdA,transIdB}
}
