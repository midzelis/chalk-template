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
} from './source.js';
import { type State } from './source.js';

export interface Template {
	type: 'template';
	nodes: AstNode[];
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

export type StyleTagChild = StyleTag | Text;

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

type StyleAndPosition = {
	position: State;
	styleStack: boolean[];
};

let startTag: string;
let endTag: string;
let styleStack: boolean[];
export function parse(
	options: Options = {},
	temp: string[],
	...args: any[]
): Template {
	startTag = options.startTag || '{';
	endTag = options.endTag || '}';
	styleStack = [];
	setSource(temp, args);
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
		nodes.push({
			type: 'text',
			value,
		});
	}
	return nodes;
}

function parseNode(): StyleTag | Text | undefined {
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
function parseChalkTemplate(): StyleTag | undefined {
	debugger;
	// this is an escaped arg
	if (isArgument() && !styleStack[styleStack.length - 1]) return;

	const original = saveStateAndStyleStack();
	let body: StyleTagChild[] = [];
	let style: Style[] | false;
	if (consumeStartTag()) {
		style = parseStyles();
		if (!style) return restoreStateAndStyleStack(original);
		if (
			style.length === 1 &&
			style[0].type === 'textstyle' &&
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
		if (!consumeEndTag()) return restoreStateAndStyleStack(original);
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
			else if (getPart() != originalpart)
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
