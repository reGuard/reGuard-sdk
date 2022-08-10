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
        /* Event创建自定必事件
        dispatchEvent派发事件
        addEventListener监听事件
        emoveEventListener删除事件
        其实也就是发布阅模式
        */
        window.dispatchEvent(e);
        return res;
    };
};

class Tracker {
    constructor(options) {
        this.data = Object.assign(this.initDef(), options);
        this.installTracker();
    }
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
                console.log('监听到了');
                this.reportTracker({ item, targetKey, data });
            });
        });
    }
    //设置用户id
    setUserId(uuid) {
        this.data.uuid = uuid;
    }
    //监听接口
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
    installTracker() {
        if (this.data.historyTracker) {
            this.captureEvents(['pushState', 'replaceState', 'popstate'], 'history-pv');
        }
        if (this.data.hashTracker) {
            this.captureEvents(['hashchange'], 'hash-pv');
        }
    }
}

export { Tracker as default };
