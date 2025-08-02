// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.23;

import "forge-std/Script.sol";
import "../src/Zeroinch.sol";
import "../src/HonkVerifier.sol";

contract Deploy is Script {
    // ARB addresses
    address constant LIMIT_ORDER_PROTOCOL =
        0x111111125421cA6dc452d289314280a0f8842A65;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Verifier contract first
        console.log("Deploying Verifier...");
        HonkVerifier verifier = new HonkVerifier();
        console.log("Verifier deployed at:", address(verifier));

        // Deploy Zeroinch contract
        console.log("Deploying Zeroinch...");
        Zeroinch zeroinch = new Zeroinch(
            address(verifier),
            LIMIT_ORDER_PROTOCOL
        );
        console.log("Zeroinch deployed at:", address(zeroinch));

        vm.stopBroadcast();

        // Verification info
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Arbitrum");
        console.log("Limit Order Protocol:", LIMIT_ORDER_PROTOCOL);
        console.log("Verifier:", address(verifier));
    }
}
