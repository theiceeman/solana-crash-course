const { createAndMint, TokenStandard } = require("@metaplex-foundation/mpl-token-metadata");
const { createSignerFromKeypair, generateSigner, signerIdentity, percentAmount } = require("@metaplex-foundation/umi");
const { createWeb3JsEddsa } = require('@metaplex-foundation/umi-eddsa-web3js');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const web3 = require("@solana/web3.js");
const { convertBs58ToUintArray } = require("./01-account-transactions");
const { mplCandyMachine } = require("@metaplex-foundation/mpl-candy-machine");
const fs = require('fs')


const umi = createUmi(process.env.RPC_URL ?? web3.clusterApiUrl("devnet"));
const eddsa = createWeb3JsEddsa();

// Create a keypair from your private key
const userWallet = eddsa.createKeypairFromSecretKey(convertBs58ToUintArray(process.env.OWNER_PRV_KEY))
const userWalletSigner = createSignerFromKeypair(umi, userWallet);



const metadata = {
    name: "KELVIN",
    symbol: "KVN",
    description: "This is a short description...",
    image: "https://www.paradigm.xyz/static/madrealities.png",
    uri: "https://json.extendsclass.com/bin/3dd36031d9f6"
};

const mint = generateSigner(umi);
umi.use(signerIdentity(userWalletSigner));
umi.use(mplCandyMachine())

// console.log({mint});return;

createAndMint(umi, {
    mint,
    authority: umi.identity,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    sellerFeeBasisPoints: percentAmount(0),
    decimals: 8,
    amount: 1000000_00000000,
    tokenOwner: userWallet.publicKey,
    tokenStandard: TokenStandard.Fungible,
}).sendAndConfirm(umi).then(() => {
    console.log("Successfully minted 1 million tokens (", mint.publicKey, ")");
});