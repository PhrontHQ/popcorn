/**
 * @module ./jsonp-transport
 * @requires montage/core/core
 */
var Montage = require("montage/core/core").Montage,
    Params = require('query-params'),
    Url = require("url"),
    Uuid = require("montage/core/uuid"),
    Promise = require("montage/core/promise").Promise;

/**
 * @class JsonpTransport
 * @extends Montage
 */
exports.JsonpTransport = class JsonpTransport extends Montage /** @lends JsonpTransport# */ {

    makeRequest(url, servicePrefix, callbackParameter) {
        var self = this,
            parsedUrl = Url.parse(url),
            params = Params.decode(parsedUrl.query),
            callbackNamePrefix = servicePrefix ? servicePrefix + "ServiceCallback" : "serviceCallback",
            callbackMethodName = callbackNamePrefix + Uuid.generate().replace(/-/g, "_"),
            scriptElement = document.createElement("script"),
            responsePromise = new Promise(function(resolve, reject) {
                window[callbackMethodName] = function(data) {
                    self._handleResponse(data, resolve, reject);
                    document.head.removeChild(scriptElement);
                    delete window[callbackMethodName];
                };
    
            }),
            requestUrl;


        params[callbackParameter? callbackParameter : "callback"] = callbackMethodName;

        requestUrl = url.replace(parsedUrl.query, "") + Params.encode(params);
        scriptElement.src = requestUrl;

        document.head.appendChild(scriptElement);

        return responsePromise;
    }

    _handleResponse(data, resolve, reject) {
//      console.log("response", data);
        if (!data) {
            reject(new Error("Unknown API Error"));
        } else if (data.error) {
            reject(new Error(data.error));
        } else {
            resolve(data);
        }
    }

};

exports.shared = new exports.JsonpTransport();
