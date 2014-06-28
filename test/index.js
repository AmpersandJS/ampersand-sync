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

test('read', function (t) {
    var xhr = sync('read', getStub());
    t.equal(xhr.ajaxSettings.url, '/library');
    t.equal(xhr.ajaxSettings.type, 'GET');
    t.equal(xhr.ajaxSettings.dataType, 'json');
    t.notOk(xhr.ajaxSettings.data);
    t.end();
});

test('passing data', function (t) {
    var xhr = sync('read', getStub(), {data: {a: 'a', one: 1}});
    t.equal(xhr.ajaxSettings.url, '/library');
    t.equal(xhr.ajaxSettings.data.a, 'a');
    t.equal(xhr.ajaxSettings.data.one, 1);
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
    t.equal(xhr.ajaxSettings.dataType, 'json');
    var data = JSON.parse(xhr.ajaxSettings.data);
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
    t.equal(xhr.ajaxSettings.dataType, 'json');
    var data = JSON.parse(xhr.ajaxSettings.data);
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
    t.equal(xhr.ajaxSettings.dataType, 'json');
    t.equal(xhr.ajaxSettings.data._method, 'PUT');
    var data = JSON.parse(xhr.ajaxSettings.data.model);
    t.equal(data.id, '2-the-tempest');
    t.equal(data.author, 'Tim Shakespeare');
    t.equal(data.length, 123);
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
    t.equal(xhr.ajaxSettings.contentType, 'application/json');
    var data = JSON.parse(xhr.ajaxSettings.data);
    t.equal(data.id, '2-the-tempest');
    t.equal(data.author, 'Tim Shakespeare');
    t.equal(data.length, 123);
    t.end();
});


test("update with just emulateJSON", function (t) {
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
    t.equal(xhr.ajaxSettings.contentType, 'application/x-www-form-urlencoded');
    var data = JSON.parse(xhr.ajaxSettings.data.model);
    t.equal(data.id, '2-the-tempest');
    t.equal(data.author, 'Tim Shakespeare');
    t.equal(data.length, 123);
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
    t.equal(JSON.stringify(xhr.ajaxSettings.data), '{"_method":"DELETE"}');
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
        }
    });
    xhr.ajaxSettings.error();
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
