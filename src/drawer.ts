import { type ChalkInstance } from 'chalk';
import { parse, type AstNode, type ParserOptions } from './parser.js';
import { chalker } from './chalker.js';

type ChalkedResult = {
	rendered: String;
	ast: AstNode;
};

export type DrawResult = string | ChalkedResult;

export type DrawOptions = ParserOptions & {
	returnAstNode?: boolean;
};

function drawTag(
	chalk: ChalkInstance,
	options: DrawOptions,
	strings: TemplateStringsArray,
	...values: any[]
) {
	const ast = parse(options, strings, ...values);
	const rendered = chalker(chalk, ast);
	if (options && options.returnAstNode) {
		return { rendered, ast };
	}
	return rendered;
}

const interleave = (array: any, obj: any) =>
	[].concat(...array.map((n: any) => [n, obj])).slice(0, -1);

function drawArgs(
	chalk: ChalkInstance,
	options: DrawOptions,
	fnArg: any,
	...fnArgs: any[]
) {
	const ast = parse(options, interleave([fnArg, ...fnArgs], ' '));
	const rendered = chalker(chalk, ast);
	if (options && options.returnAstNode) {
		return { rendered, ast };
	}
}

export function drawer(chalk: ChalkInstance, options?: DrawOptions) {
	function tagFunction(
		arg: TemplateStringsArray | any,
		...args: any[]
	): DrawResult {
		if (Array.isArray(arg) && 'raw' in arg) {
			return drawTag(chalk, options, arg as TemplateStringsArray, ...args);
		}
		return drawArgs(chalk, options, arg, ...args);
	}
	return tagFunction;
}
