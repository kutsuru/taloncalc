# TTSessionInfoV3Service Signal Dependency Graph

This document describes the signal dependency relationships inside `src/app/core/tt-session-info.v3.service.ts`.

## Overview

`TTSessionInfoV3Service` uses Angular signals to manage a character build state. The service contains:

- base signals: raw inputs and storage signals
- computed signals: derived values calculated from base signals
- effects: constructor `effect()` blocks that write signals in response to other signal changes

## Base Signals

- `jobClassName`
- `level`
- `baseStatsPure`
- `#equipmentState` -> `equipment`
- `rightHandType`
- `leftHandType`
- `#sqiBonusState` -> `sqiBonus`
- `#skillsBuffState` -> `skillsBuff`
- `#skillsPassiveState` -> `skillsPassive`
- `#foodsStatsState` -> `foodsStats`
- `#foodsOtherState` -> `foodsOther`
- `speedPotion`
- `pet`
- `#autoBonusState` -> `autoBonus`

## Computed Signals

- `jobClass` <- `jobClassName`
- `skillsJob` <- `jobClass`
- `baseStats` <- `baseStatsPure`, `skillsPassive`
- `jobBonusStats` <- `jobClass`, `level`
- `bonus` <- `jobClass`, `level`, `equipment`, `baseStats`, `itemCombos`, `skillsBuff`, `skillsPassive`, `foodsStats`, `foodsOther`, `speedPotion`, `sqiBonus`, `pet`, `autoBonus`
- `totalStats` <- `baseStats`, `bonus`, `jobBonusStats`
- `itemCombos` <- `equipment`
- `levelMax` <- `jobClass`, `level`

## Derived Stats

- `maxHp` <- `totalStats`, `level`, `jobClass`, `bonus`
- `maxSp` <- `totalStats`, `level`, `jobClass`, `bonus`
- `baseAtk` <- `totalStats`, `bonus`, `rightHandType`
- `weaponAtk` <- `equipment`, `bonus`
- `atk` <- `baseAtk`, `weaponAtk`
- `hit` <- `level`, `totalStats`, `bonus`
- `flee` <- `level`, `totalStats`, `bonus`
- `aspd` <- `jobClass`, `totalStats`, `bonus`, `leftHandType`, `rightHandType`, `isDualWielding`
- `crit` <- `totalStats`, `bonus`, `rightHandType`
- `perfectDodge` <- `totalStats`, `bonus`
- `matkMin` <- `totalStats`, `bonus`
- `matkMax` <- `totalStats`, `bonus`
- `def` <- `equipment`, `bonus`, `leftHandType`
- `sqiEquipped` <- `equipment`, `jobClassName`
- `statPointsRemaining` <- `baseStats`, `level`, `jobClass`

## Inverted Dependency Tree

This view starts from derived output signals and shows the base signals that feed them.

### `atk`

- `atk`
  - `baseAtk`
    - `totalStats`
      - `baseStats`
        - `baseStatsPure`
        - `skillsPassive`
      - `jobBonusStats`
      - `bonus`
        - `jobClass`
          - `jobClassName`
        - `level`
        - `equipment`
          - `#equipmentState`
        - `itemCombos`
          - `equipment`
        - `skillsBuff`
          - `#skillsBuffState`
        - `skillsPassive`
          - `#skillsPassiveState`
        - `foodsStats`
          - `#foodsStatsState`
        - `foodsOther`
          - `#foodsOtherState`
        - `speedPotion`
        - `sqiBonus`
          - `#sqiBonusState`
        - `pet`
        - `autoBonus`
          - `#autoBonusState`
    - `rightHandType`
  - `weaponAtk`
    - `equipment`
    - `bonus`

### `maxHp` / `maxSp`

- `maxHp` / `maxSp`
  - `totalStats`
    - `baseStats`
      - `baseStatsPure`
      - `skillsPassive`
    - `jobBonusStats`
    - `bonus`
      - `jobClass`
        - `jobClassName`
      - `level`
      - `equipment`
      - `itemCombos`
      - `skillsBuff`
      - `skillsPassive`
      - `foodsStats`
      - `foodsOther`
      - `speedPotion`
      - `sqiBonus`
      - `pet`
      - `autoBonus`
  - `level`
  - `jobClass`

### `hit` / `flee`

