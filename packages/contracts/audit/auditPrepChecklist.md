# Audit Prep Checklist

## Review for CEI/FREI
https://www.nascent.xyz/idea/youre-writing-require-statements-wrong

- [x] packages/contracts/src/constants.sol
- [x] packages/contracts/src/Keys.sol (removed)
- [x] packages/contracts/src/Types.sol
- [x] packages/contracts/src/utils.sol
- [x] packages/contracts/src/adts/AcidPlanetsSet.sol
- [x] packages/contracts/src/adts/CitadelPlanetsSet.sol
- [x] packages/contracts/src/adts/EmpirePlanetsSet.sol
- [x] packages/contracts/src/adts/PlanetsSet.sol
- [x] packages/contracts/src/adts/PlayersMap.sol
- [x] packages/contracts/src/adts/PointsMap.sol
- [x] packages/contracts/src/libraries/InitPrice.sol
- [x] packages/contracts/src/libraries/LibAcid.sol
- [x] packages/contracts/src/libraries/LibMagnet.sol
- [x] packages/contracts/src/libraries/LibMoveShips.sol
- [x] packages/contracts/src/libraries/LibOverride.sol
- [x] packages/contracts/src/libraries/LibPoint.sol
- [x] packages/contracts/src/libraries/LibPrice.sol
- [x] packages/contracts/src/libraries/LibResolveCombat.sol
- [x] packages/contracts/src/libraries/LibRoutine.sol
- [ ] packages/contracts/src/libraries/LibShieldEater.sol
- [x] packages/contracts/src/systems/AdminSystem.sol
- [x] packages/contracts/src/systems/DevSystem.sol
- [x] packages/contracts/src/systems/EmpiresSystem.sol
- [x] packages/contracts/src/systems/OverrideAcidSystem.sol
- [x] packages/contracts/src/systems/OverrideAirdropSystem.sol
- [x] packages/contracts/src/systems/OverrideMagnetsSystem.sol
- [x] packages/contracts/src/systems/OverridePointsSystem.sol
- [ ] packages/contracts/src/systems/OverrideShieldEaterSystem.sol
- [x] packages/contracts/src/systems/OverrideShieldSystem.sol
- [x] packages/contracts/src/systems/OverrideShipSystem.sol
- [x] packages/contracts/src/systems/resetSubsystems/ResetClearLoopSubsystem.sol
- [x] packages/contracts/src/systems/ResetSystem.sol
- [ ] packages/contracts/src/systems/RewardsSystem.sol
- [x] packages/contracts/src/systems/updateSubsystems/UpdateAcidSubsystem.sol
- [x] packages/contracts/src/systems/updateSubsystems/UpdateEmpiresSubsystem.sol
- [x] packages/contracts/src/systems/updateSubsystems/UpdateMagnetsSubsystem.sol
- [x] packages/contracts/src/systems/updateSubsystems/UpdatePriceSubsystem.sol
- [ ] packages/contracts/src/systems/updateSubsystems/UpdateShieldEaterSubsystem.sol
- [x] packages/contracts/src/systems/UpdateSystem.sol
- [x] packages/contracts/src/systems/WithdrawRakeSystem.sol

## Review for NatSpec, external clarity
https://docs.soliditylang.org/en/develop/natspec-format.html

