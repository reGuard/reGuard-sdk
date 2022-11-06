var TrackerConfig;
(function (TrackerConfig) {
    TrackerConfig["version"] = "1.0.0";
})(TrackerConfig || (TrackerConfig = {}));

//keyof 获取的是类型
const createHistoryEvent = (type) => {
    const origin = window.history[type];
    //this是假参数
    return function () {
        // eslint-disable-next-line prefer-rest-params
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
            console.log('监听到了');
            if (data) {
                data.stayTime = new Date().getTime() - data.startTime;
                data.startTime = new Date().getTime();
            }
            console.log(data);
        });
    });
}

// 兼容性判断
const compatibility$1 = {
    canUseSendBeacon: !!navigator.sendBeacon,
};
function defaultReport(params, url) {
    const options = JSON.parse(localStorage.getItem('options'));
    url = url ? url : options.requestUrl;
    params = Object.assign(params, { uuid: options.uuid, sdkversion: options.sdkVersion }, { reportTime: new Date().getTime() });
    console.log(params);
    if (compatibility$1.canUseSendBeacon && params) {
        const headers = {
            type: 'application/x-www-form-urlencoded',
        };
        //封装blob
        const blob = new Blob([JSON.stringify(params)], headers);
        navigator.sendBeacon(url, blob);
    }
    else {
        // 使用img标签上报
        const img = new Image();
        img.src = `${url}?data=${encodeURIComponent(JSON.stringify(params))}`;
    }
}

const MAX_CACHE_COUNT = 5; // 上报数据最大缓存数
const MAX_WAITING_TIME = 5000; // 最大等待时间

let reportDatas = [];
let timer = null; // 定时器
/**
 * 可以理解为异步执行
 * requestIdleCallback 是浏览器空闲时会自动执行内部函数
 * requestAnimationFrame 是浏览器必须执行的
 * 关于 requestIdleCallback 和  requestAnimationFrame 可以参考 https://www.cnblogs.com/cangqinglang/p/13877078.html
 */
const nextTime = window.requestIdleCallback || window.requestAnimationFrame || ((callback) => setTimeout(callback, 17));
function send(url) {
    if (reportDatas.length) {
        const datas = reportDatas.slice(0, MAX_CACHE_COUNT); // 需要上报的数据
        reportDatas = reportDatas.slice(MAX_CACHE_COUNT); // 剩下的待上报数据
        defaultReport(datas, url);
        if (reportDatas.length) {
            nextTime(send); // 继续上报剩余内容,在下一个时间择机传输
        }
    }
}
function timedReport(params, url) {
    reportDatas.push(params);
    clearTimeout(timer);
    reportDatas.length >= MAX_CACHE_COUNT
        ? send(url)
        : (timer = setTimeout(() => {
            send(url);
        }, MAX_WAITING_TIME));
}

function reportTracker(params, url = undefined) {
    const options = JSON.parse(localStorage.getItem('options'));
    url = url ? url : options.requestUrl;
    if (options.reportType == 'timed') {
        // 定时上报
        timedReport(params, url);
    }
    else {
        defaultReport(params, url);
    }
}

function FPTracker(FCP) {
    const entryHandler = (list) => {
        for (const entry of list.getEntries()) {
            if (entry.name === 'first-paint') {
                observer.disconnect();
                console.log('FPtime', entry.startTime);
                const reportData = {
                    name: 'FP',
                    FPtime: entry.startTime,
                };
                reportTracker(reportData);
            }
            if (FCP) {
                if (entry.name === 'first-contentful-paint') {
                    observer.disconnect();
                    console.log('FCPtime', entry.startTime);
                }
            }
        }
    };
    const observer = new PerformanceObserver(entryHandler);
    observer.observe({ type: 'paint', buffered: true });
}

function handleDOMContentLoaded() {
    document.addEventListener('DOMContentLoaded', function (e) {
        console.log(e.timeStamp);
        const info = {
            name: 'Domready',
            DOMReady: e.timeStamp,
        };
        reportTracker(info, 'http://43.142.180.91:3000/tracker');
    });
}

const MouseEventList = [
    'click',
    'dblclick',
    'contextmenu',
    'mousedown',
    'mouseup',
    'mouseenter',
    'mouseout',
    'mouseover',
];
function handleTargetDOM () {
    MouseEventList.forEach((ev) => {
        window.addEventListener(ev, (e) => {
            const target = e.target;
            const targetKey = target.getAttribute('target-key');
            if (targetKey) {
                const info = {
                    name: 'targetDom',
                    event: ev,
                    target: targetKey,
                };
                reportTracker(info);
            }
        });
    });
}

