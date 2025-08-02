import { parseAbi } from "viem"

export const contracts = {
  zeroinch: {
    address: "0x1AD9BbfD8Bb4Af4406B39bd2ee83a9663A8AE003",
    abi: parseAbi([
      "struct OrderNote { address assetAddress; uint256 amount; bytes32 cancelHash; }",
      "struct ZKPinput { bytes32 merkleRoot; bytes32 orderHash; bytes32 normalizedOrderHash; bytes32 precompSecret; OrderNote orderAsset; bytes32[2] nullifier; bytes32[2] newNoteHash; }",
      "function deposit(address asset, uint256 amount, bytes32 secretHash) public",
      "function order(ZKPinput calldata zkpInput, bytes calldata proof) public",
      "function cancel(bytes32 orderHash, bytes32 preimage) public",
      "function roots(uint256 index) public view returns (bytes32)",
      "function leaves(uint256 index) public view returns (bytes32)",
      "function nextIndex() public view returns (uint256)",
      "function cancel(bytes32 orderHash, bytes32 preimage) external",
      "event NewLeaf(bytes32 indexed secretHash, bytes32 indexed noteHash, uint256 indexed insertedIndex)",
    ]),
  },
  limit: {
    address: "0x111111125421ca6dc452d289314280a0f8842a65",
    abi: parseAbi([
      "struct Order { uint256 salt; address maker; address receiver; address makerAsset; address takerAsset; uint256 makingAmount; uint256 takingAmount; uint256 makerTraits; }",
      "function fillContractOrder(Order calldata order, bytes calldata signature, uint256 amount, uint256 takerTraits) public",
      "function fillContractOrderArgs(Order calldata order, bytes calldata signature, uint256 amount, uint256 takerTraits, bytes calldata args) public",
    ]),
  },
} as const
