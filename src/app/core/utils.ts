/*** imports ***/
import { BonusID, BonusSource } from "./item-script/tt-bonus-engine.service";
import { EquipIndexKey, MobClass, MobRace2 } from "./rAthena/ra-models";
import { DBWeaponType, DBMobClass, DBWeaponTypeKey, DBWeaponTypeValue, DBElement, ItemLocations, DBMobRace, DBMobRace2, DBMobSize, EquipLocation, CardTypes } from "./tt-models.v3";

/***************/
/*** General ***/
/*** create a debounced function ***/
export const debounce = <F extends (...args: Parameters<F>) => void>(callback: F, time: number) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const debounced = (...args: Parameters<F>) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => callback(...args), time);
    };

    return debounced;
}

/*** Map with default Value ***/
export class DefaultMap<K extends string | number | symbol, T> {
    #map: Map<K, T> = new Map();
    #factory: () => T;

    constructor(defaultValue: T | (() => T)) {
        this.#factory =
            typeof defaultValue === 'function'
                ? (defaultValue as () => T)
                : () => defaultValue;
    }

    public has(key: K) {
        return this.#map.has(key);
    }
    public get(key: K) {
        if (!this.#map.has(key)) {
            this.#map.set(key, this.#factory());
        }
        return this.#map.get(key)!;
    }
    public set(key: K, value: T) {
        this.#map.set(key, value);
        return this;    // FIXME: needed?
    }
    public entries() {
        return this.#map.entries();
    }
    public toJSON(): Record<K, T> {
        let result: Record<K, T> = {} as any;
        this.#map.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }
}
/*** Map with default value and only max. value will be stored */
export class DefaultMaxMap<K extends string | number | symbol> extends DefaultMap<K, number> {
    override set(key: K, value: number): this {
        const val = Math.max(this.get(key), value);
        return super.set(key, val);
    }
}
/*** Map with sorted values ***/
type Comperator<V> = (a: V, b: V) => number;
export class SuperMap<K, V> extends Map<K, V> {
    #comp: Comperator<V>;
    #sorted: V[] | null = null;

    constructor(compare: Comperator<V>, entries?: Iterable<readonly [K, V]>) {
        super(entries);
        this.#comp = compare;
    }

    /*** overrides ***/
    override clear(): void {
        this.#sorted = null;
        super.clear();
    }
    override delete(key: K): boolean {
        this.#sorted = null;
        return super.delete(key);
    }
    override set(key: K, value: V): this {
        this.#sorted = null;
        return super.set(key, value);
    }

