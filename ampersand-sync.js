var _ = require('underscore');
var $ = require('jquery-browserify');


// Throw an error when a URL is needed, and none is supplied.
var urlError = function () {
    throw new Error('A "url" property or function must be specified');
};


module.exports = function (method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
        emulateHTTP: false,
        emulateJSON: false
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
        params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
        params.contentType = 'application/json';
        params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
        params.contentType = 'application/x-www-form-urlencoded';
        params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
        params.type = 'POST';
        if (options.emulateJSON) params.data._method = type;
        var beforeSend = options.beforeSend;
        options.beforeSend = function (xhr) {
            xhr.setRequestHeader('X-HTTP-Method-Override', type);
            if (beforeSend) return beforeSend.apply(this, arguments);
        };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
        params.processData = false;
    }

    // Allow the model a chance to modify Ajax options.
    // Useful for CORS headers, etc.
    if (_.isFunction(model.ajaxConfig)) {
        params = model.ajaxConfig.call(model, params);
    } else if (_.isObject(model.ajaxConfig)) {
        _.extend(params, model.ajaxConfig);
    }

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = $.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
};

// Map from CRUD to HTTP for our default `Backbone.sync` implementation.
var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
};
