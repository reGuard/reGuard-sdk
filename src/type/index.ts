export { DefaultOptons, Optins } from "./IOptions";
export { ReportData } from "./IReportData";

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

// 个人用户的信息
export interface PersonInfo {
    user?: string;
    pageUrl?: string;
    startTime: number;
    stayTime: number;
}
