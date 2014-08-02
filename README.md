# ampersand-sync

Standalone, modern-browser-only version of Backbone.Sync as Common JS module.

You probably won't use this directly, but it is used by ampersand-model and ampersand-rest-collection to provide the REST functionality.

## Important note on the 1.0.x versions

In moving from 1.0.1 to 1.0.2 we switched the underlying ajax implementation from jQuery's ajax to [xhr](http://github.com/raynos/xhr). This changed slightly the options, as well as how `ajaxConfig` in models/collections operated when configured as a function.

Previously `ajaxConfig` would be passed the current ajax parameters object for modification, now it receives no arguments and should just return options to be merged in to the ajax parameters which will be passed to xhr.

This should have been a major release both for this module and it's dependents (ampersand-model, ampersand-rest-collection, ampersand-collection-rest-mixin), but unfortunately we made a mistake and published as 1.0.2, and were too slow to rollback our mistake before workarounds were in place.

As such we are leaving the current 1.0.x versions in place, but deprecated, and suggest people upgrade to the latest versions of model/collection when they can which will contain the new implementation of xhr.

This should only affect your if you're using `ajaxConfig` as a function. If so you'll need to return the options you want to add, rather than expecting to be passed a params object to your ajaxConfig function. If you're having trouble ping us in freenode #&yet or on twitter: [@philip_roberts](http://twitter.com/philip_roberts) & [@henrikjoreteg](http://twitter.com/henrikjoreteg).


## browser support

[![testling badge](https://ci.testling.com/AmpersandJS/ampersand-sync.png)](https://ci.testling.com/AmpersandJS/ampersand-sync)

<!-- starthide -->
Part of the [Ampersand.js toolkit](http://ampersandjs.com) for building clientside applications.
<!-- endhide -->

## install

```
npm install ampersand-sync
```

## running the tests

```
npm test
```

Tests are written in [tape](https://github.com/substack/tape) and since they require a browser environment it gets run in a headless browser using phantomjs via [tape-run](https://github.com/juliangruber/tape-run). Make sure you have phantomjs installed for this to work. 

You can also run `npm start` then open a browser.

<!-- starthide -->

## credits

All credit goes to Jeremy Ashkenas and the other Backbone.js authors.

If you like this follow [@HenrikJoreteg](http://twitter.com/henrikjoreteg) on twitter.


## license

MIT

<!-- endhide -->
