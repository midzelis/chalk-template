import {
	adjustPos,
	consume,
	consumeNextWhitespace,
	consumeNumber,
	consumeWhile,
	consumeWhitespace,
	getPart,
	isArgument,
	isEscaped,
	isStartOfArgument,
	consumeRemainder,
	reset,
	saveState,
	setSource,
	consumeRemainderOfPart,
	createError,
} from './source.js';
import { type State } from './source.js';

export interface TemplateNode {
	type: 'template';
	nodes: AstNode[];
	startTag: string;
	endTag: string;
}

export interface TagNode {
	type: 'tag';
	style: Style[];
	children: StyleTagChild[];
}
export interface TextNode {
	type: 'text';
	value: string;
}

export type AstNode = TemplateNode | TagNode | TextNode;

export type StyleTagChild = TagNode | TextNode;
export interface Keyed {
	key: string;
}
export interface TextStyle extends Keyed {
	style: 'text';
	invert: boolean;
	value: string;
}
export interface RgbStyle extends Keyed {
	style: 'rgb';
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
	style: 'hex';
	invert: boolean;
	fghex: string | false;
	bghex: string | false;
}

export type Style = TextStyle | RgbStyle | HexStyle;

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

export type ParserOptions = {
	startTag?: string;
	endTag?: string;
	strict?: boolean;
	compat?: boolean;
};

type StyleAndPosition = {
	position: State;
	styleStack: boolean[];
};

let startTag: string;
let endTag: string;
let styleStack: boolean[];
let compat: boolean;
let strict: boolean;
export function parse(
	options: ParserOptions = {},
	temp: ReadonlyArray<string>,
	...args: any[]
): TemplateNode {
	startTag = options.startTag || '{';
	endTag = options.endTag || '}';
	strict = options.strict || false;
	compat = options.compat || false;
	styleStack = [];
	debugger;
	setSource(temp, ...args);
	const nodes = parseNodes();
	startTag = endTag = styleStack = undefined;
	return {
		type: 'template',
		nodes,
		startTag,
		endTag,
	};
}

function parseNodes(): AstNode[] {
	const nodes: AstNode[] = [];
	for (;;) {
		const node = parseNode();
		if (!node) break;
		nodes.push(node);
	}
	const value = consumeRemainder();
	if (value) {
		if (compat) {
			if (strict) {
				const untilStartOrEndTagExclusive = () => {
					let characters = '';
					let originalpart = getPart();
					return (char: string) => {
						const escape = char === '\\';
						const escaping = characters.endsWith('\\');
						const backtrack = escaping ? characters : characters + char;
						if (backtrack.endsWith(endTag)) {
							error(
								`Found extraneous ${endTag} in Chalk template literal`,
								null
							);
						}

						characters += char;
						if (escape)
							return {
								stop: false,
								accept: false,
								positionOffset: 0,
							};
						return true;
					};
				};
				const value = consumeWhile(untilStartOrEndTagExclusive());
			}
		}
		nodes.push({
			type: 'text',
			value,
		});
	}
	return nodes;
}

function parseNode(): TagNode | TextNode | undefined {
	// directly check for escaped here
	return parseChalkTemplate() ?? parseText();
}

function saveStateAndStyleStack(): StyleAndPosition {
	return {
		position: saveState(),
		styleStack: [...styleStack],
	};
}
function restoreStateAndStyleStack(state: StyleAndPosition): undefined {
	reset(state.position);
	styleStack = state.styleStack;
	return;
}
function error(msg, cb) {
	createError(msg);
	return cb();
}

function parseChalkTemplate(): TagNode | undefined {
	// this is an escaped arg
	if (isArgument() && !styleStack[styleStack.length - 1]) return;

	const original = saveStateAndStyleStack();
	let body: StyleTagChild[] = [];
	let style: Style[] | false;
	if (consumeStartTag()) {
		style = parseStyles();
		if (!style)
			return error('Expected [TextStyle | RgbStyle | HexStyle]', () =>
				restoreStateAndStyleStack(original)
			);
		if (
			style.length === 1 &&
			style[0].style === 'text' &&
			style[0].value === 'style'
		) {
			if (isStartOfArgument()) {
				// for style to apply, we must be at the start of an arg
				styleStack.push(true);
			}
		}

		for (;;) {
			const node = parseNode();
			if (!node) break;
			body.push(node);
		}
		if (!consumeEndTag())
			return error(`Expected ${endTag}`, () =>
				restoreStateAndStyleStack(original)
			);
		styleStack = original.styleStack;
		return {
			type: 'tag',
			style,
			children: body,
		};
	}
	return;
}

function consumeStartTag() {
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

function parseText(): TextNode | undefined {
	if (isArgument() && !styleStack[styleStack.length - 1]) {
		const value = consumeRemainderOfPart();
		return {
			type: 'text',
			value,
		};
	}
	const untilStartOrEndTagExclusive = () => {
		let characters = '';
		let originalpart = getPart();
		return (char: string) => {
			const escape = char === '\\';
			const escaping = characters.endsWith('\\');
			const backtrack = escaping ? characters : characters + char;
			if (backtrack.endsWith(startTag))
				return {
					stop: true,
					accept: false,
					positionOffset: -startTag.length,
				};
			else if (backtrack.endsWith(endTag))
				return {
					stop: true,
					accept: false,
					positionOffset: -endTag.length,
				};
			else if (getPart() != originalpart)
				return {
					stop: true,
					accept: true,
					positionOffset: 0,
				};
			characters += char;
			if (escape)
				return {
					stop: false,
					accept: false,
					positionOffset: 0,
				};
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
			style: 'hex',
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
			style: 'rgb',
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
		style: 'text',
		invert,
		value: style,
	});
}
