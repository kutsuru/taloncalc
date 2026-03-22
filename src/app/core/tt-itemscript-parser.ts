/*** types ***/
type CommandNode = { type: "Command", command: string, args: string[] };
export type IfNode = { type: "IfStatement", condition: string, then: ASTNode[], else?: ASTNode[], elseIf?: IfNode };
type AssignmentNode = { type: "Assignment", name: string, value: string };
export type ASTNode = CommandNode | IfNode | AssignmentNode;

/*** definitions ***/
export const VARB_PREFIX = '_var';

/*** class ***/
export class TTItemScriptParser {
    private _pos: number;
    private _tokens: string[] = [];

    constructor(script: string) {
        this._pos = 0;
        this._tokens = this._tokenize(script);
    }

    private _tokenize(str: string) {
        const regex = /\s*({|}|&&|==|!=|!|\(|\)|,|;|"|else if|if|else|[a-zA-Z_]\w*|-?\d+)\s*/g;
        return str.split(regex).filter(t => t && t.trim().length > 0);
    }

    private _peek() { return this._tokens[this._pos]; }
    private _consume() { return this._tokens[this._pos++]; }

    private _parseStatement(): ASTNode | null {
        const token = this._peek();

        if (token === "if") {
            return this._parseIf();
        }
        else if (token === "}") {
            this._consume();
            return null;
        }
        else if (token.startsWith(VARB_PREFIX) && this._pos + 1 < this._tokens.length && this._tokens[this._pos + 1] == '=') {
            return this._parseAssignment();
        }
        else {
            return this._parseCommand();
        }
    }

    private _parseIf(): IfNode {
        this._consume(); // if
        this._consume(); // (
        let condition = "";
        let depth = 1;
        while (depth > 0) {
            let t = this._consume();
            if (t === "(") depth++;
            if (t === ")") depth--;
            if (depth > 0) condition += " " + t;
        }

        const block = this._parseBlock();
        let alternate: any = null;

        let node: IfNode = { type: "IfStatement", condition: condition.trim(), then: block };
        if (this._peek() === "else if") {
            alternate = this._parseIf(); // Rekursiv für else if
            node.elseIf = alternate;
        } else if (this._peek() === "else") {
            this._consume(); // else
            alternate = this._parseBlock();
            node.else = alternate;
        }
        return node;
    }

    private _parseBlock(): ASTNode[] {
        if (this._peek() === "{") {
            this._consume();
            const statements: ASTNode[] = [];
            while (this._peek() !== "}" && this._pos < this.tokens.length) {
                const s = this._parseStatement();
                if (s) statements.push(s);
            }
            this._consume(); // }
            return statements;
        } else {
            return [this._parseCommand()];
        }
    }

    private _parseCommand(): CommandNode {
        const name = this._consume();
        const args: string[] = [];
        // consume args until we find ";" or end of script
        while (this._pos < this.tokens.length && this._peek() !== ";") {
            let currentExpr = "";
            let bracketLevel = 0;

            // consume arg until "," but ignore "," in brackets ()
            // example: bonus bStr, callfunc("MyFunc", 10, 20) + 5;
            while (this._pos < this.tokens.length) {
                const token = this._peek();
    
                if (token === "(" || token === '{') bracketLevel++;
                if (token === ")" || token === '}') bracketLevel--;
                // console.log(token, bracketLevel);
                // seperator reached?
                // if ((token === "," && bracketLevel === 0) || (token === ";" && bracketLevel === 0) || (token === "}" && bracketLevel === 0)) {
                if ((token === "," && bracketLevel === 0) || (token === ";" && bracketLevel === 0)) {
                    break;
                }

                currentExpr += this._consume();
            }
            args.push(currentExpr.trim());

            // if "," is coming, we consume it and continie with the next arg
            if (this._peek() === ",") {
                this._consume();
            } else {
                break; // Ende des Befehls erreicht
            }
        }

        if (this._peek() === ";") this._consume();
        return { type: "Command", command: name, args: args };
    }
    private _parseAssignment(): AssignmentNode {
        const name = this._consume();
        this._consume(); // =
        let value = '';
        while (this._pos < this.tokens.length && this._peek() !== ';') {
            value += this._consume();
        }
        if (this._peek() === ';') this._consume();   // skip ';'
        return { type: "Assignment", name: name, value: value };
    }

    parse() {
        const nodes: ASTNode[] = [];
        // console.log(this.tokens);
        while (this._pos < this.tokens.length) {
            const node = this._parseStatement();
            if (node) nodes.push(node);
        }
        return nodes;
    }

    get tokens(): readonly string[] {
        return this._tokens;
    }
}