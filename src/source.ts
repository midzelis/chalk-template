interface ConsumeWhileFunction {
	(char: string):
		| boolean
		| {
				stop: boolean;
				accept: boolean;
				positionOffset: number;
		  };
}
export interface Position {
	part: number;
	partpos: number;
}

let parts: string[][];
let part: number;
let partpos: number;

let cachedChar: string | undefined;

/**
 * Only exposed for testing
 */
export function getFullState() {
	return {
		parts,
		part,
		partpos,
		cachedChar,
	};
}

export function setFullState(state: any) {
	parts = state.parts;
	part = state.part;
	partpos = state.partpos;
	cachedChar = state.cachedChar;
}

export function clearSource() {
	cachedChar = undefined;
	parts = [];
	part = 0;
	partpos = 0;
}

export function setSource(temp: ReadonlyArray<string>, ...args: any[]) {
	clearSource();
	parts.push([...temp[0]]);
	for (let index = 1; index < temp.length; index++) {
		if (args.length - (index - 1) < 0) {
			parts.push([]);
		} else {
			parts.push([...`${args[index - 1]}`]);
		}
		parts.push([...temp[index]]);
	}
}

export function getPart() {
	return part;
}

export function isStartOfArgument() {
	return isArgument() && partpos === 0;
}

export function isArgument() {
	return isOdd(part);
}

export function savePosition(): Position {
	return {
		part,
		partpos,
	};
}

export function resetPosition(index: Position): undefined {
	partpos = index.partpos;
	part = index.part;
	return;
}

export function isEscaped() {
	if (cachedChar === undefined) {
		cachedChar = prevChar();
	}
	return cachedChar === '\\';
}

export function charAdvance() {
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

export function adjustPos(amount: number): undefined {
	let remainder = amount;
	if (amount < 0 && cachedChar == '\\') {
		remainder--;
	}
	cachedChar = undefined;
	while (remainder != 0) {
		if (partpos + remainder < parts[part].length && partpos + remainder >= 0) {
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

export function char() {
	return parts[part]?.[partpos];
}

export function prevChar() {
	const saved = { part, partpos };
	adjustPos(-1);
	const c = parts[part]?.[partpos];
	part = saved.part;
	partpos = saved.partpos;
	return c;
}

export function consumeRemainderOfPart() {
	const value = parts[part]
		.slice(partpos, parts[part].length)
		.reduce((a, b) => a + b);
	adjustPos(value.length);
	return value;
}

export function consumeRemainder() {
	if (
		part < 0 ||
		part > parts.length - 1 ||
		partpos < 0 ||
		partpos > parts[part].length - 1
	)
		return;
	let chars: string[] = [];
	chars.push(...parts[part].slice(partpos));
	for (let i = part + 1; i < parts.length; i++) {
		chars.push(...parts[i]);
	}
	const ret = chars.reduce((prev, curr) => prev + curr);
	part = parts.length - 1;
	partpos = parts.length;
	return ret;
}

export function consumeNextWhitespace() {
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

export function consume(segment: string): boolean | undefined {
	const original = savePosition();
	for (let j = 0; j < segment.length; j++) {
		const char = charAdvance();
		if (char !== segment[j]) return resetPosition(original);
	}
	return true;
}

export function consumeWhile(fn: ConsumeWhileFunction): string | undefined {
	const original = savePosition();
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
			const { accept, positionOffset, stop } = action;
			if (accept) ret += char;
			adjustPos(positionOffset);
			if (stop) break;
		}
	}
	if (partpos != original.partpos || part != original.part) {
		return ret;
	}
	return;
}

export function consumeNumber() {
	return consumeWhile(isDigit);
}

export function consumeWhitespace() {
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

function isOdd(x: number): boolean {
	return !!(x & 1);
}

function toAbsPosition(partIdx: number = part, partposIdx: number = partpos) {
	let count = partposIdx;
	for (let p = partIdx - 1; p >= 0; p--) {
		const _part = parts[p];
		count += _part.length;
	}
	return count;
}

function getErrorContextualString(isArg: boolean) {
	const adj = 40;

	const original = savePosition();
	debugger;
	// get 40 characters before and after current position
	adjustPos(-adj);
	const over = partpos;
	let string = '';
	debugger;
	for (let i = 0; i < adj * 2; i++) {
		const c = char();
		if (c !== undefined) string += c;
		adjustPos(1);
	}
	resetPosition(original);
	string += '\n';

	if (over < 0) {
		const a = adj + over;

		if (isArg) {
			string += '-'.repeat(a) + '^';
			string += '-'.repeat(parts[part].length - 2) + '^';
		} else {
			string += '-'.repeat(a) + '^';
		}
	} else {
		if (isArg) {
			string = '\u2026' + string;

			const prefix = toAbsPosition() - toAbsPosition(part, 0);
			const c = toAbsPosition(part, 0) - over;
			string += '\u2026' + ' '.repeat(c) + '-'.repeat(prefix) + '^';
			string += '-'.repeat(parts[part].length - 1 - prefix);
		} else {
			string = '\u2026' + string;
			string += '\u2026' + '-'.repeat(adj) + '^';
		}
	}
	return string;
}

export function createError(msg: string) {
	debugger;
	const isArg = isArgument();
	const argNumber = isArg ? (part - 1) / 2 : -1;

	const context = getErrorContextualString(isArg);
	let builder = `${msg}\n`;

	builder += `Parsing: `;
	if (isArg) {
		builder += `Tagged Template Argument[${argNumber}]\n`;
	} else {
		builder += `Tagged Template String\n`;
	}
	builder += `Offset: ${toAbsPosition()}\n`;
	builder += `${context}`;
	throw new Error(builder);
}
