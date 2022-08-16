import Vue from "vue";

export default function injectHandleVueError() {
    if (!Vue) return;
    Vue.config.errorHandler = (error, vm, info) => {
        try {
        } catch (err) {
            console.log("资源加载收集异常", err);
        }
    };
}
