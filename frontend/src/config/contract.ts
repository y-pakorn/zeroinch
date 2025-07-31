import { parseAbi } from "viem"

export const contracts = {
  zeroinch: {
    address: "0xefd2c6c960d25e587bc7476288ce18972c97a91e",
    abi: parseAbi([
      "struct OrderNote { address assetAddress; uint256 amount; bytes32 cancelHash; }",
      "struct ZKPinput { bytes32 merkleRoot; bytes32 orderHash; bytes32 precompSecret; OrderNote orderAsset; address orderAmount; bytes32[2] nullifier; bytes32[2] newNoteHash; bytes proof; }",
      "function deposit(address asset, uint256 amount, bytes32 secretHash) public",
      "function order(ZKPinput calldata zkpInput) public",
      "function cancel(bytes32 orderHash, bytes32 preimage) public",
      "function roots(uint256 index) public view returns (bytes32)",
      "function currentRootIndex() public view returns (uint256)",
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
