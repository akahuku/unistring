Unistring
=========

## What is this?

Unistring is a javascript library to handle "unicode string" easily and
correctly.  javascript's native string is also unicode string, however it is
actually simple UTF-16 sequence, so you must handle unicode's complicated
mechanism such as surrogate pairs and combining character sequence.

The currently supported Unicode version is 14.0.0.

Unistring hides this complexity:

## Example

```javascript
let s = 'de\u0301licieux\uD83D\uDE0B'; // délicieux😋
let us = Unistring(s);

// retrieving number of 'user-perceived characters'...
s.length;        // fail, returns 12
us.length;       // ok, returns 10

// retrieving e with accent aigu...
s.charAt(1);     // fail, returns "e" as string
us.clusterAt(1); // ok, returns "e\u0301" as string

// retrieving last character...
s.substr(-1);    // fail, returns "\uDE0B" as string
us.substr(-1);   // ok, returns "😋" as Unistring instance

// manipulation
us.insert("C'est ", 0);
us.delete(-1);
us.append('!');
us.toString();   // returns "C'est délicieux!" as string

// break into words by UAX#29 word boundary rule
let words1 = Unistring.getWords('The quick (“brown”) fox can’t jump 32.3 feet, right?');
/*
words1 = [
 {
  "text": "The",
  "index": 0,
  "length": 3,
  "type": 12
 },
 {
  "text": " ",
  "index": 3,
  "length": 1,
  "type": 19
 },
 {
  "text": "quick",
  "index": 4,
  "length": 5,
  "type": 12
 },
 {
  "text": " ",
  "index": 9,
  "length": 1,
  "type": 19
 },
 {
  "text": "(",
  "index": 10,
  "length": 1,
  "type": 0
 },
 {
  "text": "“",
  "index": 11,
  "length": 1,
  "type": 0
 },
 {
  "text": "brown",
  "index": 12,
  "length": 5,
  "type": 12
 },
 {
  "text": "”",
  "index": 17,
  "length": 1,
  "type": 0
 },
 {
  "text": ")",
  "index": 18,
  "length": 1,
  "type": 0
 },
 {
  "text": " ",
  "index": 19,
  "length": 1,
  "type": 19
 },
 {
  "text": "fox",
  "index": 20,
  "length": 3,
  "type": 12
 },
 {
  "text": " ",
  "index": 23,
  "length": 1,
  "type": 19
 },
 {
  "text": "can’t",
  "index": 24,
  "length": 5,
  "type": 12
 },
 {
  "text": " ",
  "index": 29,
  "length": 1,
  "type": 19
 },
 {
  "text": "jump",
  "index": 30,
  "length": 4,
  "type": 12
 },
 {
  "text": " ",
  "index": 34,
  "length": 1,
  "type": 19
 },
 {
  "text": "32.3",
  "index": 35,
  "length": 4,
  "type": 16
 },
 {
  "text": " ",
  "index": 39,
  "length": 1,
  "type": 19
 },
 {
  "text": "feet",
  "index": 40,
  "length": 4,
  "type": 12
 },
 {
  "text": ",",
  "index": 44,
  "length": 1,
  "type": 14
 },
 {
  "text": " ",
  "index": 45,
  "length": 1,
  "type": 19
 },
 {
  "text": "right",
  "index": 46,
  "length": 5,
  "type": 12
 },
 {
  "text": "?",
  "index": 51,
  "length": 1,
  "type": 0
 }
]
 */

// break into words by UAX#29 word boundary rule, with Unistring's script
// extension that treat neighboring same script character as part of word
let words2 = Unistring.getWords('// 漢字カタカナひらがな1.23', true);
/*
words2 = [
 {
  "text": "//",
  "index": 0,
  "length": 2,
  "type": 0
 },
 {
  "text": " ",
  "index": 2,
  "length": 1,
  "type": 19
 },
 {
  "text": "漢字",
  "index": 3,
  "length": 2,
  "type": 0
 },
 {
  "text": "カタカナ",
  "index": 5,
  "length": 4,
  "type": 20
 },
 {
  "text": "ひらがな",
  "index": 9,
  "length": 4,
  "type": 21
 },
 {
  "text": "1.23",
  "index": 13,
  "length": 4,
  "type": 16
 }
]
 */

// break into sentences by UAX#29 sentence boundary rule
let sentences = Unistring.getSentences(
	'ある日の事でございます。御釈迦様は極楽の蓮池のふちを、独りでぶらぶら御歩きになっていらっしゃいました。' +
	'He said, “Are you going?”  John shook his head.'
);
/*
sentences = [
 {
  "text": "ある日の事でございます。",
  "index": 0,
  "length": 12,
  "type": 14
 },
 {
  "text": "御釈迦様は極楽の蓮池のふちを、独りでぶらぶら御歩きになっていらっしゃいました。",
  "index": 12,
  "length": 39,
  "type": 14
 },
 {
  "text": "He said, “Are you going?”  ",
  "index": 51,
  "length": 27,
  "type": 8
 },
 {
  "text": "John shook his head.",
  "index": 78,
  "length": 20,
  "type": 13
 }
]
 */
```

## for standard web pages

### Download

* [unistring.js](https://raw.githubusercontent.com/akahuku/unistring/master/unistring.js)

### Install

```html
<script src="/path/to/unistring.js"></script>
```

Unistring function will be defined to window object.

### Use it

```javascript
let us = Unistring('de\u0301licieux\uD83D\uDE0B');
```



## for node.js

### Install

`npm install akahuku/unistring#master`

### Use it

```javascript
import Unistring from 'unistring.js';
let us = Unistring('de\u0301licieux\uD83D\uDE0B');
```



## Reference

### Instance properties

* `length: number`

### Instance methods

* `clone(): Unistring`
* `dump(): string`
* `toString(): string`
* `delete(start [,length]): Unistring`
* `insert(str, start): Unistring`
* `append(str): Unistring`
* `codePointsAt(index): number[]`
* `clusterAt(index): string`
* `rawStringAt(index): string`
* `rawIndexAt(index): number`
* `forEach(callback [,thisObj])`
* `getCrusterIndexFromUTF16Index(index): number`
* `charAt(index): string`
* `charCodeAt(index): number`
* `substring(start [,end]): Unistring`
* `substr(start [,length]): Unistring`
* `slice(start [,end]): Unistring`
* `concat(str): Unistring`
* `indexOf(str): number`
* `lastIndexOf(str): number`
* `toLowerCase([useLocale]): Unistring`
* `toUpperCase([useLocale]): Unistring`

### Class methods

* `getCodePointArray(str): number[]`
* `getGraphemeBreakProp(codePoint): number`
* `getWordBreakProp(codePoint): number`
* `getSentenceBreakProp(codePoint): number`
* `getScriptProp(codePoint): number`
* `getUTF16FromCodePoint(codePoint): string`
* `getCodePointString(codePoint, type): string`
* `getWords(str [,useScripts]): object[]`
* `getSentences(str): object[]`

### Class constants

* `GBP: Object` - an associative array from name of GraphemeBreakProperty to corresponding integer value
* `WBP: Object` - an associative array from name of WordBreakProperty to corresponding integer value
* `SBP: Object` - an associative array from name of SentenceBreakProperty to corresponding integer value
* `SCRIPT: Object` - an associative array from name of ScriptProperty to corresponding integer value
* `GBP_NAMES: string[]`
* `WBP_NAMES: string[]`
* `SBP_NAMES: string[]`
* `SCRIPT_NAMES: string[]`
