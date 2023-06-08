import { Chalk, chalkStderr, type ChalkInstance } from 'chalk';
import { parse, type AstNode } from './parser.js';
import { render } from './styler.js';

interface ChalkResult {
	rendered: String;
	ast: AstNode;
}

type StyleResult = string | ChalkResult;

type TaggedTemplateHandler = (
	pieces: TemplateStringsArray,
	...args: any[]
) => StyleResult;
type ArgsHandler = (...args: any[]) => StyleResult;

type StyleHandler = TaggedTemplateHandler | ArgsHandler;

function styler(
	chalk: ChalkInstance,
	options?: {
		returnAstNode?: boolean;
		startTag?: string;
		endTag?: string;
	}
): StyleHandler {
	function styleTaggedTemplate(...args: any[]): StyleResult;
	function styleTaggedTemplate(
		pieces: TemplateStringsArray,
		...args: any[]
	): StyleResult {
		const { startTag = '{', endTag = '}' } = options || {};
		if (Array.isArray(pieces) && 'raw' in pieces) {
			const ast = parse({ startTag, endTag }, pieces, ...args);
			const rendered = render(chalk, ast);
			if (options && options.returnAstNode) {
				return { rendered, ast };
			}
			return rendered;
		} else {
			const interleave = (array: any, obj: any) =>
				[].concat(...array.map((n: any) => [n, obj])).slice(0, -1);
			const ast = parse(
				{ startTag, endTag },
				interleave([pieces as any, ...args], ' ')
			);
			const rendered = render(chalk, ast);
			if (options && options.returnAstNode) {
				return { rendered, ast };
			}
			return rendered;
		}
	}
	return styleTaggedTemplate;
}

export const makeTaggedTemplate = (chalkInstance) => {
	styler(chalkInstance);
};

export default styler(new Chalk());

export const templateStderr = styler(chalkStderr);
export const chalkTemplateStderr = styler(chalkStderr);
