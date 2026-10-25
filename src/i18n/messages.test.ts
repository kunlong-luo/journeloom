import { describe, expect, it } from "vitest";
import { filterEvents, messages } from "@/i18n/messages";

describe("bilingual timeline preview", () => {
  it("has the same four illustrative events in each locale", () => {
    expect(messages.zh.events).toHaveLength(4);
    expect(messages.en.events).toHaveLength(4);
    expect(messages.zh.events.map((event) => event.year)).toEqual(messages.en.events.map((event) => event.year));
  });

  it("filters demo events by category without mutating source data", () => {
    const source = messages.zh.events;
    expect(filterEvents(source, "all")).toHaveLength(4);
    expect(filterEvents(source, "growth").map((event) => event.year)).toEqual(["2025", "2011"]);
    expect(filterEvents(source, "milestone").map((event) => event.year)).toEqual(["2018"]);
    expect(source).toHaveLength(4);
  });
});
