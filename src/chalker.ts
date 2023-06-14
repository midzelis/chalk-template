import type { ChalkInstance } from 'chalk';
import type { AstNode, Style, TemplateAstNode } from './parser.js';

function configChalk(chalk: ChalkInstance, styles: Map<String, Style>) {
	let currentChalk = chalk;
	for (const style of styles.values()) {
		if (style.style === 'hex') {
			if (style.fghex) {
				currentChalk = currentChalk.hex('#' + style.fghex);
			}
			if (style.bghex) {
				currentChalk = currentChalk.bgHex('#' + style.bghex);
			}
		} else if (style.style === 'rgb') {
			if (style.bgRgb) {
				const { red, green, blue } = style.bgRgb;
				currentChalk = currentChalk.bgRgb(red, green, blue);
			}
			if (style.rgb) {
				const { red, green, blue } = style.rgb;
				currentChalk = currentChalk.rgb(red, green, blue);
			}
		} else if (style.style === 'text') {
			if (!currentChalk[style.value]) {
				debugger;
				throw new Error(`Unknown Chalk style: ${style.value}`);
			}
			currentChalk = currentChalk[style.value];
		}
	}
	return currentChalk;
}

export function chalker(chalk: ChalkInstance, node: TemplateAstNode): string {
	let styles = new Map<String, Style>();
	function visitor(current: AstNode) {
		if (current.type === 'template') return current.nodes.map(visitor).join('');
		else if (current.type === 'text') return current.value;
		else if (current.type === 'tag') {
			if (
				current.style &&
				current.style.length === 0 &&
				current.style[0].style === 'text' &&
				current.style[0].value === 'style'
			) {
				debugger;
				let run = '';
				for (const node of current.children) {
					run += visitor(node);
				}
				return run;
			}
			debugger;
			const prevStyles = new Map<String, Style>(styles);

			for (const style of current.style) {
				const { key } = style;
				const { invert } = style;
				if (style.style === 'text' && style.value === 'style') {
					continue;
				}
				if (invert && styles.has(key)) {
					styles.delete(key);
					break;
				}
				styles.set(key, style);
			}
			let result = '';

			debugger;
			let run = '';
			function renderRun() {
				if (run.length > 0) {
					// process the style run
					const configured = configChalk(chalk, styles);
					if (configured) {
						result += configured(run);
						run = '';
					}
				}
			}
			for (const node of current.children) {
				if (node.type === 'text') {
					// run += unescape(visitor(node));
					run += visitor(node);
				} else {
					renderRun();
					result += visitor(node);
				}
			}
			renderRun();
			styles = prevStyles;
			return result;
		}
		return '';
	}
	return visitor(node);
}
