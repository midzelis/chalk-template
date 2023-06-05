const parts = [[...'helo'], [...'the'], [...'end'], [...'xyz']];

let part = 3;
let partpos = 0;

// const parts = [[...'helo'], [...'the'], [...'xyz']];

// let part = 2;
// let partpos = 0;

function test(part, partpos, parts) {
	function adjustPos(amount) {
		let a = amount;
		while (a != 0) {
			if (partpos + a < parts[part].length && partpos + a >= 0) {
				partpos += a;
				a = 0;
			} else if (partpos + a < 0) {
				if (part === 0) {
					part = partpos = -1;
					a = 0;
					break;
				}
				a += partpos + 1;
				part--;
				partpos = parts[part].length - 1;
				if (partpos + a < 0) {
					a += partpos;
					partpos = 0;
				} else {
					partpos += a;
					a = 0;
				}
			} else if (partpos + a > parts[part].length - 1) {
				if (part === parts.length - 1) {
					part = partpos = -1;
					a = 0;
					break;
				}
				a = a - (parts[part].length - 1 - partpos) - 1;
				part++;
				partpos = 0;
				if (partpos + a < parts[part].length) {
					partpos = partpos + a;
					a = 0;
				}
			}
		}

		return undefined;
	}

	return (amt) => {
		const o = { part, partpos };
		const arr = parts.flatMap((a) => a);
		const inx = parts
			.slice(0, part)
			.reduce((prev, cur) => prev + cur.length, partpos);
		const base = arr[inx + amt];
		// console.log('base', base);

		adjustPos(amt);
		let calc = undefined;
		if (part >= 0) {
			calc = parts[part][partpos];
		}
		// console.log('calc', calc);
		if (base != calc) {
			console.log('^^ error', o, amt);
		}
	};
}

function test2(part, partpos, parts) {
	function adjustPos(amount) {
		function oob() {
			part = partpos = -1;
		}
		let a = amount;
		while (a != 0) {
			if (partpos + a < parts[part].length && partpos + a >= 0) {
				partpos += a;
				a = 0;
			} else if (partpos + a < 0) {
				if (part === 0) return oob();
				a += partpos + 1;
				part--;
				partpos = parts[part].length - 1;
			} else if (partpos + a > parts[part].length - 1) {
				if (part === parts.length - 1) return oob();
				a = a - (parts[part].length - 1 - partpos) - 1;
				part++;
				partpos = 0;
			}
		}

		return undefined;
	}

	return (amt) => {
		const o = { part, partpos };
		const arr = parts.flatMap((a) => a);
		const inx = parts
			.slice(0, part)
			.reduce((prev, cur) => prev + cur.length, partpos);
		const base = arr[inx + amt];
		// console.log('base', base);

		adjustPos(amt);
		let calc = undefined;
		if (part >= 0) {
			calc = parts[part][partpos];
		}
		// console.log('calc', calc);
		if (base != calc) {
			console.log('^^ error', o, amt);
		}
	};
}

import Benchmark from 'benchmark';