function injectHandleJsError() {
    window.addEventListener('error', function (event) {
        // 监听语法、引用等js错误
        const reportData = {
            name: 'JsError',
            errorType: 'jsError',
            message: event.message,
            fileName: event.filename,
            position: (event.lineno || 0) + ':' + (event.colno || 0), // 异常位置
        };
        console.log('jsError', reportData);
        reportTracker(reportData);
    });
    window.addEventListener('unhandledrejection', function (event) {
        // 监听未被catch的promise错误
        const reportData = {
            kind: 'stability',
            type: 'error',
            errorType: 'promiseError',
            message: '',
            fileName: '',
            position: '',
        };
        if (event.reason instanceof Error) {
            // promise的回调中发生了错误 或是 reject了一个Error的实例
            reportData.message = event.reason.message;
        }
        else {
            // reject了字符串等其他内容
            reportData.message = event.reason;
        }
        console.log('promiseError', reportData);
        reportTracker(reportData);
    });
}

function injectHandleResourceError() {
    window.addEventListener('error', function (event) {
        // 监听资源加载错误
        if (!event)
            return;
        const target = event.target;
        const isElementTarget = target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement;
        if (isElementTarget) {
            const reportData = {
                name: 'resourceError',
                type: 'error',
                errorType: 'resourceError',
                message: `加载${target.tagName}资源失败`,
                url: event.target.src || event.target.href,
            };
            console.log(reportData);
            reportTracker(reportData);
        }
        /* true */
        return;
    }, true);
}

//接口异常采集
function requestCatch(type1, type2) {
    //开启fetch监控
    fetchCatch();
    const oldopen = XMLHttpRequest.prototype[type1];
    const oldosend = XMLHttpRequest.prototype[type2];
    let logData = {
        method: '',
        url: '',
    };
    XMLHttpRequest.prototype.open = function (method, url, async) {
        logData = {
            method,
            url,
        };
        // eslint-disable-next-line prefer-rest-params
        return oldopen.apply(this, arguments);
    };
    let startTime;
    XMLHttpRequest.prototype.send = function (body) {
        if (logData) {
            //发送时候记录时间
            startTime = Date.now();
            const handler = (type) => (event) => {
                const duration = Date.now() - startTime;
                const status = this.status;
                const statusText = this.statusText;
                const requestInfo = {
                    name: 'request',
                    type: 'xhr',
                    eventType: event.type,
                    pathName: logData.url,
                    status: status + '-' + statusText,
                    duration,
                    response: this.response ? JSON.stringify(this.response) : '',
                    params: body || '',
                };
                reportTracker(requestInfo);
            };
            this.addEventListener('load', handler(), false);
            this.addEventListener('error', handler(), false);
            this.addEventListener('abort', handler(), false);
        }
        // eslint-disable-next-line prefer-rest-params
        oldosend.apply(this, arguments);
    };
}
function fetchCatch() {
    const originFetch = window.fetch;
    window.fetch = function (input, init) {
        const startTime = Date.now();
        // eslint-disable-next-line prefer-rest-params
        const args = arguments;
        const fetchInput = args[0];
        let method = 'GET';
        let url;
        if (typeof fetchInput === 'string') {
            url = fetchInput;
        }
        else if ('Request' in window && fetchInput instanceof window.Request) {
            url = fetchInput.url;
            if (fetchInput.method) {
                method = fetchInput.method;
            }
        }
        else {
            url = '' + fetchInput;
        }
        if (args[1] && args[1].method) {
            method = args[1].method;
        }
        const fetchData = {
            name: 'request',
            method: method,
            pathName: url,
            status: 0,
            type: '',
            duration: 0,
            response: 'null',
            params: (init === null || init === void 0 ? void 0 : init.body) || '',
        };
        // eslint-disable-next-line prefer-rest-params
        return originFetch.apply(this, arguments).then(function (response) {
            fetchData.status = response.status;
            fetchData.type = 'fetch';
            fetchData.duration = Date.now() - startTime;
            console.log(fetchData);
            reportTracker(fetchData);
            return response;
        });
    };
}

