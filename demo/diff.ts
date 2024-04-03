import { JsonDiff } from "../mod.ts";

const left = { a: 1, b: [2], c: -0, d: 1 };
const right = { a: 1, b: [1, 2, 3], c: 0 };

// console.log(new JsonDiff().diff(left, undefined));
// console.log(new JsonDiff().diff(left, null));
// console.log(new JsonDiff().diff(left, true));
// console.log(new JsonDiff().diff(left, ""));
// console.log(new JsonDiff().diff(left, 1));

// console.log(new JsonDiff().diff(left, new Set()));
// console.log(new JsonDiff().diff(left, new Map()));

console.log(new JsonDiff().diff(left, right));
// console.log(new JsonDiff().diff(left, [right]));
// console.log(new JsonDiff().diff([left], right));
// console.log(new JsonDiff().diff([left], [right]));
