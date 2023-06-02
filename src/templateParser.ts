import type { ChalkInstance } from 'chalk';

export interface TemplateNode {
	type: 'template';
	nodes: AstNode[];
	templateString: string;
}

export interface ChalkTemplate {
	type: 'chalktemplate';
	style: Style[];
	body: ChalkTemplateBodyNode[];
}

export interface TextNode {
	type: 'text';
	value: string;
}

export type AstNode = TemplateNode | ChalkTemplate | TextNode;

export type ChalkTemplateBodyNode = ChalkTemplate | TextNode;

export interface Keyed {
	key: string;
}
export interface TextStyle extends Keyed {
	type: 'textstyle';
	invert: boolean;
	value: string;
}
export interface RgbStyle extends Keyed {
	type: 'rgbstyle';
	invert: boolean;
	rgb?: RGB;
	bgRgb?: RGB;
}
export interface RGB {
	red: number;
	green: number;
	blue: number;
}
export interface HexStyle extends Keyed {
	type: 'hexstyle';
	invert: boolean;
	fghex?: string;
	bghex?: string;
}

export type Style = TextStyle | RgbStyle | HexStyle;

function addKey<Type>(object: Type | undefined): (Type & Keyed) | undefined {
	if (object) {
		// filter out invert
		const key = JSON.stringify(object, (key, value) =>
			key === 'invert' ? undefined : value
		);
		Object.defineProperty(object, 'key', {
			get: () => key,
		});
		return <Type & Keyed>object;
	}
	return <Type & Keyed>object;
}

const startTemplate = '{';
const endTemplate = '}';

export function parse(
	chalk: ChalkInstance,
	templateString: string
): TemplateNode {
	let position = 0;

	return parseTemplate();

	function parseTemplate(): TemplateNode {
		const nodes: AstNode[] = [];
		for (;;) {
			const node = parseNode();
			if (!node) break;
			nodes.push(node);
		}
		return {
			type: 'template',
			nodes,
			templateString,
		};
	}

	function parseNode(): ChalkTemplate | TextNode | undefined {
		return parseChalkTemplate() ?? parseText();
	}

	function parseChalkTemplate(): ChalkTemplate | undefined {
		const original = position;
		let body: ChalkTemplateBodyNode[] = [];
		let style: Style[] | undefined;
		if (consume(startTemplate)) {
			style = parseStyles();
			if (!style) return reset(original);
			for (;;) {
				const node = parseNode();
				if (!node) break;
				body.push(node);
			}
			if (!consume(endTemplate)) return reset(original);
			return {
				type: 'chalktemplate',
				style,
				body,
			};
		}
		return undefined;
	}

	function parseText(): TextNode {
		const textmatcher = () => {
			let match = '';
			return (char: string) => {
				const matchesStart = () => (match + char).endsWith(startTemplate);
				const matchesEnd = () => (match + char).endsWith(endTemplate);
				if (matchesStart() || matchesEnd())
					return {
						kind: 'reject',
						amount: startTemplate.length - 1,
					};
				match += char;
				return true;
			};
		};
		const value = consumeWhile(textmatcher());
		if (value === undefined) return undefined;

		return {
			type: 'text',
			value,
		};
	}

	function parseStyles(): Style[] | undefined {
		const original = position;
		const styles: Style[] = [];
		for (;;) {
			const invert = consume('~');
			const style =
				parseHexStyle(invert) ??
				parseRgbStyle(invert, 'rgb') ??
				parseRgbStyle(invert, 'bgRgb') ??
				parseTextStyle(invert);
			if (!style) break;
			styles.push(style);
			if (!consume('.')) break;
		}
		// There must be whitespace following the style, to delineate end of style
		// If the whitespace is ' ', then it is swallowed, otherwise it is preserved
		const nextSpace = consumeNextWhitespace();
		if (!nextSpace) return reset(original);
		if (nextSpace !== ' ') {
			position--;
		}
		if (styles.length === 0) return undefined;
		return styles;
	}

	function parseHexStyle(invert: boolean): HexStyle | undefined {
		const original = position;
		const hash = consume('#');
		if (hash) {
			const fghex = consumeWhile((char) => /[0-9a-fA-F]/.test(char));
			let bghex: string | undefined;
			if (consume(':')) {
				bghex = consumeWhile((char) => /[0-9a-fA-F]/.test(char));
				if (!bghex) return reset(original);
			} else {
				// no seperator, that means there must be a foreground value
				if (!fghex) return reset(original);
			}
			return addKey({
				type: 'hexstyle',
				invert,
				fghex,
				bghex,
			});
		}
		return undefined;
	}
	function parseRgbStyle(
		invert: boolean,
		kind: 'rgb' | 'bgRgb'
	): RgbStyle | undefined {
		const original = position;
		const rgb = consume(kind);
		if (rgb) {
			consumeWhitespace();
			const lparen = consume('(');
			if (!lparen) reset(original);
			consumeWhitespace();
			const red = consumeNumber();
			if (!red) reset(original);
			consumeWhitespace();
			consume(',');
			consumeWhitespace();
			const green = consumeNumber();
			if (!green) reset(original);
			consumeWhitespace();
			consume(',');
			consumeWhitespace();
			const blue = consumeNumber();
			if (!blue) reset(original);
			consumeWhitespace();
			const rparen = consume(')');
			if (!rparen) reset(original);
			return addKey({
				type: 'rgbstyle',
				invert,
				[kind]: {
					red,
					green,
					blue,
				},
			});
		}
		return undefined;
	}

	function parseTextStyle(invert: boolean): TextStyle | undefined {
		const original = position;
		const style = consumeWhile((char) => /[^\s\\.]/.test(char));
		if (!style) return reset(original);
		if (!chalk[style]) return reset(original);
		return addKey({
			type: 'textstyle',
			invert,
			value: style,
		});
	}

	function consumeNextWhitespace() {
		const nextWhiteSpace = () => {
			let limit = 1;
			return (char: string) => {
				if (limit === 0) return false;
				limit--;
				return /\s/.test(char);
			};
		};
		return consumeWhile(nextWhiteSpace());
	}

	function consume(segment: string): boolean | undefined {
		for (let j = 0; j < segment.length; j++) {
			if (templateString[position + j] !== segment[j]) {
				return undefined;
			}
		}
		position += segment.length;
		return true;
	}

	function consumeWhile(
		fn: (char: string) => boolean | { kind: string; amount: number }
	): string | undefined {
		let newIndex = position;
		let adjust = 0;
		while (templateString[newIndex] != null) {
			const action = fn(templateString[newIndex]);
			if (action === true) newIndex++;
			else if (action === false) break;
			else if (action.kind === 'reject') {
				adjust = -action.amount;
				break;
			}
		}
		if (newIndex > position) {
			const result = templateString.substring(position, newIndex + adjust);
			position = newIndex + adjust;
			return result;
		}
		return undefined;
	}

	function reset(index: number): undefined {
		position = index;
		return undefined;
	}

	function consumeNumber() {
		return consumeWhile((char) => /\d/.test(char));
	}

	function consumeWhitespace() {
		consumeWhile((char) => /\s/.test(char));
	}
}