function getSelector(element) {
    let selector;
    if (element.id) {
        selector = `#${element.id}`;
    }
    else if (element.className && typeof element.className === 'string') {
        selector =
            '.' +
                element.className
                    .split(' ')
                    .filter(function (item) {
                    return !!item;
                })
                    .join('.');
    }
    else {
        selector = element.nodeName.toLowerCase();
    }
    return selector;
}
function blankScreen() {
    const wrapperSelectors = ['body', 'html', '#container', '.content'];
    let emptyPoints = 0;
    function isWrapper(element) {
        const selector = getSelector(element);
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
            const centerElements = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight / 2);
            const reportData = {
                name: '白屏',
                type: 'blank',
                emptyPoints: '' + emptyPoints,
                screen: window.screen.width + 'x' + window.screen.height,
                viewPoint: window.innerWidth + 'x' + window.innerHeight,
                selector: getSelector(centerElements[0]),
            };
            console.log('白屏', reportData);
            reportTracker(reportData);
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
            const perfEntries = performance.getEntriesByType('navigation');
            const { fetchStart, connectStart, connectEnd, requestStart, responseStart, responseEnd, domInteractive, domComplete, redirectEnd, secureConnectionStart, redirectStart, domContentLoadedEventStart, domContentLoadedEventEnd, loadEventStart, domainLookupEnd, domainLookupStart, } = perfEntries[0] || performance.timing;
            const DNSTime = domainLookupEnd - domainLookupStart; // DNS域名解析耗时
            const connectTime = connectEnd - connectStart; // 建立TCP连接耗时
            const ttfbTime = requestStart - requestStart; // 发出页面请求到接收到应答数据第一个字节所花费的毫秒数
            const responseTime = responseEnd - responseStart; // 请求响应完全接收耗时
            const domContentLoadedTime = domContentLoadedEventEnd - domContentLoadedEventStart; // DOMContentLoaded事件回调函数执行耗时
            const parseDOMTime = domComplete - domInteractive; // DOM解析的耗时
            const timeToInteractive = domInteractive - fetchStart; // 首次可交互耗时
            const completeLoadTime = loadEventStart - fetchStart; // 完整的加载耗时
            const FP = responseEnd - fetchStart; // 白屏时间
            const memory = performance.memory;
            const memoryUsage = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'; // js内存使用占比
            const logData = {
                name: 'pagePerformance',
                URL: window.location.href,
                DNSTime: DNSTime.toFixed(3),
                connectTime: connectTime.toFixed(3),
                ttfbTime: ttfbTime.toFixed(3),
                responseTime: responseTime.toFixed(3),
                parseDOMTime: parseDOMTime.toFixed(3),
                domContentLoadedTime: domContentLoadedTime.toFixed(3),
                timeToInteractive: timeToInteractive.toFixed(3),
                completeLoadTime: completeLoadTime.toFixed(3),
                FP: FP.toFixed(3),
                memoryUsage,
            };
            console.log('performanceIndex', logData);
            reportTracker(logData);
        }, 3000);
    }
}
function init() {
    if (document.readyState === 'complete') {
        if (compatibility.performance)
            handleNavigationTiming();
    }
    else {
        window.addEventListener('load', () => {
            if (compatibility.performance)
                handleNavigationTiming();
        });
    }
}

class Tracker {
    constructor(options) {
        this.options = Object.assign(this.initDef(), options);
        localStorage.setItem('options', JSON.stringify(this.options));
        this.installTracker();
    }
    // 初始化函数
    initDef() {
        window.history['pushState'] = createHistoryEvent('pushState');
        window.history['replaceState'] = createHistoryEvent('replaceState');
        return {
            sdkVersion: TrackerConfig.version,
        };
    }
    //设置用户id
    setUserId(uuid) {
        this.options.uuid = uuid;
    }
    //上报
    reportTracker(data) {
        const params = Object.assign(this.options, data);
        reportTracker(params, this.options.requestUrl);
    }
    //手动上报
    sendReport(data, url) {
        reportTracker(data, url);
    }
    installTracker() {
        //history模式监控pv
        if (this.options.historyTracker) {
            const startTime = Date.now();
            captureEvents(['pushState', 'replaceState', 'popstate'], 'history-pv', { startTime, stayTime: 0 });
        }
        //hash模式pv
        if (this.options.hashTracker) {
            captureEvents(['hashchange']);
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
            requestCatch('open', 'send');
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

export { Tracker as default };
