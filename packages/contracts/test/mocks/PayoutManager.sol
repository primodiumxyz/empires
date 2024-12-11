// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract PayoutManager {
    struct Winner {
        address winner;
        uint256 payout;
    }

    address private owner;
    mapping(address winner => uint256 payout) public balances;
    mapping(uint256 roundNumber => Winner[]) private winners;
    uint256 public currentRound;

    constructor() {
        owner = msg.sender;
        currentRound = 1;
    }

    function record(
        address[] memory _victors,
        uint256[] memory _gains
    ) public payable {
        require(msg.sender == owner, "[PAYMAN] Only owner can add winners");
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

        require(
            allocated == msg.value,
            "[PAYMAN] Incorrect balances allocation"
        );
    }

    function incrementRound() external {
        require(msg.sender == owner, "[PAYMAN] Only owner can increment round");
        currentRound = currentRound + 1;
    }

    function withdraw() external {
        uint256 payout = balances[msg.sender];
        require(payout > 0, "[PAYMAN] No balances available for this address");
        balances[msg.sender] = 0;
        (bool callSuccess, ) = payable(msg.sender).call{value: payout}("");
        require(callSuccess, "[PAYMAN] Payout call failed");
    }

    function winnersByRound(
        uint256 _roundNumber
    ) external view returns (Winner[] memory) {
        return winners[_roundNumber];
    }

    function changeOwner(address _newOwner) external {
        require(msg.sender == owner, "[PAYMAN] Only owner can change owner");
        owner = _newOwner;
    }

    function getOwner() external view returns (address) {
        return owner;
    }
}
