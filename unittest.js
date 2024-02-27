#!/usr/bin/env node
/*
 * unit test runner
 * ================
 */

import fs from 'node:fs';
import path from 'node:path';

import Unistring from './unistring.js';
import testRunner from './test/testRunner.js';
import {loadFiles, fileExists} from './utils.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const UNICODE_VERSION = fs.readFileSync(path.join(__dirname, 'unicode-version'), 'utf8').replace(/^[\s\r\n]+|[\s\r\n]+$/g, '');
const TEST_DIR = path.join(__dirname, 'test', UNICODE_VERSION, '/');
const TEST_FILES = [
	{
		url: `http://www.unicode.org/Public/${UNICODE_VERSION}/ucd/auxiliary/GraphemeBreakProperty.txt`,
		path: TEST_DIR
	},
	{
		url: `http://www.unicode.org/Public/${UNICODE_VERSION}/ucd/auxiliary/GraphemeBreakTest.txt`,
		path: TEST_DIR
	},
	{
		url: `http://www.unicode.org/Public/${UNICODE_VERSION}/ucd/auxiliary/WordBreakTest.txt`,
		path: TEST_DIR
	},
	{
		url: `http://www.unicode.org/Public/${UNICODE_VERSION}/ucd/auxiliary/SentenceBreakTest.txt`,
		path: TEST_DIR
	},
	{
		url: `http://www.unicode.org/Public/${UNICODE_VERSION}/ucd/auxiliary/LineBreakTest.txt`,
		path: TEST_DIR
	}
];

// U+0926 Devanagari Letter Da (Lo)
// U+0947 Devanagari Vowel Sign E (Mn)
// U+0935 Devanagari Letter Va (Lo)
// U+0928 Devanagari Letter Na (Lo)
// U+093e Devanagari Vowel Sign Aa (Mc)
// U+0917 Devanagari Letter Ga (Lo)
// U+0930 Devanagari Letter Ra (Lo)
// U_0940 Devanagari Vowel Sign Ii (Mc)
const DEVANAGARI = '\u0926\u0947\u0935\u0928\u093e\u0917\u0930\u0940';

const LINK_START = '\x1b]8;;file://host/path/to/target\x07';
const LINK_END = '\x1b]8;;\x07';

