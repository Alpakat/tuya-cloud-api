import type { Response } from 'got/dist/source';
import type { NormalizedOptions } from 'got/dist/source/core';
import got from 'got';
import assert from 'assert';
import crypto from 'crypto';
import * as qs from 'qs';

const availableEndpoints = {
  eu: 'http://openapi.tuyaeu.com/v1.0',
  cn: 'https://openapi.tuyacn.com/v1.0',
  us: 'https://openapi.tuyaus.com/v1.0',
  in: 'https://openapi.tuyain.com/v1.0',
};

const defaultContext: {
  clientId: null | string;
  clientSecret: null | string;
  prefixUrl: string;
  getToken: (
    options: NormalizedOptions,
    defaultContext: {
      clientId: null | string;
      clientSecret: null | string;
      prefixUrl: string;
      getToken: any;
    },
  ) => Promise<string | null>;
} = {
  clientId: null,
  clientSecret: null,
  prefixUrl: availableEndpoints.eu,
  getToken: async () => null,
};

export const httpClient = got.extend({
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
          const contentHash = crypto
            .createHash('sha256')
            .update('')
            .digest('hex');
          const stringToSign = [method, contentHash, '', signUrl].join('\n');
          const signStr = defaultContext.clientId + timestamp + stringToSign;

          const headers = {
            t: timestamp,
            sign_method: 'HMAC-SHA256',
            client_id: defaultContext.clientId || '',
            sign: crypto
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

        assert(clientId, 'client id is required for request');

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

        const reqHeaders: { [k: string]: string } = await getRequestSign(
          url,
          options.method,
          {},
          {},
          options.json,
          accessToken || '',
        );

        options.headers = reqHeaders;
      },
    ],

    afterResponse: [
      (
        response: Response<
          { success: true } | { success: false; msg: string; code: number }
        >,
      ) => {
        const {
          request: {
            options: { method, url },
          },
          body,
        } = response;
        const requestName = `${method} ${url.pathname}${url.search}`;

        if (!body.success) {
          const error = new Error(
            `Error requesting ${requestName}: ${body.msg} (${body.code})`,
          );
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

async function encryptStr(str: string, secret: string): Promise<string> {
  return crypto
    .createHmac('sha256', secret)
    .update(str, 'utf8')
    .digest('hex')
    .toUpperCase();
}

async function getRequestSign(
  path: string,
  method: string,
  _headers: { [k: string]: string } = {},
  query: { [k: string]: any } = {},
  body: { [k: string]: any } | undefined = undefined,
  token: string,
) {
  console.log(path, method, _headers, query, body);

  const t = Date.now().toString();
  const [uri, pathQuery] = path.split('?');
  const queryMerged = Object.assign(query, qs.parse(pathQuery));
  const sortedQuery: { [k: string]: string } = {};
  Object.keys(queryMerged)
    .sort()
    .forEach((i) => (sortedQuery[i] = query[i]));

  const querystring = decodeURIComponent(qs.stringify(sortedQuery));
  const url = querystring ? `${uri}?${querystring}` : uri;
  // const url = '/v1.0/devices/vdevo163110217990758/status';
  // console.log(url);
  const contentHash = crypto
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

export const configure = ({
  clientId,
  clientSecret,
  getToken,
  serverLocation = 'eu',
}: {
  clientId: string;
  clientSecret: string;
  getToken: (options: NormalizedOptions) => Promise<string | null>;
  serverLocation?: string;
}): void => {
  const prefixUrl = availableEndpoints[serverLocation];

  assert(clientId, 'clientId required');
  assert(clientSecret, 'clientSecret required');
  assert(getToken, 'getToken required');
  assert(prefixUrl, `Unknown serverLocation: ${serverLocation}`);

  Object.assign(defaultContext, {
    clientId,
    clientSecret,
    prefixUrl,
    getToken,
  });
};
