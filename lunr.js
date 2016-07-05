/**
 * lunr - http://lunrjs.com - A bit like Solr, but much smaller and not as bright - 0.7.1
 * Copyright (C) 2016 Oliver Nightingale
 * @license MIT
 */

;(function(){

/**
 * Convenience function for instantiating a new lunr index and configuring it
 * with the default pipeline functions and the passed config function.
 *
 * When using this convenience function a new index will be created with the
 * following functions already in the pipeline:
 *
 * lunr.StopWordFilter - filters out any stop words before they enter the
 * index
 *
 * lunr.stemmer - stems the tokens before entering the index.
 *
 * Example:
 *
 *     var idx = lunr(function () {
 *       this.field('title', 10)
 *       this.field('tags', 100)
 *       this.field('body')
 *       
 *       this.ref('cid')
 *       
 *       this.pipeline.add(function () {
 *         // some custom pipeline function
 *       })
 *       
 *     })
 *
 * @param {Function} config A function that will be called with the new instance
 * of the lunr.Index as both its context and first parameter. It can be used to
 * customize the instance of new lunr.Index.
 * @namespace
 * @module
 * @returns {lunr.Index}
 *
 */
var lunr = function (config) {
  var idx = new lunr.Index

  idx.pipeline.add(
    lunr.trimmer,
    lunr.stopWordFilter,
    lunr.stemmer
  )

  if (config) config.call(idx, idx)

  return idx
}

lunr.version = "0.7.1"
/*!
 * lunr.utils
 * Copyright (C) 2016 Oliver Nightingale
 */

/**
 * A namespace containing utils for the rest of the lunr library
 */
lunr.utils = {}

/**
 * Print a warning message to the console.
 *
 * @param {String} message The message to be printed.
 * @memberOf Utils
 */
lunr.utils.warn = (function (global) {
  return function (message) {
    if (global.console && console.warn) {
      console.warn(message)
    }
  }
})(this)

/**
 * Convert an object to a string.
 *
 * In the case of `null` and `undefined` the function returns
 * the empty string, in all other cases the result of calling
 * `toString` on the passed object is returned.
 *
 * @param {Any} obj The object to convert to a string.
 * @return {String} string representation of the passed object.
 * @memberOf Utils
 */
lunr.utils.asString = function (obj) {
  if (obj === void 0 || obj === null) {
    return ""
  } else {
    return obj.toString()
  }
}
/*!
 * lunr.EventEmitter
 * Copyright (C) 2016 Oliver Nightingale
 */

/**
 * lunr.EventEmitter is an event emitter for lunr. It manages adding and removing event handlers and triggering events and their handlers.
 *
 * @constructor
 */
lunr.EventEmitter = function () {
  this.events = {}
}

/**
 * Binds a handler function to a specific event(s).
 *
 * Can bind a single function to many different events in one call.
 *
 * @param {String} [eventName] The name(s) of events to bind this function to.
 * @param {Function} fn The function to call when an event is fired.
 * @memberOf EventEmitter
 */
lunr.EventEmitter.prototype.addListener = function () {
  var args = Array.prototype.slice.call(arguments),
      fn = args.pop(),
      names = args

  if (typeof fn !== "function") throw new TypeError ("last argument must be a function")

  names.forEach(function (name) {
    if (!this.hasHandler(name)) this.events[name] = []
    this.events[name].push(fn)
  }, this)
}

/**
 * Removes a handler function from a specific event.
 *
 * @param {String} eventName The name of the event to remove this function from.
 * @param {Function} fn The function to remove from an event.
 * @memberOf EventEmitter
 */
lunr.EventEmitter.prototype.removeListener = function (name, fn) {
  if (!this.hasHandler(name)) return

  var fnIndex = this.events[name].indexOf(fn)
  this.events[name].splice(fnIndex, 1)

  if (!this.events[name].length) delete this.events[name]
}

/**
 * Calls all functions bound to the given event.
 *
 * Additional data can be passed to the event handler as arguments to `emit`
 * after the event name.
 *
 * @param {String} eventName The name of the event to emit.
 * @memberOf EventEmitter
 */
lunr.EventEmitter.prototype.emit = function (name) {
  if (!this.hasHandler(name)) return

  var args = Array.prototype.slice.call(arguments, 1)

  this.events[name].forEach(function (fn) {
    fn.apply(undefined, args)
  })
}

/**
 * Checks whether a handler has ever been stored against an event.
 *
 * @param {String} eventName The name of the event to check.
 * @private
 * @memberOf EventEmitter
 */
lunr.EventEmitter.prototype.hasHandler = function (name) {
  return name in this.events
}

/*!
 * lunr.tokenizer
 * Copyright (C) 2016 Oliver Nightingale
 */

/**
 * A function for splitting a string into tokens ready to be inserted into
 * the search index. Uses `lunr.tokenizer.seperator` to split strings, change
 * the value of this property to change how strings are split into tokens.
 *
 * @module
 * @param {String} obj The string to convert into tokens
 * @see lunr.tokenizer.seperator
 * @returns {Array}
 */
lunr.tokenizer = function (obj) {
  if (!arguments.length || obj == null || obj == undefined) return []
  if (Array.isArray(obj)) return obj.map(function (t) { return lunr.utils.asString(t).toLowerCase() })

  return obj.toString().trim().toLowerCase().split(lunr.tokenizer.seperator)
}

/**
 * The sperator used to split a string into tokens. Override this property to change the behaviour of
 * `lunr.tokenizer` behaviour when tokenizing strings. By default this splits on whitespace and hyphens.
 *
 * @static
 * @see lunr.tokenizer
 */
lunr.tokenizer.seperator = /[\s\-]+/

/**
 * Loads a previously serialised tokenizer.
 *
 * A tokenizer function to be loaded must already be registered with lunr.tokenizer.
 * If the serialised tokenizer has not been registered then an error will be thrown.
 *
 * @param {String} label The label of the serialised tokenizer.
 * @returns {Function}
 * @memberOf tokenizer
 */
lunr.tokenizer.load = function (label) {
  var fn = this.registeredFunctions[label]

  if (!fn) {
    throw new Error('Cannot load un-registered function: ' + label)
  }

  return fn
}

lunr.tokenizer.label = 'default'

lunr.tokenizer.registeredFunctions = {
  'default': lunr.tokenizer
}

/**
 * Register a tokenizer function.
 *
 * Functions that are used as tokenizers should be registered if they are to be used with a serialised index.
 *
 * Registering a function does not add it to an index, functions must still be associated with a specific index for them to be used when indexing and searching documents.
 *
 * @param {Function} fn The function to register.
 * @param {String} label The label to register this function with
 * @memberOf tokenizer
 */
lunr.tokenizer.registerFunction = function (fn, label) {
  if (label in this.registeredFunctions) {
    lunr.utils.warn('Overwriting existing tokenizer: ' + label)
  }

  fn.label = label
  this.registeredFunctions[label] = fn
}
/*!
 * lunr.Pipeline
 * Copyright (C) 2016 Oliver Nightingale
 */

/**
 * lunr.Pipelines maintain an ordered list of functions to be applied to all
 * tokens in documents entering the search index and queries being ran against
 * the index.
 *
 * An instance of lunr.Index created with the lunr shortcut will contain a
 * pipeline with a stop word filter and an English language stemmer. Extra
 * functions can be added before or after either of these functions or these
 * default functions can be removed.
 *
 * When run the pipeline will call each function in turn, passing a token, the
 * index of that token in the original list of all tokens and finally a list of
 * all the original tokens.
 *
 * The output of functions in the pipeline will be passed to the next function
 * in the pipeline. To exclude a token from entering the index the function
 * should return undefined, the rest of the pipeline will not be called with
 * this token.
 *
 * For serialisation of pipelines to work, all functions used in an instance of
 * a pipeline should be registered with lunr.Pipeline. Registered functions can
 * then be loaded. If trying to load a serialised pipeline that uses functions
 * that are not registered an error will be thrown.
 *
 * If not planning on serialising the pipeline then registering pipeline functions
 * is not necessary.
 *
 * @constructor
 */
lunr.Pipeline = function() {
  this._stack = []
}

lunr.Pipeline.registeredFunctions = {}

/**
 * Register a function with the pipeline.
 *
 * Functions that are used in the pipeline should be registered if the pipeline
 * needs to be serialised, or a serialised pipeline needs to be loaded.
 *
 * Registering a function does not add it to a pipeline, functions must still be
 * added to instances of the pipeline for them to be used when running a pipeline.
 *
 * @param {Function} fn The function to check for.
 * @param {String} label The label to register this function with
 * @memberOf Pipeline
 */
lunr.Pipeline.registerFunction = function(fn, label) {
  if (label in this.registeredFunctions) {
    lunr.utils.warn('Overwriting existing registered function: ' + label)
  }

  fn.label = label
  lunr.Pipeline.registeredFunctions[fn.label] = fn
}

/**
 * Warns if the function is not registered as a Pipeline function.
 *
 * @param {Function} fn The function to check for.
 * @private
 * @memberOf Pipeline
 */
lunr.Pipeline.warnIfFunctionNotRegistered = function(fn) {
  var isRegistered = fn.label && (fn.label in this.registeredFunctions)

  if (!isRegistered) {
    lunr.utils.warn('Function is not registered with pipeline. This may cause problems when serialising the index.\n', fn)
  }
}

/**
 * Loads a previously serialised pipeline.
 *
 * All functions to be loaded must already be registered with lunr.Pipeline.
 * If any function from the serialised data has not been registered then an
 * error will be thrown.
 *
 * @param {Object} serialised The serialised pipeline to load.
 * @returns {lunr.Pipeline}
 * @memberOf Pipeline
 */
lunr.Pipeline.load = function(serialised) {
  var pipeline = new lunr.Pipeline

  serialised.forEach(function(fnName) {
    var fn = lunr.Pipeline.registeredFunctions[fnName]

    if (fn) {
      pipeline.add(fn)
    } else {
      throw new Error('Cannot load un-registered function: ' + fnName)
    }
  })

  return pipeline
}

/**
 * Adds new functions to the end of the pipeline.
 *
 * Logs a warning if the function has not been registered.
 *
 * @param {Function} functions Any number of functions to add to the pipeline.
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.add = function() {
  var fns = Array.prototype.slice.call(arguments)

  fns.forEach(function(fn) {
    lunr.Pipeline.warnIfFunctionNotRegistered(fn)
    this._stack.push(fn)
  }, this)
}

/**
 * Adds a single function after a function that already exists in the
 * pipeline.
 *
 * Logs a warning if the function has not been registered.
 *
 * @param {Function} existingFn A function that already exists in the pipeline.
 * @param {Function} newFn The new function to add to the pipeline.
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.after = function(existingFn, newFn) {
  lunr.Pipeline.warnIfFunctionNotRegistered(newFn)

  var pos = this._stack.indexOf(existingFn)
  if (pos == -1) {
    throw new Error('Cannot find existingFn')
  }

  pos = pos + 1
  this._stack.splice(pos, 0, newFn)
}

/**
 * Adds a single function before a function that already exists in the
 * pipeline.
 *
 * Logs a warning if the function has not been registered.
 *
 * @param {Function} existingFn A function that already exists in the pipeline.
 * @param {Function} newFn The new function to add to the pipeline.
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.before = function(existingFn, newFn) {
  lunr.Pipeline.warnIfFunctionNotRegistered(newFn)

  var pos = this._stack.indexOf(existingFn)
  if (pos == -1) {
    throw new Error('Cannot find existingFn')
  }

  this._stack.splice(pos, 0, newFn)
}

/**
 * Removes a function from the pipeline.
 *
 * @param {Function} fn The function to remove from the pipeline.
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.remove = function(fn) {
  var pos = this._stack.indexOf(fn)
  if (pos == -1) {
    return
  }

  this._stack.splice(pos, 1)
}

/**
 * Runs the current list of functions that make up the pipeline against the
 * passed tokens.
 *
 * @param {Array} tokens The tokens to run through the pipeline.
 * @param {String} language (Optional) The language of the tokens.
 * @returns {Array}
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.run = function(tokens, language) {
  var out = [],
    tokenLength = tokens.length,
    stackLength = this._stack.length,
    language = language || en

  for (var i = 0; i < tokenLength; i++) {
    var token = tokens[i]

    for (var j = 0; j < stackLength; j++) {
      token = this._stack[j](token, i, tokens, language)
      if (token === void 0 || token === '') break
    };

    if (token !== void 0 && token !== '') out.push(token)
  };

  return out
}

/**
 * Resets the pipeline by removing any existing processors.
 *
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.reset = function() {
  this._stack = []
}

/**
 * Returns a representation of the pipeline ready for serialisation.
 *
 * Logs a warning if the function has not been registered.
 *
 * @returns {Array}
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.toJSON = function() {
  return this._stack.map(function(fn) {
    lunr.Pipeline.warnIfFunctionNotRegistered(fn)

    return fn.label
  })
}
/*!
 * lunr.Vector
 * Copyright (C) 2016 Oliver Nightingale
 */

/**
 * lunr.Vectors implement vector related operations for
 * a series of elements.
 *
 * @constructor
 */
lunr.Vector = function () {
  this._magnitude = null
  this.list = undefined
  this.length = 0
}

/**
 * lunr.Vector.Node is a simple struct for each node
 * in a lunr.Vector.
 *
 * @private
 * @param {Number} The index of the node in the vector.
 * @param {Object} The data at this node in the vector.
 * @param {lunr.Vector.Node} The node directly after this node in the vector.
 * @constructor
 * @memberOf Vector
 */
lunr.Vector.Node = function (idx, val, next) {
  this.idx = idx
  this.val = val
  this.next = next
}

/**
 * Inserts a new value at a position in a vector.
 *
 * @param {Number} The index at which to insert a value.
 * @param {Object} The object to insert in the vector.
 * @memberOf Vector.
 */
lunr.Vector.prototype.insert = function (idx, val) {
  this._magnitude = undefined;
  var list = this.list

  if (!list) {
    this.list = new lunr.Vector.Node (idx, val, list)
    return this.length++
  }

  if (idx < list.idx) {
    this.list = new lunr.Vector.Node (idx, val, list)
    return this.length++
  }

  var prev = list,
      next = list.next

  while (next != undefined) {
    if (idx < next.idx) {
      prev.next = new lunr.Vector.Node (idx, val, next)
      return this.length++
    }

    prev = next, next = next.next
  }

  prev.next = new lunr.Vector.Node (idx, val, next)
  return this.length++
}

/**
 * Calculates the magnitude of this vector.
 *
 * @returns {Number}
 * @memberOf Vector
 */
lunr.Vector.prototype.magnitude = function () {
  if (this._magnitude) return this._magnitude
  var node = this.list,
      sumOfSquares = 0,
      val

  while (node) {
    val = node.val
    sumOfSquares += val * val
    node = node.next
  }

  return this._magnitude = Math.sqrt(sumOfSquares)
}

/**
 * Calculates the dot product of this vector and another vector.
 *
 * @param {lunr.Vector} otherVector The vector to compute the dot product with.
 * @returns {Number}
 * @memberOf Vector
 */
lunr.Vector.prototype.dot = function (otherVector) {
  var node = this.list,
      otherNode = otherVector.list,
      dotProduct = 0

  while (node && otherNode) {
    if (node.idx < otherNode.idx) {
      node = node.next
    } else if (node.idx > otherNode.idx) {
      otherNode = otherNode.next
    } else {
      dotProduct += node.val * otherNode.val
      node = node.next
      otherNode = otherNode.next
    }
  }

  return dotProduct
}

/**
 * Calculates the cosine similarity between this vector and another
 * vector.
 *
 * @param {lunr.Vector} otherVector The other vector to calculate the
 * similarity with.
 * @returns {Number}
 * @memberOf Vector
 */
lunr.Vector.prototype.similarity = function (otherVector) {
  return this.dot(otherVector) / (this.magnitude() * otherVector.magnitude())
}
/*!
 * lunr.SortedSet
 * Copyright (C) 2016 Oliver Nightingale
 */

/**
 * lunr.SortedSets are used to maintain an array of uniq values in a sorted
 * order.
 *
 * @constructor
 */
lunr.SortedSet = function () {
  this.length = 0
  this.elements = []
}

/**
 * Loads a previously serialised sorted set.
 *
 * @param {Array} serialisedData The serialised set to load.
 * @returns {lunr.SortedSet}
 * @memberOf SortedSet
 */
lunr.SortedSet.load = function (serialisedData) {
  var set = new this

  set.elements = serialisedData
  set.length = serialisedData.length

  return set
}

/**
 * Inserts new items into the set in the correct position to maintain the
 * order.
 *
 * @param {Object} The objects to add to this set.
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.add = function () {
  var i, element

  for (i = 0; i < arguments.length; i++) {
    element = arguments[i]
    if (~this.indexOf(element)) continue
    this.elements.splice(this.locationFor(element), 0, element)
  }

  this.length = this.elements.length
}

/**
 * Converts this sorted set into an array.
 *
 * @returns {Array}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.toArray = function () {
  return this.elements.slice()
}

/**
 * Creates a new array with the results of calling a provided function on every
 * element in this sorted set.
 *
 * Delegates to Array.prototype.map and has the same signature.
 *
 * @param {Function} fn The function that is called on each element of the
 * set.
 * @param {Object} ctx An optional object that can be used as the context
 * for the function fn.
 * @returns {Array}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.map = function (fn, ctx) {
  return this.elements.map(fn, ctx)
}

/**
 * Executes a provided function once per sorted set element.
 *
 * Delegates to Array.prototype.forEach and has the same signature.
 *
 * @param {Function} fn The function that is called on each element of the
 * set.
 * @param {Object} ctx An optional object that can be used as the context
 * @memberOf SortedSet
 * for the function fn.
 */
lunr.SortedSet.prototype.forEach = function (fn, ctx) {
  return this.elements.forEach(fn, ctx)
}

/**
 * Returns the index at which a given element can be found in the
 * sorted set, or -1 if it is not present.
 *
 * @param {Object} elem The object to locate in the sorted set.
 * @returns {Number}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.indexOf = function (elem) {
  var start = 0,
      end = this.elements.length,
      sectionLength = end - start,
      pivot = start + Math.floor(sectionLength / 2),
      pivotElem = this.elements[pivot]

  while (sectionLength > 1) {
    if (pivotElem === elem) return pivot

    if (pivotElem < elem) start = pivot
    if (pivotElem > elem) end = pivot

    sectionLength = end - start
    pivot = start + Math.floor(sectionLength / 2)
    pivotElem = this.elements[pivot]
  }

  if (pivotElem === elem) return pivot

  return -1
}

/**
 * Returns the position within the sorted set that an element should be
 * inserted at to maintain the current order of the set.
 *
 * This function assumes that the element to search for does not already exist
 * in the sorted set.
 *
 * @param {Object} elem The elem to find the position for in the set
 * @returns {Number}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.locationFor = function (elem) {
  var start = 0,
      end = this.elements.length,
      sectionLength = end - start,
      pivot = start + Math.floor(sectionLength / 2),
      pivotElem = this.elements[pivot]

  while (sectionLength > 1) {
    if (pivotElem < elem) start = pivot
    if (pivotElem > elem) end = pivot

    sectionLength = end - start
    pivot = start + Math.floor(sectionLength / 2)
    pivotElem = this.elements[pivot]
  }

  if (pivotElem > elem) return pivot
  if (pivotElem < elem) return pivot + 1
}

/**
 * Creates a new lunr.SortedSet that contains the elements in the intersection
 * of this set and the passed set.
 *
 * @param {lunr.SortedSet} otherSet The set to intersect with this set.
 * @returns {lunr.SortedSet}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.intersect = function (otherSet) {
  var intersectSet = new lunr.SortedSet,
      i = 0, j = 0,
      a_len = this.length, b_len = otherSet.length,
      a = this.elements, b = otherSet.elements

  while (true) {
    if (i > a_len - 1 || j > b_len - 1) break

    if (a[i] === b[j]) {
      intersectSet.add(a[i])
      i++, j++
      continue
    }

    if (a[i] < b[j]) {
      i++
      continue
    }

    if (a[i] > b[j]) {
      j++
      continue
    }
  };

  return intersectSet
}

/**
 * Makes a copy of this set
 *
 * @returns {lunr.SortedSet}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.clone = function () {
  var clone = new lunr.SortedSet

  clone.elements = this.toArray()
  clone.length = clone.elements.length

  return clone
}

/**
 * Creates a new lunr.SortedSet that contains the elements in the union
 * of this set and the passed set.
 *
 * @param {lunr.SortedSet} otherSet The set to union with this set.
 * @returns {lunr.SortedSet}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.union = function (otherSet) {
  var longSet, shortSet, unionSet

  if (this.length >= otherSet.length) {
    longSet = this, shortSet = otherSet
  } else {
    longSet = otherSet, shortSet = this
  }

  unionSet = longSet.clone()

  for(var i = 0, shortSetElements = shortSet.toArray(); i < shortSetElements.length; i++){
    unionSet.add(shortSetElements[i])
  }

  return unionSet
}

/**
 * Returns a representation of the sorted set ready for serialisation.
 *
 * @returns {Array}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.toJSON = function () {
  return this.toArray()
}
/*!
 * lunr.Index
 * Copyright (C) 2016 Oliver Nightingale
 */

/**
 * lunr.Index is object that manages a search index.  It contains the indexes
 * and stores all the tokens and document lookups.  It also provides the main
 * user facing API for the library.
 *
 * @constructor
 */
lunr.Index = function() {
  this._fields = []
  this._ref = 'id'
  this._language = 'en'
  this.pipeline = new lunr.Pipeline
  this.documentStore = new lunr.Store
  this.tokenStore = new lunr.TokenStore
  this.corpusTokens = new lunr.SortedSet
  this.eventEmitter = new lunr.EventEmitter
  this.tokenizerFn = lunr.tokenizer

  this._idfCache = {}

  this.on('add', 'remove', 'update', (function() {
    this._idfCache = {}
  }).bind(this))
}

/**
 * Bind a handler to events being emitted by the index.
 *
 * The handler can be bound to many events at the same time.
 *
 * @param {String} [eventName] The name(s) of events to bind the function to.
 * @param {Function} fn The serialised set to load.
 * @memberOf Index
 */
lunr.Index.prototype.on = function() {
  var args = Array.prototype.slice.call(arguments)
  return this.eventEmitter.addListener.apply(this.eventEmitter, args)
}

/**
 * Removes a handler from an event being emitted by the index.
 *
 * @param {String} eventName The name of events to remove the function from.
 * @param {Function} fn The serialised set to load.
 * @memberOf Index
 */
lunr.Index.prototype.off = function(name, fn) {
  return this.eventEmitter.removeListener(name, fn)
}

/**
 * Loads a previously serialised index.
 *
 * Issues a warning if the index being imported was serialised
 * by a different version of lunr.
 *
 * @param {Object} serialisedData The serialised set to load.
 * @returns {lunr.Index}
 * @memberOf Index
 */
lunr.Index.load = function(serialisedData) {
  if (serialisedData.version !== lunr.version) {
    lunr.utils.warn('version mismatch: current ' + lunr.version + ' importing ' + serialisedData.version)
  }

  var idx = new this

  idx._fields = serialisedData.fields
  idx._ref = serialisedData.ref

  idx.tokenizer = lunr.tokenizer.load(serialisedData.tokenizer)
  idx.documentStore = lunr.Store.load(serialisedData.documentStore)
  idx.tokenStore = lunr.TokenStore.load(serialisedData.tokenStore)
  idx.corpusTokens = lunr.SortedSet.load(serialisedData.corpusTokens)
  idx.pipeline = lunr.Pipeline.load(serialisedData.pipeline)

  return idx
}

/**
 * Adds a field to the list of fields that will be searchable within documents
 * in the index.
 *
 * An optional boost param can be passed to affect how much tokens in this field
 * rank in search results, by default the boost value is 1.
 *
 * Fields should be added before any documents are added to the index, fields
 * that are added after documents are added to the index will only apply to new
 * documents added to the index.
 *
 * @param {String} fieldName The name of the field within the document that
 * should be indexed
 * @param {Number} boost An optional boost that can be applied to terms in this
 * field.
 * @returns {lunr.Index}
 * @memberOf Index
 */
lunr.Index.prototype.field = function(fieldName, opts) {
  var opts = opts || {},
    field = {
      name: fieldName,
      boost: opts.boost || 1
    }

  this._fields.push(field)
  return this
}

/**
 * Sets the property used to uniquely identify documents added to the index,
 * by default this property is 'id'.
 *
 * This should only be changed before adding documents to the index, changing
 * the ref property without resetting the index can lead to unexpected results.
 *
 * The value of ref can be of any type but it _must_ be stably comparable and
 * orderable.
 *
 * @param {String} refName The property to use to uniquely identify the
 * documents in the index.
 * @param {Boolean} emitEvent Whether to emit add events, defaults to true
 * @returns {lunr.Index}
 * @memberOf Index
 */
lunr.Index.prototype.ref = function(refName) {
  this._ref = refName
  return this
}

/**
 * Set the language used to analyse the texts included in the document.
 *
 * This variable defines which stemmer and stop word algorithms will be used.
 *
 * Current supported values are 'en', 'fr' and 'de'. If the value is unsupported,
 * fallback language is 'en'.
 * 
 * @param  {String} language Language used in this lunr instance.
 * @returns {lunr.Index}
 * @memberOf Index
 */
lunr.Index.prototype.language = function(language) {
  this._language = ['en', 'fr', 'de'].indexOf(language) ? language : 'en'
  return this
}

/**
 * Sets the tokenizer used for this index.
 *
 * By default the index will use the default tokenizer, lunr.tokenizer. The tokenizer
 * should only be changed before adding documents to the index. Changing the tokenizer
 * without re-building the index can lead to unexpected results.
 *
 * @param {Function} fn The function to use as a tokenizer.
 * @returns {lunr.Index}
 * @memberOf Index
 */
lunr.Index.prototype.tokenizer = function(fn) {
  var isRegistered = fn.label && (fn.label in lunr.tokenizer.registeredFunctions)

  if (!isRegistered) {
    lunr.utils.warn('Function is not a registered tokenizer. This may cause problems when serialising the index')
  }

  this.tokenizerFn = fn
  return this
}

/**
 * Add a document to the index.
 *
 * This is the way new documents enter the index, this function will run the
 * fields from the document through the index's pipeline and then add it to
 * the index, it will then show up in search results.
 *
 * An 'add' event is emitted with the document that has been added and the index
 * the document has been added to. This event can be silenced by passing false
 * as the second argument to add.
 *
 * @param {Object} doc The document to add to the index.
 * @param {Boolean} emitEvent Whether or not to emit events, default true.
 * @memberOf Index
 */
lunr.Index.prototype.add = function(doc, emitEvent) {
  var docTokens = {},
    allDocumentTokens = new lunr.SortedSet,
    docRef = doc[this._ref],
    emitEvent = emitEvent === undefined ? true : emitEvent

  this._fields.forEach(function(field) {
    var fieldTokens = this.pipeline.run(this.tokenizerFn(doc[field.name]), this._language)

    docTokens[field.name] = fieldTokens

    for (var i = 0; i < fieldTokens.length; i++) {
      var token = fieldTokens[i]
      allDocumentTokens.add(token)
      this.corpusTokens.add(token)
    }
  }, this)

  this.documentStore.set(docRef, allDocumentTokens)

  for (var i = 0; i < allDocumentTokens.length; i++) {
    var token = allDocumentTokens.elements[i]
    var tf = 0;

    for (var j = 0; j < this._fields.length; j++) {
      var field = this._fields[j]
      var fieldTokens = docTokens[field.name]
      var fieldLength = fieldTokens.length

      if (!fieldLength) continue

      var tokenCount = 0
      for (var k = 0; k < fieldLength; k++) {
        if (fieldTokens[k] === token) {
          tokenCount++
        }
      }

      tf += (tokenCount / fieldLength * field.boost)
    }

    this.tokenStore.add(token, {
      ref: docRef,
      tf: tf
    })
  };

  if (emitEvent) this.eventEmitter.emit('add', doc, this)
}

/**
 * Removes a document from the index.
 *
 * To make sure documents no longer show up in search results they can be
 * removed from the index using this method.
 *
 * The document passed only needs to have the same ref property value as the
 * document that was added to the index, they could be completely different
 * objects.
 *
 * A 'remove' event is emitted with the document that has been removed and the index
 * the document has been removed from. This event can be silenced by passing false
 * as the second argument to remove.
 *
 * @param {Object} doc The document to remove from the index.
 * @param {Boolean} emitEvent Whether to emit remove events, defaults to true
 * @memberOf Index
 */
lunr.Index.prototype.remove = function(doc, emitEvent) {
  var docRef = doc[this._ref],
    emitEvent = emitEvent === undefined ? true : emitEvent

  if (!this.documentStore.has(docRef)) return

  var docTokens = this.documentStore.get(docRef)

  this.documentStore.remove(docRef)

  docTokens.forEach(function(token) {
    this.tokenStore.remove(token, docRef)
  }, this)

  if (emitEvent) this.eventEmitter.emit('remove', doc, this)
}

/**
 * Updates a document in the index.
 *
 * When a document contained within the index gets updated, fields changed,
 * added or removed, to make sure it correctly matched against search queries,
 * it should be updated in the index.
 *
 * This method is just a wrapper around `remove` and `add`
 *
 * An 'update' event is emitted with the document that has been updated and the index.
 * This event can be silenced by passing false as the second argument to update. Only
 * an update event will be fired, the 'add' and 'remove' events of the underlying calls
 * are silenced.
 *
 * @param {Object} doc The document to update in the index.
 * @param {Boolean} emitEvent Whether to emit update events, defaults to true
 * @see Index.prototype.remove
 * @see Index.prototype.add
 * @memberOf Index
 */
lunr.Index.prototype.update = function(doc, emitEvent) {
  var emitEvent = emitEvent === undefined ? true : emitEvent

  this.remove(doc, false)
  this.add(doc, false)

  if (emitEvent) this.eventEmitter.emit('update', doc, this)
}

/**
 * Calculates the inverse document frequency for a token within the index.
 *
 * @param {String} token The token to calculate the idf of.
 * @see Index.prototype.idf
 * @private
 * @memberOf Index
 */
lunr.Index.prototype.idf = function(term) {
  var cacheKey = "@" + term
  if (Object.prototype.hasOwnProperty.call(this._idfCache, cacheKey)) return this._idfCache[cacheKey]

  var documentFrequency = this.tokenStore.count(term),
    idf = 1

  if (documentFrequency > 0) {
    idf = 1 + Math.log(this.documentStore.length / documentFrequency)
  }

  return this._idfCache[cacheKey] = idf
}

/**
 * Searches the index using the passed query.
 *
 * Queries should be a string, multiple words are allowed and will lead to an
 * AND based query, e.g. `idx.search('foo bar')` will run a search for
 * documents containing both 'foo' and 'bar'.
 *
 * All query tokens are passed through the same pipeline that document tokens
 * are passed through, so any language processing involved will be run on every
 * query term.
 *
 * Each query term is expanded, so that the term 'he' might be expanded to
 * 'hello' and 'help' if those terms were already included in the index.
 *
 * Matching documents are returned as an array of objects, each object contains
 * the matching document ref, as set for this index, and the similarity score
 * for this document against the query.
 *
 * @param {String} query The query to search the index with.
 * @returns {Object}
 * @see Index.prototype.idf
 * @see Index.prototype.documentVector
 * @memberOf Index
 */
lunr.Index.prototype.search = function(query) {
  var queryTokens = this.pipeline.run(this.tokenizerFn(query), this._language),
    queryVector = new lunr.Vector,
    documentSets = [],
    fieldBoosts = this._fields.reduce(function(memo, f) {
      return memo + f.boost
    }, 0)

  var hasSomeToken = queryTokens.some(function(token) {
    return this.tokenStore.has(token)
  }, this)

  if (!hasSomeToken) return []

  queryTokens
    .forEach(function(token, i, tokens) {
      var tf = 1 / tokens.length * this._fields.length * fieldBoosts,
        self = this

      var set = this.tokenStore.expand(token).reduce(function(memo, key) {
        var pos = self.corpusTokens.indexOf(key),
          idf = self.idf(key),
          similarityBoost = 1,
          set = new lunr.SortedSet

        // if the expanded key is not an exact match to the token then
        // penalise the score for this key by how different the key is
        // to the token.
        if (key !== token) {
          var diff = Math.max(3, key.length - token.length)
          similarityBoost = 1 / Math.log(diff)
        }

        // calculate the query tf-idf score for this token
        // applying an similarityBoost to ensure exact matches
        // these rank higher than expanded terms
        if (pos > -1) queryVector.insert(pos, tf * idf * similarityBoost)

        // add all the documents that have this key into a set
        // ensuring that the type of key is preserved
        var matchingDocuments = self.tokenStore.get(key),
          refs = Object.keys(matchingDocuments),
          refsLen = refs.length

        for (var i = 0; i < refsLen; i++) {
          set.add(matchingDocuments[refs[i]].ref)
        }

        return memo.union(set)
      }, new lunr.SortedSet)

      documentSets.push(set)
    }, this)

  var documentSet = documentSets.reduce(function(memo, set) {
    return memo.intersect(set)
  })

  return documentSet
    .map(function(ref) {
      return {
        ref: ref,
        score: queryVector.similarity(this.documentVector(ref))
      }
    }, this)
    .sort(function(a, b) {
      return b.score - a.score
    })
}

/**
 * Generates a vector containing all the tokens in the document matching the
 * passed documentRef.
 *
 * The vector contains the tf-idf score for each token contained in the
 * document with the passed documentRef.  The vector will contain an element
 * for every token in the indexes corpus, if the document does not contain that
 * token the element will be 0.
 *
 * @param {Object} documentRef The ref to find the document with.
 * @returns {lunr.Vector}
 * @private
 * @memberOf Index
 */
lunr.Index.prototype.documentVector = function(documentRef) {
  var documentTokens = this.documentStore.get(documentRef),
    documentTokensLength = documentTokens.length,
    documentVector = new lunr.Vector

  for (var i = 0; i < documentTokensLength; i++) {
    var token = documentTokens.elements[i],
      tf = this.tokenStore.get(token)[documentRef].tf,
      idf = this.idf(token)

    documentVector.insert(this.corpusTokens.indexOf(token), tf * idf)
  };

  return documentVector
}

/**
 * Returns a representation of the index ready for serialisation.
 *
 * @returns {Object}
 * @memberOf Index
 */
lunr.Index.prototype.toJSON = function() {
  return {
    version: lunr.version,
    fields: this._fields,
    ref: this._ref,
    tokenizer: this.tokenizerFn.label,
    documentStore: this.documentStore.toJSON(),
    tokenStore: this.tokenStore.toJSON(),
    corpusTokens: this.corpusTokens.toJSON(),
    pipeline: this.pipeline.toJSON()
  }
}

/**
 * Applies a plugin to the current index.
 *
 * A plugin is a function that is called with the index as its context.
 * Plugins can be used to customise or extend the behaviour the index
 * in some way. A plugin is just a function, that encapsulated the custom
 * behaviour that should be applied to the index.
 *
 * The plugin function will be called with the index as its argument, additional
 * arguments can also be passed when calling use. The function will be called
 * with the index as its context.
 *
 * Example:
 *
 *     var myPlugin = function (idx, arg1, arg2) {
 *       // `this` is the index to be extended
 *       // apply any extensions etc here.
 *     }
 *
 *     var idx = lunr(function () {
 *       this.use(myPlugin, 'arg1', 'arg2')
 *     })
 *
 * @param {Function} plugin The plugin to apply.
 * @memberOf Index
 */
lunr.Index.prototype.use = function(plugin) {
  var args = Array.prototype.slice.call(arguments, 1)
  args.unshift(this)
  plugin.apply(this, args)
}
/*!
 * lunr.Store
 * Copyright (C) 2016 Oliver Nightingale
 */

/**
 * lunr.Store is a simple key-value store used for storing sets of tokens for
 * documents stored in index.
 *
 * @constructor
 * @module
 */
lunr.Store = function () {
  this.store = {}
  this.length = 0
}

/**
 * Loads a previously serialised store
 *
 * @param {Object} serialisedData The serialised store to load.
 * @returns {lunr.Store}
 * @memberOf Store
 */
lunr.Store.load = function (serialisedData) {
  var store = new this

  store.length = serialisedData.length
  store.store = Object.keys(serialisedData.store).reduce(function (memo, key) {
    memo[key] = lunr.SortedSet.load(serialisedData.store[key])
    return memo
  }, {})

  return store
}

/**
 * Stores the given tokens in the store against the given id.
 *
 * @param {Object} id The key used to store the tokens against.
 * @param {Object} tokens The tokens to store against the key.
 * @memberOf Store
 */
lunr.Store.prototype.set = function (id, tokens) {
  if (!this.has(id)) this.length++
  this.store[id] = tokens
}

/**
 * Retrieves the tokens from the store for a given key.
 *
 * @param {Object} id The key to lookup and retrieve from the store.
 * @returns {Object}
 * @memberOf Store
 */
lunr.Store.prototype.get = function (id) {
  return this.store[id]
}

/**
 * Checks whether the store contains a key.
 *
 * @param {Object} id The id to look up in the store.
 * @returns {Boolean}
 * @memberOf Store
 */
lunr.Store.prototype.has = function (id) {
  return id in this.store
}

/**
 * Removes the value for a key in the store.
 *
 * @param {Object} id The id to remove from the store.
 * @memberOf Store
 */
lunr.Store.prototype.remove = function (id) {
  if (!this.has(id)) return

  delete this.store[id]
  this.length--
}

/**
 * Returns a representation of the store ready for serialisation.
 *
 * @returns {Object}
 * @memberOf Store
 */
lunr.Store.prototype.toJSON = function () {
  return {
    store: this.store,
    length: this.length
  }
}

/*!
 * lunr.stemmer
 * Copyright (C) 2016 Oliver Nightingale
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

		word = word.toLowerCase();

		// Contracted and prefixed articles c'|d'|j'|l'|m'|n'|s'|t'
		word = word.replace(/^((?:c|d|j|l|m|n|s|t)')/, '');

		word = word.replace(/[^a-zâàçëéêèïîôûùü]/g, '')
			.replace(/([aeiouyâàëéêèïîôûù])y|y([aeiouyâàëéêèïîôûù])/g, '$1Y$2')
			.replace(/([aeiouyâàëéêèïîôûù])u([aeiouyâàëéêèïîôûù])/g, '$1U$2')
			.replace(/qu/g, 'qU')
			.replace(/([aeiouyâàëéêèïîôûù])i([aeiouyâàëéêèïîôûùq])/g, '$1I$2');

		// Contracted and prefixed articles c'|d'|j'|l'|m'|n'|s'|t'
		word = word.replace(/^((?:c|d|j|l|m|n|s|t)')/, '');

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
/*!
 * lunr.stopWordFilter
 * Copyright (C) 2016 Oliver Nightingale
 */

/**
 * lunr.generateStopWordFilter builds a stopWordFilter function from the provided
 * list of stop words.
 *
 * The built in lunr.stopWordFilter is built using this generator and can be used
 * to generate custom stopWordFilters for applications or non English languages.
 *
 * @module
 * @param {Array} token The token to pass through the filter
 * @returns {Function}
 * @see lunr.Pipeline
 * @see lunr.stopWordFilter
 */
lunr.generateStopWordFilter = function(stopWords) {
	var words = stopWords.reduce(function(memo, stopWord) {
		memo[stopWord] = stopWord;
		return memo;
	}, {});

	return function(token) {
		if (token && words[token] !== token) return token;
	};
};

/**
 * lunr.stopWordFilterEn is an English language stop word list filter, any words
 * contained in the list will not be passed through the filter.
 *
 * This is intended to be used in the Pipeline. If the token does not pass the
 * filter then undefined will be returned.
 *
 * @module
 * @param {String} token The token to pass through the filter
 * @returns {String}
 * @see lunr.Pipeline
 */
lunr.stopWordFilterEn = lunr.generateStopWordFilter(['a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves']);

/**
 * lunr.stopWordFilterFr is a French language stop word list filter, any words
 * contained in the list will not be passed through the filter.
 *
 * This is intended to be used in the Pipeline. If the token does not pass the
 * filter then undefined will be returned.
 *
 * @module
 * @param {String} token The token to pass through the filter
 * @returns {String}
 * @see lunr.Pipeline
 */
lunr.stopWordFilterFr = lunr.generateStopWordFilter(['alors', 'au', 'aucuns', 'aussi', 'autre', 'avant', 'ave', 'avoir', 'bon', 'car', 'ce', 'cela', 'ces', 'ceux', 'chaque', 'ci', 'comme', 'comment', 'd', 'des', 'du', 'dedans', 'dehors', 'depuis', 'deux', 'devrait', 'doit', 'donc', 'dos', 'droite', 'début', 'elle', 'elles', 'en', 'encore', 'essai', 'est', 'et', 'eu', 'fait', 'faites', 'fois', 'font', 'force', 'haut', 'hors', 'ici', 'il', 'ils', 'je', 'juste', 'la', 'le', 'les', 'leur', 'là', 'ma', 'maintenant', 'mais', 'mes', 'mine', 'moins', 'mon', 'mot', 'même', 'ni', 'nommés', 'notre', 'nous', 'nouveaux', 'ou', 'où', 'par', 'parce', 'parole', 'pas', 'personnes', 'peut', 'peu', 'pièce', 'plupart', 'pour', 'pourquoi', 'quand', 'que', 'quel', 'quelle', 'quelles', 'quels', 'qui', 'sa', 'sans', 'ses', 'seulement', 'si', 'sien', 'son', 'sont', 'sous', 'soyez', 'sujet', 'sur', 'ta', 'tandis', 'tellement', 'tels', 'tes', 'ton', 'tous', 'tout', 'trop', 'très', 'tu', 'valeur', 'voie', 'voient', 'vont', 'votre', 'vous', 'vu', 'ça', 'étaient', 'état', 'étions', 'été', 'être']);

/**
 * lunr.stopWordFilterDe is a German language stop word list filter, any words
 * contained in the list will not be passed through the filter.
 *
 * This is intended to be used in the Pipeline. If the token does not pass the
 * filter then undefined will be returned.
 *
 * @module
 * @param {String} token The token to pass through the filter
 * @returns {String}
 * @see lunr.Pipeline
 */
lunr.stopWordFilterDe = lunr.generateStopWordFilter(['aber', 'als', 'am', 'an', 'auch', 'auf', 'aus', 'bei', 'bin', 'bis', 'bist', 'da', 'dadurch', 'daher', 'darum', 'das', 'daß', 'dass', 'dein', 'deine', 'dem', 'den', 'der', 'des', 'dessen', 'deshalb', 'die', 'dies', 'dieser', 'dieses', 'doch', 'dort', 'du', 'durch', 'ein', 'eine', 'einem', 'einen', 'einer', 'eines', 'er', 'es', 'euer', 'eure', 'für', 'hatte', 'hatten', 'hattest', 'hattet', 'hier', 'hinter', 'ich', 'ihr', 'ihre', 'im', 'in', 'ist', 'ja', 'jede', 'jedem', 'jeden', 'jeder', 'jedes', 'jener', 'jenes', 'jetzt', 'kann', 'kannst', 'können', 'könnt', 'machen', 'mein', 'meine', 'mit', 'muß', 'mußt', 'musst', 'müssen', 'müßt', 'nach', 'nachdem', 'nein', 'nicht', 'nun', 'oder', 'seid', 'sein', 'seine', 'sich', 'sie', 'sind', 'soll', 'sollen', 'sollst', 'sollt', 'sonst', 'soweit', 'sowie', 'und', 'unser', 'unsere', 'unter', 'vom', 'von', 'vor', 'wann', 'warum', 'was', 'weiter', 'weitere', 'wenn', 'wer', 'werde', 'werden', 'werdet', 'weshalb', 'wie', 'wieder', 'wieso', 'wir', 'wird', 'wirst', 'wo', 'woher', 'wohin', 'zu', 'zum', 'zur', 'über']);

/**
 * lunr.stopWordFilter is a multi-language stop word list filter, any words
 * contained in the list will not be passed through the filter.
 *
 * It currently supports English, French and German languages.
 *
 * This is intended to be used in the Pipeline. If the token does not pass the
 * filter then undefined will be returned.
 *
 * @module
 * @param  {String} token  The word to tokenize
 * @param  {Number} i      Index of the word in the sentence
 * @param  {Array} tokens Array of words in the sentence
 * @param  {String} lg     Language of the sentence
 * @return {String}        The word, or undefined if it is a stop word for the language
 * @see lunr.Pipeline
 */
lunr.stopWordFilter = function(token, i, tokens, lg) {
	lg = ['en', 'fr', 'de'].indexOf(lg) > -1 ? lg : 'en';
	var stopWordFilters = {
		en: lunr.stopWordFilterEn,
		fr: lunr.stopWordFilterFr,
		de: lunr.stopWordFilterDe
	};
	return stopWordFilters[lg](token);
};

lunr.Pipeline.registerFunction(lunr.stopWordFilter, 'stopWordFilter');
/*!
 * lunr.trimmer
 * Copyright (C) 2016 Oliver Nightingale
 */

/**
 * lunr.trimmer is a pipeline function for trimming non word
 * characters from the begining and end of tokens before they
 * enter the index.
 *
 * This implementation may not work correctly for non latin
 * characters and should either be removed or adapted for use
 * with languages with non-latin characters.
 *
 * @module
 * @param {String} token The token to pass through the filter
 * @returns {String}
 * @see lunr.Pipeline
 */
lunr.trimmer = function (token) {
  return token.replace(/^\W+/, '').replace(/\W+$/, '')
}

lunr.Pipeline.registerFunction(lunr.trimmer, 'trimmer')
/*!
 * lunr.stemmer
 * Copyright (C) 2016 Oliver Nightingale
 * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
 */

/**
 * lunr.TokenStore is used for efficient storing and lookup of the reverse
 * index of token to document ref.
 *
 * @constructor
 */
lunr.TokenStore = function () {
  this.root = { docs: {} }
  this.length = 0
}

/**
 * Loads a previously serialised token store
 *
 * @param {Object} serialisedData The serialised token store to load.
 * @returns {lunr.TokenStore}
 * @memberOf TokenStore
 */
lunr.TokenStore.load = function (serialisedData) {
  var store = new this

  store.root = serialisedData.root
  store.length = serialisedData.length

  return store
}

/**
 * Adds a new token doc pair to the store.
 *
 * By default this function starts at the root of the current store, however
 * it can start at any node of any token store if required.
 *
 * @param {String} token The token to store the doc under
 * @param {Object} doc The doc to store against the token
 * @param {Object} root An optional node at which to start looking for the
 * correct place to enter the doc, by default the root of this lunr.TokenStore
 * is used.
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.add = function (token, doc, root) {
  var root = root || this.root,
      key = token.charAt(0),
      rest = token.slice(1)

  if (!(key in root)) root[key] = {docs: {}}

  if (rest.length === 0) {
    root[key].docs[doc.ref] = doc
    this.length += 1
    return
  } else {
    return this.add(rest, doc, root[key])
  }
}

/**
 * Checks whether this key is contained within this lunr.TokenStore.
 *
 * By default this function starts at the root of the current store, however
 * it can start at any node of any token store if required.
 *
 * @param {String} token The token to check for
 * @param {Object} root An optional node at which to start
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.has = function (token) {
  if (!token) return false

  var node = this.root

  for (var i = 0; i < token.length; i++) {
    if (!node[token.charAt(i)]) return false

    node = node[token.charAt(i)]
  }

  return true
}

/**
 * Retrieve a node from the token store for a given token.
 *
 * By default this function starts at the root of the current store, however
 * it can start at any node of any token store if required.
 *
 * @param {String} token The token to get the node for.
 * @param {Object} root An optional node at which to start.
 * @returns {Object}
 * @see TokenStore.prototype.get
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.getNode = function (token) {
  if (!token) return {}

  var node = this.root

  for (var i = 0; i < token.length; i++) {
    if (!node[token.charAt(i)]) return {}

    node = node[token.charAt(i)]
  }

  return node
}

/**
 * Retrieve the documents for a node for the given token.
 *
 * By default this function starts at the root of the current store, however
 * it can start at any node of any token store if required.
 *
 * @param {String} token The token to get the documents for.
 * @param {Object} root An optional node at which to start.
 * @returns {Object}
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.get = function (token, root) {
  return this.getNode(token, root).docs || {}
}

lunr.TokenStore.prototype.count = function (token, root) {
  return Object.keys(this.get(token, root)).length
}

/**
 * Remove the document identified by ref from the token in the store.
 *
 * By default this function starts at the root of the current store, however
 * it can start at any node of any token store if required.
 *
 * @param {String} token The token to get the documents for.
 * @param {String} ref The ref of the document to remove from this token.
 * @param {Object} root An optional node at which to start.
 * @returns {Object}
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.remove = function (token, ref) {
  if (!token) return
  var node = this.root

  for (var i = 0; i < token.length; i++) {
    if (!(token.charAt(i) in node)) return
    node = node[token.charAt(i)]
  }

  delete node.docs[ref]
}

/**
 * Find all the possible suffixes of the passed token using tokens
 * currently in the store.
 *
 * @param {String} token The token to expand.
 * @returns {Array}
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.expand = function (token, memo) {
  var root = this.getNode(token),
      docs = root.docs || {},
      memo = memo || []

  if (Object.keys(docs).length) memo.push(token)

  Object.keys(root)
    .forEach(function (key) {
      if (key === 'docs') return

      memo.concat(this.expand(token + key, memo))
    }, this)

  return memo
}

/**
 * Returns a representation of the token store ready for serialisation.
 *
 * @returns {Object}
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.toJSON = function () {
  return {
    root: this.root,
    length: this.length
  }
}

  /**
   * export the module via AMD, CommonJS or as a browser global
   * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
   */
  ;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define(factory)
    } else if (typeof exports === 'object') {
      /**
       * Node. Does not work with strict CommonJS, but
       * only CommonJS-like enviroments that support module.exports,
       * like Node.
       */
      module.exports = factory()
    } else {
      // Browser globals (root is window)
      root.lunr = factory()
    }
  }(this, function () {
    /**
     * Just return a value to define the module export.
     * This example returns an object, but the module
     * can return a function as the exported value.
     */
    return lunr
  }))
})();
