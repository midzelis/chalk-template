import { type ChalkInstance } from 'chalk';
import { parse, type ParserOptions, type TemplateNode } from './parser.js';
import { chalker } from './chalker.js';

export type ChalkedResult = {
	rendered: String;
	ast: TemplateNode;
};

export type DrawResult = string | ChalkedResult;

export type DrawOptions = ParserOptions & {
	returnAstNode?: boolean;
};

export function drawer(chalk: ChalkInstance, options?: DrawOptions) {
	function tagFunction(
		arg: TemplateStringsArray | any,
		...args: any[]
	): DrawResult {
		let parser: () => TemplateNode;
		if (Array.isArray(arg) && 'raw' in arg) {
			parser = () => parse(options, arg, ...args);
		} else {
			parser = () => parse(options, [arg, ...args]);
		}
		const ast = parser();
		const rendered = chalker(chalk, ast);
		if (options && options.returnAstNode) {
			return { rendered, ast };
		}
		return rendered;
	}
	return tagFunction;
}
