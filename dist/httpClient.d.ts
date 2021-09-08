import type { NormalizedOptions } from 'got/dist/source/core';
export declare const httpClient: import("got/dist/source").Got;
export declare const configure: ({ clientId, clientSecret, getToken, serverLocation, }: {
    clientId: string;
    clientSecret: string;
    getToken: (options: NormalizedOptions) => Promise<string | null>;
    serverLocation?: string | undefined;
}) => void;
