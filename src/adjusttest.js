const parts = [[...'helo'], [...'the'], [...'end'], [...'xyz']];

let part = 3;
let partpos = 0;

// const parts = [[...'helo'], [...'the'], [...'xyz']];

// let part = 2;
// let partpos = 0;

function test(part, partpos, parts) {
	function adjustPos(amount) {
		debugger;
		if (partpos + amount < parts[part].length && partpos + amount >= 0) {
			partpos += amount;
		} else if (partpos + amount < parts[part].length) {
			let a = amount;
			while (partpos + a < 0) {
				if (part === 0) {
					part = partpos = -1;
					break;
				}
				const prevpartpos = partpos;
				
				part--;
				partpos = parts[part].length - 1;
				if (partpos - (-a - 1 - prevpartpos) < 0) {
					a = a + partpos + 1 + prevpartpos;
					partpos = 0;
				} else {
					partpos = partpos - (-a - 1) + prevpartpos;
					a = 0;
				}
			}
		} else {
			// advance to next (or subsequent)
			let a = amount;
			while (partpos + a > parts[part].length - 1) {
				if (part === parts.length - 1) {
					part = partpos = -1;
					break;
				}
				a = a - (parts[part].length - 1 - partpos) - 1;
				part++;
				partpos = 0;
				if (partpos + a < parts[part].length) {
					partpos = partpos + a;
					a = 0;
				} else {
					a = a - (parts[part].length - 1) - 1;
					partpos = parts[part].length;
				}
			}
		}
		return undefined;
	}

	return (amt) => {
		const arr = parts.flatMap((a) => a);
		const inx = parts
			.slice(0, part)
			.reduce((prev, cur) => prev + cur.length, partpos);
		console.log('base', arr[inx + amt]);

		adjustPos(amt);
		// console.log({part,partpos})
		if (part == -1) {
			console.log('calc', undefined);
		} else {
			console.log('calc', parts[part][partpos]);
		}
	};
}

test(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(0);
test(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-6);
test(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-7);
test(3, 0, [[...'helo'], [...'the'], [...'zyx'], [...'more']])(-1);

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
