use dep::poseidon;
use trees::merkle::MerkleTree;

struct Combined_secret {
    secret: Field,
    nonce: Field,
}

fn leaf_hasher(leafs: [Field; 2]) -> Field {
    poseidon::poseidon2::Poseidon2::hash(leafs, 2)
}

fn process_path_hash(leaf: Field, index: u32, another_leaf: Field) -> Field {
    // if index is even, then leaf is left child
    // if index is odd, then leaf is right child
    if index % 2 == 0 {
        leaf_hasher([leaf, another_leaf])
    } else {
        leaf_hasher([another_leaf, leaf])
    }
}

fn path_processor(leaf: Field, index: u32, hash_path: [Field; 10]) -> Field {
    let mut calculated_hash = leaf;
    let mut calculated_index = index;
    for i in 0..10 {
        calculated_hash = process_path_hash(calculated_hash, calculated_index, hash_path[i]);
        calculated_index = calculated_index / 2;
    }
    calculated_hash
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

// make order.
// take in 2 notes
fn main(
    included_asset: pub [Field; 2],
    merkle_root: pub Field,
    order_hash: pub [Field; 3],
    precomp_secret: pub [Field; 10],
    order_asset: pub [Note; 2],
    nullifier: pub [Field; 2],
    new_note_hash: pub [Field; 2],
    input_note: [Note; 2],
    output_note: [Note; 2],
    inclusion_proof: [Merkle_proof; 2],
) {
    // check if all input are valid
    for i in 0..2 {
        // check correct nullifier
        assert(nullifier[i] == input_note[i].secret.nonce);
        // note is valid in tree
        let leaf = note_hasher(input_note[i]);
        let processed_root =
            path_processor(leaf, inclusion_proof[i].index, inclusion_proof[i].path);
        assert(processed_root == merkle_root);
        // assert note asset is in included_asset in any order
        assert(
            (input_note[i].asset_address == included_asset[0])
                | (input_note[i].asset_address == included_asset[1]),
        );
    }

    let mut sum_asset_1_in = 0u128;
    let mut sum_asset_2_in = 0u128;
    for i in 0..2 {
        if input_note[i].asset_address == included_asset[0] {
            sum_asset_1_in += input_note[i].amount;
        } else {
            sum_asset_2_in += input_note[i].amount;
        }
    }

    // check if output notes are valid
    for i in 0..2 {
        // note hash correctly
        let out_hash = note_hasher(output_note[i]);
        assert(new_note_hash[i] == out_hash);
        // asset is in included_asset in any order
        assert(
            (output_note[i].asset_address == included_asset[0])
                | (output_note[i].asset_address == included_asset[1]),
        );
    }

    // sum of output
    let mut sum_asset_1_out = 0u128;
    let mut sum_asset_2_out = 0u128;
    for i in 0..2 {
        if output_note[i].asset_address == included_asset[0] {
            sum_asset_1_out += output_note[i].amount;
        } else {
            sum_asset_2_out += output_note[i].amount;
        }
    }

    // sum order asset
    for i in 0..2 {
        if order_asset[i].asset_address == included_asset[0] {
            sum_asset_1_out += order_asset[i].amount;
        } else {
            sum_asset_2_out += order_asset[i].amount;
        }
    }

    // assert in and out
    assert(sum_asset_1_in == sum_asset_1_out);
    assert(sum_asset_2_in == sum_asset_2_out);
}

fn fake_merkle_proof(input: [Field; 2]) -> ([Merkle_proof; 2], Field) {
    let mut current = leaf_hasher([input[0], input[1]]);
    let mut p1 = [0; 10];
    let mut p2 = [0; 10];
    p1[0] = input[1];
    p2[0] = input[0];

    for i in 1..10 {
        let random = poseidon::poseidon2::Poseidon2::hash([i as Field], 1);
        current = leaf_hasher([current, random]);
        p1[i] = random;
        p2[i] = random;
    }

    let first_proof = Merkle_proof { index: 0, path: p1 };
    let second_proof = Merkle_proof { index: 1, path: p2 };

    ([first_proof, second_proof], current)
}

#[test]
fn test_main() {
    // main(1, 2);

    // Uncomment to make test fail
    // main(1, 1);
}
