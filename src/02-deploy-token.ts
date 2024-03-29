import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { TokenMetadata, pack } from "@solana/spl-token-metadata";

const { createInitializeMintInstruction, createMintToCheckedInstruction, createInitializeInstruction, TOKEN_2022_PROGRAM_ID, createInitializeMetadataPointerInstruction, ExtensionType, getMintLen, TYPE_SIZE, LENGTH_SIZE } = require("@solana/spl-token");
const web3 = require("@solana/web3.js");
const { deriveKeyPair, convertBs58ToUintArray, generateKeyPair } = require("./01-account-transactions");
require("dotenv").config()


const CLUSTER_URL = process.env.RPC_URL ?? web3.clusterApiUrl("devnet");
const connection = new web3.Connection(CLUSTER_URL, { commitment: "finalized" });



/**
 * Sending transactions.
 * @param signers 
 * @param transaction 
 */
async function _sendTransaction(signers: Array<any>, transaction: any) {
    const transactionSignature = await web3.sendAndConfirmTransaction(connection, transaction, signers);
    console.log("\n", `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`);
    return;
}




async function createToken(tokenConfig: TokenMetadata, payer: any, mintKeypair: any, supply: number) {
    const EXTENSIONS = [ExtensionType.MetadataPointer];
    const mintSpace = getMintLen(EXTENSIONS);
    const metadataSpace = TYPE_SIZE + LENGTH_SIZE + pack(tokenConfig).length
    const lamports = await connection.getMinimumBalanceForRentExemption(mintSpace + metadataSpace)

    // get associated token account
    let ata = await getAssociatedTokenAddress(mintKeypair.publicKey, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);

    // register the address token will be deployed at
    const createMintAccountInstruction = web3.SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintSpace,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
    });


    // instruction that creates a pointer to where the metadata is stored
    const initMetadataPointerInstruction = createInitializeMetadataPointerInstruction(
        mintKeypair.publicKey,
        payer.publicKey,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
    );

    // instruction to deploy token program to mint account address
    const initMintInstruction = createInitializeMintInstruction(
        mintKeypair.publicKey,
        9,
        payer.publicKey,
        payer.publicKey,
        TOKEN_2022_PROGRAM_ID
    );

    // instruction to store the metadata
    const initMetadataInstruction = createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mintKeypair.publicKey,
        updateAuthority: payer.publicKey,
        mint: mintKeypair.publicKey,
        mintAuthority: payer.publicKey,
        name: tokenConfig.name,
        symbol: tokenConfig.symbol,
        uri: tokenConfig.uri,
    });

    // create associated token account
    const createAssociatedTokenAccountIx = createAssociatedTokenAccountInstruction(
        payer.publicKey,
        ata,
        payer.publicKey,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID
    )

    // mint token to account
    let mintTokenInstruction = createMintToCheckedInstruction(
        mintKeypair.publicKey,
        ata,
        payer.publicKey,
        supply,
        9,
        [],
        TOKEN_2022_PROGRAM_ID
    )

    let signers = [payer, mintKeypair];
    const transaction = new web3.Transaction().add(
        createMintAccountInstruction,
        initMetadataPointerInstruction,
        initMintInstruction,
        initMetadataInstruction,
        createAssociatedTokenAccountIx,
        mintTokenInstruction
    );
    await _sendTransaction(signers, transaction); return;
}


let payer = deriveKeyPair(convertBs58ToUintArray(process.env.OWNER_PRV_KEY));
let mintKeypair = generateKeyPair()

const tokenConfig = {
    mint: mintKeypair.publicKey,
    updateAuthority: payer.publicKey,
    name: "KELVIN",
    symbol: "KVN",
    image: "https://www.paradigm.xyz/static/madrealities.png",
    uri: "https://json.extendsclass.com/bin/3dd36031d9f6",
    additionalMetadata: [
        ["description", "This is a short description..."]
    ] as [string, string][],
};

createToken(tokenConfig, payer, mintKeypair, 1000000_000000000)




// getting token details
/* const mintInfo = await getMint(
    connection,
    new web3.PublicKey('9WfuHapJXxLgHeZ16KBch5m8gEaRKRtQokzqkPpxNqce')
)
 */


