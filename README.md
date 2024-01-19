Unistring
=========

## What is this?

Unistring is a javascript library to handle "unicode string" easily and
correctly.  javascript's native string is also unicode string, however it is
actually simple UTF-16 sequence, so you must handle unicode's complicated
mechanism such as surrogate pairs and combining character sequence.

Unistring hides this complexity.  The currently supported Unicode version is
14.0.0 and Unistring passes all 11454 test patterns provided by Unicode.org.

## Example

### String manipulation

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
```

### Break into words by UAX#29 word boundary rule

```javascript
let words1 = Unistring.getWords('The quick (“brown”) fox can’t jump 32.3 feet, right?');
/*
words1 = [
 {
  "text": "The",	// fragment of the target text
  "index": 0,		// start index, in grapheme unit
  "rawIndex": 0,	// start index, in UTF-16 unit
  "length": 3,		// length of graphemes
  "type": 12		// internal class value
 },
 {
  "text": " ",
  "index": 3, "rawIndex": 3, "length": 1, "type": 19
 },
 {
  "text": "quick",
  "index": 4, "rawIndex": 4, "length": 5, "type": 12
 },
 {
  "text": " ",
  "index": 9, "rawIndex": 9, "length": 1, "type": 19
 },
 {
  "text": "(", "index": 10, "rawIndex": 10, "length": 1, "type": 0
 },
 {
  "text": "“",
  "index": 11, "rawIndex": 11, "length": 1, "type": 0
 },
 {
  "text": "brown",
  "index": 12, "rawIndex": 12, "length": 5, "type": 12
 },
 {
  "text": "”",
  "index": 17, "rawIndex": 17, "length": 1, "type": 0
 },
 {
  "text": ")",
  "index": 18, "rawIndex": 18, "length": 1, "type": 0
 },
 {
  "text": " ",
  "index": 19, "rawIndex": 19, "length": 1, "type": 19
 },
 {
  "text": "fox",
  "index": 20, "rawIndex": 20, "length": 3, "type": 12
 },
 {
  "text": " ",
  "index": 23, "rawIndex": 23, "length": 1, "type": 19
 },
 {
  "text": "can’t",
  "index": 24, "rawIndex": 24, "length": 5, "type": 12
 },
 {
  "text": " ",
  "index": 29, "rawIndex": 29, "length": 1, "type": 19
 },
 {
  "text": "jump",
  "index": 30, "rawIndex": 30, "length": 4, "type": 12
 },
 {
  "text": " ",
  "index": 34, "rawIndex": 34, "length": 1, "type": 19
 },
 {
  "text": "32.3",
  "index": 35, "rawIndex": 35, "length": 4, "type": 16
 },
 {
  "text": " ",
  "index": 39, "rawIndex": 39, "length": 1, "type": 19
 },
 {
  "text": "feet",
  "index": 40, "rawIndex": 40, "length": 4, "type": 12
 },
 {
  "text": ",",
  "index": 44, "rawIndex": 44, "length": 1, "type": 14
 },
 {
  "text": " ",
  "index": 45, "rawIndex": 45, "length": 1, "type": 19
 },
 {
  "text": "right",
  "index": 46, "rawIndex": 46, "length": 5, "type": 12
 },
 {
  "text": "?",
  "index": 51, "rawIndex": 51, "length": 1, "type": 0
 }
]
 */
```

### Break into words by UAX#29 word boundary rule, with Unistring's script extension

You can turn on Unistring's script extension (treat neighboring same script
character as part of word) by setting the second argument of getWords() to
true.

```javascript
let words2 = Unistring.getWords('// 漢字カタカナひらがな1.23', true);
/*
words2 = [
 {
  "text": "//",
  "index": 0, "rawIndex": 0, "length": 2, "type": 0
 },
 {
  "text": " ",
  "index": 2, "rawIndex": 2, "length": 1, "type": 19
 },
 {
  "text": "漢字",
  "index": 3, "rawIndex": 3, "length": 2, "type": 0
 },
 {
  "text": "カタカナ",
  "index": 5, "rawIndex": 5, "length": 4, "type": 20
 },
 {
  "text": "ひらがな",
  "index": 9, "rawIndex": 9, "length": 4, "type": 21
 },
 {
  "text": "1.23",
  "index": 13, "rawIndex": 13, "length": 4, "type": 16
 }
]
 */
```

### Break into sentences by UAX#29 sentence boundary rule

```javascript
let sentences = Unistring.getSentences(
	'ある日の事でございます。御釈迦様は極楽の蓮池のふちを、独りでぶらぶら御歩きになっていらっしゃいました。' +
	'He said, “Are you going?”  John shook his head.'
);
/*
sentences = [
 {
  "text": "ある日の事でございます。",
  "index": 0, "rawIndex": 0, "length": 12, "type": 11
 },
 {
  "text": "御釈迦様は極楽の蓮池のふちを、独りでぶらぶら御歩きになっていらっしゃいました。",
  "index": 12, "rawIndex": 12, "length": 39, "type": 11
 },
 {
  "text": "He said, “Are you going?”  ",
  "index": 51, "rawIndex": 51, "length": 27, "type": 10
 },
 {
  "text": "John shook his head.",
  "index": 78, "rawIndex": 78, "length": 20, "type": 10
 }
]
 */
