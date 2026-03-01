/*** types ***/
type CommandNode = { type: "Command", command: string, args: string[] };
type IfNode = { type: "IfStatement", condition: string, then: ASTNode[], else?: ASTNode[], elseIf?: IfNode };
type ASTNode = CommandNode | IfNode;
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
        } else if (token === "}") {
            this._consume();
            return null;
        } else {
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
        while (this._peek() !== ";" && this._pos < this.tokens.length) {
            let arg = this._consume();
            if (arg !== ",") args.push(arg.replace(/"/g, ''));
        }
        this._consume(); // ;
        return { type: "Command", command: name, args: args };
    }

    parse() {
        const nodes: ASTNode[] = [];
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