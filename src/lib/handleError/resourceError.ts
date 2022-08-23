import reportTracker from "../../utils/reportTracker";
export default function injectHandleResourceError() {
    window.addEventListener(
        "error",
        function (event: any) {
            // 监听资源加载错误
            if (!event) return;
            const target: any = event.target;
            const isElementTarget = target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement;
            if (isElementTarget) {
                const reportData = {
                    name: "resourceError",
                    type: "error", // 异常大类
                    errorType: "resourceError", // 异常具体类型
                    message: `加载${target.tagName}资源失败`, // 异常信息
                    url: event.target.src || event.target.href,
                };
                console.log(reportData);
                reportTracker(reportData);
            }
            /* true */
            return;
        },
        true
    );
}
