#!/usr/bin/env node
/*
 * grapheme break property generator
 * =================================
 *
 * format:
 *
 *   +0       +1       +2       +3       +4
 *   --------------------------------------------
 *   11111111 00000000 00010000 11111111 11111111
 *   ^^^^^^^^
 *    value   ^^^^^^^^ ^^^
 *            range length^^^^^ ^^^^^^^^ ^^^^^^^^
 *                               codepoint
 *
 *   note: code point order must be sorted.
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import minimist from 'minimist';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const DATA_DIR = __dirname + '/unicode-data/';
const TEST_DIR = __dirname + '/test/';

const args = minimist(process.argv.slice(2));
const self = process.argv.map((s, index) => {
	return index < 2 ? path.basename(s) : s;
}).join(' ');

function loadFile (fileURL, localPath) {
	return new Promise(resolve => {
		console.log(`loading ${fileURL}...`)
		http.get(fileURL, res => {
			let content = '';
			res.setEncoding('utf8');
			res.on('data', chunk => {content += chunk});
			res.on('end', res => {
				fs.writeFileSync(localPath, content, 'utf8');
				console.log(`done.`);
				resolve();
			});
		});
	});
}

function loadFiles (fileSpecs, forceLoad) {
	return fileSpecs.reduce((acc, fileSpec) => {
		let {url: fileURL, path: localPath} = fileSpec;

		if (localPath.substr(-1) == '/') {
			localPath += path.basename(fileURL);
		}

		if (!fs.existsSync(localPath) || forceLoad) {
			return acc.then(() => loadFile(fileURL, localPath));
		}
		else {
			console.log(`found: ${path.basename(localPath)}`);
			return acc;
		}
	}, Promise.resolve()).then(() => {
		console.log(`all files processed.`);
	});
}

function setup (params) {
	fs.readFile(params.srcFileName, 'utf8', (err, data) => {
		if (err) throw err;
		prepare(params, data);
	});
}

function prepare (params, data) {
	data = data.split('\n');
	params.onSourceLoad && (data = params.onSourceLoad(data));

	for (let i = 0, goal = data.length; i < goal; i++) {
		let line = data[i];
		line = line.replace(/#.*/, '');
		line = line.replace(/^\s+|\s+$/g, '');
		if (line == '') continue;

		let re = /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*(.+)/.exec(line);
		if (!re) continue;

		if (!re[2]) {
			re[2] = re[1];
		}
		if (!(re[3] in params.propIndex)) {
			params.propIndex[re[3]] = Object.keys(params.propIndex).length;
		}

		params.propData.push([
			parseInt(re[1], 16),
			parseInt(re[2], 16),
			params.propIndex[re[3]]
		]);
	}

	params.onDataCreate && (params.propData = params.onDataCreate(params.propData));
	params.propData.sort((a, b) => a[0] - b[0]);

	for (let i = 0; i < params.propData.length - 1; i++) {
		if (params.propData[i][1] + 1 == params.propData[i + 1][0]
		&&  params.propData[i][2] == params.propData[i + 1][2]) {
			params.propData[i][1] = params.propData[i + 1][1];
			params.propData.splice(i + 1, 1);
			i--;
		}
	}

	makeJs(params);
}

