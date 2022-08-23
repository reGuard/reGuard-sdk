//接口异常采集
import reportTracker from "../../utils/reportTracker";
export default function injectHandleResourceError() {
    let temp = {
        url: "",
        method: "",
    };

    let XMLHttpRequest = window.XMLHttpRequest;

    // 记录旧的open方法
    let oldOpen = XMLHttpRequest.prototype.open;
    // 重写open方法
    XMLHttpRequest.prototype.open = function (method: string, url: any, async: boolean = true, username?: string, password?: string) {
        temp.url = url;
        temp.method = method;
        return oldOpen.apply(this, [method, url, async, username, password]);
    };

    // 记录旧的send方法并重写
    let oldSend = XMLHttpRequest.prototype.send;
    let startTime: number;
    XMLHttpRequest.prototype.send = function (body) {
        if (temp.url) {
            startTime = Date.now();

            let handler = (eventType: string) => () => {
                let duration = Date.now() - startTime;
                console.log(this);
                const reportData = {
                    type: "xhr",
                    eventType: eventType, // 事件类型
                    path: temp.url, // 请求路径
                    method: temp.method, // 请求方法
                    status: this.status + "-" + this.statusText, // 状态码
                    duration: duration, // 耗费时间
                    response: this.response ? JSON.stringify(this.response) : "",
                    param: body || "",
                };
                console.log(reportData);
                reportTracker(reportData);
            };

            // 监听load、error、abort事件
            this.addEventListener("load", handler("load"), false); // load 事件表示服务器传来的数据接收完毕
            this.addEventListener("error", handler("error"), false); // error 事件表示请求出错
            this.addEventListener("abort", handler("abort"), false); // abort 事件表示请求被中断（比如用户取消请求）
        }

        return oldSend.apply(this, [body]);
    };
}
