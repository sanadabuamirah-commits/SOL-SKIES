// server/escrow.mjs
// Sol Skies — Devnet Escrow Manager
//
// Holds a server-side Solana keypair that acts as escrow.
// Enterprise deposits SOL → escrow on mission creation.
// Server pays operator from escrow on contract completion.
//
// Escrow pubkey: Dx9ey3aYGcpJn1XWNBknC2BvGBpS9TwGAWpRkFGTFf1m
// Network: Devnet (free SOL via airdrop — no paywall)

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from '@solana/web3.js';

// ─── Escrow keypair (devnet — NOT mainnet, safe to store) ────────────────────
const ESCROW_SECRET = Uint8Array.from([
  182,232,110,193,139,154,33,80,229,183,150,120,34,242,151,118,
  172,251,42,121,102,212,194,95,249,204,173,5,241,11,243,245,
  192,108,249,48,67,181,11,173,12,181,136,4,63,107,108,127,
  137,207,70,156,162,160,155,77,217,223,210,251,110,114,190,180
]);

export const escrowKeypair = Keypair.fromSecretKey(ESCROW_SECRET);
export const ESCROW_ADDRESS = escrowKeypair.publicKey.toBase58();

// ─── Devnet connection ────────────────────────────────────────────────────────
export const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// ─── Airdrop helper — funds escrow on devnet (free) ──────────────────────────
export async function ensureEscrowFunded(minLamports = 0.05 * LAMPORTS_PER_SOL) {
  try {
    const balance = await connection.getBalance(escrowKeypair.publicKey);
    if (balance < minLamports) {
      console.log(`[escrow] Balance low (${balance} lamports), requesting airdrop…`);
      const sig = await connection.requestAirdrop(escrowKeypair.publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, 'confirmed');
      const newBal = await connection.getBalance(escrowKeypair.publicKey);
      console.log(`[escrow] Airdrop confirmed. New balance: ${newBal / LAMPORTS_PER_SOL} SOL`);
      return newBal;
    }
    return balance;
  } catch (err) {
    console.warn('[escrow] Airdrop failed (rate-limited or offline):', err.message);
    return null;
  }
}

// ─── Get current escrow balance ───────────────────────────────────────────────
export async function getEscrowBalance() {
  try {
    const lamports = await connection.getBalance(escrowKeypair.publicKey);
    return { lamports, sol: lamports / LAMPORTS_PER_SOL };
  } catch (err) {
    console.error('[escrow] getBalance error:', err.message);
    return { lamports: 0, sol: 0 };
  }
}

// ─── Verify an inbound deposit ────────────────────────────────────────────────
// Checks that `txSignature` is a confirmed transfer of at least `expectedLamports`
// to the escrow address from `fromWallet`.
export async function verifyDeposit(txSignature, fromWallet, expectedLamports) {
  try {
    const tx = await connection.getParsedTransaction(txSignature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || tx.meta?.err) {
      return { ok: false, reason: 'Transaction not found or failed on-chain' };
    }

    const instructions = tx.transaction?.message?.instructions || [];
    let deposited = 0;

    for (const ix of instructions) {
      if (
        ix.program === 'system' &&
        ix.parsed?.type === 'transfer' &&
        ix.parsed?.info?.destination === ESCROW_ADDRESS
      ) {
        // Optionally verify sender matches
        if (fromWallet && ix.parsed.info.source !== fromWallet) continue;
        deposited += ix.parsed.info.lamports || 0;
      }
    }

    if (deposited < expectedLamports) {
      return {
        ok: false,
        reason: `Expected ${expectedLamports} lamports, found ${deposited}`
      };
    }

    return { ok: true, deposited };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

// ─── Pay operator from escrow ─────────────────────────────────────────────────
// Signs a transfer from escrow keypair → operator wallet.
// Called by server when enterprise completes a contract.
export async function payOperator(operatorWallet, lamports) {
  try {
    await ensureEscrowFunded(lamports + 5000); // keep a little extra for fees

    const toPubkey = new PublicKey(operatorWallet);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: escrowKeypair.publicKey,
    }).add(
      SystemProgram.transfer({
        fromPubkey: escrowKeypair.publicKey,
        toPubkey,
        lamports,
      })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [escrowKeypair], {
      commitment: 'confirmed',
    });

    console.log(`[escrow] Paid ${lamports / LAMPORTS_PER_SOL} SOL to ${operatorWallet}. Tx: ${signature}`);
    return { ok: true, signature, explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet` };
  } catch (err) {
    console.error('[escrow] payOperator error:', err.message);
    return { ok: false, reason: err.message };
  }
}

// ─── SOL ↔ Lamports helpers ───────────────────────────────────────────────────
export const solToLamports = (sol) => Math.round(parseFloat(sol) * LAMPORTS_PER_SOL);
export const lamportsToSol = (lamports) => lamports / LAMPORTS_PER_SOL;
