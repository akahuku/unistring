#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import Unistring from './unistring.js';

const args = minimist(process.argv.slice(2), {
	string: [
		'grapheme',
		'word',
		'word-extended',
		'sentence',

		'grapheme-prop',
		'word-prop',
		'sentence-prop',
		'script-prop'
	],
	alias: {
		'grapheme': 'g',
		'word': 'w',
		'word-extended': 'W',
		'sentence': 's'
	},
	unknown: () => false
});

function pick (map, value) {
	for (let i in map) {
		if (map[i] == value) {
			return i;
		}
	}
	return '(N/A)';
}

function main () {
	const params = {
		
	};

	if ('grapheme' in args && args['grapheme'] != '') {
		const us = Unistring(args['grapheme']);
		console.dir(us.clusters);
		console.log(`length of UTF-16 code points: ${args['grapheme'].length}`)
		console.log(` length of grapheme clusters: ${us.length}`);
	}
	else if ('word' in args && args['word'] != '') {
		const words = Unistring.getWords(args['word']);
		console.dir(words);
	}
	else if ('word-extended' in args && args['word-extended'] != '') {
		const words = Unistring.getWords(args['word-extended'], true);
		console.dir(words);
	}
	else if ('sentence' in args && args['sentence'] != '') {
		const sentences = Unistring.getSentences(args['sentence']);
		console.dir(sentences);
	}
	else if ('grapheme-prop' in args && args['grapheme-prop'] != '') {
		const arg = args['grapheme-prop'];
		const codePoint = /^u\+([0-9a-f]+)$/i.test(arg) ?
			parseInt(RegExp.$1, 16) : arg.codePointAt(0);
		const prop = Unistring.getGraphemeBreakProp(codePoint);
		const propString = pick(Unistring.GBP, prop);

		console.log([
			`grapheme break property value for`,
			`${Unistring.getCodePointString(codePoint, 'unicode')} "${String.fromCodePoint(codePoint)}" is`,
			`${prop} (Unistring.GBP.${propString})`
		].join(' '));
	}
	else if ('word-prop' in args && args['word-prop'] != '') {
		const arg = args['word-prop'];
		const codePoint = /^u\+([0-9a-f]+)$/i.test(arg) ?
			parseInt(RegExp.$1, 16) : arg.codePointAt(0);
		const prop = Unistring.getWordBreakProp(codePoint);
		const propString = pick(Unistring.WBP, prop);

		console.log([
			`word break property value for`,
			`${Unistring.getCodePointString(codePoint, 'unicode')} "${String.fromCodePoint(codePoint)}" is`,
			`${prop} (Unistring.WBP.${propString})`
		].join(' '));
	}
	else if ('sentence-prop' in args && args['sentence-prop'] != '') {
		const arg = args['sentence-prop'];
		const codePoint = /^u\+([0-9a-f]+)$/i.test(arg) ?
			parseInt(RegExp.$1, 16) : arg.codePointAt(0);
		const prop = Unistring.getSentenceBreakProp(codePoint);
		const propString = pick(Unistring.SBP, prop);

		console.log([
			`sentence break property value for`,
			`${Unistring.getCodePointString(codePoint, 'unicode')} "${String.fromCodePoint(codePoint)}" is`,
			`${prop} (Unistring.SBP.${propString})`
		].join(' '));
	}
	else if ('script-prop' in args && args['script-prop'] != '') {
		const arg = args['script-prop'];
		const codePoint = /^u\+([0-9a-f]+)$/i.test(arg) ?
			parseInt(RegExp.$1, 16) : arg.codePointAt(0);
		const prop = Unistring.getScriptProp(codePoint);
		const propString = pick(Unistring.SCRIPT, prop);

		console.log([
			`script property value for`,
			`${Unistring.getCodePointString(codePoint, 'unicode')} "${String.fromCodePoint(codePoint)}" is`,
			`${prop} (Unistring.SCRIPT.${propString})`
		].join(' '));
	}
	else {
		console.log([
			`${path.basename(new URL(import.meta.url).pathname)} [option]`,
			'options for retrieving boundary properties:',
			'  -g --grapheme=<argument>',
			'  -w --word=<argument>',
			'  -W --word-extended=<argument>',
			'  -s --sentence=<argument>',
			'   * argument is arbitrary string',
			'',
			'options for retrieving each break properties:',
			'  --grapheme-prop=<argument>',
			'  --word-prop=<argument>',
			'  --sentence-prop=<argument>',
			'   * argument is arbitrary string or "U+XXXXXX"',
			'',
			'options for retrieving script properties:',
			'  --script=<argument>',
			'   * argument is arbitrary string or "U+XXXXXX"'
		].join('\n'));
	}

}

main();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :
