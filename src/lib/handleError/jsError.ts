export default function injectHandleJsError() {
    window.addEventListener("error", function (event) {
        // 监听语法、引用等js错误
        const reportData = {
            kind: "stability", // 稳定性指标
            type: "error", // 异常大类
            errorType: "jsError", // 异常具体类型
            message: event.message, // 异常信息
            fileName: event.filename, // 异常文件
            position: (event.lineno || 0) + ":" + (event.colno || 0), // 异常位置
        };

        console.log("jsError", reportData);
    });

    window.addEventListener("unhandledrejection", function (event) {
        // 监听未被catch的promise错误
        const reportData = {
            kind: "stability", // 稳定性指标
            type: "error",
            errorType: "promiseError",
            message: "",
            fileName: "",
            position: "",
        };

        if (event.reason instanceof Error) {
            // promise的回调中发生了错误 或是 reject了一个Error的实例
            reportData.message = event.reason.message;
        } else {
            // reject了字符串等其他内容
            reportData.message = event.reason;
        }

        console.log("promiseError", reportData);
    });
}
