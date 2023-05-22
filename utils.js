import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

export function fileExists (filepath) {
	let result = true;
	try {
		fs.accessSync(filepath, fs.constants.R_OK);
	}
	catch (err) {
		result = false;
	}
	return result;
}

export function loadFile (fileURL, localPath) {
	return new Promise(resolve => {
		process.stdout.write(`loading ${fileURL}...`)
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

export function loadFiles (fileSpecs, forceLoad = false) {
	return fileSpecs.reduce((acc, fileSpec) => {
		let {url: fileURL, path: localPath} = fileSpec;

		if (/[\\\/]$/.test(localPath)) {
			localPath += path.basename(fileURL);
		}

		if (!fileExists(localPath) || forceLoad) {
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

// vim:set ts=4 sw=4 fenc=UTF-8 ff=unix ft=javascript fdm=marker fmr=<<<,>>> :
