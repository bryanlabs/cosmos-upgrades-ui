// Server-side verification of a Cosmos wallet login (ADR-036 "signArbitrary").
//
// The user signs buildLoginMessage(address, nonce) with Keplr/Leap. We
// reconstruct the ADR-036 sign doc, verify the secp256k1 signature against the
// provided public key, and confirm that public key actually derives the claimed
// bech32 address. This is the Cosmos analogue of Sign-In With Ethereum.
import { Secp256k1, Secp256k1Signature, sha256 } from "@cosmjs/crypto";
import {
  fromBase64,
  toBase64,
  fromBech32,
  toBech32,
  toUtf8,
} from "@cosmjs/encoding";
import {
  rawSecp256k1PubkeyToRawAddress,
  serializeSignDoc,
  type StdSignDoc,
} from "@cosmjs/amino";

// ADR-036 wraps arbitrary data in a fixed, zeroed sign doc.
function adr36SignDoc(signer: string, data: string): StdSignDoc {
  return {
    chain_id: "",
    account_number: "0",
    sequence: "0",
    fee: { gas: "0", amount: [] },
    msgs: [
      {
        type: "sign/MsgSignData",
        value: { signer, data: toBase64(toUtf8(data)) },
      },
    ],
    memo: "",
  };
}

export async function verifyWalletLogin(args: {
  address: string;
  pubKeyB64: string;
  signatureB64: string;
  message: string;
}): Promise<boolean> {
  let pubkey: Uint8Array;
  let prefix: string;
  try {
    pubkey = fromBase64(args.pubKeyB64);
    prefix = fromBech32(args.address).prefix;
  } catch {
    return false;
  }

  // The public key must derive the claimed address; otherwise a valid signature
  // from a different key could impersonate an address.
  let derived: string;
  try {
    derived = toBech32(prefix, rawSecp256k1PubkeyToRawAddress(pubkey));
  } catch {
    return false;
  }
  if (derived !== args.address) {
    return false;
  }

  let signature: Secp256k1Signature;
  try {
    signature = Secp256k1Signature.fromFixedLength(fromBase64(args.signatureB64));
  } catch {
    return false;
  }

  const hash = sha256(serializeSignDoc(adr36SignDoc(args.address, args.message)));
  try {
    return await Secp256k1.verifySignature(signature, hash, pubkey);
  } catch {
    return false;
  }
}