function makeJs (params) {
	function output (...args) {
		console.log(args.join('\n'));
	}

	const propData = params.propData;
	const propIndex = params.propIndex;
	const UNIT_SIZE = 5;

	output(
		'// GENERATED CODE START <<<1',
		'// This data was generated by the command \'' + self + '\'.',
		'const ' + params.tableName + ' = \'\\'
	);

	/*
	 * table
	 */

	for (let i = 0; i < propData.length; i++) {
		if (propData[i][1] - propData[i][0] + 1 > 2047) {
			propData.splice(i + 1, 0, [
				propData[i][0] + 2047,
				propData[i][1],
				propData[i][2]
			]);
			propData[i][1] = propData[i][0] + 2047 - 1;
		}
	}
	let tmp = Buffer.alloc(propData.length * UNIT_SIZE);
	let offset = 0;
	for (let i = 0, goal = propData.length; i < goal; i++) {
		if (propData[i][2] > 255) {
			throw new Error(
				'#' + i + ': property value too large: ' +
				propData[i][2]);
		}
		if (propData[i][1] - propData[i][0] + 1 > 2047) {
			throw new Error(
				'#' + i + ': range too large: ' +
				(propData[i][1] - propData[i][0] + 1));
		}
		if (propData[i][0] > 0x10ffff) {
			throw new Error(
				'#' + i + ': code point too large: ' +
				propData[i][0].toString(16));
		}
		tmp.writeUInt8(propData[i][2], offset);
		offset += 1;

		tmp.writeUInt32LE(
			((propData[i][1] - propData[i][0] + 1) * 0x200000)
			+ (propData[i][0]),
			offset);
		offset += 4;
	}

	tmp = tmp.toString('hex').toUpperCase().replace(/.{80}/g, '$&\\\n');
	output(
		tmp + '\'',
		'.replace(/[0-9A-F]{2}/g, $0=>String.fromCharCode(parseInt($0, 16)));',
		''
	);

	/*
	 * property name
	 */

	/*
	for (var key in propIndex) {
		output('var ' + params.constPrefix + '_' + key + ' = ' + propIndex[key] + ';');
	}
	output('');
	*/

	/*
	 * length of struct
	 */

	output('const ' + params.structLengthVarName + ' = ' + UNIT_SIZE + ';');

	/*
	 * name convert table
	 */

	output(
		`const ${params.constPrefix} = ` +
		JSON.stringify(propIndex, null, '\t')
			.split('\n')
			.map((a, i) => i ? a.replace(/"/g, "'") : a)
			.map((a, i) => params.outputCode ? a.replace(/^(\t*)(')/g, `$1/* ${String.fromCharCode(95 + i)} */$2`) : a)
			.join('\n') + ';'
		);

	output(
		`const ${params.constPrefix}_NAMES = Object.keys(${params.constPrefix});`);

	output(
		'',
		'// GENERATED CODE END',
		'// >>>'
	);
}

function main () {
	const params = {
		unicodeVersion: '14.0.0',
		forceLoad: false,
		propData: []
	};

	if (args.u || args['unicode-version']) {
		params.unicodeVersion = args.u || args['unicode-version'];
	}

	if (args.f || args['force']) {
		params.forceLoad = true;
	}

	if (args.l || args['load-files']) {
		const files = [
			{
				url: 'http://www.unicode.org/Public/#version#/ucd/auxiliary/GraphemeBreakProperty.txt',
				path: DATA_DIR
			},
			{
				url: 'http://www.unicode.org/Public/#version#/ucd/auxiliary/WordBreakProperty.txt',
				path: DATA_DIR
			},
			{
				url: 'http://www.unicode.org/Public/#version#/ucd/auxiliary/SentenceBreakProperty.txt',
				path: DATA_DIR
			},
			{
				url: 'http://www.unicode.org/Public/#version#/ucd/Scripts.txt',
				path: DATA_DIR
			},
			{
				url: 'http://www.unicode.org/Public/#version#/ucd/auxiliary/GraphemeBreakTest.txt',
				path: TEST_DIR
			},
			{
				url: 'http://www.unicode.org/Public/#version#/ucd/auxiliary/WordBreakTest.txt',
				path: TEST_DIR
			},
			{
				url: 'http://www.unicode.org/Public/#version#/ucd/auxiliary/SentenceBreakTest.txt',
				path: TEST_DIR
			}
		];
		files.forEach(spec => {
			spec.url = spec.url.replace('#version#', params.unicodeVersion);
		});
		loadFiles(files, params.forceLoad);
		return;
	}

	if (args.s || args['scripts']) {
		params.srcFileName = DATA_DIR + 'Scripts.txt';
		params.propIndex = {
			'Unknown': 0
		};
		params.tableName = 'SCRIPTS';
		params.structLengthVarName = 'SCRIPTS_PROP_UNIT_LENGTH';
		params.constPrefix = 'SCRIPT';
	}

	else if (args.g || args['grapheme-break-properties']) {
		params.srcFileName = DATA_DIR + 'GraphemeBreakProperty.txt';
		params.propIndex = {
			'Other': 0,
			'SOT': 1,
			'EOT': 2
		};
		params.tableName = 'GRAPHEME_BREAK_PROPS';
		params.structLengthVarName = 'GRAPHEME_BREAK_PROP_UNIT_LENGTH';
		params.constPrefix = 'GBP';
		params.outputCode = true;
	}

	else if (args.w || args['word-break-properties']) {
		params.srcFileName = DATA_DIR + 'WordBreakProperty.txt';
		params.propIndex = {
			'Other': 0,
			'SOT': 1,
			'EOT': 2
		};
		params.tableName = 'WORD_BREAK_PROPS';
		params.structLengthVarName = 'WORD_BREAK_PROP_UNIT_LENGTH';
		params.constPrefix = 'WBP';
		params.outputCode = true;
		params.onSourceLoad = data => {
			// strip Katakana
			data = data.filter(line => {
				return !/;\s*Katakana\s*#/.test(line);
			});

			// override customized data
			try {
				const dataString = data.join('\n');
				const overrides = fs.readFileSync(DATA_DIR + 'WordBreakOverrides.txt', 'utf8')
					.split('\n')
					.filter(line => {
						let re = /^([0-9A-F]+(\.\.[0-9A-F]+)?)/.exec(line);
						return re ? dataString.indexOf('\n' + re[1]) < 0 : true;
					});

				data.push.apply(data, overrides);
			}
			catch (e) {
				if (e.code != 'ENOENT') throw e;
			}

			return data;
		};
	}

	else if (args.e || args['sentence-break-properties']) {
		params.srcFileName = DATA_DIR + 'SentenceBreakProperty.txt';
		params.propIndex = {
			'Other': 0,
			'SOT': 1,
			'EOT': 2
		};
		params.tableName = 'SENTENCE_BREAK_PROPS';
		params.structLengthVarName = 'SENTENCE_BREAK_PROP_UNIT_LENGTH';
		params.constPrefix = 'SBP';
		params.outputCode = true;
	}

	if (!params.srcFileName || args.h || args['?'] || args.help) {
		console.log([
			`${path.basename(new URL(import.meta.url).pathname)} [options]`,
			'options for handling Unicode data:',
			'  -u --unicode-version=<version>',
			'  -l --load-files',
			'  -f --force',
			'',
			'options for generating the data table:',
			'  -s --scripts',
			'  -g --grapheme-break-properties',
			'  -w --word-break-properties',
			'  -e --sentence-break-properties'
		].join('\n'));
		process.exit(1);
	}

	setup(params);
}

main();

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker :