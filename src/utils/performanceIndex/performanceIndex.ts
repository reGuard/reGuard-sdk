// 兼容性判断
const compatibility = {
    performance: !!window.performance,
    getEntriesByType: !!(window.performance && performance.getEntriesByType),
};

function handleNavigationTiming() {
    if (compatibility.getEntriesByType) {
        setTimeout(() => {
            const perfEntries: any = performance.getEntriesByType("navigation");

            const { fetchStart, connectStart, connectEnd, requestStart, responseStart, responseEnd, domInteractive, domComplete, redirectEnd, secureConnectionStart, redirectStart, domContentLoadedEventStart, domContentLoadedEventEnd, loadEventStart, domainLookupEnd, domainLookupStart } = perfEntries[0] || performance.timing;

            const redirectTime: number = redirectEnd - redirectStart; // 重定向耗时
            const appCache: number = domainLookupStart - fetchStart; // 读取缓存耗时
            const DNSTime: number = domainLookupEnd - domainLookupStart; // DNS域名解析耗时
            const connectTime: number = connectEnd - connectStart; // 建立TCP连接耗时
            const SSLTime: number = connectEnd - secureConnectionStart; // SSL 安全连接耗时
            const ttfbTime: number = requestStart - requestStart; // 发出页面请求到接收到应答数据第一个字节所花费的毫秒数
            const responseTime: number = responseEnd - responseStart; // 请求响应完全接收耗时
            const domContentLoadedTime: number = domContentLoadedEventEnd - domContentLoadedEventStart; // DOMContentLoaded事件回调函数执行耗时
            const parseDOMTime: number = domComplete - domInteractive; // DOM解析的耗时
            const resourceTime: number = domComplete - domContentLoadedEventEnd; // 资源加载耗时
            const timeToInteractive: number = domInteractive - fetchStart; // 首次可交互耗时
            const completeLoadTime: number = loadEventStart - fetchStart; // 完整的加载耗时

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

export default function init() {
    if (document.readyState === "complete") {
        if (compatibility.performance) handleNavigationTiming();
    } else {
        window.addEventListener("load", () => {
            if (compatibility.performance) handleNavigationTiming();
        });
    }
}
