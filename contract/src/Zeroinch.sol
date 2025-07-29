// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import {IVerifier} from "./Verifier.sol";
import "solidity-utils/mixins/OnlyWethReceiver.sol";
import {} from "limit-order-protocol";

contract Zeroinch {
    IVerifier verifier;
    enum OrderType {
        SimpleLimit,
        TWAP
    }
    enum OrderStatus {
        Open,
        PartiallyFilled,
        Done,
        Cancelled
    }

    event newNote(bytes32 indexed noteHash, bytes32 indexed SecretHash);

    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
    }

    function _verify(
        bytes calldata _proof,
        bytes32[] calldata _publicInputs
    ) internal view {
        require(verifier.verify(_proof, _publicInputs));
    }
}
