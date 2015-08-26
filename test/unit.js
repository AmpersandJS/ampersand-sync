var test = require('tape');
var syncCore = require('../core');
var reqStub = require('./helpers/requestStub');
var modelStub = require('./helpers/modelStub');
var Model = require('ampersand-model');

var sync = syncCore(reqStub());

test('should allow models to overwrite ajax configs at the model level', function (t) {
    t.plan(7);
    var Me = Model.extend({
        url: '/hi',
        ajaxConfig: {
            useXDR: true,
            xhrFields: {
                withCredentials: true
            },
            headers: {
                accept: 'application/xml'
            }
        }
    });
    var m = new Me();
    m.on('request', function (model, xhr, options, ajaxSettings) {
        t.equal(ajaxSettings.type, 'GET');
        t.equal(ajaxSettings.xhrFields.withCredentials, true);
        t.equal(ajaxSettings.useXDR, true);
        t.equal(ajaxSettings.headers.accept, 'application/xml');
        t.equal(reqStub.recentOpts.method, 'GET');
        t.equal(reqStub.recentOpts.useXDR, true);
        t.ok(reqStub.recentOpts.beforeSend);
        t.end();
    });
    var xhr = sync('read', m);
});

test('should merge headers and lowercase them', function (t) {
    t.plan(3);
    var Me = Model.extend({
        url: '/hi',
        ajaxConfig: {
            headers: {
                ACcept: 'application/xml',
                "X-Other-Header": "ok"
            }
        }
    });
    var m = new Me();
    m.on('request', function (model, xhr, options, ajaxSettings) {
        t.equal(reqStub.recentOpts.headers.accept, '*/*');
        t.equal(reqStub.recentOpts.headers["x-other-header"], 'ok');
        t.equal(reqStub.recentOpts.headers["x-another-header"], 'ok');
        t.end();
    });
    var xhr = sync('read', m, {
        headers: {
            accEPT: '*/*',
            "X-anOther-Header": "ok"
        }
    });
});

test('read', function (t) {
    sync('read', modelStub());
    t.equal(reqStub.recentOpts.url, '/library');
    t.equal(reqStub.recentOpts.method, 'GET');
    t.ok(!reqStub.recentOpts.json);
    t.ok(!reqStub.recentOpts.body);
    sync('read', modelStub(), {
        url: '/library/books'
    });
    t.equal(reqStub.recentOpts.url, '/library/books', 'passed url should overwrite model url');
    t.end();
});

test('passing data', function (t) {
    // on reads it should be part of the URL
    sync('read', modelStub(), {
        data: {
            a: 'a',
            one: 1
        }
    });
    t.equal(reqStub.recentOpts.url, '/library?a=a&one=1', 'data passed to reads should be made into a query string');
    t.equal(typeof reqStub.recentOpts.data, 'undefined', 'data leftovers should be cleaned up');

    var modelStubInstance = modelStub();
    modelStubInstance.url = '/library?something=hi';
    sync('read', modelStubInstance, {
        data: {
            a: 'a',
            one: 1
        }
    });
    t.equal(reqStub.recentOpts.url, '/library?something=hi&a=a&one=1', 'data passed to reads should be appended to an existing query string in the url');
    t.equal(typeof reqStub.recentOpts.data, 'undefined', 'data leftovers should be cleaned up');

    sync('read', modelStub(), {
        url: '/library/books',
        data: {
            a: 'a',
            one: 1
        }
    });
    t.equal(reqStub.recentOpts.url, '/library/books?a=a&one=1', 'data passed to reads should be added as a query string to overwritten url');
    t.equal(typeof reqStub.recentOpts.data, 'undefined', 'data leftovers should be cleaned up');
    t.end();
});

test('create', function (t) {
    sync('create', modelStub({
        title: 'The Tempest',
        author: 'Bill Shakespeare',
        length: 123
    }));
    t.equal(reqStub.recentOpts.url, '/library');
    t.equal(reqStub.recentOpts.method, 'POST');
    t.ok(reqStub.recentOpts.json, 'body passed as json');
    var data = reqStub.recentOpts.json;
    t.equal(data.title, 'The Tempest');
    t.equal(data.author, 'Bill Shakespeare');
    t.equal(data.length, 123);
    t.end();
});

test('update', function (t) {
    var xhr = sync('update', modelStub({
        id: '1-the-tempest',
        author: 'William Shakespeare'
    }));
    t.equal(reqStub.recentOpts.url, '/library');
    t.equal(reqStub.recentOpts.method, 'PUT');
    t.ok(reqStub.recentOpts.json, 'body passed as json');
    var data = reqStub.recentOpts.json;
    t.equal(data.id, '1-the-tempest');
    t.equal(data.author, 'William Shakespeare');
    t.end();
});

test('update with emulateHTTP and emulateJSON', function (t) {
    var xhr = sync('update', modelStub({
        id: '2-the-tempest',
        author: 'Tim Shakespeare',
        length: 123
    }), {
        emulateHTTP: true,
        emulateJSON: true
    });
    t.equal(reqStub.recentOpts.url, '/library');
    t.equal(reqStub.recentOpts.method, 'POST');
    t.equal(reqStub.recentOpts.body, 'model%5Bid%5D=2-the-tempest&model%5Bauthor%5D=Tim%20Shakespeare&model%5Blength%5D=123&_method=PUT');
    t.equal(reqStub.recentOpts.headers['content-type'], 'application/x-www-form-urlencoded');
    t.end();
});

