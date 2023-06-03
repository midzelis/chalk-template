#!/usr/bin/env ts-node
import { chalkTemplateRenderer } from './index.js';
import { Chalk } from 'chalk';
import { inspect } from 'node:util';
import type { AstNode, Style, Template } from './templateParser.js';

function unescape(string: string, startTag = '{', endTag = '}') {
	return string.replaceAll(new RegExp(`(${startTag}|${endTag}){2}`, 'g'), '$1');
}

function toString(node: Template) {
	function visitor(current: AstNode | Style) {
		if (current.type === 'template') return current.nodes.map(visitor).join('');
		else if (current.type === 'text') return unescape(current.value);
		else if (current.type === 'styletag')
			return `${node.startTag}${current.style
				.map(visitor)
				.join('.')} ${current.children.map(visitor).join('')}${node.endTag}`;
		else if (current.type === 'textstyle') {
			return `${current.invert ? '~' : ''}${current.value}`;
		} else if (current.type === 'hexstyle') {
			if (current.fghex && current.bghex)
				return current.invert
					? '~'
					: '' + '#' + current.fghex + ':' + current.bghex;
			else if (current.fghex && !current.bghex)
				return current.invert ? '~' : '' + '#' + current.fghex;
			else if (!current.fghex && current.bghex)
				return current.invert ? '~' : '' + '#:' + current.bghex;
		} else if (current.type === 'rgbstyle') {
			if (current.rgb) {
				const { red, green, blue } = current.rgb;
				return `rgb(${red},${green},${blue})`;
			} else {
				const { red, green, blue } = current.bgRgb;
				return `bgRgb(${red},${green},${blue})`;
			}
		}

		return '';
	}
	return visitor(node);
}

const debugRender = chalkTemplateRenderer(new Chalk(), { returnAstNode: true });

function test(result) {
	const ast = result.ast;
	const rendered = result.rendered;
	const templateString = ast.templateString;

	console.log(inspect(ast, { depth: null, colors: true }));
	console.log('template', templateString);
	console.log('toString', toString(ast));
	console.log(rendered);
}

function testRandom() {
	test(debugRender`{strikethrough.cyanBright.bgBlue ok {~strikethrough two}}`);
	test(debugRender`{bold.rgb (144 ,10,178).inverse Hello, {~inverse there!}}`);
	test(
		debugRender`{strikethrough.cyanBright.bgBlack Works with {reset {bold numbers}} {bold.red ${1}}}`
	);
	test(debugRender`{bold.bgRgb (144 ,10,178) Hello, there!}`);
	test(debugRender`{bold hello \\{in brackets\\}}`);
	test(debugRender`{abadstylethatdoesntexist this shouldn\'t work ever}`);
	test(debugRender`\u{AB}`);
	test(debugRender`This is a {bold \u{AB681}} test`);
	test(debugRender`{#FF0000 hello}`);
	test(debugRender`{#CCAAFF:AABBCC hello}`);
	test(debugRender`{#X:Y hello}`);
	test(debugRender`{bold hello`);
}

function testHex() {
	test(debugRender`{#:FF0000 hello}`);
	test(debugRender`{#00FF00:FF0000 hello}`);
	test(debugRender`{bold.#FF0000 hello}`);
	test(debugRender`{bold.#:FF0000 hello}`);
	test(debugRender`{bold.#00FF00:FF0000 hello}`);
	test(debugRender`{#FF0000.bold hello}`);
	test(debugRender`{#:FF0000.bold hello}`);
	test(debugRender`{#00FF00:FF0000.bold hello}`);
}
function testFn() {
	test(debugRender`debugRender`);
	test(debugRender`b${'c'}`);
	test(debugRender`${'d'}`);
	test(debugRender`${'e'}${'f'}`);
	test(debugRender`\b`);
	test(debugRender`${8}`);
	test(debugRender('hi'));
	test(debugRender('hi', 'a'));
}

function debug() {
	testRandom();
	testHex();
	testFn();
}
// testRandom();
// test(debugRender`{bold hello `);
// debug()
// test(debugRender`{bold.rgb(144,10,178).inverse Hello, {~inverse there!}}`);
// test(debugRender`{bold.bgRgb(144,10,178).inverse Hello, {~inverse there!}}`);

// test(debugRender`{bold hello ${'{red \\there}'} a ${'{red more}'}}{underline hi ${'b {inverse {a a} escape}'}}`);
// console.log("{bold hello ${'{red \\there}'} a ${'{red more}'}}{underline hi ${'b {inverse {a a} escape}'}}");

function rtest(string) {
	console.log("input: "+string);
	const ast = eval("debugRender`"+string+"`");
	console.log(inspect(ast, { depth: null, colors: true }));
	const templateString = ast.templateString;
	console.log("templateString="+templateString)
	console.log(ast.rendered)
}
function mtest(string) {
	console.log("input: "+string);

}
rtest("{bold style \{ \\ ${'{red !style \\ a \{ { } }'} after}remaining")
rtest("{bold style \{ \\ {style ${'{red !style \\ a \{ { } }'}} after}remaining")

mtest( `debugRender("{bold rendered ", "{red rendered}", {style: false, arg: "{red rendered}"}, "{green not rendered}", "}")` )