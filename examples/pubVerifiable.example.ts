// Copyright (c) 2023 Cloudflare, Inc.
// Licensed under the Apache-2.0 license found in the LICENSE file or at https://opensource.org/licenses/Apache-2.0

import {
    verifyToken,
    Client,
    Issuer,
    keyGen,
    TOKEN_TYPES,
    TokenChallenge,
    getPublicKeyBytes,
} from '../src/index.js';

export async function publicVerifiableTokens(): Promise<void> {
    // Protocol Setup
    //
    // [ Everybody ] agree to use Public Verifiable Tokens.
    const tokenType = TOKEN_TYPES.BLIND_RSA.value;

    // [ Issuer ] creates a key pair.
    const keys = await keyGen();
    const issuer = new Issuer('issuer.com', keys.privateKey, keys.publicKey);
    const pkIssuer = await getPublicKeyBytes(issuer.publicKey);

    // [ Client ] creates a state.
    const client = new Client();

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
    const tokReq = await client.createTokenRequest(tokChl, pkIssuer);
    //     |                     +--------- TokenRequest ------->|
    //     |                     |                   |           |
    const tokRes = await issuer.issue(tokReq);
    //     |                     |<-------- TokenResponse -------+
    //     |                     |                   |           |
    const token = await client.finalize(tokRes);
    //     |<-- Request+Token ---+                   |           |
    //     |                     |                   |           |
    const isValid = await /*origin*/ verifyToken(token, issuer.publicKey);
    console.log(`Public-Verifiable token is valid: ${isValid}`);
}
