import { csvEscape } from './src/lib/utils';

const testCases = [
    { name: "Normal string", input: "Hello World", expected: "Hello World" },
    { name: "Comma", input: "Hello, World", expected: '"Hello, World"' },
    { name: "Quote", input: 'Hello "World"', expected: '"Hello ""World"""' },
    { name: "Newline", input: "Hello\nWorld", expected: '"Hello\nWorld"' },
    { name: "Formula =", input: "=SUM(1,2)", expected: "'=SUM(1,2)" },
    { name: "Formula @", input: "@target", expected: "'@target" },
    { name: "Formula +", input: "+123", expected: "'+123" },
    { name: "Formula -", input: "-456", expected: "'-456" },
];

console.log("CSV Escape Logic Verification:");
testCases.forEach(tc => {
    const result = csvEscape(tc.input);
    const passed = result === tc.expected;
    console.log(`${passed ? '[PASS]' : '[FAIL]'} ${tc.name}: Input[${tc.input}] -> Output[${result}]`);
});
