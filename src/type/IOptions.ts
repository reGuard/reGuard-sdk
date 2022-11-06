/**
 * @requestUrl 上报地址
 * @sdkVersion sdk版本
 * @historyTracker history上报
 * @hashTracker hash上报
 * @domTracker DOM元素上报 携带 Tracker-key 点击事件上报
 * @jsError js 和 promise 报错异常上报
 * @requestTracker 网络请求异常上报
 * @screenTracker 白屏上报
 * @resourceError 静态资源加载异常上报
 * @performanceIndex 页面性能指标上报
 * @extra 用户自定义字段(对象)
 */
export interface DefaultOptons {
  uuid: string | undefined;
  requestUrl: string | undefined;
  sdkVersion: string | number;
  historyTracker: boolean;
  hashTracker: boolean;
  DOMTracker: boolean;
  jsError: boolean;
  requestTracker: boolean;
  screenTracker: boolean;
  resourceError: boolean;
  performanceIndex: boolean;
  FPTracker: boolean;
  FCPTracker: boolean;
  extra: Record<string, any> | undefined;
}

// Partial代表将属性变为可选属性
export interface Optins extends Partial<DefaultOptons> {
  requestUrl: string; // 使该属性变为必选属性
}

//上报请求信息
export interface IrequestData {
  uuid: string;
  sdkversion: string;
  reportTime?: number;
}
