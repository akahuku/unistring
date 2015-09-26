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
var s = 'de\u0301licieux\uD83D\uDE0B'; // délicieux😋
var us = Unistring(s);

// retrieving number of 'user-perceived characters'...
s.length;        // fail, returns 12
us.length;       // ok, returns 10

// retrieving e with accent aigu...
s.charAt(2);     // fail, returns "e" as string
us.clusterAt(2); // ok, returns "é" as Unistring instance

// retrieving last character...
s.substr(-1);    // fail, returns "\uDE0B" as string
us.substr(-1);   // ok, returns "😋" as Unistring instance

// manipulation
us.insert(0, "C'est ");
us.delete(-1);
us.append('!');
us.toString();   // returns "C'est délicieux!" as string
```

## Reference

### Properties

* `length`

### Methods

* `clone()`
* `dump()`
* `toString()`
* `delete(start, length)`
* `insert(s, start)`
* `append(s)`
* `codePointsAt(index)`
* `clusterAt(index)`
* `rawStringAt(index)`
* `rawIndexAt(index)`
* `forEach(callback [,thisObj])`

* `charAt(index)`
* `charCodeAt(index)`
* `substring(start, end)`
* `substr(start, length)`
* `slice(start, end)`
* `concat(s)`
* `indexOf(s)`
* `lastIndexOf(s)`
