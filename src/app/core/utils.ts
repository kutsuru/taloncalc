import { MobSize, Element } from "./models";

/*** map Mob Size (string) to number */
export const MOB_SIZE_MODIFIER: { [key in MobSize]: number } = {
    small: 0,
    medium: 1,
    large: 2
}

/*** map waepon element to Element (string) */
export const WEAPON_ELE: Element[] = ["neutral", "water", "earth", "fire", "wind", "poison", "holy", "shadow", "ghost", "undead"];

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