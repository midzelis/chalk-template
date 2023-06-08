import { Chalk, chalkStderr } from 'chalk';
import { parse } from './templateParser.js';
import { renderChalk } from './templateRenderer.js';
function escape(string, startTag = '{', endTag = '}') {
    // return string.replaceAll(new RegExp(`(${startTag}|${endTag})`, 'g'), '$1$1');
    return string.replaceAll(new RegExp(`(${startTag}|${endTag}|\\\\)`, 'g'), '\\$1');
}
// function renderer(
// 	chalk: ChalkInstance,
// 	options?: {
// 		returnAstNode?: boolean;
// 		startTag?: string;
// 		endTag?: string;
// 	}
// ) {
// 	function renderTaggedTemplate(...args: any[]): string;
// 	function renderTaggedTemplate(
// 		pieces: TemplateStringsArray,
// 		...args: any[]
// 	): string | ChalkResult {
// 		const { startTag = '{', endTag = '}' } = options || {};
// 		let msg: string;
// 		const lastIdx = pieces.length - 1;
// 		if (
// 			Array.isArray(pieces) &&
// 			pieces.every(isString) &&
// 			lastIdx === args.length
// 		) {
// 			msg =
// 				args
// 					.map((a, i) => pieces[i] + stringify(a))
// 					.join('') + pieces[lastIdx];
// 		} else {
// 			msg = [pieces, ...args.map(stringify)].join(' ');
// 		}
// 		const ast = parse({startTag, endTag}, msg, pieces, ...args);
// 		const rendered = renderChalk(chalk, ast);
// 		if (options && options.returnAstNode) {
// 			return { rendered, ast };
// 		}
// 		return rendered;
// 	}
// 	return renderTaggedTemplate;
// }
function renderer(chalk, options) {
    function renderTaggedTemplate(pieces, ...args) {
        const { startTag = '{', endTag = '}' } = options || {};
        if (Array.isArray(pieces) && 'raw' in pieces) {
            const ast = parse({ startTag, endTag }, 'msg', pieces, ...args);
            const rendered = renderChalk(chalk, ast);
            if (options && options.returnAstNode) {
                return { rendered, ast };
            }
            return rendered;
        }
        else {
            const interleave = (array, obj) => [].concat(...array.map((n) => [n, obj])).slice(0, -1);
            const ast = parse({ startTag, endTag }, 'msg', interleave([pieces, ...args], ' '));
            const rendered = renderChalk(chalk, ast);
            if (options && options.returnAstNode) {
                return { rendered, ast };
            }
            return rendered;
        }
    }
    return renderTaggedTemplate;
}
function stringify(arg) {
    return `${arg}`;
}
function isString(obj) {
    return typeof obj === 'string';
}
export const chalkTemplateWithChalk = (chalk) => renderer(chalk);
export const chalkTemplate = renderer(new Chalk());
export const chalkTemplateStderr = renderer(chalkStderr);
/**
 * The AST is EXPERIMENTAL and subject to chance.
 */
export const chalkTemplateRenderer = renderer;

function a() {
    console.log('hi');
}
export default a