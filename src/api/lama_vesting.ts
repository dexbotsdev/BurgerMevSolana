import {blob, publicKey, seq, str, struct, u64, u8} from "./marshmallow";
import {web3} from "@project-serum/anchor";
import * as buffer from "buffer";

export const VestingPoolLayout = struct([
	blob(8, "padding"), //8
	publicKey('tokenMint'), //32
	publicKey('tokenAccount'), //32
	publicKey('destAccount'), //32
	str('seed'), //32 +4
	blob(4, 'buffer'),
	seq(struct([
		u64('releaseTime'),
		u64('amount'),
	]), 50, 'sequence'),
	u8('bump'), //1
]);

export default class LamaVesting {
	connection: web3.Connection

	constructor(connection: web3.Connection) {
		this.connection = connection
	}

	getLockersByMint(mint: web3.PublicKey) {
		return this.connection.getProgramAccounts(new web3.PublicKey("vestwXyjHjcaqbTwNXSyn5HKMt6U3D5NcfdjQHJWVyG"), {
			commitment: "confirmed",
			filters: [
				{
					memcmp: {
						offset: 8, //BaseMint
						bytes: mint.toString()
					}
				}
			]
		})

	}

}