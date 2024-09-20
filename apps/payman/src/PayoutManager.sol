// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract PayoutManager {
    struct Winner {
        address winner;
        uint256 payout;
    }

    address private immutable owner;
    mapping(address winner => uint256 payout) public winnings;
    mapping(uint256 roundNumber => Winner[]) private winners;
    uint256 public lastRound;

    constructor() {
        owner = msg.sender;
    }

    function record(
        address[] memory _winners,
        uint256[] memory _winnings,
        uint256 _roundNumber
    ) public payable {
        require(msg.sender == owner, "[PAYMAN] Only owner can add winners");
        require(
            _winners.length == _winnings.length,
            "[PAYMAN] Winners and winnings length mismatch"
        );
        require(
            _roundNumber > lastRound,
            "[PAYMAN] Round number must be greater than last round"
        );

        uint256 allocated = 0;

        for (uint256 i = 0; i < _winners.length; i++) {
            winners[_roundNumber].push(Winner(_winners[i], _winnings[i]));
            winnings[_winners[i]] = winnings[_winners[i]] + _winnings[i];
            allocated = allocated + _winnings[i];
        }

        lastRound = _roundNumber;
        require(
            allocated == msg.value,
            "[PAYMAN] Incorrect winnings allocation"
        );
    }

    function withdraw() external {
        uint256 payout = winnings[msg.sender];
        require(payout > 0, "[PAYMAN] No winnings available for this address");
        winnings[msg.sender] = 0;
        (bool callSuccess, ) = payable(msg.sender).call{value: payout}("");
        require(callSuccess, "[PAYMAN] Payout call failed");
    }

    function winnersByRound(
        uint256 _roundNumber
    ) external view returns (Winner[] memory) {
        return winners[_roundNumber];
    }
}
