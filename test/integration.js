var test = require('tape');
var sync = require('../ampersand-sync');
var Model = require('ampersand-model');


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
        t.equal(m.foo, "bar");
    });
    m.fetch({
        success: function (data) {
            //TODO: assert more arguments
            t.equal(data.foo, "bar");
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
