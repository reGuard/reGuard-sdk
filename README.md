<div align="center">
    <img src="./res/logo.png">
    <p> a flexible front-end monitor SDK </p>
    
</div>
<img alt="left" src="https://img.shields.io/npm/v/reguard-sdk?style=flat-square">
<hr>

[简体中文](https://github.com/reGuard/reGuard-sdk/blob/main/README_zh.md) **English**

## Quick Start

1. Dependencies

```bash
npm install --save reguard-sdk
```

2. Import sdk

<details>
<summary> ESM </summary><br>

```

import { MonitorJS } from "reguard-sdk";

```
</details>

<details>
<summary> Script </summary><br>

```

<script src="../node_modules/reguard-sdk/index.min.js"></script>

```
</details>

3. Initialization

```javascript
new Tracker({
    uuid: '', //uuid
    historyTracker: true, //history report
    requestUrl: '', // request url
    FPTracker: true, // FP Tracker
    FCPTracker: true, //FCP Tracker
    DOMTracker: true, //DOM Tracker
    jsError: true, //js Error Tracker
    resourceError: true, //resource Tracker
    screenTracker: true, //White screen Tracker
    performanceIndex: true, // Browser performance Tracker
    requestTracker: true, //request Tracker
});

```

## Others

| Name      | Description |
| ----------- | ----------- |
| [reGuard-server](https://github.com/reGuard/reGuard-server)   |    Data Server     |
| [reGuard-admin-react](https://github.com/reGuard/reGuard-admin-react)      | Monitor with React       |
| [reGuard-admin-vue](https://github.com/reGuard/reGuard-admin-vue)   | Monitor with Vue        |

## License

[MIT](https://github.com/reGuard/reGuard-sdk/blob/main/LICENSE)