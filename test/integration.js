var test = require('tape');
var sync = require('../');
var modelStub = require('./helpers/modelStub');
var Model = require('ampersand-model');
var sinon = require('sinon');
var fakeXhr = sinon.useFakeXMLHttpRequest();
var xhr = require('xhr');
var requests = [];

xhr.XMLHttpRequest = global.XMLHttpRequest;

fakeXhr.onCreate = function (request) {

  //We don't know yet if this request is from
  //zuul trying to get the map file, or our test suite
  //trying to GET its url.  We have to wait for the filter
  //below to know for sure
  requests.push(request);
};

fakeXhr.useFilters = true;

fakeXhr.addFilter(function (method, url) {

  //Now we know if we're a test request or not.
  //If we are, we assume the test will clean up the requests
  //array, if not, we clean it up now.
  var skip = url !== 'sinon_will_handle_this';
  if (skip) {
    requests.pop();
  }
  return skip;
});


test('should get a response for read', function (t) {
    t.plan(2);
    var Me = Model.extend({
        url: 'sinon_will_handle_this',
        ajaxConfig: {
            useXDR: false
        },
        props: {
            foo: 'string'
        },
        sync: sync //override with this sync, so fetch doesn't use the stable one from dependencies
    });
    var m = new Me();
    m.on('change', function () {
        //TODO: assert more arguments
        t.equal(m.foo, 'bar');
    });
    m.fetch({
        success: function (data) {
            //TODO: assert more arguments
            t.equal(data.foo, 'bar');
            t.end();
        },
        error: function () {
            t.fail('error while fetching (are you offline?)');
            t.end();
        }
    });
    requests[0].respond(200, { "Content-Type": "application/json" }, '{"foo":"bar"}');
    requests.pop();
});

test('should not parse body when not expecting JSON', function (t) {
    t.plan(1);
    var Me = Model.extend({
        url: 'sinon_will_handle_this',
        ajaxConfig: {
            useXDR: false,
            headers: {
                accept: 'application/xml'
            }
        }
    });
    var m = new Me();
    //not calling fetch, as model also gives parsing JSON a try apparently
    sync('read', m, {
        success: function (data) {
            t.equal(typeof data, 'string');
            t.end();
        },
        error: function () {
            t.fail('error while fetching (are you offline?)');
            t.end();
        }
    });
    requests[0].respond(200, { "Content-Type": "application/xml" }, '<foo>bar</foo>');
    requests.pop();
});

test('should call error when read results in 404', function (t) {
    t.plan(1);
    var Me = Model.extend({
        url: 'sinon_will_handle_this',
        sync: sync
    });
    var m = new Me();
    m.fetch({
        success: function () {
            t.fail('unexpected success call');
            t.end();
        },
        error: function () {
            t.pass('received an expected error');
            t.end();
        }
    });
    requests[0].respond(404, { "Content-Type": "text/html" }, 'Not found');
    requests.pop();
});



test('should call user provided beforeSend function. (when in the browser)', function (t) {
    t.plan(1);
    var xhr = sync('delete', modelStub(), {
        beforeSend: function (_xhr) {
            t.pass();
        },
        emulateHTTP: true
    });
    t.end();
});

test('should call user provided beforeSend function from model\'s ajaxConfig when no custom xhrFields are passed.  (when in the browser)', function (t) {
    t.plan(1);

    var Me = Model.extend({
        url: '/hi',
        ajaxConfig: {
            beforeSend: function (xhr) {
                t.pass();
            }
        }
    });

    var m = new Me();
    var xhr = sync('create', m);

    t.end();
});
