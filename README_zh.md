<div align="center">
    <img src="./res/logo.png">
    <p> 轻量级无侵入式的前端埋点监控SDK </p>
    
</div>
<img alt="left" src="https://img.shields.io/npm/v/reguard-sdk?style=flat-square">
<hr>

**简体中文** [English](https://github.com/reGuard/reGuard-sdk/blob/main/README.md) 

## 快速开始

1. 安装依赖

```bash
npm install --save reguard-sdk
```

2. 引入依赖

<details>
<summary> ESM </summary><br>

```

import { Tracker } from "reguard-sdk";

```
</details>

<details>
<summary> Script </summary><br>

```

<script src="../node_modules/reguard-sdk/index.min.js"></script>

```
</details>

3. 初始化

```javascript
new Tracker({
    uuid: '', //uuid
    historyTracker: true, //history上报
    requestUrl: '', //上报url
    FPTracker: true, //FP监控
    FCPTracker: true, //FCP监控
    DOMTracker: true, //DOM监控
    jsError: true, //js错误监控
    resourceError: true, //资源加载监控
    screenTracker: true, //白屏监控
    performanceIndex: true, //浏览器表现行为监控
    requestTracker: true, //请求监控
});

```

## 相关仓库

| Name      | Description |
| ----------- | ----------- |
| [reGuard-server](https://github.com/reGuard/reGuard-server)   |    数据后台API     |
| [reGuard-admin-react](https://github.com/reGuard/reGuard-admin-react)      | React版本的数据监控中台       |
| [reGuard-admin-vue](https://github.com/reGuard/reGuard-admin-vue)   | Vue版本的数据监控中台        |

## 许可

[MIT](https://github.com/reGuard/reGuard-sdk/blob/main/LICENSE)