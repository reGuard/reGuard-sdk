export interface ReportData {
    uuid: string | number;
    sdkVersion: string | number;
    reportTime: string | number | Date;
    [proppName: string]: any;
}
