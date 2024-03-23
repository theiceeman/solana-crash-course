
const { MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMint2Instruction, createMint, getMint, getOrCreateAssociatedTokenAccount, getAccount, mintTo } = require("@solana/spl-token");
const {
    PROGRAM_ID,
    createCreateMetadataAccountV3Instruction,
    MPL_TOKEN_METADATA_PROGRAM_ID,
    createFungible,
    mplTokenMetadata,
} = require("@metaplex-foundation/mpl-token-metadata");
const web3 = require("@solana/web3.js");
const { deriveKeyPair, convertBs58ToUintArray, generateKeyPair } = require("./01-account-transactions");
const { generateSigner, createUmi, percentAmount } = require("@metaplex-foundation/umi");
require("dotenv").config()


const CLUSTER_URL = process.env.RPC_URL ?? web3.clusterApiUrl("devnet");
const connection = new web3.Connection(CLUSTER_URL, "single");



/**
 * Sending transactions
 * @param {*} connection 
 * @param {string} payer 
 * @param {Array} signers 
 * @param {Array} instructions 
 */
async function _sendTransaction(payer, signers, instructions) {
    let recentBlockhash = await connection.getLatestBlockhash().then(res => res.blockhash);

    // create a message (v0)
    const message = new web3.TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash,
        instructions: instructions,
    }).compileToV0Message();

    // create a versioned transaction using the message
    const tx = new web3.VersionedTransaction(message);
    tx.sign(signers);
    const sig = await connection.sendTransaction(tx);

}




async function createToken(tokenConfig, payer, mintKeypair) {

    // instruction for the token mint account
    const createMintAccountInstruction = web3.SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
        programId: TOKEN_PROGRAM_ID,
    });

    // instruction to initialize account as Mint
    const initializeMintInstruction = createInitializeMint2Instruction(
        mintKeypair.publicKey,
        tokenConfig.decimals,
        payer.publicKey,
        payer.publicKey,
    );
    // console.log({
    //     xxx: Buffer.from("metadata"),
    //     yyy: Buffer.from(MPL_TOKEN_METADATA_PROGRAM_ID),
    //     zzz: mintKeypair.publicKey.toBuffer()
    // }); return;
    // derive the pda address for the Metadata account
    const metadataAccount = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), Buffer.from(MPL_TOKEN_METADATA_PROGRAM_ID), mintKeypair.publicKey.toBuffer()],
        MPL_TOKEN_METADATA_PROGRAM_ID,
    )[0];

    console.log("Metadata address:", metadataAccount.toBase58()); return;

    // Create the Metadata account for the Mint
    const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
        {
            metadata: metadataAccount,
            mint: mintKeypair.publicKey,
            mintAuthority: payer.publicKey,
            payer: payer.publicKey,
            updateAuthority: payer.publicKey,
        },
        {
            createMetadataAccountArgsV3: {
                data: {
                    creators: null,
                    name: tokenConfig.name,
                    symbol: tokenConfig.symbol,
                    uri: tokenConfig.uri,
                    sellerFeeBasisPoints: 0,
                    collection: null,
                    uses: null,
                },
                // `collectionDetails` - for non-nft type tokens, normally set to `null` to not have a value set
                collectionDetails: null,
                // should the metadata be updatable?
                isMutable: true,
            },
        },
    );

    let signers = [payer, mintKeypair];
    let instructions = [createMintAccountInstruction, initializeMintInstruction, createMetadataInstruction]
    await _sendTransaction(payer, signers, instructions)

}


const tokenConfig = {
    decimals: 9,
    name: "KELVIN",
    symbol: "KVN",
    uri: "https://test.com/info.json",
};

let payer = deriveKeyPair(convertBs58ToUintArray(process.env.OWNER_PRV_KEY));
let mintKeypair = generateKeyPair()
// createToken(tokenConfig, payer, mintKeypair)


// console.log({payerPubKey});return;


// getting token details
/* const mintInfo = await getMint(
    connection,
    new web3.PublicKey('9WfuHapJXxLgHeZ16KBch5m8gEaRKRtQokzqkPpxNqce')
)
 */


// metaplex
async function main() {
    // const umi = createUmi(CLUSTER_URL).use(mplTokenMetadata());

    // const mint = generateSigner(umi)
    // await createFungible(umi, {
    //     mint,
    //     decimals: 9,
    //     name: "KELVIN",
    //     symbol: "KVN",
    //     uri: "https://test.com/info.json",
    //     sellerFeeBasisPoints: percentAmount(0),
    // }).sendAndConfirm(umi)


    // create a unique address for the token
    const mint = await createMint(
        connection,
        payer,
        payer.publicKey,
        payer.publicKey,
        9
    );
    console.log({ mint: mint.toBase58() })

    // create an address to hold the token supply
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        payer.publicKey
    )
    console.log(tokenAccount.address.toBase58());


    // mint tokens
    await mintTo(
        connection,
        payer,
        mint,
        tokenAccount.address,
        payer,
        100000000000 // 100.000000000
    )
    
    // get details of a token account
    const tokenAccountInfo = await getAccount(
        connection,
        tokenAccount.address
    )
    console.log(tokenAccountInfo);

}
main()