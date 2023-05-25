function p (label, number) {
	return number + ' ' + (number == 1 ? label : `${label}s`);
}

function run (tests) {
	switch (Object.prototype.toString.call(tests)) {
	case '[object Object]':
		const startTime = Date.now();
		let availableTests = Object.keys(tests).filter(t => /^only_?[tT]est/.test(t));
		if (availableTests.length == 0) {
			availableTests = Object.keys(tests).filter(t => /^test/.test(t));
		}
		let testCount = 0;
		let assertCount = 0;
		let failedCount = 0;

		if ('before' in tests) {
			availableTests.unshift(tests.before);
		}

		if ('after' in tests) {
			availableTests.push(tests.after);
		}

		availableTests.forEach(function (t) {
			const tester = {
				testName: t,
				assertCount: 0,
				failed: 0,
				log: [],
				stopOnFail: false,
				fail: function (label) {
					this.failed++;
					this.log.push(label);
					if (this.stopOnFail) {
						throw new Error('Stop on fail');
					}
					return false;
				},
				eq: function (label, expected, actual) {
					this.assertCount++;
					if (expected != actual) {
						this.failed++;
						this.log.push(
							`---- ${label}`,
							`expected: ${expected}\u001b[m`,
							`  actual: ${actual}\u001b[m`
						);
						if (this.stopOnFail) {
							throw new Error('Stop on fail');
						}
						return false;
					}
					return true;
				},
				t: function (label, condition) {
					this.assertCount++;
					if (!condition) {
						this.failed++;
						this.log.push(
							`---- ${label}`
						);
						if (this.stopOnFail) {
							throw new Error('Stop on fail');
						}
					}
					return true;
				},
				done: function () {
					assertCount += this.assertCount;
					failedCount += this.failed;
					if (this.failed) {
						console.log(`\n\t${this.log.join('\n\t')}`);
					}
					testCount++;
					console.log(`...${this.assertCount}`);
					if (testCount >= availableTests.length) {
						if (failedCount) {
							console.log(
								'\n' +
								`${p('test', availableTests.length)}, ` +
								`${p('assertion', assertCount)}, ` +
								`${failedCount} failed.`);
							process.exit(1);
						}
						else {
							console.log(
								'\n' +
								`${p('test', availableTests.length)}, ` +
								`${p('assertion', assertCount)}`);
							console.log(
								`passed in ${((Date.now() - startTime) / 1000).toFixed(2)} secs.`);
						}
					}
					delete this.done;
				}
			};
			try {
				process.stdout.write(t);
				const result = tests[t](tester);
				result !== false && tester.done && tester.done();
			}
			catch (e) {
				tester.stopOnFail = false;
				tester.fail(`exception: ${e.message}\n${e.stack}`);
				tester.done && tester.done();
			}
		});
		break;

	case '[object Array]':
		tests.forEach(test => {
			run(test);
		});
		break;

	default:
		throw new Error('argument is not an Object or an Array');
	}
}

export default {run};