test('update with just emulateHTTP', function (t) {
    var xhr = sync('update', modelStub({
        id: '2-the-tempest',
        author: 'Tim Shakespeare',
        length: 123
    }), {
        emulateHTTP: true
    });
    t.equal(reqStub.recentOpts.url, '/library');
    t.equal(reqStub.recentOpts.method, 'POST');
    t.ok(reqStub.recentOpts.json, 'body passed as json');
    var data = reqStub.recentOpts.json;
    t.equal(data.id, '2-the-tempest');
    t.equal(data.author, 'Tim Shakespeare');
    t.equal(data.length, 123);
    t.end();
});


test('update with just emulateJSON', function (t) {
    var xhr = sync('update', modelStub({
        id: '2-the-tempest',
        author: 'Tim Shakespeare',
        length: 123
    }), {
        emulateJSON: true
    });
    t.equal(reqStub.recentOpts.url, '/library');
    t.equal(reqStub.recentOpts.method, 'PUT');
    t.equal(reqStub.recentOpts.headers['content-type'], 'application/x-www-form-urlencoded');
    t.equal(reqStub.recentOpts.body, 'model%5Bid%5D=2-the-tempest&model%5Bauthor%5D=Tim%20Shakespeare&model%5Blength%5D=123');
    t.end();
});

test('delete', function (t) {
    var xhr = sync('delete', modelStub({
        author: 'Tim Shakespeare',
        length: 123
    }));
    t.equal(reqStub.recentOpts.url, '/library');
    t.equal(reqStub.recentOpts.method, 'DELETE');
    t.notOk(reqStub.recentOpts.data);
    t.end();
});


test('destroy with emulateHTTP', function (t) {
    var xhr = sync('delete', modelStub({
        author: 'Tim Shakespeare',
        length: 123
    }), {
        emulateHTTP: true,
        emulateJSON: true
    });
    t.equal(reqStub.recentOpts.url, '/library');
    t.equal(reqStub.recentOpts.method, 'POST');
    t.equal(reqStub.recentOpts.body, '_method=DELETE');
    t.end();
});

test('urlError', function (t) {
    t.throws(function () {
        var xhr = sync('read', {});
    }, Error);
    t.end();
});

test('should call provided error callback on error.', function (t) {
    t.plan(1);
    var xhr = sync('read', modelStub(), {
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


test('should call provided error callback on HTTP error.', function (t) {
    t.plan(1);
    var xhr = sync('read', modelStub(), {
        error: function (resp,type,error) {
            t.equal(error,'HTTP400');
            t.end();
        },
        xhrImplementation: function (ajaxSettings, callback) {
            callback(null, {statusCode:400}, null);
            return {};
        }
    });
});


test('should parse JSON in error responses if possible', function (t) {
    t.plan(1);
    var xhr = sync('read', modelStub(), {
        error: function (resp,type,error) {
            t.equal(error.e,"rror");
            t.end();
        },
        xhrImplementation: function (ajaxSettings, callback) {
            callback(null, {statusCode:400}, '{"e":"rror"}');
            return {};
        }
    });
});

test('should call provided error callback for bad JSON.', function (t) {
    t.plan(2);

    var xhr = sync('read', modelStub(), {
        error: function (resp, type, error) {
            t.deepEqual(resp, {}, 'should be passed through response');
            t.equal(type, 'error', 'is string \'error\' as per jquery');
            t.end();
        },
        xhrImplementation: function (ajaxSettings, callback) {
            callback(null, {}, '{"bad": "json');
            return {};
        }
    });
});

test('should not call success when error occurs and there\'s no error callback', function (t) {
    t.plan(1);

    var xhr = sync('read', modelStub(), {
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

test('Call "always" after success callback', function (t) {
    t.plan(1);

    var xhr = sync('read', modelStub(), {
        always: function (err, resp, body) {
            t.equal(err, null, 'error param is null');
            t.end();
        },
        xhrImplementation: function (ajaxSettings, callback) {
            callback(null, {}, '{"good": "json"}');
            return {};
        }
    });
});

test('Call "always" after error callback', function (t) {
    t.plan(1);

    var xhr = sync('read', modelStub(), {
        always: function (err, resp, body) {
            t.pass();
            t.end();
        },
        xhrImplementation: function (ajaxSettings, callback) {
           callback(new Error(), {}, '{"good": "json"}');
           return {};
        }
    });
});

test('should parse json for different media types', function (t) {
    t.plan(4);

    var jsonMediaTypes = [
        '', // Test with no accept header
        'application/hal+json',
        'application/json+hal',
        'application/json'
    ];

    jsonMediaTypes.forEach(function (mediaType) {
        sync('read', modelStub(), {
            headers: {
                accept: 'application/hal+json'
            },
            success: function (resp, type, error) {
                t.deepEqual(resp.good, 'json', (mediaType || 'no type') + ' is parsed as json');
            },
            xhrImplementation: function (ajaxSettings, callback) {
                callback(null, {}, '{"good": "json"}');
                return {};
            }
        });
    });
});

