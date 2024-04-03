# jsr:@zhengxs/json-diff

比对 JSON 数据的差异，主要解决以下场景的需求：

1. 存储在 localStorage，并且跨浏览器标签页同步数据。
2. 后台存储配置，并且需要在合并数据。

> [!IMPORTANT]  
> 通常 lodash 的 [\_.merge()][merge] 或 [\_.mergeWith()][mergewith] 可以满足绝大部分需求，只有在特殊场景下才需要使用 JsonDiff。

## 安装

主要发布到 [jsr.io](https://jsr.io/) 平台，非传统 NPM 项目。

```sh
# deno
$ deno add @zhengxs/json-diff

# npm (one of the below, depending on your package manager)
$ npx jsr add @zhengxs/json-diff

$ yarn dlx jsr add @zhengxs/json-diff

$ pnpm dlx jsr add @zhengxs/json-diff

$ bunx jsr add @zhengxs/json-diff
```

详见 [Using packages](https://jsr.io/docs/using-packages).

### 使用

```js
import { JsonDiff } from "jsr:@zhengxs/json-diff";

const left = { a: 1, b: [2], c: -0, d: 1 };
const right = { a: 1, b: [1, 2, 3], c: 0 };

JsonDiff.diff(left, right);
```

输出:

```json
[
  {
    "depth": 1,
    "value": 1,
    "oldValue": null,
    "paths": ["a"],
    "added": false,
    "changed": false,
    "removed": false
  },
  {
    "depth": 2,
    "value": 1,
    "oldValue": 2,
    "paths": ["b", 0],
    "added": false,
    "changed": true,
    "removed": false
  },
  {
    "depth": 2,
    "value": 2,
    "paths": ["b", 1],
    "added": true,
    "changed": false,
    "removed": false
  },
  {
    "depth": 2,
    "value": 3,
    "paths": ["b", 2],
    "added": true,
    "changed": false,
    "removed": false
  },
  {
    "depth": 1,
    "value": 0,
    "oldValue": 0,
    "paths": ["c"],
    "added": false,
    "changed": true,
    "removed": false
  },
  {
    "depth": 1,
    "oldValue": 1,
    "paths": ["d"],
    "added": false,
    "changed": false,
    "removed": true
  }
]
```

### 搭配 lodash 使用

通常 lodash 的 [\_.merge()][merge] 或 [\_.mergeWith()][mergewith] 可以满足绝大部分需求，只有在特殊场景下才需要使用 JsonDiff。

```ts
import _ from "https://esm.sh/lodash-es@4.17.21";

import { JsonDiff } from "jsr:@zhengxs/json-diff";

const userConfig = {
  gate: {
    showTokenExpired: true,
    showUpgradeModel: {
      interval: 15000,
    },
  },
  telemetry: {
    enable: true,
    dsn: "/trace/spans",
    events: ["pv", "mc"],
    resources: {
      sessionId: "4LxHaV0ucE/cnTs9CGY6mdeYWcHTm2bzq19adajgaC8=",
    },
  },
};

const localConfig = {
  gate: {
    showUpgradeModel: false,
  },
  telemetry: {
    enable: false,
    events: ["pv"],
  },
};

JsonDiff.diff(userConfig, localConfig, { depth: 2 }, (change) => {
  // 如果是新增或者变更
  if (change.added || change.changed) {
    _.set(userConfig, change.paths, change.value);
  } else if (change.removed) {
    // 也可以使用 unset
    _.remove(userConfig, change.paths);
  }
});

console.log(userConfig);
// {
//   gate: { showTokenExpired: true, showUpgradeModel: false },
//   telemetry: {
//     enable: false,
//     dsn: "/trace/spans",
//     events: [ "pv" ],
//     resources: { sessionId: "4LxHaV0ucE/cnTs9CGY6mdeYWcHTm2bzq19adajgaC8=" }
//   }
// }
```

## License

- MIT

[merge]: https://lodash.com/docs/4.17.15#merge
[mergeWith]: https://lodash.com/docs/4.17.15#mergeWith
