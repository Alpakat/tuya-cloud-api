"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tuyaApi = void 0;
const httpClient_1 = require("./httpClient");
class TuyaApi {
    constructor() {
        this.tokenRequest = {
            expiresAt: Date.now() - 3,
            promise: Promise.resolve(''),
        };
    }
    async authorize({ apiClientId, apiClientSecret, serverLocation, }) {
        httpClient_1.configure({
            clientId: apiClientId,
            clientSecret: apiClientSecret,
            serverLocation,
            getToken: (options) => this.getTokenForRequest(options, {
                clientId: apiClientId,
                clientSecret: apiClientSecret,
                prefixUrl: 'BLA',
                getToken: 'Bla',
            }),
        });
    }
    async getToken({ grantType = 1, refreshToken = null, } = {}, _defaultContext) {
        let uri = 'token';
        if (refreshToken) {
            uri += `/${refreshToken}`;
        }
        const { body } = await httpClient_1.httpClient.get(uri, {
            searchParams: {
                grant_type: grantType,
            },
        });
        const { result } = body;
        const ttl = (result.expire_time - 20) * 1000;
        return {
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            expiresAt: Date.now() - ttl,
            ttl,
        };
    }
    async getTokenForRequest(options, defaultContext) {
        if (options.url.pathname.includes('/token')) {
            // do not add accessToken if it is token request
            return null;
        }
        let { promise } = this.tokenRequest;
        if (Date.now() > this.tokenRequest.expiresAt) {
            const request = {
                // this will be updated, when we get a token
                expiresAt: Date.now() + 10000,
                promise: this.getToken({
                    grantType: 1,
                }, defaultContext).then(({ expiresAt, accessToken }) => {
                    this.tokenRequest.expiresAt = expiresAt;
                    return accessToken;
                }, (error) => {
                    console.error('Error requesting token', {
                        error,
                    });
                    this.tokenRequest.expiresAt = Date.now() - 3;
                    throw error;
                }),
            };
            this.tokenRequest = request;
            ({ promise } = request);
        }
        return promise;
    }
    async getDeviceWithFunctions({ deviceId, }) {
        const [device, functions] = await Promise.all([
            this.getDevice({ deviceId }),
            this.getDeviceFunctions({ deviceId }),
        ]);
        return {
            ...device,
            functions,
        };
    }
    async getDevice({ deviceId }) {
        const { body } = await httpClient_1.httpClient.get(`devices/${deviceId}`, {});
        return body.result;
    }
    async getDeviceStatus({ deviceId, }) {
        const { body } = await httpClient_1.httpClient.get(`devices/${deviceId}/status`);
        return body.result;
    }
    async getDeviceList({ uid }) {
        const { body } = await httpClient_1.httpClient.get(`users/${uid}/devices`);
        return body.result;
    }
    async getDeviceFunctions({ deviceId, }) {
        const { body } = await httpClient_1.httpClient.get(`devices/${deviceId}/functions`);
        return body.result;
    }
    async sendCommand({ deviceId, commands, }) {
        const { body } = await httpClient_1.httpClient.post(`devices/${deviceId}/commands`, {
            json: {
                commands,
            },
        });
        return body.result;
    }
}
exports.tuyaApi = new TuyaApi();
