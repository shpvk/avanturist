import assert from "node:assert/strict";
import test, { beforeEach, afterEach } from "node:test";

import { attachWheelRotation } from "../app/_hero-model/hero-scene.ts";

/** Minimal stand-ins for the browser pieces the wheel handler touches. */
function createHarness() {
  const canvas = new EventTarget();
  const pageListeners = new Map();
  const frames = [];
  let rotation = 0;
  let renders = 0;

  globalThis.window = {
    addEventListener: (type, listener) => pageListeners.set(type, listener),
    removeEventListener: (type) => pageListeners.delete(type),
  };
  globalThis.requestAnimationFrame = (callback) => frames.push(callback);
  globalThis.cancelAnimationFrame = () => {};

  const controls = { rotateLeft: (angle) => { rotation += angle; }, update: () => {} };
  const detach = attachWheelRotation(canvas, controls, () => { renders += 1; });

  return {
    canvas,
    detach,
    get rotation() { return rotation; },
    get renders() { return renders; },
    scrollPage: () => pageListeners.get("scroll")?.(),
    wheel: (init = {}) => {
      const event = Object.assign(new Event("wheel", { cancelable: true }), { deltaY: 120, deltaMode: 0, ctrlKey: false, metaKey: false }, init);
      canvas.dispatchEvent(event);
      return event;
    },
    /** Drain the eased rotation until the animation settles. */
    flush: () => {
      for (let guard = 0; guard < 500 && frames.length > 0; guard += 1) frames.shift()();
    },
  };
}

let harness;

beforeEach(() => {
  harness = createHarness();
});

afterEach(() => {
  harness.detach();
  delete globalThis.window;
  delete globalThis.requestAnimationFrame;
  delete globalThis.cancelAnimationFrame;
});

test("one wheel notch turns the model by a readable angle", () => {
  harness.wheel({ deltaY: 120 });
  harness.flush();
  // 120px * 0.0022 rad/px ≈ 15°.
  assert.equal(Math.abs(harness.rotation - 0.264) < 0.001, true);
  assert.equal(harness.renders > 1, true, "the eased rotation renders more than once");
});

test("scrolling the wheel the other way turns the model back", () => {
  harness.wheel({ deltaY: -120 });
  harness.flush();
  assert.equal(harness.rotation < 0, true);
});

test("the wheel gesture takes over the page scroll while it is over the model", () => {
  assert.equal(harness.wheel().defaultPrevented, true);
});

test("line and page wheel modes are normalised, and flings are clamped", () => {
  harness.wheel({ deltaY: 3, deltaMode: 1 });
  harness.flush();
  assert.equal(Math.abs(harness.rotation - 48 * 0.0022) < 0.001, true);

  const clamped = createHarness();
  clamped.wheel({ deltaY: 5000 });
  clamped.flush();
  assert.equal(Math.abs(clamped.rotation - 180 * 0.0022) < 0.001, true);
  clamped.detach();
});

test("ctrl+wheel stays the browser's zoom gesture", () => {
  const event = harness.wheel({ ctrlKey: true });
  harness.flush();
  assert.equal(event.defaultPrevented, false);
  assert.equal(harness.rotation, 0);
});

test("a wheel that arrives mid page scroll keeps scrolling the page", () => {
  harness.scrollPage();
  const event = harness.wheel();
  harness.flush();
  assert.equal(event.defaultPrevented, false);
  assert.equal(harness.rotation, 0);
});

test("detaching stops the model from reacting to the wheel", () => {
  harness.detach();
  const event = harness.wheel();
  harness.flush();
  assert.equal(event.defaultPrevented, false);
  assert.equal(harness.rotation, 0);
});
