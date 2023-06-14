import test from 'ava';
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
	clearSource,
	setFullState,
	getFullState,
} from '../source.ts';

const testAdjustPos = test.macro({
	exec(t, { part, partpos, parts, amount }) {
		parts = parts.map((p) => [...p]);

		setFullState({ part, partpos, parts });

		// set up the expectation
		const arr = parts.flatMap((a) => a);
		const string = parts
			.slice(0, part)
			.reduce((prev, cur) => prev + cur.length, partpos);
		const expectedChar = arr[string + amount];

		// test
		adjustPos(amount);

		const state = getFullState();
		part = state.part;
		partpos = state.partpos;
		parts = state.parts;

		let calculuatedChar;
		if (part >= 0) {
			calculuatedChar = parts[part][partpos];
		}
		t.is(calculuatedChar, expectedChar);
	},
	title(providedTitle = '', input) {
		return `part: ${input.part}, partpos: ${input.partpos}, adjustPos(${input.amount})`.trim();
	},
});

for (let amount = 0; amount > -8; amount--) {
	test(testAdjustPos, {
		part: 3,
		partpos: 0,
		parts: ['abcd', 'efg', 'hij', 'klmn'],
		amount,
	});
}
for (let amount = 0; amount > -14; amount--) {
	test(testAdjustPos, {
		part: 3,
		partpos: 2,
		parts: ['abcd', 'efg', 'hij', 'klmn'],
		amount,
	});
}
test(testAdjustPos, {
	part: 3,
	partpos: 2,
	parts: ['abcd', 'efg', 'hij', 'klmn'],
	amount: -1000,
});
for (let amount = 0; amount > -8; amount--) {
	test(testAdjustPos, {
		part: 0,
		partpos: 2,
		parts: ['abcd', 'efg', 'hij', 'klmn'],
		amount,
	});
}
test(testAdjustPos, {
	part: 0,
	partpos: 2,
	parts: ['abcd', 'efg', 'hij', 'klmn'],
	amount: -1000,
});
for (let amount = 0; amount < 11; amount++) {
	test(testAdjustPos, {
		part: 0,
		partpos: 0,
		parts: ['abcd', 'efg', 'hij', 'klmn'],
		amount,
	});
}
test(testAdjustPos, {
	part: 0,
	partpos: 0,
	parts: ['abcd', 'efg', 'hij', 'klmn'],
	amount: 1000,
});
for (let amount = 0; amount < 11; amount++) {
	test(testAdjustPos, {
		part: 0,
		partpos: 1,
		parts: ['abcd', 'efg', 'hij', 'klmn'],
		amount,
	});
}
test(testAdjustPos, {
	part: 0,
	partpos: 1,
	parts: ['abcd', 'efg', 'hij', 'klmn'],
	amount: 1000,
});
for (let amount = 0; amount < 11; amount++) {
	test(testAdjustPos, {
		part: 0,
		partpos: 3,
		parts: ['abcd', 'efg', 'hij', 'klmn'],
		amount,
	});
}
test(testAdjustPos, {
	part: 0,
	partpos: 3,
	parts: ['abcd', 'efg', 'hij', 'klmn'],
	amount: 1000,
});

