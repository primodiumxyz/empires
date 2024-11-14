## Payout Manager for Primodium Empires

need to set PRIVATE_KEY in .env

outputs payman.json to primodium empires/packages/contracts for use by PostDeploy script.

## deploying

`pnpm deploy:local`
or
`pnpm:deploy:base-sepolia`
or
`pnpm:deploy:base`

## testing

- spin up anvil
- in another terminal run `forge script script/DeployPayoutManager.s.sol --fork-url http://localhost:8545 --broadcast` from `/apps/payman`