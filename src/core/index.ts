import type { DefaultOptons, Optins } from "../type/index";
import { TrackerConfig } from "../type/index";
import { createHistoryEvent, captureEvents } from "../lib/userBehavior/pv";
import FPTracker from "../lib/pageRender/FP";
import handleDOMContentLoaded from "../lib/handleDOM/handleDOMContentLoaded";
import handleTargetDOM from "../lib/handleDOM/handleTargetDOM";
import JsErrorTracker from "../lib/handleError/jsError";
import resourceErrorTracker from "../lib/handleError/resourceError";
import requestTracker from "../lib/handleRequest/handleRequest";
import blankScreen from "../lib/pageRender/blankScreen";
import performanceIndex from "../lib/performanceIndex/navigationTiming";
import reportTracker from "../utils/publicReport";

export default class Tracker {
    public options: Optins;

    constructor(options: Optins) {
        this.options = Object.assign(this.initDef(), options);
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

    //设置用户id
    public setUserId<T extends DefaultOptons["uuid"]>(uuid: T) {
        this.options.uuid = uuid;
    }

    //上报请求
    private reportTracker<T>(data: T) {
        const params = Object.assign(this.options, data);
        reportTracker(this.options.requestUrl, params);
    }

    //手动上报
    public sendReport<T>(data: T) {
        this.reportTracker(data);
    }

    private installTracker() {
        //history模式监控pv
        if (this.options.historyTracker) {
            let startTime = Date.now();
            captureEvents(["pushState", "replaceState", "popstate"], "history-pv", { startTime, stayTime: 0 });
        }
        //hash模式pv
        if (this.options.hashTracker) {
            captureEvents(["hashchange"], "hash-pv");
        }
        //Fp监控
        if (this.options.FPTracker) {
            FPTracker(this.options.FCPTracker);
        }
        //dom监听
        if (this.options.DOMTracker) {
            handleDOMContentLoaded();
            handleTargetDOM();
        }
        //js监听
        if (this.options.jsError) {
            JsErrorTracker();
        }
        //请求监听
        if (this.options.requestTracker) {
            requestTracker("open", "send");
        }
        //资源加载错误监听
        if (this.options.resourceError) {
            resourceErrorTracker();
        }
        //白屏监听
        if (this.options.screenTracker) {
            blankScreen();
        }
        // 性能指标
        if (this.options.performanceIndex) {
            performanceIndex();
        }
    }
}
