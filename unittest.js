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
		test.eq('#newtral',          5, Unistring.getColumnsFor('देवनागरी'));
		test.eq('#ambiguous (1)',   10, Unistring.getColumnsFor('どうして…'));
		test.eq('#ambiguous (2)',    9, Unistring.getColumnsFor('どうして…', {awidth: 1}));
		test.eq('#narrow + combining marks',  7, Unistring.getColumnsFor('⦅a\u0302pple⦆'));
		test.eq('#wide',            10, Unistring.getColumnsFor('あいうえお'));
		test.eq('#half',             8, Unistring.getColumnsFor('ﾊﾝｶｸｶﾀｶﾅ'));
		test.eq('#full',            12, Unistring.getColumnsFor('ＡＢＣ０１２'));
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

		test.eq( '#1', 'ﾋｬｱ信は潔く負けを認めろ\u001b[1;91m(H\u0308yar believers should ', result[0]);
		test.eq( '#2', 'accept defeat gracefully)\u001b[m\n', result[1]);
		test.eq( '#3', 'お前らの大好きな日テレ版は視聴率低迷・社長逃亡で半', result[2]);
		test.eq( '#4', '年で打ち切り・資料の焼き捨て・原作者の忌避・声優か', result[3]);
		test.eq( '#5', 'らも白黒だったと間違えられる程度の作品 対するテレ', result[4]);
		test.eq( '#6', '朝版は日テレ版の失敗を研究した結果原作者に愛され毎', result[5]);
		test.eq( '#7', '年大長編が作られ途中でリニューアルしながら40年続く', result[6]);
		test.eq( '#8', '国民的アニメに成長 世間は\u001b[4mつんつるてんのホイ来た', result[7]);
		test.eq( '#9', 'サッサ\u001b[mじゃなくて頭テカテカのホンワカパッパを選んだ', result[8]);
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
