type ConsumeWhileFunction = (char: string) =>
	| boolean
	| {
			stop: boolean;
			accept: boolean;
			positionOffset: number;
	  };

export type State = {
	part: number;
	partpos: number;
};

let parts: string[][];
let part: number;
let partpos: number;

let cachedChar: string | undefined;

export function setSource(temp: ReadonlyArray<string>, ...args: any[]) {
	cachedChar = undefined;
	parts = [];
	part = 0;
	partpos = 0;
	parts.push([...temp[0]]);
	for (let index = 1; index < temp.length; index++) {
		parts.push([...`${args[index - 1]}`]);
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

export function saveState(): State {
	return {
		part,
		partpos,
	};
}
export function reset(index: State): undefined {
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
	let chars = [];
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

export function consume(segment: string): boolean {
	const original = saveState();
	for (let j = 0; j < segment.length; j++) {
		const char = charAdvance();
		if (char !== segment[j]) return reset(original);
	}
	return true;
}

export function consumeWhile(fn: ConsumeWhileFunction): string | undefined {
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

function toAbsPosition() {
	let count = partpos;
	for (let p = part - 1; p >= 0; p--) {
		const _part = parts[p];
		count += _part.length;
	}
	return count;
}

function getErrorContextualString() {
	const adj = 40;

	const original = saveState();
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
	reset(original);
	string += '\n';
	if (over < 0) {
		console.log('over', over, 'adj', adj);
		const a = adj + over;
		console.log(a);
		string += '-'.repeat(a) + '^';
	} else {
		string = '...' + string;
		string += '   ' + '-'.repeat(adj) + '^';
	}
	return string;
}

export function createError(msg: string) {
	const isArg = isArgument();
	const argNumber = isArg ? (part - 1) / 2 : -1;

	const context = getErrorContextualString();
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
