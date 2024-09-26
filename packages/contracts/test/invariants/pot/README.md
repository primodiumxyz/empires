These stateful fuzzing tests check that the pot is updated correctly thorough actions during the game.

The intended pot and rake values are mirrored and checked against the actual balances in the contract.

This _does not_ check for after-game withdrawals, which needs to be verified in a separate suite, as this requires an empire to actually win, and is done in a separate Paymaster contract.
