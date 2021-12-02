function run (tests) {
	switch (Object.prototype.toString.call(tests)) {
	case '[object Object]':
		const startTime = Date.now();
		let availableTests = Object.keys(tests).filter(t => /^only_?[tT]est/.test(t));
		if (availableTests.length == 0) {
			availableTests =  Object.keys(tests).filter(t => /^test/.test(t));
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
				fail: function (label) {
					this.failed++;
					this.log.push(label);
					return false;
				},
				eq: function (label, expected, actual) {
					this.assertCount++;
					if (expected != actual) {
						this.failed++;
						this.log.push(
							'---- ' + label + ' ----',
							'expected: ' + expected,
							'  actual: ' + actual
						);
						return false;
					}
					return true;
				},
				t: function (label, condition) {
					this.assertCount++;
					if (!condition) {
						this.failed++;
						this.log.push(
							'---- ' + label + ' ----'
						);
					}
					return true;
				},
				done: function () {
					assertCount += this.assertCount;
					failedCount += this.failed;
					if (this.failed) {
						console.log('******** ' + this.testName + ' ********');
						console.log('\t' + this.log.join('\n\t'));
					}
					testCount++;
					if (testCount >= availableTests.length) {
						if (failedCount) {
							console.log(
								'\n' +
								availableTests.length + ' test(s), ' +
								assertCount + ' assertion(s), ' +
								failedCount + ' failed.');
							process.exit(1);
						}
						else {
							console.log(
								'\n' +
								availableTests.length + ' test(s), ' +
								assertCount + ' assertion(s)');
							console.log('passed in ' + ((Date.now() - startTime) / 1000).toFixed(2) + ' secs.');
						}
					}
					delete this.done;
				}
			};
			try {
				const result = tests[t](tester);
				result !== false && tester.done && tester.done();
			}
			catch (e) {
				tester.fail('exception: ' + e.message + '\n' + e.stack);
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
