import {Optins} from '../type/IOptions'
const options:Optins = JSON.parse(localStorage.getItem('info')!)

// 兼容性判断
const compatibility = {
    canUseSendBeacon: !!navigator.sendBeacon,
};

export default function reportTracker<T>(url: string, params: any) {
     params = Object.assign(params,{uuid:options.uuid,sdkversion:options.sdkVersion},{ reportTime: new Date().getTime() });
     console.log(params)
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
