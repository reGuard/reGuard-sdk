/**
 * @requestUrl 接口地址
 * @historyTracker history上报
 * @hashTracker hash上报
 * @domTracker 携带Tracker-key 点击事件上报
 * @sdkVersionsdk版本
 * @extra透传字段
 * @jsError js 和 promise 报错异常上报
 */
export interface DefaultOptons {
    uuid: string | undefined;
    requestUrl: string | undefined;
    historyTracker: boolean;
    hashTracker: boolean;
    domTracker: boolean;
    requestTracker: boolean;
    sdkVersion: string | number;
    extra: Record<string, any> | undefined;
    jsError: boolean;
    resourceError: boolean;
}

//Partial代表将属性变为可选属性
<<<<<<< HEAD
export interface Optins extends Partial<DefaultOptons>{
    requestUrl: string,
    FPTracker?: boolean,
    FCPTracker?: boolean,
    DOMTracker?: boolean
    requestTracker?: boolean
=======
export interface Optins extends Partial<DefaultOptons> {
    requestUrl: string;
    FPTracker?: boolean;
    FCPTracker?: boolean;
    DOMTracker?: boolean;
>>>>>>> dae8c81497a9cdc7adce454421a4dacabe0d866d
}

export enum TrackerConfig {
    version = "1.0.0",
}

export interface Requests {
    url: string; //url
    event: string; //最终请求的得到的类型 load/error/abort
    type: string; //请求方式
    method: string; //事件类型
    status: string; //状态码
    duration: string; //持续时间
    response: any; //响应内容
    params: any; //参数
    success: boolean; //是否成功
}