```

### Fold text to fit into specified columns by UAX#14 line breaking algorithm

```javascript
let foldedLines = Unistring.getFoldedLines(
`On this unsatisfactory manner the penultimate message of Cavor dies out. One seems to see him away there in the blue obscurity amidst his apparatus intently signalling us to the last, all unaware of the curtain of confusion that drops between us; all unaware, too, of the final dangers that even then must have been creeping upon him. His disastrous want of vulgar common sense had utterly betrayed him. He had talked of war, he had talked of all the strength and irrational violence of men, of their insatiable aggressions, their tireless futility of conflict. He had filled the whole moon world with this impression of our race, and then I think it is plain that he made the most fatal admission that upon himself alone hung the possibility—at least for a long time—of any further men reaching the moon. The line the cold, inhuman reason of the moon would take seems plain enough to me, and a suspicion of it, and then perhaps some sudden sharp realisation of it, must have come to him. One imagines him about the moon with the remorse of this fatal indiscretion growing in his mind.  During a certain time I am inclined to guess the Grand Lunar was deliberating the new situation, and for all that time Cavor may have gone as free as ever he had gone. But obstacles of some sort prevented his getting to his electromagnetic apparatus again after that message I have just given. For some days we received nothing. Perhaps he was having fresh audiences, and trying to evade his previous admissions.  Who can hope to guess?

And then suddenly, like a cry in the night, like a cry that is followed by a stillness, came the last message. It is the briefest fragment, the broken beginnings of two sentences.`,
  {
	columns: 50,  // number of columns to fold. default is 80
	awidth: 1,    // columns of ambiguous characters in east asian script, 1 or 2. default is 2
	ansi: false,  // if true, ignore ANSI escape sequences. default is false
	characterReference: false // if true, treat \&#999999; / \&#x999999; as the character they
	                          // represent. default is false
  }
);
/*
foldedLines = [
 "On this unsatisfactory manner the penultimate ",
 "message of Cavor dies out. One seems to see him ",
 "away there in the blue obscurity amidst his ",
 "apparatus intently signalling us to the last, all ",
 "unaware of the curtain of confusion that drops ",
 "between us; all unaware, too, of the final ",
 "dangers that even then must have been creeping ",
 "upon him. His disastrous want of vulgar common ",
 "sense had utterly betrayed him. He had talked of ",
 "war, he had talked of all the strength and ",
 "irrational violence of men, of their insatiable ",
 "aggressions, their tireless futility of conflict. ",
 "He had filled the whole moon world with this ",
 "impression of our race, and then I think it is ",
 "plain that he made the most fatal admission that ",
 "upon himself alone hung the possibility—at least ",
 "for a long time—of any further men reaching the ",
 "moon. The line the cold, inhuman reason of the ",
 "moon would take seems plain enough to me, and a ",
 "suspicion of it, and then perhaps some sudden ",
 "sharp realisation of it, must have come to him. ",
 "One imagines him about the moon with the remorse ",
 "of this fatal indiscretion growing in his mind.  ",
 "During a certain time I am inclined to guess the ",
 "Grand Lunar was deliberating the new situation, ",
 "and for all that time Cavor may have gone as free ",
 "as ever he had gone. But obstacles of some sort ",
 "prevented his getting to his electromagnetic ",
 "apparatus again after that message I have just ",
 "given. For some days we received nothing. Perhaps ",
 "he was having fresh audiences, and trying to ",
 "evade his previous admissions.  Who can hope to ",
 "guess?\n",
 "\n",
 "And then suddenly, like a cry in the night, like ",
 "a cry that is followed by a stillness, came the ",
 "last message. It is the briefest fragment, the ",
 "broken beginnings of two sentences."
]
 */
```

## Using Unistring in standard web pages

### Download

* [unistring.js](https://raw.githubusercontent.com/akahuku/unistring/master/unistring.js)

### Use it

```javascript
import Unistring from './unistring.js';
let us = Unistring('de\u0301licieux\uD83D\uDE0B');
```



## Using Unistring as a node.js package

### Install

```sh
$ npm install @akahuku/unistring
```

### Use it

```javascript
import Unistring from '@akahuku/unistring';
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

methods for text segmentation algorithm (UAX#29):

* `getCodePointArray(str): number[]`
* `getGraphemeBreakProp(codePoint): number`
* `getWordBreakProp(codePoint): number`
* `getSentenceBreakProp(codePoint): number`
* `getScriptProp(codePoint): number`
* `getUTF16FromCodePoint(codePoint): string`
* `getCodePointString(codePoint, type): string`
* `getWords(str [,useScripts]): object[]`
* `getSentences(str): object[]`

methods for line breaking algorithm (UAX#14):

* `getLineBreakableClusters(str): object[]`
* `getColumnsFor(str [,options = {}]): number`
* `divideByColumns(str, columns [,options = {}]): string[left, right]`
* `getFoldedLines(str [,options = {}]): string[]`

these tree methods take an option for which the following properties are available:

* `columns: number` - number of column (default: 80). For getFoldedLInes(), it may be an array. In that case, each element of the array is used as columns. If the array is not long enough, the last element is used as the remaining columns
* `awidth: number` - column of ambiguous character in East Asian Width (1 or 2, default: 2)
* `ansi: boolean` - ignore ANSI escape sequences and treat their width as 0 (default: false)
* `characterReference: boolean` - treat SGML character reference (\&#999999;, \&#x999999; ...) as the character they represent (default: false)

### Class properties

* `awidth: number` - default ambiguous column if no awidth is specified in options

### Class constants

* `GBP: Object` - an associative array from name of GraphemeBreakProperty to corresponding integer value
* `WBP: Object` - an associative array from name of WordBreakProperty to corresponding integer value
* `SBP: Object` - an associative array from name of SentenceBreakProperty to corresponding integer value
* `SCRIPT: Object` - an associative array from name of ScriptProperty to corresponding integer value
* `LBP: Object` - an associative array from name of LineBreakProperty to corresponding integer value
* `GBP_NAMES: string[]`
* `WBP_NAMES: string[]`
* `SBP_NAMES: string[]`
* `SCRIPT_NAMES: string[]`
* `LBP_NAMES: string[]`
