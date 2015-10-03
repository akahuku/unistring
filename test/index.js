#!/usr/bin/node

var fs = require('fs');
var Unistring = require('../unistring');

var tests = {
	testFind: function (test) {
		readFileByLine(
			__dirname + '/../unicode-data/GraphemeBreakProperty.txt',
			function (line, lineIndex) {
				var re = /^([0-9A-F]+)[^;]+;\s*(\S+)/.exec(line);
				if (!re) return;

				var codePoint = parseInt(re[1], 16);
				var codePointString = Unistring.getCodePointString(codePoint, 'unicode');
				var code = Unistring.getGBPCodeFromName(re[2]);
				if (code == undefined) {
					test.fail(
						codePointString + ' failed:' +
						' unknown property (' + re[2] + ')'
					);
					return;
				}

				var result = Unistring.getGraphemeBreakProp(codePoint);
				test.eq('line ' + (lineIndex + 1) + ': ' + re[1], code, result);
			},
			function () {
				test.done();
			}
		);
		return false;
	},
	testGraphemeBreak: function (test) {
		readFileByLine(
			__dirname + '/GraphemeBreakTest.txt',
			function (line, lineIndex) {
				line = line.replace(/#.*$/, '');
				line = line.replace(/^\s+|\s+$/g, '');
				if (!/^÷ .+ ÷$/.test(line)) return;

				var testString = '';
				line.replace(/[0-9A-F]+/g, function ($0) {
					testString += Unistring.getUTF16FromCodePoint(
						parseInt($0, 16)
					);
					return $0;
				});

				var result = (new Unistring(testString)).dump();
				test.eq('line ' + (lineIndex + 1), line, result);
			},
			function () {
				test.done();
			}
		);
		return false;
	},
	testToString: function (test) {
		var s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		test.eq('#1', 'か\u3099き\u3099く\u3099け\u3099こ\u3099', s.toString());
	},
	testDelete: function (test) {
		var s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		test.eq('#1-0', 0, s.rawIndexAt(0));
		test.eq('#1-1', 2, s.rawIndexAt(1));
		test.eq('#1-2', 4, s.rawIndexAt(2));
		test.eq('#1-3', 6, s.rawIndexAt(3));
		test.eq('#1-4', 8, s.rawIndexAt(4));

		s.delete(2, 1);

		test.eq('#2-0', 4, s.length);
		test.eq('#2-1', 0, s.rawIndexAt(0));
		test.eq('#2-2', 2, s.rawIndexAt(1));
		test.eq('#2-3', 4, s.rawIndexAt(2));
		test.eq('#2-4', 6, s.rawIndexAt(3));

		s.delete(-1);
		test.eq('#3-0', 3, s.length);
		test.eq('#3-1', 'か\u3099き\u3099け\u3099', s.toString());

		s.delete(-100, 1);
		test.eq('#4-0', 2, s.length);
		test.eq('#4-1', 'き\u3099け\u3099', s.toString());

		s.delete();
		test.eq('#5-0', 0, s.length);
		test.eq('#5-1', '', s.toString());
	},
	testInsert: function (test) {
		var s = new Unistring('foobar');

		s.insert('BAZ', 0);
		test.eq('#1-1', 'BAZfoobar', s.toString());
		test.eq('#1-2', 3, s.rawIndexAt(3));

		s.insert('BAX', 6);
		test.eq('#2-1', 'BAZfooBAXbar', s.toString());

		s.insert('BAQ', -1);
		test.eq('#3-1', 'BAZfooBAXbaBAQr', s.toString());

		s.insert('FOO', s.length);
		test.eq('#4-1', 'BAZfooBAXbaBAQrFOO', s.toString());
	},
	testCodePointsAt: function (test) {
		var s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		test.eq('#1-1', '[12365,12441]', JSON.stringify(s.codePointsAt(1)));

		test.done();
	},
	testRawStringAt: function (test) {
		var s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		test.eq('#1-1', 'か\u3099', s.rawStringAt(0));
		test.eq('#1-2', 'き\u3099', s.rawStringAt(1));
		test.eq('#1-3', 'く\u3099', s.rawStringAt(2));
		test.eq('#1-4', 'け\u3099', s.rawStringAt(3));
		test.eq('#1-5', 'こ\u3099', s.rawStringAt(4));
	},
	testForEach: function (test) {
		var s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		var result = '';
		s.forEach(function (g) {
			result += g.rawString.charAt(0);
		});
		test.eq('#1-1', 'かきくけこ', result);
	},
	testGetCrusterIndexFromUTF16Index: function (test) {
		var s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		test.eq('#1-1', 0, s.getCrusterIndexFromUTF16Index(0));
		test.eq('#1-2', 0, s.getCrusterIndexFromUTF16Index(1));
		test.eq('#1-3', 1, s.getCrusterIndexFromUTF16Index(2));
		test.eq('#1-4', 1, s.getCrusterIndexFromUTF16Index(3));
		test.eq('#1-5', 2, s.getCrusterIndexFromUTF16Index(4));
		test.eq('#1-6', 2, s.getCrusterIndexFromUTF16Index(5));
		test.eq('#1-7', 3, s.getCrusterIndexFromUTF16Index(6));
		test.eq('#1-8', 3, s.getCrusterIndexFromUTF16Index(7));
		test.eq('#1-9', 4, s.getCrusterIndexFromUTF16Index(8));
		test.eq('#1-10', 4, s.getCrusterIndexFromUTF16Index(9));
	},
	testLength: function (test) {
		var s = new Unistring(
			// ZALGO!
			'\u005a\u0351\u036b\u0343\u036a\u0302\u036b\u033d\u034f\u0334\u0319\u0324\u031e\u0349\u035a\u032f\u031e\u0320\u034d' +
			'\u0041\u036b\u0357\u0334\u0362\u0335\u031c\u0330\u0354' +
			'\u004c\u0368\u0367\u0369\u0358\u0320' +
			'\u0047\u0311\u0357\u030e\u0305\u035b\u0341\u0334\u033b\u0348\u034d\u0354\u0339' +
			'\u004f\u0342\u030c\u030c\u0358\u0328\u0335\u0339\u033b\u031d\u0333' +
			'\u0021\u033f\u030b\u0365\u0365\u0302\u0363\u0310\u0301\u0301\u035e\u035c\u0356\u032c\u0330\u0319\u0317'
		);
		test.eq('#1', 6, s.length);
	},
	testCharAt: function (test) {
		var s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');

		test.eq('#1-1', 'か', s.charAt(0));
		test.eq('#1-2', 'き', s.charAt(1));
		test.eq('#1-3', 'く', s.charAt(2));
		test.eq('#1-4', 'け', s.charAt(3));
		test.eq('#1-5', 'こ', s.charAt(4));

		test.eq('#2-1', '', s.charAt(-1));
		test.eq('#2-2', '', s.charAt(100));
	},
	testCharCodeAt: function (test) {
		var s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');

		test.eq('#1-1', 12363, s.charCodeAt(0));
		test.eq('#1-2', 12365, s.charCodeAt(1));
		test.eq('#1-3', 12367, s.charCodeAt(2));
		test.eq('#1-4', 12369, s.charCodeAt(3));
		test.eq('#1-5', 12371, s.charCodeAt(4));

		test.t('#2-1', isNaN(s.charCodeAt(-1)));
		test.t('#2-2', isNaN(s.charCodeAt(100)));
	},
	testSubstring: function (test) {
		var s1 = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		var s2 = s1.substring(1, 4);
		test.eq('#1-1', 'き\u3099く\u3099け\u3099', s2.toString());

		s2 = s1.substring(2, 0);
		test.eq('#2-1', 'か\u3099き\u3099', s2.toString());

		s2 = s1.substring();
		test.eq('#3-1', 'か\u3099き\u3099く\u3099け\u3099こ\u3099', s2.toString());
	},
	testSubstr: function (test) {
		var s1 = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		var s2 = s1.substr(1, 2);
		test.eq('#1-1', 'き\u3099く\u3099', s2.toString());

		s2 = s1.substr(2, 0);
		test.eq('#2-1', '', s2.toString());

		s2 = s1.substr(2, -1);
		test.eq('#3-1', '', s2.toString());

		s2 = s1.substr(2);
		test.eq('#4-1', 'く\u3099け\u3099こ\u3099', s2.toString());

		s2 = s1.substr(-1);
		test.eq('#5-1', 'こ\u3099', s2.toString());
	},
	testSlice: function (test) {
		var s1 = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		var s2 = s1.slice(1, 4);
		test.eq('#1-1', 'き\u3099く\u3099け\u3099', s2.toString());
		test.eq('#1-2', 0, s2.rawIndexAt(0));
		test.eq('#1-3', 2, s2.rawIndexAt(1));
		test.eq('#1-4', 4, s2.rawIndexAt(2));

		s2 = s1.slice(2, 0);
		test.eq('#2-1', '', s2.toString());

		s2 = s1.slice();
		test.eq('#3-1', 'か\u3099き\u3099く\u3099け\u3099こ\u3099', s2.toString());

		s2 = s1.slice(-1);
		test.eq('#4-1', 'こ\u3099', s2.toString());
	},
	testConcat: function (test) {
		var s = Unistring('foo');
		s.concat(Unistring('bar'));

		test.eq('#1-1', 'foobar', s.toString());
		test.eq('#1-2', 0, s.rawIndexAt(0));
		test.eq('#1-3', 1, s.rawIndexAt(1));
		test.eq('#1-4', 2, s.rawIndexAt(2));
		test.eq('#1-5', 3, s.rawIndexAt(3));
		test.eq('#1-6', 4, s.rawIndexAt(4));
		test.eq('#1-7', 5, s.rawIndexAt(5));
	},
	testIndexOf: function (test) {
		var s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');

		test.eq('#1-1', -1, s.indexOf('か'));
		test.eq('#1-2', -1, s.indexOf('\u3099'));
		test.eq('#1-3', 4, s.indexOf('こ\u3099'));
	},
	testLastIndexOf: function (test) {
		var s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');

		test.eq('#1-1', -1, s.lastIndexOf('か'));
		test.eq('#1-2', -1, s.lastIndexOf('\u3099'));
		test.eq('#1-3', 1, s.lastIndexOf('き\u3099'));
	},
	testGetWords: function (test) {
		readFileByLine(
			__dirname + '/WordBreakTest.txt',
			function (line, lineIndex) {
				line = line.replace(/#.*$/, '');
				line = line.replace(/^\s+|\s+$/g, '');
				if (!/^÷ .+ ÷$/.test(line)) return;

				var testString = '';
				line.replace(/[0-9A-F]+/g, function ($0) {
					testString += Unistring.getUTF16FromCodePoint(
						parseInt($0, 16)
					);
					return $0;
				});

				var result = [];
				Unistring.getWords(testString).forEach(function (word) {
					var tmp = [];
					Unistring(word.text).forEach(function (cluster) {
						tmp.push.apply(tmp, cluster.codePoints.map(Unistring.getCodePointString));
					});
					result.push(tmp.join(' × '));
				});
				result = '÷ ' + result.join(' ÷ ') + ' ÷';

				test.eq('line ' + (lineIndex + 1), line, result);
			},
			function () {
				test.done();
			}
		);
		return false;
	}
};

function readFileByLine (fileName, callback, callback2) {
	fs.readFile(fileName, 'utf8', function (err, data) {
		if (err) throw err;
		data = data.split('\n');
		for (var i = 0, goal = data.length; i < goal; i++) {
			var result = callback(data[i], i);
			if (result === false) {
				break;
			}
		}
		callback2 && callback2();
	});
}


function main () {
	var availableTests = Object.keys(tests)
		.filter(function(t){return /^test/.test(t)});
	var testCount = 0;
	var assertCount = 0;
	var failedCount = 0;
	var startTime = Date.now();
	availableTests.forEach(function (t) {
		var tester = {
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
			var result = tests[t](tester);
			result !== false && tester.done && tester.done();
		}
		catch (e) {
			tester.fail('exception: ' + e.message + '\n' + e.stack);
			tester.done && tester.done();
		}
	});
}

main();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker fmr=<<<,>>> :
