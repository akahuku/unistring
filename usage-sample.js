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

//
let foldedLines = Unistring.getFoldedLines(
`On this unsatisfactory manner the penultimate message of Cavor dies out. One seems to see him away there in the blue obscurity amidst his apparatus intently signalling us to the last, all unaware of the curtain of confusion that drops between us; all unaware, too, of the final dangers that even then must have been creeping upon him. His disastrous want of vulgar common sense had utterly betrayed him. He had talked of war, he had talked of all the strength and irrational violence of men, of their insatiable aggressions, their tireless futility of conflict. He had filled the whole moon world with this impression of our race, and then I think it is plain that he made the most fatal admission that upon himself alone hung the possibility—at least for a long time—of any further men reaching the moon. The line the cold, inhuman reason of the moon would take seems plain enough to me, and a suspicion of it, and then perhaps some sudden sharp realisation of it, must have come to him. One imagines him about the moon with the remorse of this fatal indiscretion growing in his mind.  During a certain time I am inclined to guess the Grand Lunar was deliberating the new situation, and for all that time Cavor may have gone as free as ever he had gone. But obstacles of some sort prevented his getting to his electromagnetic apparatus again after that message I have just given. For some days we received nothing. Perhaps he was having fresh audiences, and trying to evade his previous admissions.  Who can hope to guess?

And then suddenly, like a cry in the night, like a cry that is followed by a stillness, came the last message. It is the briefest fragment, the broken beginnings of two sentences.`, {
	columns: 50,  // number of columns to fold. default is 80
	awidth: 1     // columns of ambiguous characters in east asian script, 1 or 2. default is 1
});
console.log('foldedLines = ' + JSON.stringify(foldedLines, null, ' '));

//
let breakableClusters = Unistring.getLineBreakableClusters('テキストが多くの言語に対応した折り返し可能な位置で分割されます (The text is divided at the foldable position for many languages).');
console.log('breakableClusters = ' + JSON.stringify(breakableClusters, null, ' '));
