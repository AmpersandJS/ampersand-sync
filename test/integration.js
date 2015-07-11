var test = require('tape');
var sync = require('../');
var modelStub = require('./helpers/modelStub');
var Model = require('ampersand-model');

var ImInBrowser = (typeof window !== 'undefined');


test('should get a response for read', function (t) {
    t.plan(2);
    var Me = Model.extend({
        url: 'http://www.mocky.io/v2/54f1d2b932d8370a036e5b21',
        ajaxConfig: {
            useXDR: true
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
});

test('should not parse body when not expecting JSON', function (t) {
    t.plan(1);
    var Me = Model.extend({
        url: 'http://www.mocky.io/v2/54f1d2b932d8370a036e5b21',
        ajaxConfig: {
            useXDR: true,
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
});

test('should call error when read results in 404', function (t) {
    t.plan(1);
    var Me = Model.extend({
        url: '/nothing',
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
});



if (ImInBrowser) {
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
} else {
    var concatStream = require('concat-stream');

    test('should alow piping from request', function (t) {
        t.plan(1);
        var Me = Model.extend({
            url: 'http://www.mocky.io/v2/54f1d2b932d8370a036e5b21',
            ajaxConfig: {
                useXDR: true
            },
            props: {
                foo: 'string'
            },
            sync: sync //override with this sync, so fetch doesn't use the stable one from dependencies
        });
        var m = new Me();
        var requestStream = m.fetch({});
        var writable = concatStream({
            encoding: 'string'
        }, function (data) {
            t.equal(JSON.parse(data).foo, 'bar');
            t.end();
        });
        requestStream.pipe(writable);
    });

}