- [ ] packages/contracts/src/constants.sol
- [x] packages/contracts/src/Keys.sol (removed)
- [ ] packages/contracts/src/Types.sol
- [ ] packages/contracts/src/utils.sol
- [ ] packages/contracts/src/adts/AcidPlanetsSet.sol
- [ ] packages/contracts/src/adts/CitadelPlanetsSet.sol
- [ ] packages/contracts/src/adts/EmpirePlanetsSet.sol
- [ ] packages/contracts/src/adts/PlanetsSet.sol
- [ ] packages/contracts/src/adts/PlayersMap.sol
- [ ] packages/contracts/src/adts/PointsMap.sol
- [ ] packages/contracts/src/libraries/InitPrice.sol
- [ ] packages/contracts/src/libraries/LibAcid.sol
- [ ] packages/contracts/src/libraries/LibMagnet.sol
- [ ] packages/contracts/src/libraries/LibMoveShips.sol
- [ ] packages/contracts/src/libraries/LibOverride.sol
- [ ] packages/contracts/src/libraries/LibPoint.sol
- [ ] packages/contracts/src/libraries/LibPrice.sol
- [ ] packages/contracts/src/libraries/LibResolveCombat.sol
- [ ] packages/contracts/src/libraries/LibRoutine.sol
- [ ] packages/contracts/src/libraries/LibShieldEater.sol
- [ ] packages/contracts/src/systems/AdminSystem.sol
- [ ] packages/contracts/src/systems/DevSystem.sol
- [ ] packages/contracts/src/systems/EmpiresSystem.sol
- [ ] packages/contracts/src/systems/OverrideAcidSystem.sol
- [ ] packages/contracts/src/systems/OverrideAirdropSystem.sol
- [ ] packages/contracts/src/systems/OverrideMagnetsSystem.sol
- [ ] packages/contracts/src/systems/OverridePointsSystem.sol
- [ ] packages/contracts/src/systems/OverrideShieldEaterSystem.sol
- [ ] packages/contracts/src/systems/OverrideShieldSystem.sol
- [ ] packages/contracts/src/systems/OverrideShipSystem.sol
- [ ] packages/contracts/src/systems/resetSubsystems/ResetClearLoopSubsystem.sol
- [ ] packages/contracts/src/systems/ResetSystem.sol
- [ ] packages/contracts/src/systems/RewardsSystem.sol
- [ ] packages/contracts/src/systems/updateSubsystems/UpdateAcidSubsystem.sol
- [ ] packages/contracts/src/systems/updateSubsystems/UpdateEmpiresSubsystem.sol
- [ ] packages/contracts/src/systems/updateSubsystems/UpdateMagnetsSubsystem.sol
- [ ] packages/contracts/src/systems/updateSubsystems/UpdatePriceSubsystem.sol
- [ ] packages/contracts/src/systems/updateSubsystems/UpdateShieldEaterSubsystem.sol
- [ ] packages/contracts/src/systems/UpdateSystem.sol
- [ ] packages/contracts/src/systems/WithdrawRakeSystem.sol


## Review Test Coverage
Happy Path, failure modes, fuzzing and invariants

- [ ] packages/contracts/src/constants.sol
- [x] packages/contracts/src/Keys.sol (removed)
- [ ] packages/contracts/src/Types.sol
- [ ] packages/contracts/src/utils.sol
- [ ] packages/contracts/src/adts/AcidPlanetsSet.sol
- [ ] packages/contracts/src/adts/CitadelPlanetsSet.sol
- [ ] packages/contracts/src/adts/EmpirePlanetsSet.sol
- [ ] packages/contracts/src/adts/PlanetsSet.sol
- [ ] packages/contracts/src/adts/PlayersMap.sol
- [ ] packages/contracts/src/adts/PointsMap.sol
- [ ] packages/contracts/src/libraries/InitPrice.sol
- [ ] packages/contracts/src/libraries/LibAcid.sol
- [ ] packages/contracts/src/libraries/LibMagnet.sol
- [ ] packages/contracts/src/libraries/LibMoveShips.sol
- [ ] packages/contracts/src/libraries/LibOverride.sol
- [ ] packages/contracts/src/libraries/LibPoint.sol
- [ ] packages/contracts/src/libraries/LibPrice.sol
- [ ] packages/contracts/src/libraries/LibResolveCombat.sol
- [ ] packages/contracts/src/libraries/LibRoutine.sol
- [ ] packages/contracts/src/libraries/LibShieldEater.sol
- [ ] packages/contracts/src/systems/AdminSystem.sol
- [ ] packages/contracts/src/systems/DevSystem.sol
- [ ] packages/contracts/src/systems/EmpiresSystem.sol
- [ ] packages/contracts/src/systems/OverrideAcidSystem.sol
- [ ] packages/contracts/src/systems/OverrideAirdropSystem.sol
- [ ] packages/contracts/src/systems/OverrideMagnetsSystem.sol
- [ ] packages/contracts/src/systems/OverridePointsSystem.sol
- [ ] packages/contracts/src/systems/OverrideShieldEaterSystem.sol
- [ ] packages/contracts/src/systems/OverrideShieldSystem.sol
- [ ] packages/contracts/src/systems/OverrideShipSystem.sol
- [ ] packages/contracts/src/systems/resetSubsystems/ResetClearLoopSubsystem.sol
- [ ] packages/contracts/src/systems/ResetSystem.sol
- [ ] packages/contracts/src/systems/RewardsSystem.sol
- [ ] packages/contracts/src/systems/updateSubsystems/UpdateAcidSubsystem.sol
- [ ] packages/contracts/src/systems/updateSubsystems/UpdateEmpiresSubsystem.sol
- [ ] packages/contracts/src/systems/updateSubsystems/UpdateMagnetsSubsystem.sol
- [ ] packages/contracts/src/systems/updateSubsystems/UpdatePriceSubsystem.sol
- [ ] packages/contracts/src/systems/updateSubsystems/UpdateShieldEaterSubsystem.sol
- [ ] packages/contracts/src/systems/UpdateSystem.sol
- [ ] packages/contracts/src/systems/WithdrawRakeSystem.sol

