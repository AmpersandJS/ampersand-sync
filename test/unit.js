var test = require('tape');
var sync = require('../ampersand-sync');
var Model = require('ampersand-model');


function getStub(data) {
    return {
        url: '/library',
        trigger: function () {
            // capture args for comparison
            this.args = arguments;
        },
        toJSON: function () {
            return data || {};
        }
    };
}

test('should allow models to overwrite ajax configs at the model level', function (t) {
    t.plan(3);
    var Me = Model.extend({
        url: '/hi',
        ajaxConfig: {
            useXDR: true,
            xhrFields: {
                withCredentials: true
            }
        }
    });
    var m = new Me();
    m.on('request', function (model, xhr, options, ajaxSettings) {
        t.equal(ajaxSettings.type, 'GET');
        t.equal(ajaxSettings.xhrFields.withCredentials, true);
        t.equal(ajaxSettings.useXDR, true);
        t.end();
    });
    var xhr = sync('read', m);
});

test('read', function (t) {
    var xhr = sync('read', getStub());
    t.equal(xhr.ajaxSettings.url, '/library');
    t.equal(xhr.ajaxSettings.type, 'GET');
    t.ok(!xhr.ajaxSettings.json);
    t.ok(!xhr.ajaxSettings.data);
    var xhr2 = sync('read', getStub(), {url: '/library/books'});
    t.equal(xhr2.ajaxSettings.url, '/library/books', 'passed url should overwrite model url');
    t.end();
});

test('passing data', function (t) {
    // on reads it should be part of the URL
    var xhr = sync('read', getStub(), {data: {a: 'a', one: 1}});
    t.equal(xhr.ajaxSettings.url, '/library?a=a&one=1', 'data passed to reads should be made into a query string');

    var modelStub = getStub();
    modelStub.url = '/library?something=hi';
    var xhr2 = sync('read', modelStub, {data: {a: 'a', one: 1}});
    t.equal(xhr2.ajaxSettings.url, '/library?something=hi&a=a&one=1', 'data passed to reads should be appended to an existing query string in the url');

    var xhr3 = sync('read', getStub(), {url: '/library/books', data: {a: 'a', one: 1}});
    t.equal(xhr3.ajaxSettings.url, '/library/books?a=a&one=1', 'data passed to reads should be added as a query string to overwritten url');
    t.end();
});

test('create', function (t) {
    var xhr = sync('create', getStub({
        title: 'The Tempest',
        author: 'Bill Shakespeare',
        length: 123
    }));
    t.equal(xhr.ajaxSettings.url, '/library');
    t.equal(xhr.ajaxSettings.type, 'POST');
    t.equal(xhr.ajaxSettings.headers['Content-Type'], 'application/json');
    var data = xhr.ajaxSettings.json;
    t.equal(data.title, 'The Tempest');
    t.equal(data.author, 'Bill Shakespeare');
    t.equal(data.length, 123);
    t.end();
});

test('update', function (t) {
    var xhr = sync('update', getStub({
        id: '1-the-tempest',
        author: 'William Shakespeare'
    }));
    t.equal(xhr.ajaxSettings.url, '/library');
    t.equal(xhr.ajaxSettings.type, 'PUT');
    t.equal(xhr.ajaxSettings.headers['Content-Type'], 'application/json');
    var data = xhr.ajaxSettings.json;
    t.equal(data.id, '1-the-tempest');
    t.equal(data.author, 'William Shakespeare');
    t.end();
});

test('update with emulateHTTP and emulateJSON', function (t) {
    var xhr = sync('update', getStub({
            id: '2-the-tempest',
            author: 'Tim Shakespeare',
            length: 123
        }),
        {
            emulateHTTP: true,
            emulateJSON: true
        }
    );
    t.equal(xhr.ajaxSettings.url, '/library');
    t.equal(xhr.ajaxSettings.type, 'POST');
    t.equal(xhr.ajaxSettings.body, 'model%5Bid%5D=2-the-tempest&model%5Bauthor%5D=Tim%20Shakespeare&model%5Blength%5D=123&_method=PUT');
    t.equal(xhr.ajaxSettings.headers['Content-Type'], 'application/x-www-form-urlencoded');
    t.end();
});

