'use strict';

var TrackerConfig;
(function (TrackerConfig) {
    TrackerConfig["version"] = "1.0.0";
})(TrackerConfig || (TrackerConfig = {}));

//keyof 获取的是类型
const createHistoryEvent = (type) => {
    const origin = history[type];
    //this是假参数
    return function () {
        const res = origin.apply(this, arguments);
        const e = new Event(type);
        /* Event创建自定义事件
        dispatchEvent派发事件
        addEventListener监听事件
        emoveEventListener删除事件
        其实也就是发布阅模式
        */
        window.dispatchEvent(e);
        return res;
    };
};

function FPTracker(FCP) {
    const entryHandler = (list) => {
        for (const entry of list.getEntries()) {
            if (entry.name === "first-paint") {
                observer.disconnect();
                console.log("FPtime", entry.startTime);
            }
            if (FCP) {
                if (entry.name === "first-contentful-paint") {
                    observer.disconnect();
                    console.log("FCPtime", entry.startTime);
                }
            }
        }
    };
    const observer = new PerformanceObserver(entryHandler);
    observer.observe({ type: "paint", buffered: true });
}

function DOMTracker() {
    document.addEventListener('DOMContentLoaded', function () {
        console.log('DOMReady: True', new Date());
    });
}

function injectHandleJsError() {
    window.addEventListener("error", function (event) {
        // 监听语法、引用等js错误
        const reportData = {
            kind: "stability",
            type: "error",
            errorType: "jsError",
            message: event.message,
            fileName: event.filename,
            position: (event.lineno || 0) + ":" + (event.colno || 0), // 异常位置
        };
        console.log("jsError", reportData);
    });
    window.addEventListener("unhandledrejection", function (event) {
        // 监听未被catch的promise错误
        const reportData = {
            kind: "stability",
            type: "error",
            errorType: "promiseError",
            message: "",
            fileName: "",
            position: "",
        };
        if (event.reason instanceof Error) {
            // promise的回调中发生了错误 或是 reject了一个Error的实例
            reportData.message = event.reason.message;
        }
        else {
            // reject了字符串等其他内容
            reportData.message = event.reason;
        }
        console.log("promiseError", reportData);
    });
}

function injectHandleResourceError() {
    window.addEventListener("error", function (event) {
        // 监听资源加载错误
        let target = event.target;
        const isElementTarget = target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement;
        if (!isElementTarget)
            return;
        console.log(event);
        ({
            kind: "stability",
            type: "error",
            errorType: "resourceError",
            message: event.message,
            fileName: event.filename,
            position: (event.lineno || 0) + ":" + (event.colno || 0), // 异常位置
        });
    }, true);
}

class Tracker {
    constructor(options) {
        this.MouseEventList = ["click", "dblclick", "contextmenu", "mousedown", "mouseup", "mouseenter", "mouseout", "mouseover"];
        this.data = Object.assign(this.initDef(), options);
        this.installTracker();
    }
    //初始化函数
    initDef() {
        window.history["pushState"] = createHistoryEvent("pushState");
        window.history["replaceState"] = createHistoryEvent("replaceState");
        return {
            sdkVersion: TrackerConfig.version,
            historyTracker: false,
            hashTracker: false,
            domTracker: false,
            jsError: false,
            resourceError: false,
        };
    }
    //targetKey自定义 例如history-pv
    captureEvents(mouseEventList, targetKey, data) {
        mouseEventList.forEach((item) => {
            window.addEventListener(item, () => {
                console.log("监听到了");
                this.reportTracker({ item, targetKey, data });
            });
        });
    }
    //设置用户id
    setUserId(uuid) {
        this.data.uuid = uuid;
    }
    //上报请求
    reportTracker(data) {
        const params = Object.assign(this.data, data, { time: new Date().getTime() });
        let headers = {
            type: "application/x-www-form-urlencoded",
        };
        //封装blob
        let blob = new Blob([JSON.stringify(params)], headers);
        navigator.sendBeacon(this.data.requestUrl, blob);
    }
    //手动上报
    sendReport(data) {
        this.reportTracker(data);
    }
    //dom监听
    targerKeyReport() {
        this.MouseEventList.forEach((ev) => {
            window.addEventListener(ev, (e) => {
                const target = e.target;
                const targetKey = target.getAttribute("target-key");
                if (targetKey) {
                    console.log({
                        event: ev,
                        target: targetKey,
                    }, "监听到了");
                    this.reportTracker({
                        event: ev,
                        target: targetKey,
                    });
                }
            });
        });
    }
    jsError() {
        injectHandleJsError();
    }
    resourceError() {
        injectHandleResourceError();
    }
    installTracker() {
        if (this.data.DOMTracker) {
            DOMTracker();
        }
        //history模式监控
        if (this.data.historyTracker) {
            this.captureEvents(["pushState", "replaceState", "popstate"], "history-pv");
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
        if (this.data.jsError) {
            this.jsError();
        }
        if (this.data.resourceError) {
            this.resourceError();
        }
    }
}

module.exports = Tracker;
