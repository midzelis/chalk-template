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

test('empty', t => {
	const input = '';
	setSource([input], []);
	const ret = consumeRemainder();
	t.is(ret,input);
});
test('graphene cluster', t => {
	const input = 'abc 👉🏿 efg';
	setSource([input], []);
	const ret = consumeRemainder();
	t.is(ret,input);
});