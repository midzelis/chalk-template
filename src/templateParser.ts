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
	fghex?: string;
	bghex?: string;
}

export type Style = TextStyle | RgbStyle | HexStyle;

type ConsumeWhileFunction = (
	char: string
) => boolean | { kind: string; positionOffset?: number; valueOffset?: number };

function addKey<Type>(object: Type | undefined): Type & Keyed | undefined {
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
		value: key
	});
	return ret;
}

type Options = {
	startTag?: string,
	endTag?: string
}

export function parse(
	options: Options = {},
	templateString: string,
	temp: TemplateStringsArray,
	...args: any[]
): Template {
	const { startTag = '{', endTag = '}'} = options;

	const parts = []
	debugger;
	parts.push([...temp[0]] );

	for (let index = 1; index < temp.length; index++) {
		parts.push( [...args[index-1]] )
		parts.push( [...`${args[index]}`] )
	}


	let position = 0;
	return parseTemplate();

	function parseTemplate(): Template {
		const nodes: AstNode[] = [];
		for (;;) {
			const node = parseNode();
			if (!node) break;
			nodes.push(node);
		}
		if (position != templateString.length)
			nodes.push({
				type: 'text',
				value: templateString.substring(position, templateString.length),
			});
		return {
			type: 'template',
			nodes,
			templateString,
			startTag,
			endTag,
		};
	}

	function parseNode(): StyleTag | EscapedStyleTag | Text | undefined {
		// directly check for escaped here
		return  parseChalkTemplate() ?? parseText();
	}

	function parseChalkTemplate(): StyleTag | undefined {
		const original = position;
		let body: StyleTagChild[] = [];
		let style: Style[] | undefined;
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

	// function parseEscapedStyleTag(): EscapedStyleTag | undefined {
	// 	const original = position;
	// 	const doubleStart = startTag + startTag;
	// 	if (!consume(doubleStart)) return reset(original);
	// 	// read until a double end tag
	// 	const untilDoubleEndTagInclusive = () => {
	// 		let match = '';
	// 		return (char: string) => {
	// 			const backtrack = match + char;
	// 			if (backtrack.endsWith(endTag + endTag))
	// 				return {
	// 					kind: 'stop',
	// 					positionOffset: 1,
	// 					valueOffset: -doubleStart.length,
	// 				};
	// 			match += char;
	// 			return true;
	// 		};
	// 	};
	// 	const value = consumeWhile(untilDoubleEndTagInclusive());
	// 	if (!value) return undefined;
	// 	return {
	// 		type: 'escapedstyletag',
	// 		value,
	// 	};
	// }

	function parseText(): Text {
		const untilStartOrEndTagExclusive = () => {
			let match = '';
			return (char: string) => {
				const backtrack = match + char;
				if (backtrack.endsWith(startTag))
					return {
						kind: 'stop',
						positionOffset: -(startTag.length - 1),
					};
				else if (backtrack.endsWith(endTag))
					return {
						kind: 'stop',
						positionOffset: -(endTag.length - 1),
					};
				match += char;
				return true;
			};
		};
		const value = consumeWhile(untilStartOrEndTagExclusive());
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
		let escaped = 0;
		let prev = null;
		for (let j = 0; j < segment.length; j++) {
			const char = templateString[position+j];
			if (char === '\\') {
				if (prev !== '\\') {
					return undefined;
				} 
			}
			if (char !== segment[j]) {
				return undefined;
			}
			prev = char;
		}
		position += segment.length + escaped;
		return true;
	}

	function consumeWhile(fn: ConsumeWhileFunction): string | undefined {
		let newIndex = position;
		let valueOffset = 0;
		let prev = null;
		while (templateString[newIndex] != null) {
			const char = templateString[newIndex];
			if (char === '\\') {
				if (prev !== '\\') {
					prev = char;
					newIndex++
					continue;
				}
			}
			const action = prev === '\\' || fn(char);
			if (action === true) newIndex++;
			else if (action === false) break;
			else if (action.kind === 'stop') {
				newIndex += action.positionOffset || 0;
				valueOffset += action.valueOffset || 0;
				break;
			}
			prev = char;
		}
		if (newIndex > position) {
			const result = templateString.substring(position, newIndex + valueOffset);
			position = newIndex;
			return result;
		}
		return undefined;
	}

	function reset(index: number): undefined {
		position = index;
		return undefined;
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
