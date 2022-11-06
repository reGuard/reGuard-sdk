import { UserBehavior } from '../../type/index';

//keyof 获取的是类型
export const createHistoryEvent = <T extends keyof History>(type: T) => {
  const origin = window.history[type];

  //this是假参数
  return function (this: any) {
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
export function captureEvents<T extends UserBehavior>(mouseEventList: string[], targetKey: string, data?: T) {
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
