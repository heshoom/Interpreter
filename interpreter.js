class CustomInterpreter {
    constructor() {
        this.table_of_symbols = {};
        this.tokens_list = [];
        this.line_counter = 0;
    }

    split_into_tokens(code) {
        this.tokens_list = code.match(/\s*(---|-|\+\+|--|[A-Za-z_][A-Za-z0-9_]*|\d+|\S)\s*/g);
    }

    get_next() {
        return this.tokens_list.shift() || null;
    }

    parse_assignment_statement() {
        let identifier = this.get_next();
        if (this.get_next() !== '=') {
            return ['error', this.line_counter];
        }
        if (this.tokens_list.length && this.tokens_list[0] === ';') {
            this.table_of_symbols[identifier] = null; // Assign None for simple assignment without expression
            this.get_next(); // Consume the semicolon
            return [null, this.line_counter];
        }
        let [expr_value, error_line] = this.parse_expression();
        if (expr_value === 'error' || !this.tokens_list.length || this.tokens_list[0] !== ';') {
            return ['error', error_line];
        }
        this.table_of_symbols[identifier] = expr_value;
        return [this.get_next(), this.line_counter]; // Return the semicolon
    }

    parse_expression() {
        let negations = 0;
        while (this.tokens_list.length && this.tokens_list[0] === '---') {
            negations += 1;
            this.get_next(); // consume '---'
        }
        let [value, error_line] = this.parse_term();
        if (value === 'error') {
            return ['error', error_line];
        }
        if (negations % 2 === 1) {
            value = -value;
        }
        while (this.tokens_list.length && ['+', '-'].includes(this.tokens_list[0])) {
            let op = this.get_next();
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
        let [value, error_line] = this.parse_factor();
        while (this.tokens_list.length && this.tokens_list[0] === '*') {
            this.get_next(); // consume '*'
            let [rhs, error_line] = this.parse_factor();
            if (rhs === 'error') {
                return ['error', error_line];
            }
            value *= rhs;
        }
        return [value, error_line];
    }

    parse_factor() {
        let negations = 0;
        while (this.tokens_list.length && ['-', '+', '++', '--'].includes(this.tokens_list[0])) {
            let token = this.get_next();
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

        let token = this.get_next();
        if (/^\d+$/.test(token)) {
            if (token !== '0' && token.replace(/^0+/, '') !== token) {
                return ['error', this.line_counter];
            }
            value = parseInt(token);
        } else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token)) {
            if (!this.table_of_symbols.hasOwnProperty(token)) {
                return ['error', this.line_counter];
            }
            value = this.table_of_symbols[token];
        } else if (token === '(') {
            let [value, error_line] = this.parse_expression();
            if (!this.tokens_list.length || this.get_next() !== ')') {
                return ['error', error_line];
            }
        } else {
            return ['error', this.line_counter];
        }

        while (this.tokens_list.length && this.tokens_list[0] === '/') {
            this.get_next(); // consume '/'
            let [rhs, error_line] = this.parse_factor();
            if (rhs === 'error') {
                return ['error', error_line];
            }
            if (rhs === 0) {
                console.log(`Division by zero in line ${this.line_counter}`);
                return ['error', this.line_counter];
            }
            value /= rhs;
        }

        return [negations % 2 ? -value : value, this.line_counter];
    }

    run(code) {
        this.table_of_symbols = {}; // Clear the symbol table before each interpretation
        this.line_counter = 0;
        code.split('\n').forEach(line => {
            this.line_counter += 1;
            this.split_into_tokens(line.trim());
            let [result, error_line] = this.parse_assignment_statement();
            if (result === 'error') { // Check for errors in assignment
                console.log(`Error in line ${error_line}: ${line}`);
                return;
            }
        });
        for (let [varName, val] of Object.entries(this.table_of_symbols)) {
            console.log(`${varName} = ${val}`);
        }
    }
}

const customInterpreter = new CustomInterpreter();

function process_hardcoded_inputs() {
    const input1 = 'x = 001;';
    const input2 = 'x_2 = 0;';
    const input3 = 'x = 0\ny = x;\nz = ---(x+y);';
    const input4 = 'x = 1;\ny = 2;\nz = ---(x+y)*(x+-y);';

    console.log("\n\n");
    console.log("Input 1:\n" + input1);
    console.log("Output 1:");
    customInterpreter.run(input1);
    console.log("\n\n");

    console.log("Input 2:\n" + input2);
    console.log("Output 2:");
    customInterpreter.run(input2);
    console.log("\n\n");

    console.log("Input 3:\n" + input3);
    console.log("Output 3:");
    customInterpreter.run(input3);
    console.log("\n\n");

    console.log("Input 4:\n" + input4);
    console.log("Output 4:");
    customInterpreter.run(input4);
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
            customInterpreter.run(input_code);
        } catch (err) {
            console.log(`File '${file_name}' not found.`);
        } finally {
            readline.close();
        }
    });
}

// Prompt user for option
const readlineInterface = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readlineInterface.question("Enter 1 to process hardcoded inputs or 2 to provide a file name: ", (option) => {
    if (option === '1')
        process_hardcoded_inputs();
    else if (option === '2')
        process_file_input();
    else
        console.log("Invalid option. Please enter either 1 or 2.");
});
