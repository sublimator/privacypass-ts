// Copyright (c) 2023 Cloudflare, Inc.
// Licensed under the Apache-2.0 license found in the LICENSE file or at https://opensource.org/licenses/Apache-2.0

import { Client2, Issuer2, keyGen2, TOKEN_TYPES, TokenChallenge } from '../src/index.js';

export async function privateVerifiableTokens(): Promise<void> {
    // Protocol Setup
    //
    // [ Everybody ] agree to use Private-Verifiable Tokens.
    const tokenType = TOKEN_TYPES.VOPRF.value;

    // [ Issuer ] creates a key pair.
    const keys = await keyGen2();
    const issuer = new Issuer2('issuer.com', keys.privateKey, keys.publicKey);

    // [ Client ] creates a state.
    const client = new Client2(issuer.publicKey);

    // Online Protocol
    //
    // +--------+            +--------+         +----------+ +--------+
    // | Origin |            | Client |         | Attester | | Issuer |
    // +---+----+            +---+----+         +----+-----+ +---+----+
    //     |                     |                   |           |
    //     |<----- Request ------+                   |           |
    const redemptionContext = crypto.getRandomValues(new Uint8Array(32));
    const originInfo = ['origin.example.com', 'origin2.example.com'];
    const tokChl = new TokenChallenge(tokenType, issuer.name, redemptionContext, originInfo);
    //     +-- TokenChallenge -->|                   |           |
    //     |                     |<== Attestation ==>|           |
    //     |                     |                   |           |
    const [tokReq, state] = await client.createTokenRequest(tokChl);
    //     |                     +--------- TokenRequest ------->|
    //     |                     |                   |           |
    const tokRes = await issuer.issue(tokReq);
    //     |                     |<-------- TokenResponse -------+
    //     |                     |                   |           |
    const token = await client.finalize(tokRes, state);
    //     |<-- Request+Token ---+                   |           |
    //     |                     |                   |           |
    const isValid = await issuer.verify(token);

    console.log('Private-Verifiable tokens');
    console.log(`    Suite: ${TOKEN_TYPES.VOPRF.name}`);
    console.log(`    Valid token: ${isValid}`);
}