test('update with just emulateHTTP', function (t) {
    var xhr = sync('update', getStub({
            id: '2-the-tempest',
            author: 'Tim Shakespeare',
            length: 123
        }),
        {
            emulateHTTP: true
        }
    );
    t.equal(xhr.ajaxSettings.url, '/library');
    t.equal(xhr.ajaxSettings.type, 'POST');
    t.equal(xhr.ajaxSettings.headers['Content-Type'], 'application/json');
    var data = xhr.ajaxSettings.json;
    t.equal(data.id, '2-the-tempest');
    t.equal(data.author, 'Tim Shakespeare');
    t.equal(data.length, 123);
    t.end();
});


test('update with just emulateJSON', function (t) {
    var xhr = sync('update', getStub({
            id: '2-the-tempest',
            author: 'Tim Shakespeare',
            length: 123
        }),
        {
            emulateJSON: true
        }
    );
    t.equal(xhr.ajaxSettings.url, '/library');
    t.equal(xhr.ajaxSettings.type, 'PUT');
    t.equal(xhr.ajaxSettings.headers['Content-Type'], 'application/x-www-form-urlencoded');
    t.equal(xhr.ajaxSettings.body, 'model%5Bid%5D=2-the-tempest&model%5Bauthor%5D=Tim%20Shakespeare&model%5Blength%5D=123');
    t.end();
});

test('delete', function (t) {
    var xhr = sync('delete', getStub({
        author: 'Tim Shakespeare',
        length: 123
    }));
    t.equal(xhr.ajaxSettings.url, '/library');
    t.equal(xhr.ajaxSettings.type, 'DELETE');
    t.notOk(xhr.ajaxSettings.data);
    t.end();
});


test('destroy with emulateHTTP', function (t) {
    var xhr = sync('delete', getStub({
            author: 'Tim Shakespeare',
            length: 123
        }),
        {
            emulateHTTP: true,
            emulateJSON: true
        }
    );
    t.equal(xhr.ajaxSettings.url, '/library');
    t.equal(xhr.ajaxSettings.type, 'POST');
    t.equal(xhr.ajaxSettings.body, '_method=DELETE');
    t.end();
});

test('urlError', function (t) {
    t.throws(function () {
        var xhr = sync('read', {});
    }, Error);
    t.end();
});

test('Call provided error callback on error.', function (t) {
    t.plan(1);
    var xhr = sync('read', getStub(), {
        error: function () {
            t.pass();
            t.end();
        },
        xhrImplementation: function (ajaxSettings, callback) {
            callback(new Error(), {}, null);
            return {};
        }
    });
});

test('Call provided error callback is bad JSON error.', function (t) {
    t.plan(3);

    var xhr = sync('read', getStub(), {
        error: function (resp, type, error) {
            t.deepEqual(resp, {}, 'should be passed through response');
            t.equal(type, 'error', 'is string \'error\' as per jquery');
            t.ok(error=='Unable to parse JSON string' || error=='Unexpected end of input', 'should be json parse message');
            t.end();
        },
        xhrImplementation: function (ajaxSettings, callback) {
            callback(null, {}, '{"bad": "json');
            return {};
        }
    });
});

test('Don\'t call success when error occurs and there\'s no error callback', function (t) {
    t.plan(1);

    var xhr = sync('read', getStub(), {
        success: function (resp, type, error) {
            t.fail('doh');
        },
        xhrImplementation: function (ajaxSettings, callback) {
            callback(new Error(), {}, '{"good": "json"}');
            t.pass();
            t.end();
            return {};
        }
    });
});


test('Call user provided beforeSend function.', function (t) {
    t.plan(1);
    var xhr = sync('delete', getStub(), {
        beforeSend: function (_xhr) {
            t.pass();
        },
        emulateHTTP: true
    });
    t.end();
});

test('Call user provided beforeSend function from model\'s ajaxConfig when no custom xhrFields are passed', function (t) {
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
