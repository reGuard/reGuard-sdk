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
            if (entry.name === 'first-paint') {
                observer.disconnect();
                console.log('FPtime', entry.startTime);
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

function DOMTracker() {
    document.addEventListener('DOMContentLoaded', function () {
        console.log('DOMReady: True', new Date());
    });
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
function reportTracker(params) {
    let headers = {
        type: 'application/x-www-form-urlencoded'
    };
    //封装blob
    let blob = new Blob([JSON.stringify(params)], headers);
    navigator.sendBeacon('http://localhost:9000/tracker', blob);
}

class Tracker {
    constructor(options) {
        this.MouseEventList = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseup', 'mouseenter', 'mouseout', 'mouseover'];
        this.data = Object.assign(this.initDef(), options);
        this.installTracker();
    }
    //初始化函数
    initDef() {
        window.history['pushState'] = createHistoryEvent('pushState');
        window.history['replaceState'] = createHistoryEvent('replaceState');
        return {
            sdkVersion: TrackerConfig.version,
            historyTracker: false,
            hashTracker: false,
            domTracker: false,
            jsError: false
        };
    }
    //targetKey自定义 例如history-pv
    captureEvents(mouseEventList, targetKey, data) {
        mouseEventList.forEach(item => {
            window.addEventListener(item, () => {
                console.log('监听到了pv');
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
            type: 'application/x-www-form-urlencoded'
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
        this.MouseEventList.forEach(ev => {
            window.addEventListener(ev, (e) => {
                const target = e.target;
                const targetKey = target.getAttribute('target-key');
                if (targetKey) {
                    console.log({
                        event: ev,
                        target: targetKey
                    }, '监听到了');
                    this.reportTracker({
                        event: ev,
                        target: targetKey
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
    //promise错误
    promistReject() {
        window.addEventListener('unhandledrejection', (event) => {
            //通过catch捕获错误
            event.promise.catch(error => {
                this.reportTracker({
                    event: 'promise',
                    targetkey: 'reject',
                    message: error
                });
            });
        });
    }
    jsError() {
        this.errorEvent();
        this.promistReject();
    }
    installTracker() {
        if (this.data.DOMTracker) {
            DOMTracker();
        }
        //history模式监控
        if (this.data.historyTracker) {
            this.captureEvents(['pushState', 'replaceState', 'popstate'], 'history-pv');
        }
        //hash模式
        if (this.data.hashTracker) {
            this.captureEvents(['hashchange'], 'hash-pv');
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
        if (this.data.requestTracker) {
            requestCatch('open', 'send');
            //上报
        }
    }
}

module.exports = Tracker;
