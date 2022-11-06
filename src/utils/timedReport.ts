import { MAX_CACHE_COUNT, MAX_WAITING_TIME } from './constant';
import defaultReport from './defaultReport';

let reportDatas = [];
let timer = null; // 定时器

/**
 * 可以理解为异步执行
 * requestIdleCallback 是浏览器空闲时会自动执行内部函数
 * requestAnimationFrame 是浏览器必须执行的
 * 关于 requestIdleCallback 和  requestAnimationFrame 可以参考 https://www.cnblogs.com/cangqinglang/p/13877078.html
 */
const nextTime = window.requestIdleCallback || window.requestAnimationFrame || ((callback) => setTimeout(callback, 17));

function send(url: string) {
  if (reportDatas.length) {
    const datas = reportDatas.slice(0, MAX_CACHE_COUNT); // 需要上报的数据
    reportDatas = reportDatas.slice(MAX_CACHE_COUNT); // 剩下的待上报数据
    defaultReport(datas, url);

    if (reportDatas.length) {
      nextTime(send as any); // 继续上报剩余内容,在下一个时间择机传输
    }
  }
}

export default function timedReport(params: any, url: string) {
  reportDatas.push(params);
  clearTimeout(timer);

  reportDatas.length >= MAX_CACHE_COUNT
    ? send(url)
    : (timer = setTimeout(() => {
        send(url);
      }, MAX_WAITING_TIME));
}