- `hit` / `flee`
  - `totalStats`
    - `baseStats`
      - `baseStatsPure`
      - `skillsPassive`
    - `jobBonusStats`
    - `bonus`
      - `jobClass`
        - `jobClassName`
      - `level`
      - `equipment`
      - `itemCombos`
      - `skillsBuff`
      - `skillsPassive`
      - `foodsStats`
      - `foodsOther`
      - `speedPotion`
      - `sqiBonus`
      - `pet`
      - `autoBonus`
  - `level`

### `aspd`

- `aspd`
  - `totalStats`
    - `baseStats`
      - `baseStatsPure`
      - `skillsPassive`
    - `jobBonusStats`
    - `bonus`
      - `jobClass`
        - `jobClassName`
      - `level`
      - `equipment`
      - `itemCombos`
      - `skillsBuff`
      - `skillsPassive`
      - `foodsStats`
      - `foodsOther`
      - `speedPotion`
      - `sqiBonus`
      - `pet`
      - `autoBonus`
  - `leftHandType`
  - `rightHandType`
  - `isDualWielding`
  - `jobClass`

### `crit`

- `crit`
  - `totalStats`
    - `baseStats`
      - `baseStatsPure`
      - `skillsPassive`
    - `jobBonusStats`
    - `bonus`
      - `jobClass`
        - `jobClassName`
      - `level`
      - `equipment`
      - `itemCombos`
      - `skillsBuff`
      - `skillsPassive`
      - `foodsStats`
      - `foodsOther`
      - `speedPotion`
      - `sqiBonus`
      - `pet`
      - `autoBonus`
  - `rightHandType`

### `perfectDodge`

- `perfectDodge`
  - `totalStats`
    - `baseStats`
      - `baseStatsPure`
      - `skillsPassive`
    - `jobBonusStats`
    - `bonus`
      - `jobClass`
        - `jobClassName`
      - `level`
      - `equipment`
      - `itemCombos`
      - `skillsBuff`
      - `skillsPassive`
      - `foodsStats`
      - `foodsOther`
      - `speedPotion`
      - `sqiBonus`
      - `pet`
      - `autoBonus`

### `matkMin` / `matkMax`

- `matkMin` / `matkMax`
  - `totalStats`
    - `baseStats`
      - `baseStatsPure`
      - `skillsPassive`
    - `jobBonusStats`
    - `bonus`
      - `jobClass`
        - `jobClassName`
      - `level`
      - `equipment`
      - `itemCombos`
      - `skillsBuff`
      - `skillsPassive`
      - `foodsStats`
      - `foodsOther`
      - `speedPotion`
      - `sqiBonus`
      - `pet`
      - `autoBonus`

### `def`

- `def`
  - `equipment`
  - `bonus`
    - `jobClass`
      - `jobClassName`
    - `level`
    - `equipment`
    - `itemCombos`
    - `skillsBuff`
    - `skillsPassive`
    - `foodsStats`
    - `foodsOther`
    - `speedPotion`
    - `sqiBonus`
    - `pet`
    - `autoBonus`
  - `leftHandType`

### `levelMax`

- `levelMax`
  - `jobClass`
    - `jobClassName`
  - `level`

### `statPointsRemaining`

- `statPointsRemaining`
  - `baseStats`
    - `baseStatsPure`
    - `skillsPassive`
  - `level`
  - `jobClass`
    - `jobClassName`

### `skillsJob`

- `skillsJob`
  - `jobClass`
    - `jobClassName`

### `sqiEquipped`

- `sqiEquipped`
  - `equipment`
  - `jobClassName`

## Constructor Effect Writers

### effect 1 — core load

- writes: `jobClassName`, `#equipmentState` (via `updateEquipmentId('leftHand', 2150)`)
- triggers: `---`

### effect 2 — update equips if job class changes

- writes: `#equipmentState`
- reads: `jobClass`, `#equipmentState`

### effect 3 — load and map buff skills

- writes: `#skillsBuffState`
- reads: `#core.skillDB`

### effect 4 — load and map passive skills

- writes: `#skillsPassiveState`
- reads:  `jobClass`, `#core.skillDB`

### effect 5 — clear SQI bonus on SQI changes

- writes: `#sqiBonusState`
- reads: `sqiEquipped`

## Notes

- `bonus` is the central shared dependency for almost all derived stats.
- `totalStats` is calculated from `baseStats` + `bonus` + `jobBonusStats`.
- `itemCombos`, `skillsBuff`, `skillsPassive`, `foodsStats`, `foodsOther`, `speedPotion`, `pet` and `autoBonus` all feed into `bonus`.
- `baseStats` includes passive effects, such as `SN_NO_DEATH_BONUS`.
