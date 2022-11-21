import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { DecentralizedInvoices } from "../target/types/decentralized_invoices"
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js'
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

  it("Initialize accounts", async () => {
    await safeAirdrop(merchant.publicKey, provider.connection)
    await safeAirdrop(customer.publicKey, provider.connection)
    await safeAirdrop(mintAuth.publicKey, provider.connection)
    await safeAirdrop(provider.wallet.publicKey, provider.connection)
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
      100
    )
  })

  it("Create Invoice", async () => {
    let uuid = new anchor.BN(1)
    const [invoicePda, invoiceBump] = await PublicKey.findProgramAddress(
      [uuid.toArrayLike(Buffer, 'le', 8), Buffer.from("invoice"), merchant.publicKey.toBuffer()],
      program.programId
    )
    const tx = await program.methods.createInvoice(uuid, new anchor.BN(5))
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
    let uuid = new anchor.BN(1)
    const [invoicePda, invoiceBump] = await PublicKey.findProgramAddress(
      [uuid.toArrayLike(Buffer, 'le', 8), Buffer.from("invoice"), merchant.publicKey.toBuffer()],
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
    let uuid = new anchor.BN(2)
    const [invoicePda, invoiceBump] = await PublicKey.findProgramAddress(
      [uuid.toArrayLike(Buffer, 'le', 8), Buffer.from("invoice"), merchant.publicKey.toBuffer()],
      program.programId
    )
    const tx = await program.methods.createInvoice(uuid, new anchor.BN(5))
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
    let uuid = new anchor.BN(2)
    const [invoicePda, invoiceBump] = await PublicKey.findProgramAddress(
      [uuid.toArrayLike(Buffer, 'le', 8), Buffer.from("invoice"), merchant.publicKey.toBuffer()],
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
