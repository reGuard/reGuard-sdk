import { Optins } from "../type/IOptions";

// 兼容性判断
const compatibility = {
    canUseSendBeacon: !!navigator.sendBeacon,
};

export default function reportTracker<T>(params: any, url: string | undefined) {
    const options: Optins = JSON.parse(localStorage.getItem("options")!);
    url = !!url ? url : options.requestUrl;

    params = Object.assign(params, { uuid: options.uuid, sdkversion: options.sdkVersion }, { reportTime: new Date().getTime() });

    console.log(params);

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
