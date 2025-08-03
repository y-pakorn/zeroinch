# ZeroInch

Zeroinch, decentralized private limit order protocol. powered by 1inch, ZKP, and our just in time MADSP.  

## Description

For most, they love CEX user experience (UX). Limit order is easy to understand (compared to constant product AMM), frictionless (no wallet, no signing), and some level of privacy also preferable. For some self custody and decentralization is important. 

1Inch limit order protocol is most of what users need. However, (like others dapp on public chains) it still lacks privacy. Anyone can track anybody's wallet. Some for friendly banter e.g. “your trade sucks”. Some learn alpha which makes it decay. Or some might be more harmful than that.

We offer the “Zeroinch” extension. A set of smart contract, ZK circuit, Webapp, and api services. That adds privacy to the 1inch limit order protocol. The extension allows users to have a shielded account that can privately interact with 1inch limit order protocol. The extension is fully compatible with 1inch so it can also work with other extensions in the future.

In this version we have our own order pool and resolver (as the competition rules required). But it is fully compatible with 1inch’s infrastructure. So if permitted, this can be integrated later. 

While the user flow is seamless and easy to used. We employ a lot of novel techniques to achieve this. See technical section


## How it's made

The work centered around 3 key ideas. 

Private but fully compatible with 1inch limit order protocol. While most private protocols scarified composability. We set out to not only composable but fully compatible with 1inch limit order protocol. This means that users don’t have to choose between privacy and others. All 1inch infra, extension, etc should be compatible with our work.

Multi-Asset Double-Shielded Pool (MADSP)- instead of normal MASP and its variance. Where add an extra shielded step to shielded secret/nonce first. So the note hash become H(info, H(secret, nonce)) instead of normal H(info, secret, nonce). While extra hashing steps cost more gas and some compute in circuit. This allow more flexibility in our protocol

Just in time private note generation - most privacy swap work with precomputed expected results which work well for atomic swap e.g. with norman AMM. but those approaches are not flexible enough. To fully harness with 1inch limit order and its dynamic extension (e.g. auction, etc) where price are not predetermined. We create Just in time private note generation. powered by MADSP the smart contract can keep shielded secrets for later use without leaking information. This allows the smart contract to take in trade results and other real time information as input of private note construction. This design can fully support any extension or any logic.

With this innovation we implement smart contract, ZK circuit, Webapp, and api services. 

Apart from fully functional circuit, contract, and api services. (including filler and order pool) we also build web apps to allow users to easily interact with the protocol.
