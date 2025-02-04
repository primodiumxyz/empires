## Empires: Payout Manager

A vault contract for managing payouts to winners (anyone with a claim left) after each round.

It receives funds from the game for winners who didn't claim their payout in the previous round, and allows them to withdraw their funds.

This contract is fully managed through the [contracts](../contracts) package, which will deploy it and will output the address in the [`payman.json`](../contracts/payman.json) file in there as well.

## Testing

1. Spin up an anvil node:

   ```bash
   anvil
   ```

2. In another terminal, deploy the payout manager:

   ```bash
   forge script script/DeployPayoutManager.s.sol --fork-url http://localhost:8545 --broadcast
   ```

3. Run the tests:

   ```bash
   forge test
   ```
