import type { DefaultOptons, Optins } from "../type/index";
import { TrackerConfig, PersonInfo } from "../type/index";
import { createHistoryEvent } from "../utils/PV/pv";
import FPTracker from "../utils/FP/FP";
import DOMTracker from "../utils/DomReady/DomReady";
import injectHandleJsError from "../utils/handleError/jsError";
import injectHandleResourceError from "../utils/handleError/resourceError";
import requestCatch from "../utils/requestCatch/requestCatch";
import blankScreen from "../utils/WhiteScreen/whiteScreen";
import performanceIndex from "../utils/performanceIndex/performanceIndex";

export default class Tracker {
    public data: Optins;
    MouseEventList: string[] = ["click", "dblclick", "contextmenu", "mousedown", "mouseup", "mouseenter", "mouseout", "mouseover"];

    constructor(options: Optins) {
        this.data = Object.assign(this.initDef(), options);
        this.installTracker();
    }

    // 初始化函数
    private initDef(): DefaultOptons {
        window.history["pushState"] = createHistoryEvent("pushState");
        window.history["replaceState"] = createHistoryEvent("replaceState");
        return <DefaultOptons>{
            sdkVersion: TrackerConfig.version,
        };
    }

    //targetKey自定义 例如history-pv
    private captureEvents<T extends PersonInfo>(mouseEventList: string[], targetKey: string, data?: T) {
        mouseEventList.forEach((item) => {
            window.addEventListener(item, () => {
                console.log("监听到了");
                if (data) {
                    data.stayTime = new Date().getTime() - data.startTime;
                    data.startTime = new Date().getTime();
                }
                console.log(data);

                this.reportTracker({ item, targetKey, data });
            });
        });
    }
    //设置用户id
    public setUserId<T extends DefaultOptons["uuid"]>(uuid: T) {
        this.data.uuid = uuid;
    }
    //请求异常
    //上报请求
    private reportTracker<T>(data: T) {
        const params = Object.assign(this.data, data, { time: new Date().getTime() });
        let headers = {
            type: "application/x-www-form-urlencoded",
        };
        //封装blob
        let blob = new Blob([JSON.stringify(params)], headers);
        navigator.sendBeacon(this.data.requestUrl, blob);
    }
    //手动上报
    public sendReport<T>(data: T) {
        this.reportTracker(data);
    }

    //dom监听
    private targerKeyReport() {
        this.MouseEventList.forEach((ev) => {
            window.addEventListener(ev, (e) => {
                const target = e.target as HTMLElement;
                const targetKey = target.getAttribute("target-key");
                if (targetKey) {
                    console.log(
                        {
                            event: ev,
                            target: targetKey,
                        },
                        "监听到了"
                    );
                    this.reportTracker({
                        event: ev,
                        target: targetKey,
                    });
                }
            });
        });
    }

    private installTracker() {
        if (this.data.DOMTracker) {
            DOMTracker();
        }
        //history模式监控
        if (this.data.historyTracker) {
            let startTime = Date.now();
            this.captureEvents(["pushState", "replaceState", "popstate"], "history-pv", { startTime, stayTime: 0 });
        }
        //hash模式
        if (this.data.hashTracker) {
            this.captureEvents(["hashchange"], "hash-pv");
        }
        //Fp监控
        if (this.data.FPTracker) {
            FPTracker(this.data.FCPTracker);
        }
        //dom监听
        if (this.data.DOMTracker) {
            this.targerKeyReport();
        }
        //js监听
        if (this.data.jsError) {
            injectHandleJsError();
        }
        //请求监听
        if (this.data.requestTracker) {
            requestCatch("open", "send");
        }
        //资源加载错误监听
        if (this.data.resourceError) {
            injectHandleResourceError();
        }
        //白屏监听
        if (this.data.screenTracker) {
            blankScreen();
        }
        //
        if (this.data.performanceIndex) {
            performanceIndex();
        }
    }
}
