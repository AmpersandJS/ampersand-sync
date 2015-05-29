var stub = function () {
    stub.recentOpts = null;
    stub.returnedObject = null;
    return function requestStub(opts) {
        stub.recentOpts = opts;
        stub.returnedObject = {};
        return stub.returnedObject;
    };
};
module.exports = stub;