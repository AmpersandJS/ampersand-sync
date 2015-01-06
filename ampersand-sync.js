/*$AMPERSAND_VERSION*/
var _ = require('underscore');
var xhr = require('xhr');
var qs = require('qs');
// TPromise stands for then/promise, used as a way to avoid naming collision with native Promise implementation
// at this point, this is largely to avoid jshint from complaining
var TPromise = require('promise');

// Throw an error when a URL is needed, and none is supplied.
var urlError = function () {
    throw new Error('A "url" property or function must be specified');
};


module.exports = function (method, model, options) {
    var type = methodMap[method];
    var headers = {};

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
        emulateHTTP: false,
        emulateJSON: false,
        // overrideable primarily to enable testing
        xhrImplementation: xhr
    });

    // Default request options.
    var params = {type: type};

    // Ensure that we have a URL.
    if (!options.url) {
        options.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
        params.json = options.attrs || model.toJSON(options);
    }

    // If passed a data param, we add it to the URL or body depending on request type
    if (options.data && type === 'GET') {
        // make sure we've got a '?'
        options.url += _.contains(options.url, '?') ? '&' : '?';
        options.url += qs.stringify(options.data);
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        params.body = params.json ? {model: params.json} : {};
        delete params.json;
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
        params.type = 'POST';
        if (options.emulateJSON) params.body._method = type;
        headers['X-HTTP-Method-Override'] = type;
    }

    // When emulating JSON, we turn the body into a querystring.
    // We do this later to let the emulateHTTP run its course.
    if (options.emulateJSON) {
        params.body = qs.stringify(params.body);
    }

    // Start setting ajaxConfig options (headers, xhrFields).
    var ajaxConfig = (_.result(model, 'ajaxConfig') || {});

    // Combine generated headers with user's headers.
    if (ajaxConfig.headers) {
        _.extend(headers, ajaxConfig.headers);
    }
    params.headers = headers;

    //Set XDR for cross domain in IE8/9
    if (ajaxConfig.useXDR) {
        params.useXDR = true;
    }

    // Set raw xhr options.
    if (ajaxConfig.xhrFields) {
        var beforeSend = ajaxConfig.beforeSend;
        params.beforeSend = function (req) {
            for (var key in ajaxConfig.xhrFields) {
                req[key] = ajaxConfig.xhrFields[key];
            }
            if (beforeSend) return beforeSend.apply(this, arguments);
        };
        params.xhrFields = ajaxConfig.xhrFields;
    } else {
        params.beforeSend = ajaxConfig.beforeSend;
    }

    // Turn a jQuery.ajax formatted request into xhr compatible
    params.method = params.type;

    var ajaxSettings = _.extend(params, options);

    var request;
    // Make the request. The callback executes functions that are compatible
    // With jQuery.ajax's syntax.
    var promise = new TPromise(function (resolve, reject) {
        request = options.xhr = options.xhrImplementation(ajaxSettings, function (err, resp, body) {
            if (err) {
                if (options.error) {
                    options.error(resp, 'error', err.message);
                }
                reject(err);
            }

            // Parse body as JSON if a string.
            if (body && typeof body === 'string') {
                try {
                    body = JSON.parse(body);
                } catch (err) {
                    if (options.error) options.error(resp, 'error', err.message);
                    reject(err);
                }
            }
            if (options.success) options.success(body, 'success', resp);
            resolve(body);
        });
    });
    request.ajaxSettings = ajaxSettings;
    model.trigger('request', model, request, options, ajaxSettings);
    // attach request to promise
    promise.request = request;
    return promise;
};

// Map from CRUD to HTTP for our default `Backbone.sync` implementation.
var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
};
