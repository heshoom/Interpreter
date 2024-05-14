class Interpreter {
    constructor() {
        this.symbol_table = {};
        this.tokens = [];
        this.line_number = 0;
    }

    tokenize(code) {
        this.tokens = code.match(/\s*(---|-|\+\+|--|[A-Za-z_][A-Za-z0-9_]*|\d+|\S)\s*/g);
    }

    get_next_token() {
        return this.tokens.shift() || null;
    }

    parse_assignment() {
        let identifier = this.get_next_token();
        if (this.get_next_token() !== '=') {
            return ['error', this.line_number];
        }
        if (this.tokens.length && this.tokens[0] === ';') {
            this.symbol_table[identifier] = null; // Assign None for simple assignment without expression
            this.get_next_token(); // Consume the semicolon
            return [null, this.line_number];
        }
        let [expr_value, error_line] = this.parse_expr();
        if (expr_value === 'error' || !this.tokens.length || this.tokens[0] !== ';') {
            return ['error', error_line];
        }
        this.symbol_table[identifier] = expr_value;
        return [this.get_next_token(), this.line_number]; // Return the semicolon
    }

    parse_expr() {
        let negations = 0;
        while (this.tokens.length && this.tokens[0] === '---') {
            negations += 1;
            this.get_next_token(); // consume '---'
        }
        let [value, error_line] = this.parse_term();
        if (value === 'error') {
            return ['error', error_line];
        }
        if (negations % 2 === 1) {
            value = -value;
        }
        while (this.tokens.length && ['+', '-'].includes(this.tokens[0])) {
            let op = this.get_next_token();
            let [rhs, error_line] = this.parse_term();
            if (rhs === 'error') {
                return ['error', error_line];
            }
            if (op === '+') {
                value += rhs;
            } else {
                value -= rhs;
            }
        }
        return [value, error_line];
    }

    parse_term() {
        let [value, error_line] = this.parse_fact();
        while (this.tokens.length && this.tokens[0] === '*') {
            this.get_next_token(); // consume '*'
            let [rhs, error_line] = this.parse_fact();
            if (rhs === 'error') {
                return ['error', error_line];
            }
            value *= rhs;
        }
        return [value, error_line];
    }

    parse_fact() {
        let negations = 0;
        while (this.tokens.length && ['-', '+', '++', '--'].includes(this.tokens[0])) {
            let token = this.get_next_token();
            if (token === '-') {
                negations += 1;
            } else if (token === '+') {
                negations -= 1;
            } else if (token === '++') {
                continue;
            } else if (token === '--') {
                negations += 2;
            }
        }

        let token = this.get_next_token();
        if (/^\d+$/.test(token)) {
            if (token !== '0' && token.replace(/^0+/, '') !== token) {
                return ['error', this.line_number];
            }
            value = parseInt(token);
        } else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token)) {
            if (!this.symbol_table.hasOwnProperty(token)) {
                return ['error', this.line_number];
            }
            value = this.symbol_table[token];
        } else if (token === '(') {
            let [value, error_line] = this.parse_expr();
            if (!this.tokens.length || this.get_next_token() !== ')') {
                return ['error', error_line];
            }
        } else {
            return ['error', this.line_number];
        }

        while (this.tokens.length && this.tokens[0] === '/') {
            this.get_next_token(); // consume '/'
            let [rhs, error_line] = this.parse_fact();
            if (rhs === 'error') {
                return ['error', error_line];
            }
            if (rhs === 0) {
                console.log(`Division by zero in line ${this.line_number}`);
                return ['error', this.line_number];
            }
            value /= rhs;
        }

        return [negations % 2 ? -value : value, this.line_number];
    }

    interpret(code) {
        this.symbol_table = {}; // Clear the symbol table before each interpretation
        this.line_number = 0;
        code.split('\n').forEach(line => {
            this.line_number += 1;
            this.tokenize(line.trim());
            let [result, error_line] = this.parse_assignment();
            if (result === 'error') { // Check for errors in assignment
                console.log(`Error in line ${error_line}: ${line}`);
                return;
            }
        });
        for (let [varName, val] of Object.entries(this.symbol_table)) {
            console.log(`${varName} = ${val}`);
        }
    }
}

const interpreter = new Interpreter();

function process_hardcoded_inputs() {
    const input1 = 'x = 001;';
    const input2 = 'x_2 = 0;';
    const input3 = 'x = 0\ny = x;\nz = ---(x+y);';
    const input4 = 'x = 1;\ny = 2;\nz = ---(x+y)*(x+-y);';

    console.log("\n\n");
    console.log("Input 1:\n" + input1);
    console.log("Output 1:");
    interpreter.interpret(input1);
    console.log("\n\n");

    console.log("Input 2:\n" + input2);
    console.log("Output 2:");
    interpreter.interpret(input2);
    console.log("\n\n");

    console.log("Input 3:\n" + input3);
    console.log("Output 3:");
    interpreter.interpret(input3);
    console.log("\n\n");

    console.log("Input 4:\n" + input4);
    console.log("Output 4:");
    interpreter.interpret(input4);
}

function process_file_input() {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question("Enter the file name: ", (file_name) => {
        try {
            const fs = require('fs');
            const input_code = fs.readFileSync(file_name, 'utf8');
            console.log(`\nInput Code:\n${input_code}\n`);
            interpreter.interpret(input_code);
        } catch (err) {
            console.log(`File '${file_name}' not found.`);
        } finally {
            readline.close();
        }
    });
}

// Prompt user for option
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question("Enter 1 to process hardcoded inputs or 2 to provide a file name: ", (option) => {
    if (option === '1')
