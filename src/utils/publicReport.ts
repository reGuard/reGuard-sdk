import { ReportData } from "../type/index";

// 兼容性判断
const compatibility = {
    canUseSendBeacon: !!navigator.sendBeacon,
};

export default function reportTracker<T>(url: string, params: T) {
    params = Object.assign(params, { reportTime: new Date().getTime() });

    if (compatibility.canUseSendBeacon && params) {
        let headers = {
            type: "application/x-www-form-urlencoded",
        };
        //封装blob
        let blob = new Blob([JSON.stringify(params)], headers);
        navigator.sendBeacon(url, blob);
    } else {
        // 使用img标签上报
        const img = new Image();
        img.src = `${url}?data=${encodeURIComponent(JSON.stringify(params))}`;
    }
}
