import { parseAbi } from "viem"

export const contracts = {
  zeroinch: {
    address: "0x439D9c9DaC4579570946343cA2d484de9c352f38",
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
      "function withdraw(address asset, uint256 amount, address to, uint256 nonce) public",
      "event NewLeaf(bytes32 indexed secretHash, bytes32 indexed noteHash, uint256 indexed insertedIndex)",
    ]),
  },
  limit: {
    address: "0x111111125421ca6dc452d289314280a0f8842a65",
    abi: parseAbi([
      "struct Order { uint256 salt; uint256 maker; uint256 receiver; uint256 makerAsset; uint256 takerAsset; uint256 makingAmount; uint256 takingAmount; uint256 makerTraits; }",
      "function fillContractOrder(Order calldata order, bytes calldata signature, uint256 amount, uint256 takerTraits) public",
      "function fillContractOrderArgs(Order calldata order, bytes calldata signature, uint256 amount, uint256 takerTraits, bytes calldata args) public",
    ]),
  },
  router: {
    address: "0xe592427a0aece92de3edee1f18e0157c05861564",
    abi: parseAbi([
      "function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut)",
      "struct ExactInputSingleParams { address tokenIn; address tokenOut; uint24 fee; address recipient; uint256 deadline; uint256 amountIn; uint256 amountOutMinimum; uint160 sqrtPriceLimitX96; }",
    ]),
  },
  quoter: {
    address: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    abi: parseAbi([
      "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)",
    ]),
  },
} as const
