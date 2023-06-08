import type { ChalkInstance } from 'chalk';
import type { AstNode, Style, Template } from './templateParser.js';

function unescape(string: string, startTag = '{', endTag = '}') {
	// return string.replaceAll(new RegExp(`(${startTag}|${endTag}){2}`, 'g'), '$1');
	// return string.replaceAll(new RegExp(`\\{2}`, 'g'), '\\');
	let result = '';
	for (let i = 0; i < string.length; i++) {
		const char = string[i];
		if (char === '\\') result += string[++i];
		else result += char;
	}
	return result;
}

function configChalk(chalk: ChalkInstance, styles: Map<String, Style>) {
	let currentChalk = chalk;
	for (const style of styles.values()) {
		if (style.type === 'hexstyle') {
			if (style.fghex) {
				currentChalk = currentChalk.hex('#' + style.fghex);
			}
			if (style.bghex) {
				currentChalk = currentChalk.bgHex('#' + style.bghex);
			}
		} else if (style.type === 'rgbstyle') {
			if (style.bgRgb) {
				const { red, green, blue } = style.bgRgb;
				currentChalk = currentChalk.bgRgb(red, green, blue);
			}
			if (style.rgb) {
				const { red, green, blue } = style.rgb;
				currentChalk = currentChalk.rgb(red, green, blue);
			}
		} else if (style.type === 'textstyle') {
			currentChalk = currentChalk[style.value];
		}
	}
	return currentChalk;
}

export function renderChalk(chalk: ChalkInstance, node: Template): string {
	let styles = new Map<String, Style>();
	function visitor(current: AstNode) {
		if (current.type === 'template') return current.nodes.map(visitor).join('');
		else if (current.type === 'text') return current.value;
		else if (current.type === 'styletag') {
			if (
				current.style &&
				current.style.length === 0 &&
				current.style[0].type === 'textstyle' &&
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
				if (style.type === 'textstyle' && style.value === 'style') {
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
					run += unescape(visitor(node));
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