var suite = new Benchmark.Suite();
suite
	.add('a', () => {
		test(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(0);

		test(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-1);
		test(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-2);
		test(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-3);

		test(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-4);
		test(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-5);
		test(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-6);
		test(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-7);

		test(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(0);
		test(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-1);
		test(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-2);
		test(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-3);
		test(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-4);
		test(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-5);
		test(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-6);
		test(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-9);
		test(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-12);
		test(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-13);
		test(0, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-3);
		test(0, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-4);
		test(0, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-5);
		test(0, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-6);
		test(0, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-7);

		test(0, 0, [[...'helo'], [...'the'], [...'xyz']])(0);
		test(0, 0, [[...'helo'], [...'the'], [...'xyz']])(1);
		test(0, 0, [[...'helo'], [...'the'], [...'xyz']])(3);
		test(0, 0, [[...'helo'], [...'the'], [...'xyz']])(4);
		test(0, 0, [[...'helo'], [...'the'], [...'xyz']])(5);
		test(0, 0, [[...'helo'], [...'the'], [...'xyz']])(6);
		test(0, 0, [[...'helo'], [...'the'], [...'xyz']])(7);
		test(0, 0, [[...'helo'], [...'the'], [...'xyz']])(8);
		test(0, 0, [[...'helo'], [...'the'], [...'xyz']])(9);
		test(0, 0, [[...'helo'], [...'the'], [...'xyz']])(10);

		test(0, 1, [[...'helo'], [...'the'], [...'xyz']])(0);
		test(0, 1, [[...'helo'], [...'the'], [...'xyz']])(1);
		test(0, 1, [[...'helo'], [...'the'], [...'xyz']])(2);
		test(0, 1, [[...'helo'], [...'the'], [...'xyz']])(3);
		test(0, 1, [[...'helo'], [...'the'], [...'xyz']])(4);
		test(0, 1, [[...'helo'], [...'the'], [...'xyz']])(5);
		test(0, 1, [[...'helo'], [...'the'], [...'xyz']])(6);
		test(0, 1, [[...'helo'], [...'the'], [...'xyz']])(7);
		test(0, 1, [[...'helo'], [...'the'], [...'xyz']])(8);
		test(0, 1, [[...'helo'], [...'the'], [...'xyz']])(9);
		test(0, 1, [[...'helo'], [...'the'], [...'xyz']])(1000);

		test(0, 3, [[...'helo'], [...'the'], [...'xyz']])(0);
		test(0, 3, [[...'helo'], [...'the'], [...'xyz']])(1);
		test(0, 3, [[...'helo'], [...'the'], [...'xyz']])(2);
		test(0, 3, [[...'helo'], [...'the'], [...'xyz']])(3);
		test(0, 3, [[...'helo'], [...'the'], [...'xyz']])(4);
		test(0, 3, [[...'helo'], [...'the'], [...'xyz']])(5);
		test(0, 3, [[...'helo'], [...'the'], [...'xyz']])(6);
		test(0, 3, [[...'helo'], [...'the'], [...'xyz']])(7);
		test(0, 3, [[...'helo'], [...'the'], [...'xyz']])(8);
		test(0, 3, [[...'helo'], [...'the'], [...'xyz']])(9);
		test(0, 3, [[...'helo'], [...'the'], [...'xyz']])(1000);
	})
	.add('b', () => {
		test2(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(0);

		test2(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-1);
		test2(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-2);
		test2(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-3);

		test2(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-4);
		test2(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-5);
		test2(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-6);
		test2(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-7);

		test2(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(0);
		test2(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-1);
		test2(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-2);
		test2(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-3);
		test2(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-4);
		test2(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-5);
		test2(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-6);
		test2(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-9);
		test2(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-12);
		test2(3, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-13);
		test2(0, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-3);
		test2(0, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-4);
		test2(0, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-5);
		test2(0, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-6);
		test2(0, 2, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-7);

		test2(0, 0, [[...'helo'], [...'the'], [...'xyz']])(0);
		test2(0, 0, [[...'helo'], [...'the'], [...'xyz']])(1);
		test2(0, 0, [[...'helo'], [...'the'], [...'xyz']])(3);
		test2(0, 0, [[...'helo'], [...'the'], [...'xyz']])(4);
		test2(0, 0, [[...'helo'], [...'the'], [...'xyz']])(5);
		test2(0, 0, [[...'helo'], [...'the'], [...'xyz']])(6);
		test2(0, 0, [[...'helo'], [...'the'], [...'xyz']])(7);
		test2(0, 0, [[...'helo'], [...'the'], [...'xyz']])(8);
		test2(0, 0, [[...'helo'], [...'the'], [...'xyz']])(9);
		test2(0, 0, [[...'helo'], [...'the'], [...'xyz']])(10);

		test2(0, 1, [[...'helo'], [...'the'], [...'xyz']])(0);
		test2(0, 1, [[...'helo'], [...'the'], [...'xyz']])(1);
		test2(0, 1, [[...'helo'], [...'the'], [...'xyz']])(2);
		test2(0, 1, [[...'helo'], [...'the'], [...'xyz']])(3);
		test2(0, 1, [[...'helo'], [...'the'], [...'xyz']])(4);
		test2(0, 1, [[...'helo'], [...'the'], [...'xyz']])(5);
		test2(0, 1, [[...'helo'], [...'the'], [...'xyz']])(6);
		test2(0, 1, [[...'helo'], [...'the'], [...'xyz']])(7);
		test2(0, 1, [[...'helo'], [...'the'], [...'xyz']])(8);
		test2(0, 1, [[...'helo'], [...'the'], [...'xyz']])(9);
		test2(0, 1, [[...'helo'], [...'the'], [...'xyz']])(1000);

		test2(0, 3, [[...'helo'], [...'the'], [...'xyz']])(0);
		test2(0, 3, [[...'helo'], [...'the'], [...'xyz']])(1);
		test2(0, 3, [[...'helo'], [...'the'], [...'xyz']])(2);
		test2(0, 3, [[...'helo'], [...'the'], [...'xyz']])(3);
		test2(0, 3, [[...'helo'], [...'the'], [...'xyz']])(4);
		test2(0, 3, [[...'helo'], [...'the'], [...'xyz']])(5);
		test2(0, 3, [[...'helo'], [...'the'], [...'xyz']])(6);
		test2(0, 3, [[...'helo'], [...'the'], [...'xyz']])(7);
		test2(0, 3, [[...'helo'], [...'the'], [...'xyz']])(8);
		test2(0, 3, [[...'helo'], [...'the'], [...'xyz']])(9);
		test2(0, 3, [[...'helo'], [...'the'], [...'xyz']])(1000);
	})
	.on('cycle', function (event) {
		console.log(String(event.target));
	})
	.on('complete', function () {
		console.log('Fastest is ' + this.filter('fastest').map('name'));
	})
	.run();
