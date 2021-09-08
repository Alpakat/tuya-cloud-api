import type { NormalizedOptions } from 'got/dist/source/core';
import type { DeviceWithFunctions, Device, DeviceFunctions, DeviceFunctionStatus } from './types';
interface TokenData {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    ttl: number;
}
declare class TuyaApi {
    tokenRequest: {
        expiresAt: number;
        promise: Promise<string>;
    };
    authorize({ apiClientId, apiClientSecret, serverLocation, }: {
        apiClientId: string;
        apiClientSecret: string;
        serverLocation?: string;
    }): Promise<void>;
    getToken({ grantType, refreshToken, }: {
        refreshToken?: string | null | undefined;
        grantType?: 2 | 1 | undefined;
    } | undefined, _defaultContext: {
        clientId: null | string;
        clientSecret: null | string;
        prefixUrl: string;
        getToken: any;
    }): Promise<TokenData>;
    getTokenForRequest(options: NormalizedOptions, defaultContext: {
        clientId: null | string;
        clientSecret: null | string;
        prefixUrl: string;
        getToken: any;
    }): Promise<string | null>;
    getDeviceWithFunctions({ deviceId, }: {
        deviceId: string;
    }): Promise<DeviceWithFunctions>;
    getDevice({ deviceId }: {
        deviceId: string;
    }): Promise<Device>;
    getDeviceStatus({ deviceId, }: {
        deviceId: string;
    }): Promise<DeviceFunctionStatus[]>;
    getDeviceList({ uid }: {
        uid: string;
    }): Promise<Device[]>;
    getDeviceFunctions({ deviceId, }: {
        deviceId: string;
    }): Promise<DeviceFunctions>;
    sendCommand({ deviceId, commands, }: {
        deviceId: string;
        commands: {
            code: string;
            value: any;
        }[];
    }): Promise<boolean>;
}
export declare const tuyaApi: TuyaApi;
export {};
