import { describe, it, expect } from "vitest";
import { parseCoords } from "../server/ocean/coords.js";

describe("parseCoords", () => {
  it("accepts valid coordinates", () => {
    expect(parseCoords("35.5", "-40.25")).toEqual({
      lat: 35.5,
      lon: -40.25,
    });
  });

  it("rejects missing or undefined coordinates", () => {
    expect(parseCoords(undefined, "0")).toBeNull();
    expect(parseCoords("0", undefined)).toBeNull();
    expect(parseCoords(undefined, undefined)).toBeNull();
  });

  it("rejects non-numeric strings", () => {
    expect(parseCoords("abc", "0")).toBeNull();
    expect(parseCoords("0", "xyz")).toBeNull();
    expect(parseCoords("35.5.5", "40")).toBeNull();
  });

  it("rejects latitude outside -90..90", () => {
    expect(parseCoords("91", "0")).toBeNull();
    expect(parseCoords("-91", "0")).toBeNull();
    expect(parseCoords("90.1", "0")).toBeNull();
  });

  it("rejects longitude outside -180..180", () => {
    expect(parseCoords("0", "181")).toBeNull();
    expect(parseCoords("0", "-181")).toBeNull();
    expect(parseCoords("0", "180.1")).toBeNull();
  });

  it("accepts boundary coordinates", () => {
    expect(parseCoords("90", "180")).toEqual({ lat: 90, lon: 180 });
    expect(parseCoords("-90", "-180")).toEqual({ lat: -90, lon: -180 });
    expect(parseCoords("0", "0")).toEqual({ lat: 0, lon: 0 });
  });
});
