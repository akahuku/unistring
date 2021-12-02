import Unistring from './unistring.js';

let s = 'de\u0301licieux\uD83D\uDE0B'; // délicieux😋
let us = Unistring(s);

// retrieving number of 'user-perceived characters'...
console.log(s.length);        // fail, returns 12
console.log(us.length);       // ok, returns 10

// retrieving e with accent aigu...
console.log(s.charAt(1));     // fail, returns "e" as string
console.log(us.clusterAt(1)); // ok, returns "e\u0301" as string

// retrieving last character...
console.log(s.substr(-1));    // fail, returns "\uDE0B" as string
console.log(us.substr(-1));   // ok, returns "😋" as Unistring instance

// manipulation
us.insert("C'est ", 0);
us.delete(-1);
us.append('!');
console.log(us.toString());   // returns "C'est délicieux!" as string

// break into words by UAX#29 word boundary rule
let words1 = Unistring.getWords('The quick (“brown”) fox can’t jump 32.3 feet, right?');
console.log('words1 = ' + JSON.stringify(words1, null, ' '));
/*
 */

// break into words by UAX#29 word boundary rule, with Unistring's script extension
let words2 = Unistring.getWords('// 漢字カタカナひらがな1.23', true);
console.log('words2 = ' + JSON.stringify(words2, null, ' '));

// break into sentences by UAX#29 sentence boundary rule
let sentences = Unistring.getSentences(
	'ある日の事でございます。御釈迦様は極楽の蓮池のふちを、独りでぶらぶら御歩きになっていらっしゃいました。' +
	'He said, “Are you going?”  John shook his head.'
);
console.log('sentences = ' + JSON.stringify(sentences, null, ' '));
