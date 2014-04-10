# ampersand-sync

Standalone, modern-browser-only version of Backbone.Sync as Common JS module.

You probably won't use this directly, but it is used by ampersand-model and ampersand-rest-collection to provide the REST functionality.

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
