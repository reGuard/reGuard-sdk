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
        const origin = window.history[type];
        //this是假参数
        return function () {
            const res = origin.apply(this, arguments);
            const e = new Event(type);
            /*
                Event创建自定义事件
                dispatchEvent派发事件
                addEventListener监听事件
                removeEventListener删除事件
                其实也就是发布订阅模式
            */
            window.dispatchEvent(e);
            return res;
        };
    };
    // targetKey自定义 例如 history-pv
    function captureEvents(mouseEventList, targetKey, data) {
        mouseEventList.forEach((item) => {
            window.addEventListener(item, () => {
                console.log("监听到了");
                if (data) {
                    data.stayTime = new Date().getTime() - data.startTime;
                    data.startTime = new Date().getTime();
                }
                console.log(data);
            });
        });
    }

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

    function handleDOMContentLoaded() {
        document.addEventListener("DOMContentLoaded", function () {
            console.log("DOMReady: True", new Date());
        });
    }

    const MouseEventList = ["click", "dblclick", "contextmenu", "mousedown", "mouseup", "mouseenter", "mouseout", "mouseover"];
    function handleTargetDOM () {
        MouseEventList.forEach((ev) => {
            window.addEventListener(ev, (e) => {
                const target = e.target;
                const targetKey = target.getAttribute("target-key");
                if (targetKey) {
                    console.log({
                        event: ev,
                        target: targetKey,
                    }, "监听到了");
                }
            });
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
            if (isElementTarget) {
                const reportData = {
                    kind: "stability",
                    type: "error",
                    errorType: "resourceError",
                    message: `加载${target.tagName}资源失败`,
                    url: event.target.src || event.target.href,
                };
                console.log(reportData);
            }
            /* true */
            return;
        }, true);
    }

    // 兼容性判断
    const compatibility$1 = {
        canUseSendBeacon: !!navigator.sendBeacon,
    };
    function reportTracker(url, params) {
        params = Object.assign(params, { reportTime: new Date().getTime() });
        if (compatibility$1.canUseSendBeacon && params) {
            let headers = {
                type: "application/x-www-form-urlencoded",
            };
            //封装blob
            let blob = new Blob([JSON.stringify(params)], headers);
            navigator.sendBeacon(url, blob);
        }
        else {
            // 使用img标签上报
            const img = new Image();
            img.src = `${url}?data=${encodeURIComponent(JSON.stringify(params))}`;
        }
    }

    //接口异常采集
    function requestCatch(type1, type2) {
        //开启fetch监控
        fetchCatch();
        let oldopen = XMLHttpRequest.prototype[type1];
        let oldosend = XMLHttpRequest.prototype[type2];
        let logData = {
            method: "",
            url: "",
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
                        type: "xhr",
                        eventType: event.type,
                        pathName: logData.url,
                        status: status + "-" + statusText,
                        duration,
                        response: this.response ? JSON.stringify(this.response) : "",
                        params: body || "",
                    };
                    reportTracker("http://localhost:9000/tracker", requestInfo);
                };
                this.addEventListener("load", handler(), false);
                this.addEventListener("error", handler(), false);
                this.addEventListener("abort", handler(), false);
            }
            oldosend.apply(this, arguments);
        };
    }
    function fetchCatch() {
        let originFetch = window.fetch;
        window.fetch = function (input, init) {
            let startTime = Date.now();
            let args = arguments;
            let fetchInput = args[0];
            let method = "GET";
            let url;
            if (typeof fetchInput === "string") {
                url = fetchInput;
            }
            else if ("Request" in window && fetchInput instanceof window.Request) {
                url = fetchInput.url;
                if (fetchInput.method) {
                    method = fetchInput.method;
                }
            }
            else {
                url = "" + fetchInput;
            }
            if (args[1] && args[1].method) {
                method = args[1].method;
            }
            let fetchData = {
                method: method,
                pathName: url,
                status: 0,
                type: "",
                duration: 0,
                response: "null",
                params: (init === null || init === void 0 ? void 0 : init.body) || "",
            };
            return originFetch.apply(this, arguments).then(function (response) {
                fetchData.status = response.status;
                fetchData.type = "fetch";
                fetchData.duration = Date.now() - startTime;
                console.log(fetchData);
                return response;
            });
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
                console.log("白屏", reportData);
            }
        };
    }

    // 兼容性判断
    const compatibility = {
        performance: !!window.performance,
        getEntriesByType: !!(window.performance && performance.getEntriesByType),
    };
    function handleNavigationTiming() {
        if (compatibility.getEntriesByType) {
            setTimeout(() => {
                const perfEntries = performance.getEntriesByType("navigation");
                const { fetchStart, connectStart, connectEnd, requestStart, responseStart, responseEnd, domInteractive, domComplete, redirectEnd, secureConnectionStart, redirectStart, domContentLoadedEventStart, domContentLoadedEventEnd, loadEventStart, domainLookupEnd, domainLookupStart } = perfEntries[0] || performance.timing;
                const DNSTime = domainLookupEnd - domainLookupStart; // DNS域名解析耗时
                const connectTime = connectEnd - connectStart; // 建立TCP连接耗时
                const ttfbTime = requestStart - requestStart; // 发出页面请求到接收到应答数据第一个字节所花费的毫秒数
                const responseTime = responseEnd - responseStart; // 请求响应完全接收耗时
                const domContentLoadedTime = domContentLoadedEventEnd - domContentLoadedEventStart; // DOMContentLoaded事件回调函数执行耗时
                const parseDOMTime = domComplete - domInteractive; // DOM解析的耗时
                const timeToInteractive = domInteractive - fetchStart; // 首次可交互耗时
                const completeLoadTime = loadEventStart - fetchStart; // 完整的加载耗时
                const logData = {
                    type: "pagePerformance",
                    URL: window.location.href,
                    DNSTime,
                    connectTime,
                    ttfbTime,
                    responseTime,
                    parseDOMTime,
                    domContentLoadedTime,
                    timeToInteractive,
                    completeLoadTime,
                };
                console.log("performanceIndex", logData);
            }, 3000);
        }
    }
    function init() {
        if (document.readyState === "complete") {
            if (compatibility.performance)
                handleNavigationTiming();
        }
        else {
            window.addEventListener("load", () => {
                if (compatibility.performance)
                    handleNavigationTiming();
            });
        }
    }

    class Tracker {
        constructor(options) {
            this.options = Object.assign(this.initDef(), options);
            this.installTracker();
        }
        // 初始化函数
        initDef() {
            window.history["pushState"] = createHistoryEvent("pushState");
            window.history["replaceState"] = createHistoryEvent("replaceState");
            return {
                sdkVersion: TrackerConfig.version,
            };
        }
        //设置用户id
        setUserId(uuid) {
            this.options.uuid = uuid;
        }
        //上报请求
        reportTracker(data) {
            const params = Object.assign(this.options, data);
            reportTracker(this.options.requestUrl, params);
        }
        //手动上报
        sendReport(data) {
            this.reportTracker(data);
        }
        installTracker() {
            //history模式监控pv
            if (this.options.historyTracker) {
                let startTime = Date.now();
                captureEvents(["pushState", "replaceState", "popstate"], "history-pv", { startTime, stayTime: 0 });
            }
            //hash模式pv
            if (this.options.hashTracker) {
                captureEvents(["hashchange"]);
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
                injectHandleJsError();
            }
            //请求监听
            if (this.options.requestTracker) {
                requestCatch("open", "send");
            }
            //资源加载错误监听
            if (this.options.resourceError) {
                injectHandleResourceError();
            }
            //白屏监听
            if (this.options.screenTracker) {
                blankScreen();
            }
            // 性能指标
            if (this.options.performanceIndex) {
                init();
            }
        }
    }

    return Tracker;

}));
