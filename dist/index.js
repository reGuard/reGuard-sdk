(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Tracker = factory());
})(this, (function () { 'use strict';

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
        document.addEventListener("DOMContentLoaded", function () {
            console.log("DOMReady: True", new Date());
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
            if (!event)
                return;
            const target = event.target;
            const isElementTarget = target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement;
            if (isElementTarget)
                return;
            ({
                kind: "stability",
                type: "error",
                errorType: "resourceError",
                message: `加载${target.tagName}资源失败`,
                url: event.target.src || event.target.href,
            });
        }, true);
    }

    function reportTracker(params) {
        let headers = {
            type: 'application/x-www-form-urlencoded'
        };
        //封装blob
        let blob = new Blob([JSON.stringify(params)], headers);
        navigator.sendBeacon('http://localhost:9000/tracker', blob);
    }

    //接口异常采集
    function requestCatch(type1, type2) {
        let oldopen = XMLHttpRequest.prototype[type1];
        let oldosend = XMLHttpRequest.prototype[type2];
        let logData = {
            method: '',
            url: '',
        };
        XMLHttpRequest.prototype.open = function (method, url, async) {
            logData = {
                method,
                url,
            };
            return oldopen.apply(this, arguments);
        };
        let startTime;
        XMLHttpRequest.prototype.send = function (body) {
            if (logData) {
                //发送时候记录时间
                startTime = Date.now();
                const handler = (type) => (event) => {
                    let duration = Date.now() - startTime;
                    let status = this.status;
                    let statusText = this.statusText;
                    let requestInfo = {
                        type: 'xhr',
                        eventType: event.type,
                        pathName: logData.url,
                        status: status + '-' + statusText,
                        duration,
                        response: this.response ? JSON.stringify(this.response) : '',
                        params: body || ''
                    };
                    reportTracker(requestInfo);
                };
                this.addEventListener('load', handler(), false);
                this.addEventListener('error', handler(), false);
                this.addEventListener('abort', handler(), false);
            }
            oldosend.apply(this, arguments);
        };
    }

    function getSelector(element) {
        var selector;
        if (element.id) {
            selector = `#${element.id}`;
        }
        else if (element.className && typeof element.className === "string") {
            selector =
                "." +
                    element.className
                        .split(" ")
                        .filter(function (item) {
                        return !!item;
                    })
                        .join(".");
        }
        else {
            selector = element.nodeName.toLowerCase();
        }
        return selector;
    }
    function blankScreen() {
        const wrapperSelectors = ["body", "html", "#container", ".content"];
        let emptyPoints = 0;
        function isWrapper(element) {
            let selector = getSelector(element);
            if (wrapperSelectors.indexOf(selector) >= 0) {
                emptyPoints++;
            }
        }
        onload = function () {
            let xElements, yElements;
            for (let i = 1; i <= 9; i++) {
                xElements = document.elementsFromPoint((window.innerWidth * i) / 10, window.innerHeight / 2);
                yElements = document.elementsFromPoint(window.innerWidth / 2, (window.innerHeight * i) / 10);
                isWrapper(xElements[0]);
                isWrapper(yElements[0]);
            }
            if (emptyPoints >= 0) {
                let centerElements = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight / 2);
                let reportData = {
                    kind: "stability",
                    type: "blank",
                    emptyPoints: "" + emptyPoints,
                    screen: window.screen.width + "x" + window.screen.height,
                    viewPoint: window.innerWidth + "x" + window.innerHeight,
                    selector: getSelector(centerElements[0]),
                };
                console.log('白屏', reportData);
            }
        };
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
        //请求异常
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
        //js错误
        errorEvent() {
            window.addEventListener('error', (event) => {
                console.log(event);
                this.reportTracker({
                    event: 'jserror',
                    targetkey: 'message',
                    message: event.message
                });
            });
        }
        resourceError() {
            /*  injectHandleResourceError(); */
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
                injectHandleJsError();
            }
            if (this.data.requestTracker) {
                requestCatch('open', 'send');
                //上报
            }
            if (this.data.resourceError) {
                injectHandleResourceError();
            }
            if (this.data.ScreenTracker) {
                blankScreen();
            }
        }
    }

    return Tracker;

}));
