var test = require('tape');
var sync = require('../ampersand-sync');
var Model = require('ampersand-model');


test('should allow models to overwrite ajax configs at the model level', function (t) {
    t.plan(2);
    var Me = Model.extend({
        url: '/hi',
        ajaxConfig: {
            xhrFields: {
                withCredentials: true
            }
        }
    });
    var m = new Me();
    m.on('request', function (model, xhr, options, ajaxSettings) {
        t.equal(ajaxSettings.type, 'GET');
        t.equal(ajaxSettings.xhrFields.withCredentials, true);
        t.end();
    });
    var xhr = sync('read', m);
});
