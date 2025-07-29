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
        // skip if input note is empty
        if input_note[i].amount != 0 {
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
    }

    let mut sum_asset_1_in = 0;
    let mut sum_asset_2_in = 0;
    for i in 0..2 {
        if input_note[i].asset_address == included_asset[0] {
            sum_asset_1_in += input_note[i].amount;
        } else {
            sum_asset_2_in += input_note[i].amount;
        }
    }

    // check if output notes are valid
    for i in 0..2 {
        if output_note[i].amount != 0 {
            // note hash correctly
            let out_hash = note_hasher(output_note[i]);
            println(out_hash);
            println(new_note_hash[i]);

            assert(new_note_hash[i] == out_hash);
            // asset is in included_asset in any order
            assert(
                (output_note[i].asset_address == included_asset[0])
                    | (output_note[i].asset_address == included_asset[1]),
            );
        }
    }

    // sum of output
    let mut sum_asset_1_out = 0;
    let mut sum_asset_2_out = 0;
    for i in 0..2 {
        if output_note[i].asset_address == included_asset[0] {
            sum_asset_1_out += output_note[i].amount;
        } else {
            sum_asset_2_out += output_note[i].amount;
        }
    }

    // sum order asset
    for i in 0..2 {
        if order_asset[i].amount != 0 {
            // asset is in included_asset in any order
            assert(
                (order_asset[i].asset_address == included_asset[0])
                    | (order_asset[i].asset_address == included_asset[1]),
            );
            if order_asset[i].asset_address == included_asset[0] {
                sum_asset_1_out += order_asset[i].amount;
            } else {
                sum_asset_2_out += order_asset[i].amount;
            }
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
fn test_tree() {
    let test1 = 69;
    let test2 = 420;

    let tmp = fake_merkle_proof([test1, test2]);
    let p1 = tmp.0[0];
    let p2 = tmp.0[1];
    let root = tmp.1;

    let root1 = path_processor(test1, p1.index, p1.path);
    assert(root == root1);

    let root2 = path_processor(test2, p2.index, p2.path);
    assert(root2 == root);
}

#[test]
fn test_failed_tree() {
    let test1 = 69;
    let test2 = 420;

    let tmp = fake_merkle_proof([test1, test2]);
    let p1 = tmp.0[0];
    let p2 = tmp.0[1];
    let root = tmp.1;

    let root1 = path_processor(test1, p2.index, p1.path);
    assert(root != root1);

    let root2 = path_processor(test2, p1.index, p2.path);
    assert(root2 != root);

    let root3 = path_processor(test1, p1.index, p2.path);
    assert(root != root3);

    let root4 = path_processor(test1, p2.index, p1.path);
    assert(root != root4);
}

#[test]
fn test_simple_note_hash() {
    let note =
        Note { asset_address: 1, amount: 100, secret: Combined_secret { secret: 42, nonce: 69 } };
    let hash = note_hasher(note);
    assert(
        hash
            == poseidon::poseidon2::Poseidon2::hash(
                [1, 100, poseidon::poseidon2::Poseidon2::hash([42, 69], 2)],
                3,
            ),
    );
}

#[test]
fn test_note_in_main() {
    let test_note =
        Note { asset_address: 1, amount: 100, secret: Combined_secret { secret: 42, nonce: 69 } };
    let included_asset = [1, 2];
    let note_hash = note_hasher(test_note);
    let tmp = fake_merkle_proof([note_hash, note_hash]);
    let inclusion_proof = tmp.0;
    let merkle_root = tmp.1;
    let empty_note =
        Note { asset_address: 0, amount: 0, secret: Combined_secret { secret: 0, nonce: 0 } };
    let order_note =
        Note { asset_address: 1, amount: 100, secret: Combined_secret { secret: 0, nonce: 0 } };
    main(
        included_asset,
        merkle_root,
        [0, 0, 0],
        [0; 10],
        [order_note, empty_note],
        [69, 0],
        [note_hash, note_hash],
        [test_note, empty_note],
        [empty_note, empty_note],
        inclusion_proof,
    );
}

#[test]
fn test_note_full() {
    let test_note_1 =
        Note { asset_address: 1, amount: 100, secret: Combined_secret { secret: 42, nonce: 69 } };
    let test_note_2 =
        Note { asset_address: 2, amount: 50, secret: Combined_secret { secret: 123, nonce: 456 } };
    let included_asset = [1, 2];

    let test_note_1_hash = note_hasher(test_note_1);
    let test_note_2_hash = note_hasher(test_note_2);

    let new_note_1 =
        Note { asset_address: 1, amount: 75, secret: Combined_secret { secret: 2, nonce: 3 } };

    let new_note_2 =
        Note { asset_address: 2, amount: 35, secret: Combined_secret { secret: 12, nonce: 31 } };

    let new_note_hash_1 = note_hasher(new_note_1);
    let new_note_hash_2 = note_hasher(new_note_2);

    let tmp = fake_merkle_proof([test_note_1_hash, test_note_2_hash]);
    let inclusion_proof = tmp.0;
    let merkle_root = tmp.1;

    let order_note_1 =
        Note { asset_address: 2, amount: 15, secret: Combined_secret { secret: 0, nonce: 0 } };

    let order_note_2 =
        Note { asset_address: 1, amount: 25, secret: Combined_secret { secret: 0, nonce: 0 } };
    main(
        included_asset,
        merkle_root,
        [0, 0, 0],
        [0; 10],
        [order_note_1, order_note_2],
        [69, 456],
        [new_note_hash_1, new_note_hash_2],
        [test_note_1, test_note_2],
        [new_note_1, new_note_2],
        inclusion_proof,
    );
}

#[test(should_fail)]
fn test_note_in_fail_sum() {
    let test_note =
        Note { asset_address: 1, amount: 100, secret: Combined_secret { secret: 42, nonce: 69 } };
    let included_asset = [1, 2];
    let note_hash = note_hasher(test_note);
    let tmp = fake_merkle_proof([note_hash, note_hash]);
    let inclusion_proof = tmp.0;
    let merkle_root = tmp.1;
    let empty_note =
        Note { asset_address: 0, amount: 0, secret: Combined_secret { secret: 0, nonce: 0 } };
    let order_note =
        Note { asset_address: 1, amount: 100, secret: Combined_secret { secret: 0, nonce: 0 } };
    // too many order
    main(
        included_asset,
        merkle_root,
        [0, 0, 0],
        [0; 10],
        [order_note, order_note],
        [69, 0],
        [note_hash, note_hash],
        [test_note, empty_note],
        [empty_note, empty_note],
        inclusion_proof,
    );
}

#[test(should_fail)]
fn test_note_in_fail_wrong_asset() {
    let test_note =
        Note { asset_address: 1, amount: 100, secret: Combined_secret { secret: 42, nonce: 69 } };
    let included_asset = [3, 2];
    let note_hash = note_hasher(test_note);
    let tmp = fake_merkle_proof([note_hash, note_hash]);
    let inclusion_proof = tmp.0;
    let merkle_root = tmp.1;
    let empty_note =
        Note { asset_address: 0, amount: 0, secret: Combined_secret { secret: 0, nonce: 0 } };
    let order_note =
        Note { asset_address: 1, amount: 100, secret: Combined_secret { secret: 0, nonce: 0 } };
    // too many order
    main(
        included_asset,
        merkle_root,
        [0, 0, 0],
        [0; 10],
        [order_note, empty_note],
        [69, 0],
        [note_hash, note_hash],
        [test_note, empty_note],
        [empty_note, empty_note],
        inclusion_proof,
    );
}
