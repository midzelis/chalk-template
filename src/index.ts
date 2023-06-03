import { Chalk, chalkStderr, type ChalkInstance } from 'chalk';
import { parse, type AstNode } from './templateParser.js';
import { renderChalk } from './templateRenderer.js';

interface ChalkResult {
	rendered: String;
	ast: AstNode;
}
function escape(string: string, startTag = '{', endTag = '}') {
	// return string.replaceAll(new RegExp(`(${startTag}|${endTag})`, 'g'), '$1$1');
	return string.replaceAll(new RegExp(`(${startTag}|${endTag}|\\\\)`, 'g'), '\\$1') 
}

function renderer(
	chalk: ChalkInstance,
	options?: {
		returnAstNode?: boolean;
		startTag?: string;
		endTag?: string;
	}
) {
	function renderTaggedTemplate(...args: any[]): string;
	function renderTaggedTemplate(
		pieces: TemplateStringsArray,
		...args: any[]
	): string | ChalkResult {
		const { startTag = '{', endTag = '}' } = options || {};
		let msg: string;
		const lastIdx = pieces.length - 1;
		if (
			Array.isArray(pieces) &&
			pieces.every(isString) &&
			lastIdx === args.length
		) {
			msg =
				args
					.map((a, i) => pieces[i] + escape(stringify(a), startTag, endTag))
					.join('') + pieces[lastIdx];
		} else {
			msg = [pieces, ...args.map(stringify)].join(' ');
		}
		const ast = parse({startTag, endTag}, msg, pieces, ...args);
		const rendered = renderChalk(chalk, ast);
		if (options && options.returnAstNode) {
			return { rendered, ast };
		}
		return rendered;
	}
	return renderTaggedTemplate;
}

function stringify(arg: any) {
	return `${arg}`;
}

function isString(obj: any) {
	return typeof obj === 'string';
}

export const chalkTemplateWithChalk = (chalk: ChalkInstance) => renderer(chalk);
export const chalkTemplate = renderer(new Chalk());
export const chalkTemplateStderr = renderer(chalkStderr);
/**
 * The AST is EXPERIMENTAL and subject to chance.
 */
export const chalkTemplateRenderer = renderer;
