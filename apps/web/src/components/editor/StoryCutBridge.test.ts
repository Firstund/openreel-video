import { describe, expect, it } from "vitest";
import { readStoryCutLink } from "./StoryCutBridge";

describe("readStoryCutLink", () => {
  it("reads a same-origin story-cut link", () => {
    const link = readStoryCutLink("#/editor?storycut=20261126-160401-2f82&sclite=1");
    expect(link?.job).toBe("20261126-160401-2f82");
    expect(link?.lite).toBe(true);
    expect(link?.base.endsWith("/storycut/")).toBe(true);
  });
  it("accepts an explicit http(s) base and adds the trailing slash", () => {
    const link = readStoryCutLink("#/editor?storycut=abc&scbase=" + encodeURIComponent("http://192.168.0.5:8765"));
    expect(link?.base).toBe("http://192.168.0.5:8765/");
    expect(link?.lite).toBe(false);
  });
  it("ignores other links and unsafe values", () => {
    expect(readStoryCutLink("#/editor")).toBeNull();
    expect(readStoryCutLink("#/editor?storycut=../../x")).toBeNull();
    expect(readStoryCutLink("#/editor?storycut=abc&scbase=" + encodeURIComponent("javascript:alert(1)"))).toBeNull();
  });
});
