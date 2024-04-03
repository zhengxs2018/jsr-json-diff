// deno-lint-ignore-file no-namespace

/**
 * JSON structural diff
 */
export interface JsonDiffOptions {
  /**
   * The maximum depth to traverse.
   *
   * @default 5
   */
  depth?: number | undefined;

  /**
   * `true` to ignore casing difference.
   * @default false
   */
  ignoreCase?: boolean | undefined;

  /**
   * Comparator for custom equality checks.
   */
  comparator?: JsonDiff.Comparator | undefined;
}

export class JsonDiff {
  /**
   * The maximum depth to traverse.
   *
   * @default 5
   */
  depth: number;

  /**
   * `true` to ignore casing difference.
   * @default false
   */
  ignoreCase: boolean;

  /**
   * Comparator for custom equality checks.
   */
  comparator: JsonDiff.Comparator;

  constructor(options: JsonDiffOptions = {}) {
    this.depth = options.depth || 5;
    this.ignoreCase = options.ignoreCase === true;
    this.comparator = options.comparator || defaultComparator;
  }

  /**
   * Diff json
   *
   * @param left - old json
   * @param right - new json
   * @param callback - change callback
   * @returns changes
   */
  diff(
    left: unknown,
    right?: unknown,
    callback: JsonDiff.Callback = noop
  ): JsonDiff.Change[] {
    const changes: JsonDiff.Change[] = [];

    difference(this, changes, left, right, [], 0, callback);

    return changes;
  }

  /**
   * Diff json
   *
   * @param left - old json
   * @param right - new json
   * @param callback - change callback
   * @returns changes
   */
  static diff(
    left: unknown,
    right?: unknown,
    options?: JsonDiffOptions | JsonDiff.Callback,
    callback?: JsonDiff.Callback
  ): JsonDiff.Change[] {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }

    return new JsonDiff(options).diff(left, right, callback);
  }
}

export namespace JsonDiff {
  /**
   * Change info
   */
  export type Change = {
    depth: number;
    value: unknown;
    oldValue: unknown;
    paths: (number | string)[];
    added: boolean;
    changed: boolean;
    removed: boolean;
  };

  /**
   * Change callback
   */
  export type Callback = (change: Change) => void;

  /**
   * Comparator for custom equality checks.
   */
  export type Comparator = (
    left: unknown,
    right: unknown,
    ignoreCase?: boolean | undefined
  ) => boolean;
}

export default JsonDiff;

function equals(diff: JsonDiff, left: unknown, right: unknown): boolean {
  return diff.comparator(left, right, diff.ignoreCase);
}

function difference(
  diff: JsonDiff,
  changes: JsonDiff.Change[],
  left: unknown,
  right: unknown,
  paths: (string | number)[],
  depth: number,
  callback: JsonDiff.Callback
) {
  if (left == null || depth >= diff.depth) {
    differenceValue(diff, changes, left, right, paths, depth, callback);
    return;
  }

  if (Array.isArray(left)) {
    differenceArray(diff, changes, left, right, paths, depth, callback);
    return;
  }

  if (isObject(left)) {
    differenceObject(
      diff,
      changes,
      left as Record<string, unknown>,
      right,
      paths,
      depth,
      callback
    );
    return;
  }

  differenceValue(diff, changes, left, right, paths, depth, callback);
}

function differenceValue(
  diff: JsonDiff,
  changes: JsonDiff.Change[],
  left: unknown,
  right: unknown,
  paths: (string | number)[],
  depth: number,
  callback: JsonDiff.Callback
) {
  const change: JsonDiff.Change = {
    depth: depth,
    value: left,
    oldValue: null,
    paths: paths,
    added: false,
    changed: false,
    removed: false,
  };

  changes.push(change);

  // Added
  if (left == null) {
    if (right == null) return;

    change.value = right;
    change.oldValue = left;
    change.added = true;

    callback(change);
    return;
  }

  // Removed
  if (right == null) {
    if (left == null) return;

    change.value = right;
    change.oldValue = left;
    change.removed = true;

    callback(change);

    return;
  }

  // Changed
  if (!equals(diff, left, right)) {
    change.value = right;
    change.oldValue = left;
    change.changed = true;
    callback(change);
  }
}

function isObject(value: unknown): value is object {
  // Skip non-user created objects such as Set, Map, etc.
  return Object.prototype.toString.call(value) === "[object Object]";
}

function differenceObject(
  diff: JsonDiff,
  changes: JsonDiff.Change[],
  left: Record<string, unknown>,
  right: unknown,
  paths: (string | number)[],
  depth: number,
  cb: JsonDiff.Callback
) {
  // Skip non-object processing
  if (!right || !isObject(right) || Array.isArray(right)) {
    differenceValue(diff, changes, left, right, paths, depth, cb);
    return;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right as Record<string, unknown>);

  const keys = new Set([...leftKeys, ...rightKeys]);

  // Skip empty object
  if (keys.size === 0) {
    differenceValue(diff, changes, left, right, paths, depth, cb);
    return;
  }

  keys.forEach((key) => {
    difference(
      diff,
      changes,
      left[key],
      (right as Record<string, unknown>)[key],
      paths.concat(key),
      depth + 1,
      cb
    );
  });
}

function differenceArray(
  diff: JsonDiff,
  changes: JsonDiff.Change[],
  left: unknown[],
  right: unknown,
  paths: (string | number)[],
  depth: number,
  callback: JsonDiff.Callback
) {
  // Skip non-array processing
  if (!right || !Array.isArray(right)) {
    differenceValue(diff, changes, left, right, paths, depth, callback);
    return;
  }

  const size = Math.max(left.length, (right as unknown[]).length);

  // Skip empty array
  if (size === 0) {
    differenceValue(diff, changes, left, right, paths, depth, callback);
    return;
  }

  for (let i = 0; i < size; i++) {
    difference(
      diff,
      changes,
      left[i],
      (right as unknown[])[i],
      paths.concat(i),
      depth + 1,
      callback
    );
  }
}

function noop() {}

// TODO Support {} === {}?
function defaultComparator(
  left: unknown,
  right: unknown,
  ignoreCase?: boolean | undefined
) {
  if (typeof left === "string") {
    if (typeof right === "string") {
      // 'A' === 'a'
      if (ignoreCase) {
        return left.toLowerCase() === right.toLowerCase();
      }
      return left === right;
    }

    return false;
  }

  if (Array.isArray(left)) {
    // [1, 2] === [1, 2]
    return Array.isArray(right)
      ? JSON.stringify(left.sort()) === JSON.stringify(right.sort())
      : false;
  }

  return Object.is(left, right);
}
