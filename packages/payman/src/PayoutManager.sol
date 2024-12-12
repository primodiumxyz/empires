// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {console} from "forge-std/console.sol";

/**
 * @title  PayoutManager (c) Primodium 2024
 * @author Kethic <kethic@primodium.com> @kethcode
 * @notice A contract that manages the distribution of winnings to the players of Primodium Empires.
 */

contract PayoutManager {
    /*//////////////////////////////////////////////////////////////
                            DATA STRUCTURES
    //////////////////////////////////////////////////////////////*/
    struct Winner {
        address winner;
        uint256 payout;
    }

    /*//////////////////////////////////////////////////////////////
                            VARIABLES
    //////////////////////////////////////////////////////////////*/
    address private owner;
    address private payoutSystem;
    mapping(uint256 roundNumber => Winner[]) private winners;

    mapping(address winner => uint256 payout) public balances;
    uint256 public currentRound;

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor() {
        owner = msg.sender;
        currentRound = 1;
    }

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier onlyAuthorized() {
        require(
            (msg.sender == owner) || (msg.sender == payoutSystem),
            "[PAYMAN] Only authorized can manage payout system"
        );
        _;
    }

    /*//////////////////////////////////////////////////////////////
                            CORE LOGIC
    //////////////////////////////////////////////////////////////*/
    function record(
        address[] memory _victors,
        uint256[] memory _gains
    ) public payable onlyAuthorized {
        require(
            _victors.length == _gains.length,
            "[PAYMAN] Winners and balances length mismatch"
        );

        uint256 allocated = 0;

        for (uint256 i = 0; i < _victors.length; i++) {
            winners[currentRound].push(Winner(_victors[i], _gains[i]));
            balances[_victors[i]] = balances[_victors[i]] + _gains[i];
            allocated = allocated + _gains[i];
        }

        require(allocated <= msg.value, "[PAYMAN] Insufficient msg.value");
    }

    function incrementRound() external onlyAuthorized {
        currentRound = currentRound + 1;
    }

    function winnersByRound(
        uint256 _roundNumber
    ) external view returns (Winner[] memory) {
        return winners[_roundNumber];
    }

    function withdraw() external {
        uint256 payout = balances[msg.sender];
        require(payout > 0, "[PAYMAN] No balances available for this address");
        balances[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "[PAYMAN] Payout call failed");
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN LOGIC
    //////////////////////////////////////////////////////////////*/
    function getOwner() external view returns (address) {
        return owner;
    }

    function changeOwner(address _newOwner) external onlyAuthorized {
        owner = _newOwner;
    }

    function getPayoutSystem() external view returns (address) {
        return payoutSystem;
    }

    function setPayoutSystem(address _payoutSystem) external onlyAuthorized {
        payoutSystem = _payoutSystem;
    }
}
