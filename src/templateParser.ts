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
export interface Text {
	type: 'text';
	value: string;
}

export type AstNode = Template | StyleTag | Text;

export type StyleTagChild = StyleTag  | Text;

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

type ConsumeWhileFunction = (char: string) =>
	| boolean
	| {
			accept: boolean;
			positionOffset: number;
	  };

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

type State = {
	part: number;
	partpos: number;
	styleStack: boolean[];
};
export function parse(
	options: Options = {},
	templateString: string,
	temp: string[],
	...args: any[]
): Template {
	const { startTag = '{', endTag = '}' } = options;
	debugger;
	const parts: string[][] = [];
	parts.push([...temp[0]]);
	for (let index = 1; index < temp.length; index++) {
		parts.push([...args[index - 1]]);
		parts.push([...temp[index]]);
	}

	let part = 0;
	let partpos = 0;
	let styleStack = [];
	let cachedChar: string | undefined;

	function saveState(): State {
		return {
			part,
			partpos,
			styleStack: [...styleStack],
		};
	}
	function isEscaped() {
		if (cachedChar === undefined) {
			cachedChar = prevChar();
		}
		return cachedChar === '\\';
	}
	function charAdvance() {
		let c = char();
		if (c === '\\' && !isEscaped()) {
			adjustPos(1);
			const newPrev = c;
			c = char();
			adjustPos(1);
			cachedChar = newPrev;
			return c;
		}
		adjustPos(1);
		return (cachedChar = c);
	}
	function adjustPos(amount: number): undefined {
		let remainder = amount;
		if (amount < 0 && cachedChar == '\\') {
			remainder--;
		}
		cachedChar = undefined;
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
					return;
				}
				remainder += partpos + 1;
				part--;
				partpos = parts[part].length - 1;
			} else if (partpos + remainder > parts[part].length - 1) {
				if (part === parts.length - 1) {
					partpos += remainder;
					return;
				}
				remainder = remainder - 1 - (parts[part].length - 1 - partpos);
				part++;
				partpos = 0;
			}
		}
		return;
	}
	function char() {
		return parts[part]?.[partpos];
	}
	function prevChar() {
		const saved = { part, partpos };
		adjustPos(-1);
		const c = parts[part]?.[partpos];
		part = saved.part;
		partpos = saved.partpos;
		return c;
	}
	function remainder() {
		if (
			part < 0 ||
			part > parts.length - 1 ||
			partpos < 0 ||
			partpos > parts[part].length - 1
		)
			return;
		let chars = [];
		chars.push(...parts[part].slice(partpos));
		for (let i = part + 1; i < parts.length; i++) {
			chars.push(...parts[i]);
		}
		return chars.reduce((prev, curr) => prev + curr);
	}
	return parseTemplate();

	function parseTemplate(): Template {
		const nodes: AstNode[] = [];
		for (;;) {
			const node = parseNode();
			if (!node) break;
			nodes.push(node);
		}
		const value = remainder();
		if (value) {
			nodes.push({
				type: 'text',
				value,
			});
		}

		return {
			type: 'template',
			nodes,
			templateString,
			startTag,
			endTag,
		};
	}

	function parseNode(): StyleTag | Text | undefined {
		// directly check for escaped here
		return parseChalkTemplate() ?? parseText();
	}

	function isOdd(x: number): boolean {
		return !!(x & 1);
	}

	function parseChalkTemplate(): StyleTag | undefined {
		debugger;
		// this is an escaped arg
		if (isOdd(part) && !styleStack[styleStack.length - 1]) return;

		const original = saveState();
		let body: StyleTagChild[] = [];
		let style: Style[] | false;
		if (consumeStartTag()) {
			style = parseStyles();
			if (!style) return reset(original);
			if (
				style.length === 1 &&
				style[0].type === 'textstyle' &&
				style[0].value === 'style'
			) {
				if (isOdd(part) && partpos === 0) {
					// for style to apply, we must be at the start of an arg
					styleStack.push(true);
				}
			}

			for (;;) {
				const node = parseNode();
				if (!node) break;
				body.push(node);
			}
			if (!consumeEndTag()) return reset(original);
			styleStack = original.styleStack;
			return {
				type: 'styletag',
				style,
				children: body,
			};
		}
		return;
	}

	function consumeStartTag() {
		debugger;
		const original = saveState();
		const consumed = consume(startTag);
		if (consumed && isEscaped()) return reset(original);
		return consumed;
	}

	function consumeEndTag() {
		const original = saveState();
		const consumed = consume(endTag);
		if (consumed && isEscaped()) return reset(original);
		return consumed;
	}

	function parseText(): Text | undefined {
		if (isOdd(part) && !styleStack[styleStack.length - 1]) {
			const value = parts[part]
				.slice(partpos, parts[part].length)
				.reduce((a, b) => a + b);
			adjustPos(value.length);
			return {
				type: 'text',
				value,
			};
		}
		const untilStartOrEndTagExclusive = () => {
			let characters = '';
			let originalpart = part;
			return (char: string) => {
				const backtrack = characters.endsWith('\\')
					? characters
					: characters + char;
				if (backtrack.endsWith(startTag))
					return {
						accept: false,
						positionOffset: -startTag.length,
					};
				else if (backtrack.endsWith(endTag))
					return {
						accept: false,
						positionOffset: -endTag.length,
					};
				if (part != originalpart)
					return {
						accept: true,
						positionOffset: 0,
					};
				characters += char;
				return true;
			};
		};
		const value = consumeWhile(untilStartOrEndTagExclusive());
		if (value === undefined) return;
		return {
			type: 'text',
			value,
		};
	}

	function parseStyles(): Style[] | undefined {
		const original = saveState();
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
		if (styles.length === 0) return;
		// There must be whitespace following the style, to delineate end of style
		// If the whitespace is ' ', then it is swallowed, otherwise it is preserved
		const nextSpace = consumeNextWhitespace();
		if (!nextSpace) return reset(original);
		if (nextSpace !== ' ') {
			adjustPos(-1);
		}
		if (styles.length === 0) return;
		return styles;
	}

	function parseHexStyle(invert: boolean | undefined): HexStyle | undefined {
		const original = saveState();
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
		return;
	}
	function parseRgbStyle(
		invert: boolean | undefined,
		kind: 'rgb' | 'bgRgb'
	): RgbStyle | undefined {
		const original = saveState();
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
		return;
	}

	function parseTextStyle(invert: boolean | undefined): TextStyle | false {
		const original = saveState();
		const style = consumeWhile((char) => /[^\s\\.]/.test(char));
		if (!style) return reset(original);
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
				return isWhitespace(char);
			};
		};
		return consumeWhile(nextWhiteSpace());
	}

	function consume(segment: string): boolean {
		const original = saveState();
		for (let j = 0; j < segment.length; j++) {
			const char = charAdvance();
			if (char !== segment[j]) return reset(original);
		}
		return true;
	}

	function consumeWhile(fn: ConsumeWhileFunction): string | undefined {
		const original = saveState();
		let ret = '';

		for (;;) {
			const char = charAdvance();
			if (char === undefined) {
				adjustPos(-1);
				break;
			}
			const action = fn(char);
			if (action === true) {
				ret += char;
			} else if (action === false) {
				adjustPos(-1);
				break;
			} else {
				const { accept, positionOffset } = action;
				if (accept) ret += char;
				adjustPos(positionOffset);
				break;
			}
		}
		if (partpos != original.partpos || part != original.part) {
			return ret;
		}
		return;
	}

	function reset(index: State): undefined {
		partpos = index.partpos;
		part = index.part;
		styleStack = index.styleStack;
		return;
	}

	function consumeNumber() {
		return consumeWhile(isDigit);
	}

	function consumeWhitespace() {
		return consumeWhile(isWhitespace);
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