    /*** public functions ***/
    valuesSorted(): V[] {
        /* sort of if not cached */
        if (this.#sorted === null) {
            this.#sorted = [...this.values()].sort(this.#comp);
        }
        /* destruct so its always a copy */
        return [...this.#sorted];
    }
}

/*** execute a math-formula with +,-,*,/ (Shunting-Yard-Algo) ***/
type MathOperator = '+' | '-' | '*' | '/';
const precedence: Record<MathOperator, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
};
export const execFormula = (formula: string[]): number => {
    const outputQueue: string[] = [];
    const operatorStack: MathOperator[] = [];

    // 1. Shunting-Yard Algorithmus (Infix zu RPN)
    formula.forEach((token) => {
        if (!isNaN(Number(token))) {
            outputQueue.push(token);
        } else if (token in precedence) {
            while (
                operatorStack.length > 0 &&
                precedence[operatorStack[operatorStack.length - 1]] >= precedence[token as MathOperator]
            ) {
                outputQueue.push(operatorStack.pop()!);
            }
            operatorStack.push(token as MathOperator);
        }
    });

    while (operatorStack.length > 0) {
        outputQueue.push(operatorStack.pop()!);
    }

    // 2. RPN auswerten
    const stack: number[] = [];

    outputQueue.forEach((token) => {
        if (!isNaN(Number(token))) {
            stack.push(Number(token));
        } else {
            const b = stack.pop()!;
            const a = stack.pop()!;
            switch (token) {
                case '+': stack.push(a + b); break;
                case '-': stack.push(a - b); break;
                case '*': stack.push(a * b); break;
                case '/': stack.push(a / b); break;
            }
        }
    });

    return stack[0];
}
const TWO_HANDED_WEAPON: Set<DBWeaponTypeKey> = new Set<DBWeaponTypeKey>([
    'Two-Handed Sword',
    'Two-Handed Spear',
    'Two-Handed Axe',
    'Bow',
    'Katar',
    'Two-handed staves',
    'Fuuma Shuriken',
    'Gatling Gun',
    'Shotgun',
    'Grenade Launcher'
]);
export const isTwoHandedWeapon = (dbWeaponType: DBWeaponTypeKey): boolean => {
    return TWO_HANDED_WEAPON.has(dbWeaponType);
}
/***************************/
/*** DB helper functions ***/
/*** parse a MobRace string from DB file to match the type */
export const parseDBMobRace = (race: string): DBMobRace => {
    switch (race) {
        case 'RC_Angel':
            return 'angel';
        case 'RC_Brute':
            return 'brute';
        case 'RC_DemiHuman':
            return 'demiHuman';
        case 'RC_Demon':
            return 'demon';
        case 'RC_Dragon':
            return 'dragon';
        case 'RC_Fish':
            return 'fish';
        case 'RC_Formless':
            return 'formless';
        case 'RC_Insect':
            return 'insect';
        case 'RC_Plant':
            return 'plant';
        case 'RC_Player_Human': //FIXME what class?
            return 'player';
        case 'RC_Undead':
            return 'undead';
        case 'RC_All':
            return 'all';
        default:
            console.log('Unknown mob race', race);
            return 'all'
    }
}
/*** parse a Element string from DB file to match the type */
export const parseDBElement = (eleString: string): DBElement => {
    switch (eleString) {
        case 'Ele_Dark':
            return 'shadow';
        case 'Ele_Earth':
            return 'earth';
        case 'Ele_Fire':
            return 'fire';
        case 'Ele_Ghost':
            return 'ghost';
        case 'Ele_Holy':
            return 'holy';
        case 'Ele_Neutral':
            return 'neutral';
        case 'Ele_Poison':
            return 'poison';
        case 'Ele_Undead':
            return 'undead';
        case 'Ele_Water':
            return 'water';
        case 'Ele_Wind':
            return 'wind';
        case 'Ele_All':
            return 'all';
        default:
            console.log('Unknown element', eleString);
            return 'all';
    }
}
/*** parse a MobSize string from DB file to match the type */
export const parseDBMobSize = (sizeString: string): DBMobSize => {
    switch (sizeString) {
        case 'Size_Small':
            return 'small';
        case 'Size_Medium':
            return 'medium';
        case 'Size_Large':
            return 'large'
        case 'Size_All':
            return 'all';
        default:
            console.log('Unknown size', sizeString);
            return 'all';
    }
}
/*** transform EquipIndex into EquipLocation ***/
export const getItemLocationFromIndex = (equipIndex: EquipIndexKey): ItemLocations | undefined => {
    switch (equipIndex) {
        case 'EQI_ACC_L':
            return 'lhAccessory';
        case 'EQI_ACC_R':
            return 'rhAccessory';
        case 'EQI_ARMOR':
            return 'armor';
        case 'EQI_GARMENT':
            return 'garment';
        case 'EQI_HAND_L':
            return 'leftHand';
        case 'EQI_HAND_R':
            return 'rightHand';
        case 'EQI_HEAD_LOW':
            return 'lowerHg';
        case 'EQI_HEAD_MID':
            return 'middleHg';
        case 'EQI_HEAD_TOP':
            return 'upperHg';
        case 'EQI_SHOES':
            return 'shoes';
        default:
            return undefined
    }
}
/*** parse MobRace2 itemscript type to match DB type ***/
export const parseDBMobRace2 = (race: string): DBMobRace2 => {
    switch (race as MobRace2) {
        case 'RC2_Goblin': return "goblin";
        case 'RC2_Golem': return "golem";
        case 'RC2_Orc': return "orc";
        case 'RC2_Kobold': return "kobold";
        case 'RC2_Manuk': return "manuk";
        case 'RC2_Splendide': return "splendide";
        case 'RC2_Biolab': return "biolab";
        case 'RC2_Guardian': return "guardian";
        case "RC2_Ninja": return "ninja";
        case "RC2_Faceworm": return "faceworm";
        case "RC2_Robot": return "robot";
        case "RC2_Emperium": return "emperium";
        case "RC2_Snake": return "snake";
        // return "kiel"; FIXME
        // return "juperos"; FIXME
        default:
            console.log('### UNKOWN MOBRACE2', race);
            return "unknown";
    }
}
/*** parse MobClass itemscript type to match DB type ***/
export const parseDBMobClass = (classStr: string): DBMobClass => {
    switch (classStr as MobClass) {
        case 'Class_All': return 'all';
        case 'Class_Boss': return 'boss';
        case 'Class_Guardian': return 'guardian';
        case 'Class_Normal': return 'normal';
    }
}
/*** parse equipLocation into CardType */
export const getCardTypeForEquipLocation = (loc: EquipLocation): CardTypes => {
    switch (loc) {
        case 'HeadgearUpper':
        case 'HeadgearMiddle':
            return 'Headgear';
        case 'Accessory':
            return 'Accessory';
        case 'Armor':
            return 'Armor';
        case 'Garment':
            return 'Garment';
        case 'Shield':
            return 'Shield';
        case 'Shoes':
            return 'Shoes';
        case 'Weapon':
            return 'Weapon';
        default:
            /* all other juse go for Armor */
            return 'Armor';
    }
}
/*** extract bonus into source and id */
export const extractBonusID = (bonus: BonusID): { source: BonusSource, id: number | string } => {
    let parts = bonus.split(':');
    return {
        source: parts[0] as BonusSource,
        id: parts[1]
    }
}