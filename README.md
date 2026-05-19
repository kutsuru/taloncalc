# TalonTales Calc V2.0

## Stats calucation
The stats (STR,DEX,...) values are highly complex and derived via multiple signals. This section should help to understand the method.
### Relevant signals
All this signals are part of the `TTSessionInfoV3Service`<br>
All this signals are objects containing the keys `"str","agi","vit","int","dex","luk"`
- `baseStatsPure` - Lowest level of stats, which are set by the user (same as stat window in-game)
- `baseStats` - Resulting base stats; includes super-novice "No death bonus"
- `jobBonusStats` - Includes the bonus stats which are gained via job level of the selected class
- `bonus.stats` - Includes all stats which are added by equip, food, buffs, pets, etc
- `totalStats` - Resulting stats combined via `baseStats`+`jobBonusStats`+`bonus.stats`
### Dependencies
- `baseStatsPure` - No dependency (selected by user / UI)
- `baseStats` - Based on `baseStatsPure` and `skillsPassive` [SN No Death Bonus]
- `jobBonusStats` - Based on `jobClass` and `level`
- `bonus.stats` - Very big signal; details at <strong>tt-session-info-v3-service-signal-graph.md</strong>
- `totalStats` - Based on `baseStats` and `bonus` and `jobBonusStats`

## Custom items
Customs items (added only for the calc) will always start with and ID
100.001, 100.002, 100.003, ... (one hundread-thousend and)