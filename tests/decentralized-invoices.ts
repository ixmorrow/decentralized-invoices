import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { DecentralizedInvoices } from "../target/types/decentralized_invoices";

describe("decentralized-invoices", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.DecentralizedInvoices as Program<DecentralizedInvoices>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
