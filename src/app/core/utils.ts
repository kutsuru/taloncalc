/*** imports ***/
import { MobRace, Element, MobSize, DBJob } from "./tt-models.v3";

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
    private _map: Map<K, T> = new Map();

    constructor(private _default: T) { }

    public has(key: K) {
        return this._map.has(key);
    }
    public get(key: K) {
        return this._map.get(key) ?? this._default;
    }
    public set(key: K, value: T) {
        this._map.set(key, value);
        return this;    // FIXME: needed?
    }
    public toJSON(): Record<K, T> {
        let result: Record<K, T> = {} as any;
        this._map.forEach((value, key) => {
            result[key] = value;
        });
        return result;
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
/***************************/
/*** DB helper functions ***/
/*** parse a MobRace string from DB file to match the type */
export const parseDBMobRace = (race: string): MobRace => {
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
export const parseDBElement = (eleString: string): Element => {
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
export const parseDBMobSize = (sizeString: string): MobSize => {
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
/*** parse JobClass into BaseClass string ***/
// https://github.com/rathena/rathena/blob/c1602bbf2e03c6cc8ac57f2ad7ad3326803ade56/src/common/mmo.hpp#L929
export const getBaseClass = (job: DBJob): string => {
    return '';
}