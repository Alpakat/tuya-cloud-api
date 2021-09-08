"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configure = exports.httpClient = void 0;
const got_1 = __importDefault(require("got"));
const assert_1 = __importDefault(require("assert"));
const crypto_1 = __importDefault(require("crypto"));
const qs = __importStar(require("qs"));
const availableEndpoints = {
    eu: 'https://openapi.tuyaeu.com/v1.0',
    cn: 'https://openapi.tuyacn.com/v1.0',
    us: 'https://openapi.tuyaus.com/v1.0',
    in: 'https://openapi.tuyain.com/v1.0',
};
const defaultContext = {
    clientId: null,
    clientSecret: null,
    prefixUrl: availableEndpoints.eu,
    getToken: async () => null,
};
exports.httpClient = got_1.default.extend({
    responseType: 'json',
    retry: {
        limit: 4,
        methods: [
            'GET',
            // POST is used only for device command,
            // which is idempotent and can be safely retried
            'POST',
        ],
    },
    hooks: {
        init: [
            (options) => {
                const { prefixUrl } = defaultContext;
                options.prefixUrl = `${prefixUrl}/`;
            },
        ],
        beforeRequest: [
            async (options) => {
                // console.log(options.url);
                if (options.url.pathname.includes('token')) {
                    const method = 'GET';
                    const timestamp = Date.now().toString();
                    // const timestamp = '1631113587702';
                    const signUrl = '/v1.0/token?grant_type=1';
                    const contentHash = crypto_1.default
                        .createHash('sha256')
                        .update('')
                        .digest('hex');
                    const stringToSign = [method, contentHash, '', signUrl].join('\n');
                    const signStr = defaultContext.clientId + timestamp + stringToSign;
                    const headers = {
                        t: timestamp,
                        sign_method: 'HMAC-SHA256',
                        client_id: defaultContext.clientId || '',
                        sign: crypto_1.default
                            .createHmac('sha256', defaultContext.clientSecret || '')
                            .update(signStr, 'utf8')
                            .digest('hex')
                            .toUpperCase(),
                    };
                    options.headers = headers;
                    return;
                }
                const { clientId, getToken } = defaultContext;
                const accessToken = await getToken(options, defaultContext);
                assert_1.default(clientId, 'client id is required for request');
                // const now = Date.now().toString();
                // const now = '1631116472762';
                // console.log(options.url.pathname);
                const url = options.url.pathname;
                // const contentHash = crypto
                //   .createHash('sha256')
                //   .update(JSON.stringify(options.body || {}))
                //   .digest('hex');
                // const stringToSign = [options.method, contentHash, '', url].join('\n');
                // const signStr =
                //   (defaultContext.clientId || '') + accessToken + now + stringToSign;
                // options.headers.client_id = clientId;
                // options.headers.sign = await encryptStr(
                //   signStr,
                //   defaultContext.clientSecret || '',
                // );
                // options.headers.path = url;
                // options.headers.t = now;
                // options.headers.sign_method = 'HMAC-SHA256';
                // options.headers.access_token = accessToken || '';
                // const headers = {
                //   t: now,
                //   path: url,
                //   client_id: clientId,
                //   sign: await encryptStr(signStr, defaultContext.clientSecret || ''),
                //   sign_method: 'HMAC-SHA256',
                //   access_token: accessToken || '',
                // };
                const reqHeaders = await getRequestSign(url, options.method, {}, {}, options.json, accessToken || '');
                options.headers = reqHeaders;
            },
        ],
        afterResponse: [
            (response) => {
                const { request: { options: { method, url }, }, body, } = response;
                const requestName = `${method} ${url.pathname}${url.search}`;
                if (!body.success) {
                    const error = new Error(`Error requesting ${requestName}: ${body.msg} (${body.code})`);
                    error['code'] = body.code;
                    error['response'] = response;
                    error['request'] = response.request;
                    error['options'] = response.request.options;
                    throw error;
                }
                return response;
            },
        ],
    },
});
async function encryptStr(str, secret) {
    return crypto_1.default
        .createHmac('sha256', secret)
        .update(str, 'utf8')
        .digest('hex')
        .toUpperCase();
}
async function getRequestSign(path, method, _headers = {}, query = {}, body = undefined, token) {
    // console.log(path, method, _headers, query, body);
    const t = Date.now().toString();
    const [uri, pathQuery] = path.split('?');
    const queryMerged = Object.assign(query, qs.parse(pathQuery));
    const sortedQuery = {};
    Object.keys(queryMerged)
        .sort()
        .forEach((i) => (sortedQuery[i] = query[i]));
    const querystring = decodeURIComponent(qs.stringify(sortedQuery));
    const url = querystring ? `${uri}?${querystring}` : uri;
    // const url = '/v1.0/devices/vdevo163110217990758/status';
    // console.log(url);
    const contentHash = crypto_1.default
        .createHash('sha256')
        .update(JSON.stringify(body) || '')
        .digest('hex');
    const stringToSign = [method, contentHash, '', url].join('\n');
    const signStr = defaultContext.clientId + token + t + stringToSign;
    return {
        t,
        path: url,
        client_id: defaultContext.clientId || '',
        sign: await encryptStr(signStr, defaultContext.clientSecret || ''),
        sign_method: 'HMAC-SHA256',
        access_token: token,
    };
}
// function createSign({ payload }: { payload: string }): string {
//   const { clientSecret } = defaultContext;
//   assert(clientSecret, 'clientSecret required');
//   return crypto
//     .createHmac('sha256', clientSecret)
//     .update(payload)
//     .digest('hex')
//     .toUpperCase();
// }
const configure = ({ clientId, clientSecret, getToken, serverLocation = 'eu', }) => {
    const prefixUrl = availableEndpoints[serverLocation];
    assert_1.default(clientId, 'clientId required');
    assert_1.default(clientSecret, 'clientSecret required');
    assert_1.default(getToken, 'getToken required');
    assert_1.default(prefixUrl, `Unknown serverLocation: ${serverLocation}`);
    Object.assign(defaultContext, {
        clientId,
        clientSecret,
        prefixUrl,
        getToken,
    });
};
exports.configure = configure;
