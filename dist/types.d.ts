/**
 * NOTE: this file should have *.ts extension instead of *.d.ts otherwise
 * typescript will skip it during build
 */
export interface BaseResponse<R extends any> {
    result: R;
    success: boolean;
    t: number;
}
export declare type TokenResponse = BaseResponse<{
    access_token: string;
    expire_time: number;
    refresh_token: string;
    uid: string;
}>;
export interface DeviceFunctions {
    category: 'cz' | string;
    functions: {
        code: string;
        desc: string;
        name: string;
        type: 'Boolean' | 'Integer' | string;
        values: string;
    }[];
}
export declare type FunctionsResponse = BaseResponse<DeviceFunctions>;
export declare type DeviceWithFunctions = Device & {
    functions: DeviceFunctions;
};
export interface DeviceFunctionStatus {
    code: string;
    value: any;
}
export interface Device {
    active_time: number;
    biz_type: number;
    category: 'cz' | string;
    create_time: number;
    icon: string;
    id: string;
    ip: string;
    local_key: string;
    name: string;
    online: boolean;
    owner_id: string;
    product_id: string;
    product_name: string;
    status: DeviceFunctionStatus[];
    sub: boolean;
    time_zone: string;
    uid: string;
    update_time: number;
    uuid: string;
}
export declare type DeviceResponse = BaseResponse<Device>;
export declare type DeviceListResponse = BaseResponse<Device[]>;
export declare type DeviceStatusResponse = BaseResponse<DeviceFunctionStatus[]>;
export declare type DeviceCommandsResponse = BaseResponse<boolean>;