const tests = {
	testFind: test => {
		readFileByLine(
			path.join(TEST_DIR, 'GraphemeBreakProperty.txt'),
			(line, lineIndex) => {
				let re = /^([0-9A-F]+)[^;]+;\s*(\S+)/.exec(line);
				if (!re) return;

				const codePoint = parseInt(re[1], 16);
				const codePointString = Unistring.getCodePointString(codePoint, 'unicode');
				const code = Unistring.GBP[re[2]];
				if (code == undefined) {
					test.fail(`${codePointString} failed: unknown property (${re[2]})`);
					return;
				}

				const result = Unistring.getGraphemeBreakProp(codePoint);
				test.eq(`line ${lineIndex}: ${re[1]}`, code, result);
			},
			() => {
				test.done();
			}
		);
		return false;
	},
	testGraphemeBreak: test => {
		readFileByLine(
			path.join(TEST_DIR, 'GraphemeBreakTest.txt'),
			(line, lineIndex) => {
				line = line.replace(/#.*$/, '');
				line = line.replace(/^\s+|\s+$/g, '');
				if (!/^÷ .+ ÷$/.test(line)) return;

				let testString = '';
				line.replace(/[0-9A-F]+/g, $0 => {
					testString += Unistring.getUTF16FromCodePoint(
						parseInt($0, 16)
					);
					return $0;
				});

				const result = (new Unistring(testString)).dump();
				test.eq(`line ${lineIndex}`, line, result);
			},
			() => {
				test.done();
			}
		);
		return false;
	},
	testToString: test => {
		const s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		test.eq('#1', 'か\u3099き\u3099く\u3099け\u3099こ\u3099', s.toString());
	},
	testDelete: test => {
		const s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
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
	testInsert: test => {
		const s = new Unistring('foobar');

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
	testCodePointsAt: test => {
		const s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		test.eq('#1-1', '[12365,12441]', JSON.stringify(s.codePointsAt(1)));

		test.done();
	},
	testRawStringAt: test => {
		const s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		test.eq('#1-1', 'か\u3099', s.rawStringAt(0));
		test.eq('#1-2', 'き\u3099', s.rawStringAt(1));
		test.eq('#1-3', 'く\u3099', s.rawStringAt(2));
		test.eq('#1-4', 'け\u3099', s.rawStringAt(3));
		test.eq('#1-5', 'こ\u3099', s.rawStringAt(4));
		test.eq('#1-6', '',         s.rawStringAt(5));
	},
	testRawIndexAt: test => {
		const s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		test.eq('#1-1', 0, s.rawIndexAt(0));
		test.eq('#1-2', 2, s.rawIndexAt(1));
		test.eq('#1-3', 4, s.rawIndexAt(2));
		test.eq('#1-4', 6, s.rawIndexAt(3));
		test.eq('#1-5', 8, s.rawIndexAt(4));
		test.eq('#1-6', 10, s.rawIndexAt(5));
	},
	testForEach: test => {
		const s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		let result = '';
		s.forEach(g => {
			result += g.rawString.charAt(0);
		});
		test.eq('#1-1', 'かきくけこ', result);
	},
	testGetClusterIndexFromUTF16Index: test => {
		const s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		test.eq('#1-1', 0, s.getClusterIndexFromUTF16Index(0));
		test.eq('#1-2', 0, s.getClusterIndexFromUTF16Index(1));
		test.eq('#1-3', 1, s.getClusterIndexFromUTF16Index(2));
		test.eq('#1-4', 1, s.getClusterIndexFromUTF16Index(3));
		test.eq('#1-5', 2, s.getClusterIndexFromUTF16Index(4));
		test.eq('#1-6', 2, s.getClusterIndexFromUTF16Index(5));
		test.eq('#1-7', 3, s.getClusterIndexFromUTF16Index(6));
		test.eq('#1-8', 3, s.getClusterIndexFromUTF16Index(7));
		test.eq('#1-9', 4, s.getClusterIndexFromUTF16Index(8));
		test.eq('#1-10', 4, s.getClusterIndexFromUTF16Index(9));
	},
	testLength: test => {
		const s = new Unistring(
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
	testCharAt: test => {
		const s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');

		test.eq('#1-1', 'か', s.charAt(0));
		test.eq('#1-2', 'き', s.charAt(1));
		test.eq('#1-3', 'く', s.charAt(2));
		test.eq('#1-4', 'け', s.charAt(3));
		test.eq('#1-5', 'こ', s.charAt(4));

		test.eq('#2-1', '', s.charAt(-1));
		test.eq('#2-2', '', s.charAt(100));
	},
	testCharCodeAt: test => {
		const s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');

		test.eq('#1-1', 12363, s.charCodeAt(0));
		test.eq('#1-2', 12365, s.charCodeAt(1));
		test.eq('#1-3', 12367, s.charCodeAt(2));
		test.eq('#1-4', 12369, s.charCodeAt(3));
		test.eq('#1-5', 12371, s.charCodeAt(4));

		test.t('#2-1', isNaN(s.charCodeAt(-1)));
		test.t('#2-2', isNaN(s.charCodeAt(100)));
	},
	testSubstring: test => {
		const s1 = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		let s2 = s1.substring(1, 4);
		test.eq('#1-1', 'き\u3099く\u3099け\u3099', s2.toString());

		s2 = s1.substring(2, 0);
		test.eq('#2-1', 'か\u3099き\u3099', s2.toString());

		s2 = s1.substring();
		test.eq('#3-1', 'か\u3099き\u3099く\u3099け\u3099こ\u3099', s2.toString());
	},
	testSubstr: test => {
		const s1 = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		let s2 = s1.substr(1, 2);
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
	testSlice: test => {
		const s1 = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');
		let s2 = s1.slice(1, 4);
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
	testConcat: test => {
		const s = Unistring('foo');
		s.concat(Unistring('bar'));

		test.eq('#1-1', 'foobar', s.toString());
		test.eq('#1-2', 0, s.rawIndexAt(0));
		test.eq('#1-3', 1, s.rawIndexAt(1));
		test.eq('#1-4', 2, s.rawIndexAt(2));
		test.eq('#1-5', 3, s.rawIndexAt(3));
		test.eq('#1-6', 4, s.rawIndexAt(4));
		test.eq('#1-7', 5, s.rawIndexAt(5));
	},
	testIndexOf: test => {
		const s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');

		test.eq('#1-1', -1, s.indexOf('か'));
		test.eq('#1-2', -1, s.indexOf('\u3099'));
		test.eq('#1-3', 4, s.indexOf('こ\u3099'));
	},
	testLastIndexOf: test => {
		const s = new Unistring('か\u3099き\u3099く\u3099け\u3099こ\u3099');

		test.eq('#1-1', -1, s.lastIndexOf('か'));
		test.eq('#1-2', -1, s.lastIndexOf('\u3099'));
		test.eq('#1-3', 1, s.lastIndexOf('き\u3099'));
	},
	testGetWords: test => {
		readFileByLine(
			path.join(TEST_DIR, 'WordBreakTest.txt'),
			(line, lineIndex) => {
				line = line.replace(/#.*$/, '');
				line = line.replace(/^\s+|\s+$/g, '');
				if (!/^÷ .+ ÷$/.test(line)) return;

				let testString = '';
				line.replace(/[0-9A-F]+/g, $0 => {
					testString += Unistring.getUTF16FromCodePoint(
						parseInt($0, 16)
					);
					return $0;
				});

				let result = [];
				Unistring.getWords(testString).forEach(word => {
					const tmp = [];
					Unistring(word.text).forEach(cluster => {
						tmp.push.apply(tmp, cluster.codePoints.map(Unistring.getCodePointString));
					});
					result.push(tmp.join(' × '));
				});
				result = '÷ ' + result.join(' ÷ ') + ' ÷';

				test.eq(`line ${lineIndex}`, line, result);
			},
			() => {
				test.done();
			}
		);
		return false;
	},
	testGetWordsWithScript: test => {
		const w = Unistring.getWords('!@#   #+.   &*_', true);
		test.eq('#1-1', 5, w.length);

		test.eq('#2-1', '!@#', w[0].text);
		test.eq('#2-2', '   ', w[1].text);
		test.eq('#2-3', '#+.', w[2].text);
		test.eq('#2-4', '   ', w[3].text);
		test.eq('#2-5', '&*_', w[4].text);

		test.eq('#3-1', 0, w[0].index);
		test.eq('#3-2', 3, w[1].index);
		test.eq('#3-3', 6, w[2].index);
		test.eq('#3-4', 9, w[3].index);
		test.eq('#3-5', 12, w[4].index);

		test.eq('#4-1', 3, w[0].length);
		test.eq('#4-2', 3, w[1].length);
		test.eq('#4-3', 3, w[2].length);
		test.eq('#4-4', 3, w[3].length);
		test.eq('#4-5', 3, w[4].length);

		test.eq('#5-1', Unistring.WBP.Other, w[0].type);		// is prop of '!'
		test.eq('#5-2', Unistring.WBP.WSegSpace, w[1].type);
		test.eq('#5-3', Unistring.WBP.Other, w[2].type);		// is prop of '#'
		test.eq('#5-4', Unistring.WBP.WSegSpace, w[3].type);
		test.eq('#5-5', Unistring.WBP.Other, w[4].type);		// is prop of '&'
	},
	testGetWordsWithEastAsianScript: test => {
		const w = Unistring.getWords('漢字かな交じりの文', true);
		test.eq('#1-1', 5, w.length);

		test.eq('#2-1', '漢字',   w[0].text);
		test.eq('#2-2', 'かな',   w[1].text);
		test.eq('#2-3', '交',     w[2].text);
		test.eq('#2-4', 'じりの', w[3].text);
		test.eq('#2-5', '文',     w[4].text);
	},
	testWordIndexOf: test => {
		/*
		 * [
		 *   { text: '🍔@#', index: 0, rawIndex: 0, length: 3, type: 23 },
		 *   { text: '   ', index: 3, rawIndex: 4, length: 3, type: 19 },
		 *   { text: '#+.', index: 6, rawIndex: 7, length: 3, type: 0 },
		 *   { text: '   ', index: 9, rawIndex: 10, length: 3, type: 19 },
		 *   { text: '&*_', index: 12, rawIndex: 13, length: 3, type: 0 }
		 * ]
		 */
		const w = Unistring.getWords('🍔@#   #+.   &*_', true);

		test.eq('#1-1', 0, w.wordIndexOf(0));
		test.eq('#1-2', 0, w.wordIndexOf(1));
		test.eq('#1-3', 0, w.wordIndexOf(2));
		test.eq('#1-4', 0, w.wordIndexOf(3));
		test.eq('#1-5', 1, w.wordIndexOf(4));

		test.eq('#2-1', 3, w.wordIndexOf(12));
		test.eq('#2-2', 4, w.wordIndexOf(13));
		test.eq('#2-3', 4, w.wordIndexOf(14));

		test.eq('#3-1', -1, w.wordIndexOf(-1));
		test.eq('#3-2', -1, w.wordIndexOf(16));
		test.eq('#3-3', -1, w.wordIndexOf(-1000));
		test.eq('#3-4', -1, w.wordIndexOf(1000));
	},
	testComplexWordBreaking: test => {
		const w = Unistring.getWords(String.fromCodePoint(
			0x0061, 0x1F1E6, 0x200D, 0x1F1E7, 0x1F1E8, 0x0062));

		// expected result
		const expected = [
			{
				text: String.fromCodePoint(0x0061),
				index: 0,
				length: 1,
				type: 12 // WBP_ALetter
			},
			{
				text: String.fromCodePoint(0x1f1e6, 0x200d, 0x1f1e7),
				index: 1,
				length: 3,
				type: 10 // WBP_Regional_Indicator
			},
			{
				text: String.fromCodePoint(0x1f1e8),
				index: 4,
				length: 1,
				type: 10 // WBP_Regional_Indicator
			},
			{
				text: String.fromCodePoint(0x0062),
				index: 5,
				length: 1,
				type: 12 // WBP_ALetter
			}
		];

		test.eq('#1', 4, w.length);

		expected.forEach((item, index) => {
			let count = 1;
			for (let i in item) {
				test.eq(`#${index+1}-${count++} (${i})`, item[i], w[index][i]);
			}
		});
	},
	testComplexEmojiWordBreaking: test => {
		const w = Unistring.getWords('//👨‍👨‍👦日本語だよ🍩', true);

		// expected result
		const expected = [
			{
				text: '//👨‍👨‍👦',
				index: 0,
				rawIndex: 0,
				length: 7,
				type: 0 // WBP_Other
			},
			{
				text: '日本語',
				index: 7,
				rawIndex: 10,
				length: 3,
				type: 0 // WBP_Other
			},
			{
				text: 'だよ',
				index: 10,
				rawIndex: 13,
				length: 2,
				type: 21 // WBP_Hiragana
			},
			{
				text: '🍩',
				index: 12,
				rawIndex: 15,
				length: 1,
				type: 23 // WBP_Extended_Pictographic
			}
		];

		test.eq('#1', 4, w.length);

		expected.forEach((item, index) => {
			let count = 1;
			for (let i in item) {
				test.eq(`#${index+1}-${count++} (${i})`, item[i], w[index][i]);
			}
		});
	},
	testToLowerCase: test => {
		const s1 = new Unistring('ABC あいうえお');
		const s2 = s1.toLowerCase();

		test.eq('#1-1', 'ABC あいうえお', s1.toString());
		test.eq('#1-2', 'abc あいうえお', s2.toString());

		const s3 = s1.toLowerCase(true);

		test.eq('#2-1', 'ABC あいうえお', s1.toString());
		test.eq('#2-2', 'abc あいうえお', s3.toString());
	},
	testToUpperCase: test => {
		const s1 = new Unistring('abc あいうえお');
		const s2 = s1.toUpperCase();

		test.eq('#1-1', 'abc あいうえお', s1.toString());
		test.eq('#1-2', 'ABC あいうえお', s2.toString());

		const s3 = s1.toUpperCase(true);

		test.eq('#2-1', 'abc あいうえお', s1.toString());
		test.eq('#2-2', 'ABC あいうえお', s3.toString());
	},
	testGetSentences: test => {
		readFileByLine(
			path.join(TEST_DIR, 'SentenceBreakTest.txt'),
			(line, lineIndex) => {
				let expectedLine = line;
				expectedLine = expectedLine.replace(/#.*$/, '');
				expectedLine = expectedLine.replace(/^\s+|\s+$/g, '');
				if (!/^÷ .+ ÷$/.test(expectedLine)) return;

				let testString = '';
				expectedLine.replace(/[0-9A-F]+/g, $0 => {
					testString += Unistring.getUTF16FromCodePoint(
						parseInt($0, 16)
					);
					return $0;
				});

				let actualLine = [];
				Unistring.getSentences(testString).forEach(sentence => {
					const tmp = [];
					Unistring(sentence.text).forEach(cluster => {
						tmp.push.apply(tmp, cluster.codePoints.map(Unistring.getCodePointString));
					});
					actualLine.push(tmp.join(' × '));
				});
				actualLine = `÷ ${actualLine.join(' ÷ ')} ÷`;

				test.eq(`line ${lineIndex}`, expectedLine, actualLine);
			},
			() => {
				test.done();
			}
		);
		return false;
	},
	testGetLineBreakableClusters: test => {
		readFileByLine(
			path.join(TEST_DIR, 'LineBreakTest.txt'),
			(line, lineIndex) => {
				let expectedLine = line;
				expectedLine = expectedLine.replace(/#.*$/, '');
				expectedLine = expectedLine.replace(/^\s+|\s+$/g, '');
				if (!/^[÷×] .+ [÷×]$/.test(expectedLine)) return;

				let testString = '';
				expectedLine.replace(/[0-9A-F]+/g, $0 => {
					testString += Unistring.getUTF16FromCodePoint(
						parseInt($0, 16)
					);
					return $0;
				});

				let actualLine = [];
				const result = Unistring.getLineBreakableClusters(testString);
				result.forEach(cluster => {
					const tmp = [];
					Unistring(cluster.text).forEach(cluster => {
						tmp.push.apply(tmp, cluster.codePoints.map(Unistring.getCodePointString));
					});
					actualLine.push(tmp.join(' × '));
				});
				actualLine = `× ${actualLine.join(' ÷ ')} ÷`;

				if (expectedLine != actualLine) {
					console.dir(result);
				}

				test.eq(`line ${lineIndex}:\n${line.split('#', 2)[1]}`, expectedLine, actualLine);
			},
			() => {
				test.done();
			}
		);
		return false;
	},
	testGetColumnsFor: test => {
		test.eq('#neutral',
			5, Unistring.getColumnsFor(DEVANAGARI));
		test.eq('#ambiguous (1)',
			10, Unistring.getColumnsFor('どうして…'));
		test.eq('#ambiguous (2)',
			9, Unistring.getColumnsFor('どうして…', {awidth: 1}));
		test.eq('#narrow + combining marks',
			7, Unistring.getColumnsFor('⦅a\u0302pple⦆'));
		test.eq('#wide',
			10, Unistring.getColumnsFor('あいうえお'));
		test.eq('#half',
			8, Unistring.getColumnsFor('ﾊﾝｶｸｶﾀｶﾅ'));
		test.eq('#half-voiced-mark',
			6, Unistring.getColumnsFor('ﾊﾟﾝｼﾞｰ'));
		test.eq('#full',
			12, Unistring.getColumnsFor('ＡＢＣ０１２'));
		test.eq('CJK Unified Ideographs Extension A',
			4, Unistring.getColumnsFor('\u3400\u4dbf'));
		test.eq('CJK Unified Ideographs',
			4, Unistring.getColumnsFor('\u4e00\u9fff'));
		test.eq('CJK Compatibility Ideographs',
			4, Unistring.getColumnsFor('\uf900\ufaff'));
		test.eq('Plane 2 code points',
			4, Unistring.getColumnsFor('\u{20000}\u{2fffd}'));
		test.eq('Plane 3 code points',
			4, Unistring.getColumnsFor('\u{30000}\u{3fffd}'));
	},
	testGetColumnsForAnsi: test => {
		const options = {ansi: true};
		test.eq('#neutral',
			5, Unistring.getColumnsFor(`\u001b[1m${DEVANAGARI}\u001b[m`, options));
		test.eq('#ambiguous (1)',
			10, Unistring.getColumnsFor('\u001b[1mどうして…\u001b[m', options));
		test.eq('#ambiguous (2)',
			9, Unistring.getColumnsFor('\u001b[1mどうして…', {awidth: 1, ...options}));
		test.eq('#narrow + combining marks',
			7, Unistring.getColumnsFor('\u001b[1m⦅a\u0302pple⦆\u001b[m', options));
		test.eq('#wide',
			10, Unistring.getColumnsFor('\u001b[1mあいうえお\u001b[m', options));
		test.eq('#half',
			8, Unistring.getColumnsFor('\u001b[1mﾊﾝｶｸｶﾀｶﾅ\u001b[m', options));
		test.eq('#full',
			12, Unistring.getColumnsFor('\u001b[1mＡＢＣ０１２\u001b[m', options));
	},
	testGetColumnsForAnsiAndCharRef: test => {
		const options = {ansi: true, characterReference: true};
		const transformed = DEVANAGARI.split('').map(ch => `&#${ch.codePointAt(0)};`).join('');
		test.eq('#neutral',
			5, Unistring.getColumnsFor(`\u001b[1m${transformed}\u001b[m`, options));
		test.eq('#ambiguous (1)',
			10, Unistring.getColumnsFor('\u001b[1mど&#x3046;して…\u001b[m', options));
		test.eq('#ambiguous (2)',
			9, Unistring.getColumnsFor('\u001b[1mど&#x3046;して…', {awidth: 1, ...options}));
		test.eq('#narrow + combining marks',
			7, Unistring.getColumnsFor('\u001b[1m⦅a\u0302&#x0070;ple⦆\u001b[m', options));
		test.eq('#wide',
			10, Unistring.getColumnsFor('\u001b[1mあ&#x3044;うえお\u001b[m', options));
		test.eq('#half',
			8, Unistring.getColumnsFor('\u001b[1mﾊ&#xff9d;ｶｸｶﾀｶﾅ\u001b[m', options));
		test.eq('#full',
			12, Unistring.getColumnsFor('\u001b[1mＡ&#xff22;Ｃ０１２\u001b[m', options));
	},
	testGetFoldedLines: test => {
		const s = `\
ﾋｬｱ信は潔く負けを認めろ(H\u0308yar believers should accept defeat gracefully)
お前らの大好きな日テレ版は視聴率低迷・社長逃亡で半年で打ち切り・資料の焼き捨て・原作者の忌避・声優からも白黒だったと間違えられる程度の作品 対するテレ朝版は日テレ版の失敗を研究した結果原作者に愛され毎年大長編が作られ途中でリニューアルしながら40年続く国民的アニメに成長 世間はつんつるてんのホイ来たサッサじゃなくて頭テカテカのホンワカパッパを選んだんだよ`;
		const result = Unistring.getFoldedLines(s, {
			columns: 50,
			awidth: 1
		});

		test.eq( '#1', 'ﾋｬｱ信は潔く負けを認めろ(H\u0308yar believers should ', result[0]);
		test.eq( '#2', 'accept defeat gracefully)\n', result[1]);
		test.eq( '#3', 'お前らの大好きな日テレ版は視聴率低迷・社長逃亡で半', result[2]);
		test.eq( '#4', '年で打ち切り・資料の焼き捨て・原作者の忌避・声優か', result[3]);
		test.eq( '#5', 'らも白黒だったと間違えられる程度の作品 対するテレ', result[4]);
		test.eq( '#6', '朝版は日テレ版の失敗を研究した結果原作者に愛され毎', result[5]);
		test.eq( '#7', '年大長編が作られ途中でリニューアルしながら40年続く', result[6]);
		test.eq( '#8', '国民的アニメに成長 世間はつんつるてんのホイ来た', result[7]);
		test.eq( '#9', 'サッサじゃなくて頭テカテカのホンワカパッパを選んだ', result[8]);
		test.eq('#10', 'んだよ', result[9]);
	},
	testGetFoldedLinesWithAnsi: test => {
		const s = `\
\u001b[1;91mﾋｬｱ信\u001b[mは潔く負けを認めろ(H\u0308yar believers should accept defeat gracefully)
お前らの大好きな日テレ版は視聴率低迷・社長逃亡で半年で打ち切り・資料の焼き捨て・原作者の忌避・声優からも白黒だったと間違えられる程度の作品 対するテレ朝版は日テレ版の失敗を研究した結果原作者に愛され毎年大長編が作られ途中でリニューアルしながら40年続く国民的アニメに成長 世間はつんつるてんのホイ来たサッサじゃなくて頭テカテカの\u001b[4mホンワカパッパ\u001b[mを選んだんだよ`;
		const result = Unistring.getFoldedLines(s, {
			columns: 50,
			awidth: 1,
			ansi: true
		});

		test.eq( '#1', '\u001b[1;91mﾋｬｱ信\u001b[mは潔く負けを認めろ(H\u0308yar believers should ', result[0]);
		test.eq( '#2', 'accept defeat gracefully)\n', result[1]);
		test.eq( '#3', 'お前らの大好きな日テレ版は視聴率低迷・社長逃亡で半', result[2]);
		test.eq( '#4', '年で打ち切り・資料の焼き捨て・原作者の忌避・声優か', result[3]);
		test.eq( '#5', 'らも白黒だったと間違えられる程度の作品 対するテレ', result[4]);
		test.eq( '#6', '朝版は日テレ版の失敗を研究した結果原作者に愛され毎', result[5]);
		test.eq( '#7', '年大長編が作られ途中でリニューアルしながら40年続く', result[6]);
		test.eq( '#8', '国民的アニメに成長 世間はつんつるてんのホイ来た', result[7]);
		test.eq( '#9', 'サッサじゃなくて頭テカテカの\u001b[4mホンワカパッパ\u001b[mを選んだ', result[8]);
		test.eq('#10', 'んだよ', result[9]);
	},
	testGetFoldedLinesWithAnsi2: test => {
		const s = `\
\u001b[1;91mﾋｬｱ信は潔く負けを認めろ(H\u0308yar believers should accept defeat gracefully)\u001b[m`
		const result = Unistring.getFoldedLines(s, {
			columns: 50,
			awidth: 1,
			ansi: true
		});

		test.eq( '#1', '\u001b[1;91mﾋｬｱ信は潔く負けを認めろ(H\u0308yar believers should \u001b[m', result[0]);
		test.eq( '#2', '\u001b[1;91maccept defeat gracefully)\u001b[m', result[1]);
	},
	testGetFoldedLinesWithCharRef: test => {
		const s = `\
&#xff8b;&#xff6c;&#65393;信は潔く負けを認めろ(H\u0308yar believers should accept defeat gracefully)

お前らの大好きな日テレ版は視聴率低迷・社長逃亡で半年で打ち切り・資料の焼き捨て・原作者の忌避・声優からも白黒だったと間違えられる程度の作品 対するテレ朝版は日テレ版の失敗を研究した結果原作者に愛され毎年大長編が作られ途中でリニューアルしながら40年続く国民的アニメに成長 世間はつんつるてんのホイ来たサッサじゃなくて頭テカテカのホンワカパッパを選んだんだよ`;
		const result = Unistring.getFoldedLines(s, {
			columns: 50,
			awidth: 1,
			characterReference: true
		});

		test.eq( '#1', 'ﾋｬｱ信は潔く負けを認めろ(H\u0308yar believers should ', result[0]);
		test.eq( '#2', 'accept defeat gracefully)\n', result[1]);
		test.eq( '#3', '\n', result[2]);
		test.eq( '#4', 'お前らの大好きな日テレ版は視聴率低迷・社長逃亡で半', result[3]);
		test.eq( '#5', '年で打ち切り・資料の焼き捨て・原作者の忌避・声優か', result[4]);
		test.eq( '#6', 'らも白黒だったと間違えられる程度の作品 対するテレ', result[5]);
		test.eq( '#7', '朝版は日テレ版の失敗を研究した結果原作者に愛され毎', result[6]);
		test.eq( '#8', '年大長編が作られ途中でリニューアルしながら40年続く', result[7]);
		test.eq( '#9', '国民的アニメに成長 世間はつんつるてんのホイ来た', result[8]);
		test.eq('#10', 'サッサじゃなくて頭テカテカのホンワカパッパを選んだ', result[9]);
		test.eq('#11', 'んだよ', result[10]);
	},
	testGetFoldedLinesWithAnsiAndCharRef: test => {
		const s = `\
&#xff8b;&#xff6c;&#65393;信は潔く負けを認めろ\u001b[1;91m(H\u0308yar believers should accept defeat gracefully)\u001b[m
お前らの大好きな日テレ版は視聴率低迷・社長逃亡で半年で打ち切り・資料の焼き捨て・原作者の忌避・声優からも白黒だったと間違えられる程度の作品 対するテレ朝版は日テレ版の失敗を研究した結果原作者に愛され毎年大長編が作られ途中でリニューアルしながら40年続く国民的アニメに成長 世間は\u001b[4mつんつるてんのホイ来たサッサ\u001b[mじゃなくて頭テカテカのホンワカパッパを選んだんだよ`;
		const result = Unistring.getFoldedLines(s, {
			columns: 50,
			awidth: 1,
			ansi: true,
			characterReference: true
		});

		test.eq( '#1', 'ﾋｬｱ信は潔く負けを認めろ\u001b[1;91m(H\u0308yar believers should \u001b[m', result[0]);
		test.eq( '#2', '\u001b[1;91maccept defeat gracefully)\u001b[m\n', result[1]);
		test.eq( '#3', 'お前らの大好きな日テレ版は視聴率低迷・社長逃亡で半', result[2]);
		test.eq( '#4', '年で打ち切り・資料の焼き捨て・原作者の忌避・声優か', result[3]);
		test.eq( '#5', 'らも白黒だったと間違えられる程度の作品 対するテレ', result[4]);
		test.eq( '#6', '朝版は日テレ版の失敗を研究した結果原作者に愛され毎', result[5]);
		test.eq( '#7', '年大長編が作られ途中でリニューアルしながら40年続く', result[6]);
		test.eq( '#8', '国民的アニメに成長 世間は\u001b[4mつんつるてんのホイ来た\u001b[m', result[7]);
		test.eq( '#9', '\u001b[4mサッサ\u001b[mじゃなくて頭テカテカのホンワカパッパを選んだ', result[8]);
		test.eq('#10', 'んだよ', result[9]);
	},
	testGetFoldedLinesWithEmoji: test => {
		const s = '🐶🐺🐱🐭🐹🐰🐸🐯🐨🐻🐷🐽🐮🐗🐵🐒🐴🐑🐘🐼🐧🐦🐤🐥🐣🐔🐍🐢🐛🐝🐜🐞🐌🐙🐚🐠🐟🐬🐳🐋🐄🐏🐀🐃🐅🐇🐉🐎🐐🐓🐕🐖🐁🐂🐲🐡🐊🐫🐪🐆🐈🐩🐾💐🌸🌷🍀🌹🌻🌺🍁🍃🍂🌿🌾🍄🌵🌴🌲🌳🌰🌱🌼🌐🌞🌝🌚🌑🌒🌓🌔🌕🌖🌗🌘🌜🌛🌙🌍🌎🌏🌋🌌🌠⭐☀⛅☁⚡☔❄⛄🌀🌁🌈🌊';
		const result = Unistring.getFoldedLines(s, {
			columns: 50,
			awidth: 1
		});
		test.eq('#1', '🐶🐺🐱🐭🐹🐰🐸🐯🐨🐻🐷🐽🐮🐗🐵🐒🐴🐑🐘🐼🐧🐦🐤🐥🐣', result[0]);
		test.eq('#2', '🐔🐍🐢🐛🐝🐜🐞🐌🐙🐚🐠🐟🐬🐳🐋🐄🐏🐀🐃🐅🐇🐉🐎🐐🐓', result[1]);
		test.eq('#3', '🐕🐖🐁🐂🐲🐡🐊🐫🐪🐆🐈🐩🐾💐🌸🌷🍀🌹🌻🌺🍁🍃🍂🌿🌾', result[2]);
		test.eq('#4', '🍄🌵🌴🌲🌳🌰🌱🌼🌐🌞🌝🌚🌑🌒🌓🌔🌕🌖🌗🌘🌜🌛🌙🌍🌎', result[3]);
		test.eq('#5', '🌏🌋🌌🌠⭐☀⛅☁⚡☔❄⛄🌀🌁🌈🌊', result[4]);
	},
	testGetFoldedLinesWithVeryLongLatin: test => {
		const s = 'Loremipsumdolorsitametconsecteturadipiscingelitseddoeiusmodtemporincididuntutlaboreetdoloremagnaaliqua.Utenimadminimveniamquisnostrudexercitationullamcolaborisnisiutaliquipexeacommodoconsequat.Duisauteiruredolorinreprehenderitinvoluptatevelitessecillumdoloreeufugiatnullapariatur.Excepteursintoccaecatcupidatatnonproidentsuntinculpaquiofficiadeseruntmollitanimidestlaborum.';
		const result = Unistring.getFoldedLines(s, {
			columns: 50,
			awidth: 1
		});
		test.eq('#1', 'Loremipsumdolorsitametconsecteturadipiscingelitsed', result[0]);
		test.eq('#2', 'doeiusmodtemporincididuntutlaboreetdoloremagnaaliq', result[1]);
		test.eq('#3', 'ua.Utenimadminimveniamquisnostrudexercitationullam', result[2]);
		test.eq('#4', 'colaborisnisiutaliquipexeacommodoconsequat.Duisaut', result[3]);
		test.eq('#5', 'eiruredolorinreprehenderitinvoluptatevelitessecill', result[4]);
		test.eq('#6', 'umdoloreeufugiatnullapariatur.Excepteursintoccaeca', result[5]);
		test.eq('#7', 'tcupidatatnonproidentsuntinculpaquiofficiadeserunt', result[6]);
		test.eq('#8', 'mollitanimidestlaborum.', result[7]);
	},
	testGetFoldedLinesWithMultipleColumns: test => {
		const s = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

		const result = Unistring.getFoldedLines(s, {
			columns: [40, 40, 40, 80],
			awidth: 1
		});
		test.eq('#1', 'Lorem ipsum dolor sit amet, consectetur ', result[0]);
		test.eq('#2', 'adipiscing elit, sed do eiusmod tempor ', result[1]);
		test.eq('#3', 'incididunt ut labore et dolore magna ', result[2]);
		test.eq('#4', 'aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ', result[3]);
		test.eq('#5', 'ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in ', result[4]);
		test.eq('#6', 'voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint ', result[5]);
		test.eq('#7', 'occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim ', result[6]);
		test.eq('#8', 'id est laborum.', result[7]);
	},
	testGetFoldedLinesWhenColumnsAndTextLengthAreTheSame: test => {
		const result = Unistring.getFoldedLines('0123456789\nABCDEFG', {
			columns: 10
		});
		test.eq('#1', 2, result.length);
		test.eq('#2', '0123456789\n', result[0]);
		test.eq('#3', 'ABCDEFG', result[1]);
	},
	testDivideByColumns: test => {
		const [left1, right1] = Unistring.divideByColumns('a\u0302pplejuice', 5);
		test.eq('left #1', 'a\u0302pple', left1);
		test.eq('right #1', 'juice', right1);

		const [left2, right2] = Unistring.divideByColumns('a\u0302pplejuice', -5);
		test.eq('left #2', '', left2);
		test.eq('right #2', 'a\u0302pplejuice', right2);

		const [left3, right3] = Unistring.divideByColumns('a\u0302pplejuice', 50);
		test.eq('left #3', 'a\u0302pplejuice', left3);
		test.eq('right #3', '', right3);

		//                                                 0123456789012345
		const [left4, right4] = Unistring.divideByColumns('全角の途中で分割', 9);
		test.eq('left #4', '全角の途', left4);
		test.eq('right #4', '中で分割', right4);
	},
	testDivideByColumnsAnsi: test => {
		const options = {ansi: true};
		const [left1, right1] = Unistring.divideByColumns(
			'\u001b[4ma\u0302pplejuice\u001b[m', 5, options);
		test.eq('left #1', '\u001b[4ma\u0302pple', left1);
		test.eq('right #1', 'juice\u001b[m', right1);

		const [left2, right2] = Unistring.divideByColumns(
			'\u001b[4ma\u0302pplejuice\u001b[m', -5, options);
		test.eq('left #2', '', left2);
		test.eq('right #2', '\u001b[4ma\u0302pplejuice\u001b[m', right2);

		const [left3, right3] = Unistring.divideByColumns(
			'\u001b[4ma\u0302pplejuice\u001b[m', 50, options);
		test.eq('left #3', '\u001b[4ma\u0302pplejuice\u001b[m', left3);
		test.eq('right #3', '', right3);

		const [left4, right4] = Unistring.divideByColumns(
		//            0123456789012345
			'\u001b[4m全角の途中で分割\u001b[m', 9, options);
		test.eq('left #4', '\u001b[4m全角の途', left4);
		test.eq('right #4', '中で分割\u001b[m', right4);
	},
	testDivideByColumnsAnsiAndCharRef: test => {
		const options = {ansi: true, characterReference: true};
		const [left1, right1] = Unistring.divideByColumns(
			'\u001b[4ma\u0302pple&#x006a;uice\u001b[m', 5, options);
		test.eq('left #1', '\u001b[4ma\u0302pple', left1);
		test.eq('right #1', 'juice\u001b[m', right1);

		const [left2, right2] = Unistring.divideByColumns(
			'\u001b[4ma\u0302pple&#x006a;uice\u001b[m', -5, options);
		test.eq('left #2', '', left2);
		test.eq('right #2', '\u001b[4ma\u0302pplejuice\u001b[m', right2);

		const [left3, right3] = Unistring.divideByColumns(
			'\u001b[4ma\u0302pple&#x006a;uice\u001b[m', 50, options);
		test.eq('left #3', '\u001b[4ma\u0302pplejuice\u001b[m', left3);
		test.eq('right #3', '', right3);

		const [left4, right4] = Unistring.divideByColumns(
		//            0123456789012345
			'\u001b[4m全角&#x306e;途中で分割\u001b[m', 9, options);
		test.eq('left #4', '\u001b[4m全角の途', left4);
		test.eq('right #4', '中で分割\u001b[m', right4);
	},
	testNormalizeHyperlink_folded: test => {
		const result = Unistring.getFoldedLines(`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do ${LINK_START}eiusmod tempor incididunt${LINK_END} ut labore et dolore magna aliqua. Ut enim ad minim veniam`, {columns: 80, ansi: true});

		/*
                                                                _______________
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor 
incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam
^^^^^^^^^^
		 */
		test.eq('length', 2, result.length);
		test.match(
			'line #1',
			/^Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do \x1b\]8;(?:[^;]*);(?:[^\x07]+)\x07eiusmod tempor \x1b\]8;;\x07$/,
			result[0]);
		test.match(
			'line #2',
			/^\x1b\]8;(?:[^;]*);(?:[^\x07]+)\x07incididunt\x1b\]8;;\x07 ut labore et dolore magna aliqua. Ut enim ad minim veniam$/,
			result[1]);
	},
	testNormalizeHyperlink_both: test => {
		const result = Unistring.getFoldedLines(`Lorem ipsum dolor sit amet, ${LINK_START}consectetur adipiscing${LINK_END} elit, sed do ${LINK_START}eiusmod tempor incididunt${LINK_END} ut labore et dolore magna aliqua. Ut enim ad minim veniam`, {columns: 80, ansi: true});

		/*
                            ______________________              _______________
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor 
incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam
^^^^^^^^^^

		 */
		test.eq('length', 2, result.length);
		test.match(
			'line #1',
			/^Lorem ipsum dolor sit amet, \x1b\]8;(?:[^;]*);(?:[^\x07]+)\x07consectetur adipiscing\x1b\]8;;\x07 elit, sed do \x1b\]8;(?:[^;]*);(?:[^\x07]+)\x07eiusmod tempor \x1b\]8;;\x07$/,
			result[0]);
		test.match(
			'line #2',
			/^\x1b\]8;(?:[^;]*);(?:[^\x07]+)\x07incididunt\x1b\]8;;\x07 ut labore et dolore magna aliqua. Ut enim ad minim veniam$/,
			result[1]);
	},
	testNormalizeHyperlink_multipleLines: test => {
		const result = Unistring.getFoldedLines(`Lorem ipsum dolor sit amet, ${LINK_START}consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua${LINK_END}. Ut enim ad minim veniam`, {columns: 40, ansi: true});

		/*
                            ____________
Lorem ipsum dolor sit amet, consectetur 
adipiscing elit, sed do eiusmod tempor 
incididunt ut labore et dolore magna 
aliqua. Ut enim ad minim veniam
^^^^^^
		 */
		test.eq('length', 4, result.length);
		test.match(
			'line #1',
			/^Lorem ipsum dolor sit amet, \x1b\]8;(?:[^;]*);(?:[^\x07]+)\x07consectetur \x1b\]8;;\x07$/,
			result[0]);
		test.match(
			'line #2',
			/^\x1b\]8;(?:[^;]*);(?:[^\x07]+)\x07adipiscing elit, sed do eiusmod tempor \x1b\]8;;\x07$/,
			result[1]);
		test.match(
			'line #3',
			/^\x1b\]8;(?:[^;]*);(?:[^\x07]+)\x07incididunt ut labore et dolore magna \x1b\]8;;\x07$/,
			result[2]);
		test.match(
			'line #4',
			/^\x1b\]8;(?:[^;]*);(?:[^\x07]+)\x07aliqua\x1b\]8;;\x07. Ut enim ad minim veniam$/,
			result[3]);
	}
};

function readFileByLine (fileName, callback, callback2) {
	const lines = fs.readFileSync(fileName, 'utf8').split('\n');
	for (let i = 0, goal = lines.length; i < goal; i++) {
		try {
			const result = callback(lines[i], i + 1);
			if (result === false) {
				break;
			}
		}
		catch (e) {
			console.error(e.stack);
			break;
		}
	}
	callback2 && callback2();
}

if (!fileExists(TEST_DIR)) {
	fs.mkdirSync(TEST_DIR);
}

/*
 * - run all unit tests
 *
 *   $ ./unittest.js
 *
 * - run arbitrary tests
 *
 *   $ ./unittest.js --test=testA,testB,...
 */

loadFiles(TEST_FILES).then(() => {
	process.argv.reduce((result, arg) => {
		if (/^--test=(.+)/.test(arg)) {
			const selectedTests = {};
			RegExp.$1.split(/\s*,\s*/).forEach(test => {
				if (test in tests) {
					selectedTests[test] = tests[test];
				}
				else {
					console.error(`Test "${test}" not found.`);
				}
			});
			testRunner.run(selectedTests);
			result++;
		}
		return result;
	}, 0) || testRunner.run(tests);
});

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker fmr=<<<,>>> :
