/*!
 * lunr.stemmer
 * Copyright (C) @YEAR Oliver Nightingale
 * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
 */

/**
 * lunr.stemmerEn is an english language stemmer, a Javascript Porter algorithm implementation
 * taken from https://github.com/zyklus/stem/
 *
 * @module
 * @param {String} the word to stem
 * @return {String} the stemmed word
 * @see lunr.Pipeline
 */
lunr.stemmerEn = (function() {
	var exceptions = {
			skis: 'ski',
			skies: 'sky',
			dying: 'die',
			lying: 'lie',
			tying: 'tie',
			idly: 'idl',
			gently: 'gentl',
			ugly: 'ugli',
			early: 'earli',
			only: 'onli',
			singly: 'singl',
			sky: 'sky',
			news: 'news',
			howe: 'howe',
			atlas: 'atlas',
			cosmos: 'cosmos',
			bias: 'bias',
			andes: 'andes'

		},
		exceptions1a = {
			inning: 'inning',
			outing: 'outing',
			canning: 'canning',
			herring: 'herring',
			earring: 'earring',
			proceed: 'proceed',
			exceed: 'exceed',
			succeed: 'succeed'

		},
		extensions2 = {
			ization: 'ize',
			fulness: 'ful',
			iveness: 'ive',
			ational: 'ate',
			ousness: 'ous',
			tional: 'tion',
			biliti: 'ble',
			lessli: 'less',
			entli: 'ent',
			ation: 'ate',
			alism: 'al',
			aliti: 'al',
			ousli: 'ous',
			iviti: 'ive',
			fulli: 'ful',
			enci: 'ence',
			anci: 'ance',
			abli: 'able',
			izer: 'ize',
			ator: 'ate',
			alli: 'al',
			bli: 'ble',
			ogi: 'og',
			li: ''
		};

	return function(word) {
		if (word.length < 3) {
			return word;
		}
		if (exceptions[word]) {
			return exceptions[word];
		}

		var eRx = ['', ''],
			word = word.toLowerCase().replace(/^'/, '').replace(/[^a-z']/g, '').replace(/^y|([aeiouy])y/g, '$1Y'),
			R1, res;

		if (res = /^(gener|commun|arsen)/.exec(word)) {
			R1 = res[0].length;
		} else {
			R1 = ((/[aeiouy][^aeiouy]/.exec(' ' + word) || eRx).index || 1000) + 1;
		}

		var R2 = (((/[aeiouy][^aeiouy]/.exec(' ' + word.substr(R1)) || eRx).index || 1000)) + R1 + 1;

		// step 0
		word = word.replace(/('s'?|')$/, '');

		// step 1a
		rx = /(?:(ss)es|(..i)(?:ed|es)|(us)|(ss)|(.ie)(?:d|s))$/;
		if (rx.test(word)) {
			word = word.replace(rx, '$1$2$3$4$5');
		} else {
			word = word.replace(/([aeiouy].+)s$/, '$1');
		}

		if (exceptions1a[word]) {
			return exceptions1a[word];
		}

		// step 1b
		var s1 = (/(eedly|eed)$/.exec(word) || eRx)[1],
			s2 = (/(?:[aeiouy].*)(ingly|edly|ing|ed)$/.exec(word) || eRx)[1];

		if (s1.length > s2.length) {
			if (word.indexOf(s1, R1) >= 0) {
				word = word.substr(0, word.length - s1.length) + 'ee';
			}
		} else if (s2.length > s1.length) {
			word = word.substr(0, word.length - s2.length);
			if (/(at|bl|iz)$/.test(word)) {
				word += 'e';
			} else if (/(bb|dd|ff|gg|mm|nn|pp|rr|tt)$/.test(word)) {
				word = word.substr(0, word.length - 1);
			} else if (!word.substr(R1) && /([^aeiouy][aeiouy][^aeiouywxY]|^[aeiouy][^aeiouy]|^[aeiouy])$/.test(word)) {
				word += 'e';
			}
		}

		// step 1c
		word = word.replace(/(.[^aeiouy])[yY]$/, '$1i');

		// step 2
		var sfx = /(ization|fulness|iveness|ational|ousness|tional|biliti|lessli|entli|ation|alism|aliti|ousli|iviti|fulli|enci|anci|abli|izer|ator|alli|bli|l(ogi)|[cdeghkmnrt](li))$/.exec(word);
		if (sfx) {
			sfx = sfx[3] || sfx[2] || sfx[1];
			if (word.indexOf(sfx, R1) >= 0) {
				word = word.substr(0, word.length - sfx.length) + extensions2[sfx];
			}
		}

		// step 3
		var sfx = (/(ational|tional|alize|icate|iciti|ative|ical|ness|ful)$/.exec(word) || eRx)[1];
		if (sfx && (word.indexOf(sfx, R1) >= 0)) {
			word = word.substr(0, word.length - sfx.length) + {
				ational: 'ate',
				tional: 'tion',
				alize: 'al',
				icate: 'ic',
				iciti: 'ic',
				ative: ((word.indexOf('ative', R2) >= 0) ? '' : 'ative'),
				ical: 'ic',
				ness: '',
				ful: ''
			}[sfx];
		}

		// step 4
		var sfx = /(ement|ance|ence|able|ible|ment|ant|ent|ism|ate|iti|ous|ive|ize|[st](ion)|al|er|ic)$/.exec(word);
		if (sfx) {
			sfx = sfx[2] || sfx[1];
			if (word.indexOf(sfx, R2) >= 0) {
				word = word.substr(0, word.length - sfx.length);
			}
		}


		// step 5
		if (word.substr(-1) == 'e') {
			if (word.substr(R2) || (word.substr(R1) && !(/([^aeiouy][aeiouy][^aeiouywxY]|^[aeiouy][^aeiouy])e$/.test(word)))) {
				word = word.substr(0, word.length - 1);
			}

		} else if ((word.substr(-2) == 'll') && (word.indexOf('l', R2) >= 0)) {
			word = word.substr(0, word.length - 1);
		}

		return word.toLowerCase();
	};
})();

/**
 * lunr.stemmerFr is a french language stemmer, a Javascript Porter algorithm implementation
 * taken from https://github.com/zyklus/stem/
 *
 * @module
 * @param {String} the word to stem
 * @return {String} the stemmed word
 * @see lunr.Pipeline
 */
lunr.stemmerFr = (function() {
	function ifIn(ix, word, sfx, ifTrue, ifFalse) {
		var toExec = [].concat((word.substr(ix).substr(-sfx.length) === sfx) ? ifTrue || [] : ifFalse || []);

		for (var i = 0, l = toExec.length; i < l; i++) {
			if (typeof(toExec[i]) == 'function') {
				word = toExec[i](word);
			} else {
				word = word.substr(0, word.length - sfx.length) + (toExec[i] === 'delete' ? '' : toExec[i]);
			}
		}

		return word;
	}

	return function(word) {
		var eRx = ['', ''];

		word = word
			.toLowerCase()
			.replace(/[^a-zâàçëéêèïîôûùü]/g, '')
			.replace(/([aeiouyâàëéêèïîôûù])y|y([aeiouyâàëéêèïîôûù])/g, '$1Y$2')
			.replace(/([aeiouyâàëéêèïîôûù])u([aeiouyâàëéêèïîôûù])/g, '$1U$2')
			.replace(/qu/g, 'qU')
			.replace(/([aeiouyâàëéêèïîôûù])i([aeiouyâàëéêèïîôûùq])/g, '$1I$2');

		var RV = /^(par|col|tap)/.test(word) || /^[aeiouyâàëéêèïîôûù][aeiouyâàëéêèïîôûù]/.test(word) ? 3 : ((/[aeiouyâàëéêèïîôûù]/.exec(' ' + word.substr(1)) || eRx).index || 1000) + 1;

		var R1 = ((/[aeiouyâàëéêèïîôûù][^aeiouyâàëéêèïîôûù]/.exec(' ' + word) || eRx).index || 1000) + 1,
			R2 = (((/[aeiouyâàëéêèïîôûù][^aeiouyâàëéêèïîôûù]/.exec(' ' + word.substr(R1)) || eRx).index || 1000)) + R1 + 1,
			doS2 = false,
			changed,
			oWord,
			res;

		// step 1
		oWord = word;
		var sfx = /(?:(ances?|iqUes?|ismes?|ables?|istes?|eux)|(at(?:rice|eur|ion)s?)|(logies?)|(u[st]ions?)|(ences?)|(ements?)|(ités?)|(ifs?|ives?)|(eaux)|(aux)|(euses?)|(issements?)|(amment)|(emment)|(ments?))$/.exec(word) || eRx;

		// ance|iqUe|isme|able|iste|eux|ances|iqUes|ismes|ables|istes
		if (sfx[1]) {
			word = ifIn(R2, word, sfx[1], 'delete');

			// atrice|ateur|ation|atrices|ateurs|ations
		} else if (sfx[2]) {
			word = ifIn(R2, word, sfx[2], ['delete', function(word) {
				if (/ic$/.test(word)) {
					return ifIn(R2, word, 'ic', 'delete', 'iqU');
				}
				return word;
			}]);

			// logie|logies
		} else if (sfx[3]) {
			word = ifIn(R2, word, sfx[3], 'log');

			// usion|ution|usions|utions
		} else if (sfx[4]) {
			word = ifIn(R2, word, sfx[4], 'u');

			// ence|ences
		} else if (sfx[5]) {
			word = ifIn(R2, word, sfx[5], 'ent');

			// ement|ements
		} else if (sfx[6]) {
			word = ifIn(RV, word, sfx[6], ['delete', function(word) {
				return /ativ$/.test(word.substr(R2)) ? ifIn(R2, word, 'ativ', 'delete') : /iv$/.test(word) ? ifIn(R2, word, 'iv', 'delete') : /eus$/.test(word) ? ifIn(R2, word, 'eus', 'delete', function(word) {
					return ifIn(R1, word, 'eus', 'eux');
				}) : (res = /(abl|iqU)$/.exec(word)) ? ifIn(R2, word, res[1], 'delete') : (res = /(ièr|Ièr)$/.exec(word)) ? ifIn(RV, word, res[1], 'i') : word;
			}]);

			// ité|ités
		} else if (sfx[7]) {
			word = ifIn(R2, word, sfx[7], ['delete', function(word) {
				return (/abil$/.test(word) ? ifIn(R2, word, 'abil', 'delete', 'abl') : /ic$/.test(word) ? ifIn(R2, word, 'ic', 'delete', 'iqU') : /iv$/.test(word) ? ifIn(R2, word, 'iv', 'delete') : word);
			}]);

			// if|ive|ifs|ives
		} else if (sfx[8]) {
			word = ifIn(R2, word, sfx[8], ['delete', function(word) {
				return (/at$/.test(word) ? ifIn(R2, word, 'at', ['delete', function(word) {
					return (/ic$/.test(word) ? ifIn(R2, word, 'ic', 'delete', 'iqU') : word);
				}]) : word);
			}]);

			// eaux
		} else if (sfx[9]) {
			word = word.replace(/eaux$/, 'eau');

			// aux
		} else if (sfx[10]) {
			word = ifIn(R1, word, 'aux', 'al');

			// euse|euses
		} else if (sfx[11]) {
			word = ifIn(R2, word, sfx[11], 'delete', function(word) {
				return ifIn(R1, word, sfx[11], 'eux');
			});

			// issement|issements
		} else if (sfx[12]) {
			if (/[^aeiouyâàëéêèïîôûù](issements?)$/.test(word)) {
				word = ifIn(R1, word, sfx[12], 'delete');
			}

			// amment
		} else if (sfx[13]) {
			word = ifIn(RV, word, sfx[13], 'ant');
			doS2 = true;

			// emment
		} else if (sfx[14]) {
			word = ifIn(RV, word, sfx[14], 'ent');
			doS2 = true;

			// ment|ments
		} else if (sfx[15]) {
			if (/[aeiouyâàëéêèïîôûù]ments?$/.test(word.substr(RV))) {
				word = word.substr(0, word.length - sfx[15].length);
			}
			doS2 = true;
		}
		changed = (word !== oWord);
		if (!changed) {
			doS2 = true;
		}

		// step 2a
		if (doS2) {
			oWord = word;
			var res = /[^aeiouyâàëéêèïîôûù](îmes|ît|îtes|ie?s?|ira?|iraIent|irai[st]?|iras|irent|iri?ez|iri?ons|iront|issaIent|issai[st]|issante?s?|isses?|issent|issi?ez|issi?ons|it)$/.exec(word.substr(RV));
			if (res) {
				word = word.substr(0, word.length - res[1].length);
				doS2 = false;
			}
			changed = (word !== oWord);
		}

		// step 2b
		if (doS2) {
			oWord = word;
			var res = (/(?:(ions)|(ée?s?|èrent|era?|eraIent|erai[st]?|eras|eri?ez|eri?ons|eront|i?ez)|(â[mt]es|ât|ai?s?|aIent|ait|ante?s?|asse|assent|asses|assiez|assions))$/.exec(word.substr(RV)) || eRx);

			// ions
			if (res[1]) {
				word = ifIn(R2, word, res[1], 'delete');

				// é|ée|ées|és|èrent|er|era|erai|eraIent|erais|erait|eras|erez|eriez|erions|erons|eront|ez|iez
			} else if (res[2]) {
				word = word.substr(0, word.length - res[2].length);

				// âmes|ât|âtes|a|ai|aIent|ais|ait|ant|ante|antes|ants|as|asse|assent|asses|assiez|assions
			} else if (res[3]) {
				word = word.substr(0, word.length - res[3].length);
				if (/e$/.test(word.substr(RV))) {
					word = word.substr(0, word.length - 1);
				}
			}
			changed = (word !== oWord);
		}

		// step 3
		if (changed) {
			if (/Y$/.test(word)) {
				word = word.substr(0, word.length - 1) + 'i';
			} else if (/ç$/.test(word)) {
				word = word.substr(0, word.length - 1) + 'c';
			}

			// step 4
		} else {
			if (/[^aiouès]s$/.test(word)) {
				word = word.substr(0, word.length - 1);
			}

			res = (/(?:[st](ion)|(ier|ière|Ier|Ière)|(e)|gu(ë))$/.exec(word.substr(RV)) || eRx);

			// ion
			if (res[1]) {
				word = ifIn(R2, word, 'ion', 'delete');

				// ier|ière|Ier|Ière
			} else if (res[2]) {
				word = word.substr(0, word.length - res[2].length) + 'i';

				// e
				// ë
			} else if (res[3] || res[4]) {
				word = word.substr(0, word.length - 1);
			}
		}

		// step 5
		if (/(enn|onn|ett|ell|eill)$/.test(word)) {
			word = word.substr(0, word.length - 1);
		}

		// step 6
		if (res = /[é|è]([^aeiouyâàëéêèïîôûù]+)$/.exec(word)) {
			word = word.substr(0, word.length - res[0].length) + 'e' + res[1];
		}

		return word.toLowerCase();
	};
})();

/**
 * lunr.stemmerDe is a german language stemmer, a Javascript Porter algorithm implementation
 * taken from https://github.com/zyklus/stem/
 *
 * @module
 * @param {String} the word to stem
 * @return {String} the stemmed word
 * @see lunr.Pipeline
 */
lunr.stemmerDe = (function() {
	return function(word) {
		var eRx = ['', ''];

		word = word.toLowerCase().replace(/ß/g, 'ss').replace(/[^a-zäöüéç]/g, '').replace(/([aeiouyäöü])u([aeiouyäöü])/g, '$1U$2').replace(/([aeiouyäöü])y([aeiouyäöü])/g, '$1Y$2');

		var res,
			R1 = ((/[aeiouyäöü][^aeiouyäöü]/.exec(' ' + word) || eRx).index || 1000) + 1,
			R2 = (((/[aeiouyäöü][^aeiouyäöü]/.exec(' ' + word.substr(R1)) || eRx).index || 1000)) + R1 + 1;

		R1 = Math.max(3, R1);


		// step 1
		var sfx = /(ern|em|er|(en|es|e)|[bdfghklmnrt](s))$/.exec(word);
		if (sfx) {
			var g2 = !!sfx[2];
			sfx = sfx[3] || sfx[2] || sfx[1];
			if (word.indexOf(sfx, R1) >= 0) {
				word = word.substr(0, word.length - sfx.length);
				if (g2 && /niss$/.test(word)) {
					word = word.substr(0, word.length - 1);
				}
			}
		}


		// step 2
		var res, ending;
		if (res = /(est|en|er)$/.exec(word)) {
			ending = res[1];
		} else if (/...[bdfghklmnt]st$/.test(word)) {
			ending = 'st';
		}
		if (ending && (word.indexOf(ending, R1) >= 0)) {
			word = word.substr(0, word.length - ending.length);
		}


		// step 3
		var res;
		if (res = /(end|ung)$/.exec(word)) {
			if (word.indexOf(res[1], R2) >= 0) {
				word = word.substr(0, word.length - res[1].length);
				if (/[^e]ig$/.test(word) && /ig$/.test(word.substr(R2))) {
					word = word.substr(0, word.length - 2);
				}
			}
		} else if (res = /(isch|ig|ik)$/.exec(word)) {
			if (/[^e](isch|ig|ik)$/.test(word) && /(isch|ig|ik)$/.test(word.substr(R2))) {
				word = word.substr(0, word.length - res[1].length);
			}
		} else if (res = /(lich|heit)$/.exec(word)) {
			if (word.indexOf(res[1], R2) >= 0) {
				word = word.substr(0, word.length - res[1].length);
				if (/(er|en)$/.test(word.substr(R1))) {
					word = word.substr(0, word.length - 2);
				}
			}
		} else if (res = /(keit)$/.exec(word)) {
			if (word.indexOf(res[1], R2) >= 0) {
				word = word.substr(0, word.length - res[1].length);
				if ((res = /(lich|ig)$/.exec(word)) && /(lich|ig)$/.test(word.substr(R2))) {
					word = word.substr(0, word.length - res[1].length);
				}
			}
		}

		word = word.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');

		return word;
	};
})();

/**
 * lunr.stemmer is a multi-language language stemmer.
 *
 * Current supported languages are english, french and german.
 *
 * @param  {String} token  The word to stem
 * @param  {Number} i      Index of the word in the sentence
 * @param  {Array} tokens Array of words in the sentence
 * @param  {String} lg     Language of the sentence
 * @return {String}        The stemmed word
 */
lunr.stemmer = function(token, i, tokens, lg) {
	lg = ['en', 'fr', 'de'].indexOf(lg) > -1 ? lg : 'en';
	var stemmers = {
		en: lunr.stemmerEn,
		fr: lunr.stemmerFr,
		de: lunr.stemmerDe
	};
	return stemmers[lg](token);
};

lunr.Pipeline.registerFunction(lunr.stemmer, 'stemmer');
