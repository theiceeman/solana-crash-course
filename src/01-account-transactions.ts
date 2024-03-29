// ACCOUNTS & TRANSACTIONS

// @ts-ignore
const web3 = require("@solana/web3.js");
const base58 = require("bs58");
require("dotenv").config()




const CLUSTER_URL = process.env.RPC_URL ?? web3.clusterApiUrl("devnet");
const connection = new web3.Connection(CLUSTER_URL, "single");




async function _main() {
    let connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");
    // slot is a period of time during which transactions are processed and blocks are produced.
    let slot = await connection.getSlot();
    console.log(slot)

    // let fees = await connection.getFeeForMessage(base64String);
    // console.log(fees)
}
// _main()



function generateKeyPair() {
    const keypair = web3.Keypair.generate();
    return keypair;

    console.log('Public key:', keypair.publicKey.toBase58());
    console.log('Private key:', keypair.secretKey.toString('hex'));
}
// generateKeyPair();return;



const secretKey = new Uint8Array([133, 14, 138, 246, 78, 103, 209, 23, 23, 18, 134, 48, 168, 193, 196, 98, 59, 118, 148, 168, 70, 150, 253, 76, 178, 132, 52, 41, 87, 201, 88, 212, 146, 76, 79, 105, 51, 136, 225, 255, 126, 22, 56, 84, 62, 72, 21, 168, 120, 175, 243, 81, 133, 80, 13, 242, 217, 186, 255, 106, 64, 165, 196, 94]);


/**
 * convert secret key to readable base58.
 * @param {Uint8Array} secretKey
 */
function convertToBs58(secretKey: Uint8Array) {
    const base58String = base58.encode(Buffer.from(secretKey));
    console.log({ base58String })
}
convertToBs58(secretKey);


/**
 * derive public key from secret key.
 * @param {Uint8Array} secretKey
 */
function derivePublicKey(secretKey: any) {
    let derivedSecretkey = web3.Keypair.fromSecretKey(Buffer.from(secretKey, 'base64'))
    return derivedSecretkey.publicKey.toBase58();
}
// derivePublicKey(secretKey); return;


/**
 * derive signer keypair key from secret key.
 * @param {Uint8Array} secretKey
 */
function deriveKeyPair(secretKey:any) {
    return web3.Keypair.fromSecretKey(Buffer.from(secretKey, 'base64'))
}
// generateKeyPair()


/**
 * Convert base 58 string to uint8Array
 * @param {string} base58String 
 * @returns 
 */
function convertBs58ToUintArray(base58String:string) {
    return Uint8Array.from(base58.decode(base58String));
}
// convertBs58ToUintArray(process.env.PRV_KEY); return;




async function createAccount(payer:any, account:any) {
    const space = 0;
    const lamports = await connection.getMinimumBalanceForRentExemption(space);

    const createAccountIx = web3.SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: account.publicKey,
        lamports,
        space,
        programId: web3.SystemProgram.programId,
    });

    // get the latest recent blockhash
    let recentBlockhash = await connection.getLatestBlockhash().then((res:any) => res.blockhash);

    // create a message (v0)
    const message = new web3.TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash,
        instructions: [createAccountIx],
    }).compileToV0Message();

    // create a versioned transaction using the message
    const tx = new web3.VersionedTransaction(message);
    tx.sign([payer, account]);
    const sig = await connection.sendTransaction(tx);

    console.log({ sig })
}

// console.log(convertBs58ToUintArray(process.env.OWNER_PUB_KEY));return;

// let account = deriveKeyPair(convertBs58ToUintArray(process.env.PRV_KEY));
// let payerPubKey = deriveKeyPair(convertBs58ToUintArray(process.env.OWNER_PRV_KEY));

// createAccount(payerPubKey, account)


module.exports = {
    generateKeyPair, deriveKeyPair, convertBs58ToUintArray, convertToBs58
}