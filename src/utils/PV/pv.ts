//keyof 获取的是类型
export const createHistoryEvent = <T extends keyof History>(type: T) => {
    const origin = history[type];

    //this是假参数
    return function (this: any) {
        const res = origin.apply(this, arguments);

        const e = new Event(type);
        /* Event创建自定义事件
        dispatchEvent派发事件
        addEventListener监听事件
        removeEventListener删除事件
        其实也就是发布订阅模式
        */

        window.dispatchEvent(e);
        return res;
    };
};
