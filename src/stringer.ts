import { type AstNode, type Style, type TemplateAstNode } from './parser';

export function toString(node: TemplateAstNode) {
	function styleToString(current: Style) {
		let ret = '';
		if (current.invert) ret += '~';
		if (current.style === 'hex') {
			if (current.fghex && current.bghex)
				ret += '#' + current.fghex + ':' + current.bghex;
			else if (current.fghex && !current.bghex) ret += '#' + current.fghex;
			else if (!current.fghex && current.bghex) ret += '#:' + current.bghex;
		} else if (current.style === 'rgb') {
			if (current.rgb) {
				const { red, green, blue } = current.rgb;
				ret += `rgb(${red},${green},${blue})`;
			} else if (current.bgRgb) {
				const { red, green, blue } = current.bgRgb;
				ret += `bgRgb(${red},${green},${blue})`;
			}
		} else if (current.style === 'text') {
			ret += current.value;
		}
		return ret;
	}
	function visitor(current: AstNode) {
		if (current.type === 'template') return current.nodes.map(visitor).join('');
		else if (current.type === 'text') return current.value;
		else if (current.type === 'tag')
			return `${node.startTag}${current.style
				.map(styleToString)
				.join('.')} ${current.children.map(visitor).join('')}${node.endTag}`;
		return '';
	}
	return visitor(node);
}
