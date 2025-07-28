use dep::poseidon;
use trees::merkle::MerkleTree;

struct Combined_secret {
    secret: Field,
    nonce: Field,
}

fn leaf_hasher(leafs: [Field; 2]) -> Field {
    poseidon::poseidon2::Poseidon2::hash(leafs, 2)
}

// H(asset_address, amount, H(secret,nonce))
fn note_hasher(input: Note) -> Field {
    let secret_hash =
        poseidon::poseidon2::Poseidon2::hash([input.secret.secret, input.secret.nonce], 2);
    poseidon::poseidon2::Poseidon2::hash(
        [input.asset_address, input.amount as Field, secret_hash],
        3,
    )
}

// real note is
// H(asset_address, amount, H(secret,nonce))
// a UTXO note private use only
struct Note {
    asset_address: Field,
    amount: u128,
    secret: Combined_secret,
}
// a UTXO note handling assets
struct Spending_asset {
    asset_address: Field,
    amount: u128,
}

struct Merkle_proof {
    index: u32,
    path: [Field; 10],
}

fn hash_note(input: Note) -> Field {
    0
}

// make order.
// take in 2 notes
fn main(
    included_asset: pub [Field; 2],
    merkle_root: pub Field,
    order_hash: pub [Field; 3],
    precomp_secret: pub [Field; 10],
    public_asset: pub [Note; 2],
    nullifier: pub [Field; 2],
    input_note: [Note; 2],
    output_note: [Note; 2],
    inclusion_proof: [Merkle_proof; 2],
) {
    // check if all input is valid

}

#[test]
fn test_main() {
    // main(1, 2);

    // Uncomment to make test fail
    // main(1, 1);
}
