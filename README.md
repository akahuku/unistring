Unistring
=========

## What is this?

Unistring is a javascript library to handle "unicode string" easily and
correctly.  javascripts's native string is also unicode string, however it is
actually simple UTF-16 sequence, so you must handle unicode's complicated
mechanism such as surrogate pairs and combining character sequence.

Unistring hides this complexity:

## Example

```javascript
var s = 'de\u0301licieux\uD83D\uDE0B'; // délicieux😋
var us = Unistring(s);

// retrieving number of 'user-perceived characters'...
s.length;        // fail, returns 12
us.length;       // ok, returns 10

// retrieving e with accent aigu...
s.charAt(2);     // fail, returns "e" as string
us.clusterAt(2); // ok, returns "e\u0301" as string

// retrieving last character...
s.substr(-1);    // fail, returns "\uDE0B" as string
us.substr(-1);   // ok, returns "😋" as Unistring instance

// manipulation
us.insert(0, "C'est ");
us.delete(-1);
us.append('!');
us.toString();   // returns "C'est délicieux!" as string

// break into words by UAX#29 rule
var words = Unistring.getWords('漢字カタカナひらがな1.23', true);
/*
 * words = [
 *  {
 *   "text": "漢字",
 *   "index": 0,
 *   "length": 2
 *  },
 *  {
 *   "text": "カタカナ",
 *   "index": 2,
 *   "length": 4
 *  },
 *  {
 *   "text": "ひらがな",
 *   "index": 6,
 *   "length": 4
 *  },
 *  {
 *   "text": "1.23",
 *   "index": 10,
 *   "length": 4
 *  }
 * ]
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
var us = Unistring('de\u0301licieux\uD83D\uDE0B');
```



## for node.js

### Install

`npm install akahuku/unistring#master`

### Use it

```javascript
var Unistring = require('unistring');
var us = Unistring('de\u0301licieux\uD83D\uDE0B');
```



## Reference

### Instance properties

* `length: number`

### Instance methods

* `clone(): Unistring`
* `dump(): string`
* `toString(): string`
* `delete(start, length): Unistring`
* `insert(str, start): Unistring`
* `append(str): Unistring`
* `codePointsAt(index): number[]`
* `clusterAt(index): string`
* `rawStringAt(index): string`
* `rawIndexAt(index): number`
* `forEach(callback [,thisObj])`
* `charAt(index): string`
* `charCodeAt(index): number`
* `substring(start, end): Unistring`
* `substr(start, length): Unistring`
* `slice(start, end): Unistring`
* `concat(str): Unistring`
* `indexOf(str): number`
* `lastIndexOf(str): number`

### Class methods

* `getCodePointArray(str): number[]`
* `getGraphemeBreakProp(codePoint): number`
* `getWordBreakProp(codePoint): number`
* `getScriptProp(codePoint): number`
* `getUTF16FromCodePoint(codePoint): string`
* `getCodePointString(codePoint, type): string`
* `getGBPCodeFromName(name): number`
* `getWBPCodeFromName(name): number`
* `getWords(str [,useScripts]): object[]`
