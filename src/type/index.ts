export { DefaultOptons, Optins } from "./IOptions";
export { ReportData } from "./IReportData";

export enum TrackerConfig {
    version = "1.0.0",
}


// 用户行为信息
export interface UserBehavior {
    user?: string;
    pageUrl?: string;
    startTime: number;
    stayTime: number;

}

