import { describe, expect, it } from "vitest";
import { formatLifeDate, lifeDateSortKey, toLifeDate, validateLifeDate } from "./life-date";

describe("LifeDate date precision", () => {
  it("never invents a precise date for approximate and unknown memories", () => {
    expect(toLifeDate("unknown", "")).toEqual({ precision: "unknown" });
    expect(toLifeDate("approximate", "毕业后的夏天")).toEqual({ precision: "approximate", originalText: "毕业后的夏天" });
    expect(formatLifeDate({ precision: "unknown" })).toBe("时间未知");
    expect(formatLifeDate({ precision: "approximate", originalText: "高中时" })).toBe("高中时");
  });

  it("validates calendar dates and precision", () => {
    expect(validateLifeDate({ precision: "day", iso: "2024-02-29" })).toBeNull();
    expect(validateLifeDate({ precision: "day", iso: "2023-02-29" })).not.toBeNull();
    expect(validateLifeDate({ precision: "year", iso: "2018-08" })).not.toBeNull();
    expect(validateLifeDate({ precision: "month", iso: "2018-08" })).toBeNull();
    expect(validateLifeDate({ precision: "unknown", iso: "2025" })).not.toBeNull();
    expect(validateLifeDate({ precision: "approximate", originalText: "" })).not.toBeNull();
  });

  it("places unknown dates after known years in descending sort", () => {
    expect(lifeDateSortKey({ precision: "year", iso: "2018" }).localeCompare(lifeDateSortKey({ precision: "unknown" }))).toBeGreaterThan(0);
  });
});
