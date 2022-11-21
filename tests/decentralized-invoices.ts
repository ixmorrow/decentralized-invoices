import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { DecentralizedInvoices } from "../target/types/decentralized_invoices"
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { numbersToBuffer } from 'numbers-to-buffer'
import { createMint, mintTo, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { safeAirdrop, delay } from './utils/utils'
import { token } from "@project-serum/anchor/dist/cjs/utils"
import { merchantKeypair as merchant, customerKeypair as customer, mintAuth } from './test-keypairs/testKeypairs'

describe("decentralized-invoices", async () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.DecentralizedInvoices as Program<DecentralizedInvoices>;
  const provider = anchor.AnchorProvider.env()

  let tokenMint = null
  let merchantAta = null
  let customerAta = null
  let firstId = null
  let secondId = null

  it("Initialize accounts", async () => {
    await safeAirdrop(merchant.publicKey, provider.connection)
    await safeAirdrop(customer.publicKey, provider.connection)
    await safeAirdrop(mintAuth.publicKey, provider.connection)

    delay(10000)

    tokenMint = await createMint(
      provider.connection,
      mintAuth,
      mintAuth.publicKey,
      mintAuth.publicKey,
      9
    )
    console.log("Mint: ", tokenMint.toBase58())

    merchantAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      merchant,
      tokenMint,
      merchant.publicKey
      )
    console.log("Merchant ata: ", merchantAta.address.toBase58())
    customerAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      customer,
      tokenMint,
      customer.publicKey
    )
    console.log("Customer ata: ", customerAta.address.toBase58())

    await mintTo(
      provider.connection,
      customer,
      tokenMint,
      customerAta.address,
      mintAuth,
      100*LAMPORTS_PER_SOL
    )
  })

  it("Create Invoice", async () => {
    firstId = new anchor.BN(Math.floor(Math.random() * 100))
    const [invoicePda, invoiceBump] = await PublicKey.findProgramAddress(
      [firstId.toArrayLike(Buffer, 'le', 8), Buffer.from("invoice"), merchant.publicKey.toBuffer()],
      program.programId
    )
    const tx = await program.methods.createInvoice(firstId, new anchor.BN(5*LAMPORTS_PER_SOL))
    .accounts({
      merchant: merchant.publicKey,
      customer: customer.publicKey,
      invoice: invoicePda,
      paymentMint: tokenMint,
      systemProgram: SystemProgram.programId
    })
    .signers([merchant])
    .rpc()
    console.log("Invoice created: ", tx)
  })

  it("Pay Invoice", async () => {
    const [invoicePda, invoiceBump] = await PublicKey.findProgramAddress(
      [firstId.toArrayLike(Buffer, 'le', 8), Buffer.from("invoice"), merchant.publicKey.toBuffer()],
      program.programId
    )
    const tx = await program.methods.payInvoice()
    .accounts({
      invoice: invoicePda,
      customer: customer.publicKey,
      merchant: merchant.publicKey,
      customerTokenAcct: customerAta.address,
      merchantTokenAcct: merchantAta.address,
      paymentMint: tokenMint,
      tokenProgram: TOKEN_PROGRAM_ID
    })
    .signers([customer])
    .rpc()
    console.log("Invoice paid: ", tx)
  })

  it("Create Second Invoice", async () => {
    secondId = new anchor.BN(Math.floor(Math.random() * 100))
    const [invoicePda, invoiceBump] = await PublicKey.findProgramAddress(
      [secondId.toArrayLike(Buffer, 'le', 8), Buffer.from("invoice"), merchant.publicKey.toBuffer()],
      program.programId
    )
    const tx = await program.methods.createInvoice(secondId, new anchor.BN(5*LAMPORTS_PER_SOL))
    .accounts({
      merchant: merchant.publicKey,
      customer: customer.publicKey,
      invoice: invoicePda,
      paymentMint: tokenMint,
      systemProgram: SystemProgram.programId
    })
    .signers([merchant])
    .rpc()
    console.log("Invoice created: ", tx)
  })

  it("Expire Invoice", async () => {
    await delay(2000)
    const [invoicePda, invoiceBump] = await PublicKey.findProgramAddress(
      [secondId.toArrayLike(Buffer, 'le', 8), Buffer.from("invoice"), merchant.publicKey.toBuffer()],
      program.programId
    )
    const tx = await program.methods.expireInvoice()
    .accounts({
      merchant: merchant.publicKey,
      invoice: invoicePda
    })
    .signers([merchant])
    .rpc()
    console.log("Invoice expired: ", tx)
  })
})
