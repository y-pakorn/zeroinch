// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import {IVerifier} from "./Verifier.sol";
import "@1inch/solidity-utils/contracts/mixins/OnlyWethReceiver.sol";
import {IPreInteraction} from "limit-order-protocol/interfaces/IPreInteraction.sol";
import {IPostInteraction} from "limit-order-protocol/interfaces/IPostInteraction.sol";
import {IOrderMixin} from "limit-order-protocol/interfaces/IOrderMixin.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./PoseidonT2.sol";
import "./PoseidonT3.sol";
import "./PoseidonT4.sol";
import "@1inch/solidity-utils/contracts/libraries/AddressLib.sol";

import "./MerkleTreeWithHistory.sol";

contract Zeroinch is
    IPreInteraction,
    IPostInteraction,
    MerkleTreeWithHistory(20)
{
    address private immutable _LIMIT_ORDER_PROTOCOL;
    using AddressLib for Address;

    modifier onlyLimitOrderProtocol() {
        if (msg.sender != _LIMIT_ORDER_PROTOCOL)
            revert OnlyLimitOrderProtocol();
        _;
    }
    error OnlyLimitOrderProtocol();
    IVerifier _verifier;
    enum OrderType {
        SimpleLimit,
        TWAP
    }
    enum OrderStatus {
        Open,
        Done,
        Cancelled
    }

    event newNote(
        bytes32 indexed noteHash,
        bytes32 indexed SecretHash,
        uint inserted_index
    );
    struct ZOrder {
        address asset;
        uint256 amount;
        bytes32 secretHash;
        bytes32 cancelHash;
    }

    mapping(bytes32 => bool) public nullifierHashes;
    mapping(bytes32 => bool) public insertedNotes;
    mapping(bytes32 => ZOrder) public zeroinchOrder;
    mapping(bytes32 => OrderStatus) public orderStatus;

    constructor(address _verifierAddress, address limitOrderProtocol) {
        _verifier = IVerifier(_verifierAddress);
        _LIMIT_ORDER_PROTOCOL = limitOrderProtocol;
    }

    function _verify(
        bytes calldata _proof,
        bytes32[] calldata _publicInputs
    ) internal view {
        require(_verifier.verify(_proof, _publicInputs));
    }

    function _createNote(
        address asset,
        uint256 amount,
        bytes32 secretHash
    ) internal {
        bytes32 noteHash = bytes32(
            PoseidonT4.hash(
                [uint256(uint160(asset)), uint256(amount), uint256(secretHash)]
            )
        );
        require(!insertedNotes[noteHash]);
        uint256 inserted_index = _insert(noteHash);
        insertedNotes[noteHash] = true;
        emit newNote(noteHash, secretHash, inserted_index);
    }

    function deposit(bytes32 secretHash, address asset, uint256 amount) public {
        // Handle ERC20 deposit
        require(IERC20(asset).transferFrom(msg.sender, address(this), amount));
        _createNote(asset, amount, secretHash);
    }

    function order() public {}
    function withdraw(
        address asset,
        uint256 amount,
        address to,
        uint256 nonce
    ) public {
        bytes32 orderHash = keccak256(
            abi.encodePacked(asset, amount, to, nonce)
        );
        require(orderStatus[orderHash] == OrderStatus.Open);
        require(zeroinchOrder[orderHash].asset == asset);
        require(zeroinchOrder[orderHash].amount == amount);

        orderStatus[orderHash] = OrderStatus.Done;

        IERC20(asset).transfer(to, amount);
    }

    function preInteraction(
        IOrderMixin.Order calldata order,
        bytes calldata extension,
        bytes32 orderHash,
        address taker,
        uint256 makingAmount,
        uint256 takingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external {
        require(orderStatus[orderHash] == OrderStatus.Open);
        require(zeroinchOrder[orderHash].asset == order.makerAsset.get());
        require(zeroinchOrder[orderHash].amount == order.makingAmount);
        IERC20(order.makerAsset.get()).approve(
            _LIMIT_ORDER_PROTOCOL,
            order.makingAmount
        );
    }

    function cancel(bytes32 orderHash, bytes32 preimage) external {
        require(keccak256(preimage) == zeroinchOrder[orderHash].cancelHash);
        orderStatus[orderHash] = OrderStatus.Cancelled;
        _createNote(
            zeroinchOrder[orderHash].asset,
            zeroinchOrder[orderHash].amount,
            zeroinchOrder[orderHash].secretHash
        );
    }

    function postInteraction(
        IOrderMixin.Order calldata order,
        bytes calldata extension,
        bytes32 orderHash,
        address taker,
        uint256 makingAmount,
        uint256 takingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external {
        orderStatus[orderHash] = OrderStatus.Done;
        _createNote(
            order.takerAsset.get(),
            takingAmount,
            zeroinchOrder[orderHash].secretHash
        );
    }

    /**
     * @notice Checks if orderHash signature was signed with real order maker.
     */
    function isValidSignature(
        bytes32 orderHash,
        bytes calldata
    ) external view returns (bytes4) {
        if (orderStatus[orderHash] == OrderStatus.Open) {
            return IERC1271.isValidSignature.selector;
        } else {
            return 0xffffffff;
        }
    }
}
