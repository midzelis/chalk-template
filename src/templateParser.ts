export interface Template {
	type: 'template';
	nodes: AstNode[];
	templateString: string;
	startTag: string;
	endTag: string;
}

export interface StyleTag {
	type: 'styletag';
	style: Style[];
	children: StyleTagChild[];
}
export interface EscapedStyleTag {
	type: 'escapedstyletag';
	value: string;
}

export interface Text {
	type: 'text';
	value: string;
}

export type AstNode = Template | StyleTag | EscapedStyleTag | Text;

export type StyleTagChild = StyleTag | EscapedStyleTag | Text;

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
	fghex: string | false;
	bghex: string | false;
}

export type Style = TextStyle | RgbStyle | HexStyle;

type ConsumeWhileFunction = (
	char: string
) => boolean | { positionOffset?: number };

function addKey<Type>(object: Type | undefined): (Type & Keyed) | undefined {
	if (object === undefined) return undefined;
	// filter out invert
	const key = JSON.stringify(object, (key, value) =>
		key === 'invert' ? undefined : value
	);
	const ret = {
		...object,
		key,
	};
	Object.defineProperty(ret, 'key', {
		enumerable: false,
		value: key,
	});
	return ret;
}

type Options = {
	startTag?: string;
	endTag?: string;
};

type Position = {
	part: number;
	partpos: number;
};
export function parse(
	options: Options = {},
	templateString: string,
	temp: TemplateStringsArray,
	...args: any[]
): Template {
	debugger;
	const { startTag = '{', endTag = '}' } = options;

	const parts: string[][] = [];
	parts.push([...temp[0]]);
	for (let index = 1; index < temp.length; index++) {
		parts.push([...args[index - 1]]);
		parts.push([...temp[index]]);
	}

	let part = 0;
	let partpos = 0;

	function savepos(): Position {
		return {
			part,
			partpos,
		};
	}
	function charAdvance() {
		const c = char();
		adjustPos(1);
		return c;
	}
	function adjustPos(amount: number): undefined {
		let remainder = amount;
		while (remainder != 0) {
			if (
				partpos + remainder < parts[part].length &&
				partpos + remainder >= 0
			) {
				partpos += remainder;
				remainder = 0;
			} else if (partpos + remainder < 0) {
				if (part === 0) {
					partpos += remainder;
					return undefined;
				}
				remainder += partpos + 1;
				part--;
				partpos = parts[part].length - 1;
			} else if (partpos + remainder > parts[part].length - 1) {
				if (part === parts.length - 1) {
					partpos += remainder;
					return undefined;
				}
				remainder = remainder - 1 - (parts[part].length - 1 - partpos);
				part++;
				partpos = 0;
			}
		}
		return undefined;
	}
	function char() {
		return parts[part]?.[partpos];
	}
	function remainder() {
		let chars = [];
		chars.push(...parts[part].slice(partpos));
		for (let i = part; i < parts.length; i++) {
			chars.push(...parts[i]);
		}
		return chars.reduce((prev, curr) => prev + curr);
	}
	return parseTemplate();

	function parseTemplate(): Template {
		const nodes: AstNode[] = [];
		for (;;) {
			const node = parseNode();
			if (node===false) break;
			nodes.push(node);
		}
		if (part != parts.length - 1 && partpos != parts[parts.length - 1].length)
			nodes.push({
				type: 'text',
				value: remainder(),
			});
		return {
			type: 'template',
			nodes,
			templateString,
			startTag,
			endTag,
		};
	}

	function parseNode(): StyleTag | EscapedStyleTag | Text | false {
		// directly check for escaped here
		return parseChalkTemplate() ?? parseText();
	}

	function parseChalkTemplate(): StyleTag | false {
		debugger;
		const original = savepos();
		let body: StyleTagChild[] = [];
		let style: Style[] | false;
		if (consume(startTag)) {
			style = parseStyles();
			if (!style) return reset(original);
			for (;;) {
				debugger;
				const node = parseNode();
				if (!node) break;
				body.push(node);
			}
			if (!consume(endTag)) return reset(original);
			return {
				type: 'styletag',
				style,
				children: body,
			};
		}
		return undefined;
	}

	function parseText(): Text | false {
		const untilStartOrEndTagExclusive = () => {
			let match = '';
			return (char: string) => {
				const backtrack = match + char;
				if (backtrack.endsWith(startTag))
					return {
						positionOffset: -startTag.length,
					};
				else if (backtrack.endsWith(endTag))
					return {
						positionOffset: -endTag.length,
					};
				match += char;
				return true;
			};
		};
		const value = consumeWhile(untilStartOrEndTagExclusive());
		if (value === false) return value;

		return {
			type: 'text',
			value,
		};
	}

	function parseStyles(): Style[] | false {
		const original = savepos();
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
			adjustPos(-1);
		}
		if (styles.length === 0) return undefined;
		return styles;
	}

	function parseHexStyle(invert: boolean): HexStyle | false {
		const original = savepos();
		const hash = consume('#');
		if (hash) {
			const fghex = consumeWhile((char) => /[0-9a-fA-F]/.test(char));
			let bghex: string | false;
			if (consume(':')) {
				bghex = consumeWhile((char) => /[0-9a-fA-F]/.test(char));
				if (bghex === false) return reset(original);
			} else {
				// no seperator, that means there must be a foreground value
				if (fghex === false) return reset(original);
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
		const original = savepos();
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

	function parseTextStyle(invert: boolean): TextStyle | false {
		const original = savepos();
		const style = consumeWhile((char) => /[^\s\\.]/.test(char));
		if (style === false) return reset(original);
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

	function consume(segment: string): boolean {
		const original = savepos();
		let prev = null;
		for (let j = 0; j < segment.length; j++) {
			const char = charAdvance();
			if (char === '\\') {
				if (prev !== '\\') {
					return reset(original);
				}
			}
			if (char !== segment[j]) {
				return reset(original);
			}
			prev = char;
		}
		return true;
	}

	function consumeWhile(fn: ConsumeWhileFunction): string | false {
		const original = savepos();
		let ret = '';
		let prev = null;
		for (;;) {
			const char = charAdvance();
			if (char === undefined) {
				adjustPos(-1);
				break;
			} else if (char === '\\') {
				if (prev !== '\\') {
					prev = char;
					continue;
				}
			}
			const action = prev === '\\' || fn(char);
			if (action === true) {
				ret += char;
			} else if (action === false) {
				adjustPos(-1);
				break;
			} else if (action) {
				adjustPos(action.positionOffset || 0);
				break;
			}
			prev = char;
		}
		if (partpos != original.partpos || part != original.part) {
			return ret;
		}
		return false;
	}

	function reset(index: Position): false {
		partpos = index.partpos;
		part = index.part;
		return false;
	}

	function consumeNumber() {
		return consumeWhile(isDigit);
	}

	function consumeWhitespace() {
		consumeWhile(isWhitespace);
	}
	function isWhitespace(char: string) {
		// prettier-ignore
		return char === ' '
			|| char === '\n'
			|| char === '\t'
			|| char === '\r'
			|| char === '\f'
			|| char === '\v'
			|| char === '\u00a0'
			|| char === '\u1680'
			|| char === '\u2000'
			|| char === '\u200a'
			|| char === '\u2028'
			|| char === '\u2029'
			|| char === '\u202f'
			|| char === '\u205f'
			|| char === '\u3000'
			|| char === '\ufeff'
	}
	function isDigit(char: string) {
		return char >= '0' && char <= '9';
	}
}
