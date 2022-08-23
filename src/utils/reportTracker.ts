import defaultReport from "./defaultReport";
import timedReport from "./timedReport";

function reportTracker(params: any, url: string | undefined = undefined) {
    const options = JSON.parse(localStorage.getItem("options")!);
    url = !!url ? url : options.requestUrl;

    if (options.reportType == "timed") {
        // 定时上报
        timedReport(params, url);
    } else {
        defaultReport(params, url);
    }
}

export default reportTracker;
