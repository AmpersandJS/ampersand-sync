module.exports = function getStub(data) {
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
};