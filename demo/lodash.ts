import _ from "https://esm.sh/lodash-es@4.17.21";

import { JsonDiff } from "../mod.ts";

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
  if (change.added || change.changed) {
    _.set(userConfig, change.paths, change.value);
  } else if (change.removed) {
    _.remove(userConfig, change.paths);
  }
});

console.log(userConfig);
