import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MarineCurrentResponse } from "../server/ocean/types.js";

// The real modules are used; only the upstream call is faked, and the cap is
// lowered so eviction is cheap to test.
vi.mock("../server/ocean/openMeteo.js", () => ({ fetchMarineCurrent: vi.fn() }));
vi.mock("../server/constants.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../server/constants.js")>();
  return { ...original, CACHE: { ...original.CACHE, maxEntries: 3 } };
});

const MINUTE = 60 * 1000;
const TTL = 15 * MINUTE;

function raw(current: Partial<MarineCurrentResponse["current"]> = {}): MarineCurrentResponse {
  return {
    current: {
      wave_height: 1,
      wave_direction: 270,
      wave_period: 8,
      sea_level_height_msl: 0,
      sea_surface_temperature: 18,
      ocean_current_velocity: 1,
      ocean_current_direction: 90,
      ...current,
    },
  } as MarineCurrentResponse;
}

let getMarineCurrent: typeof import("../server/ocean/cache.js").getMarineCurrent;
let upstream: ReturnType<typeof vi.fn>;

// Module state (the cache Maps) is per module instance, so each test gets a fresh one.
beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  vi.spyOn(console, "error").mockImplementation(() => {});
  ({ getMarineCurrent } = await import("../server/ocean/cache.js"));
  upstream = (await import("../server/ocean/openMeteo.js")).fetchMarineCurrent as ReturnType<typeof vi.fn>;
  upstream.mockResolvedValue(raw());
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("grid cells", () => {
  it("shares one entry between nearby coordinates", async () => {
    await getMarineCurrent({ lat: 35.04, lon: -40.04 });
    await getMarineCurrent({ lat: 35.02, lon: -39.98 });
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it("fetches the snapped cell coordinates, not the raw ones", async () => {
    await getMarineCurrent({ lat: 35.04, lon: -40.04 });
    expect(upstream).toHaveBeenCalledWith({ lat: 35, lon: -40 });
  });

  it("keeps different cells apart", async () => {
    await getMarineCurrent({ lat: 35.0, lon: -40.0 });
    await getMarineCurrent({ lat: 35.1, lon: -40.0 });
    expect(upstream).toHaveBeenCalledTimes(2);
  });
});

describe("TTL", () => {
  it("serves from memory while fresh and refetches once stale", async () => {
    const coords = { lat: 10, lon: 10 };
    await getMarineCurrent(coords);
    vi.advanceTimersByTime(TTL - 1);
    await getMarineCurrent(coords);
    expect(upstream).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    await getMarineCurrent(coords);
    expect(upstream).toHaveBeenCalledTimes(2);
  });
});

describe("in-flight dedupe", () => {
  it("shares one upstream call between concurrent requests", async () => {
    let resolve!: (value: MarineCurrentResponse) => void;
    upstream.mockReturnValue(new Promise((r) => (resolve = r)));

    const calls = Array.from({ length: 20 }, () => getMarineCurrent({ lat: 10, lon: 10 }));
    resolve(raw({ wave_height: 2 }));
    const results = await Promise.all(calls);

    expect(upstream).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r.current.wave_height === 2)).toBe(true);
  });

  it("allows a new upstream call after the previous one settled", async () => {
    upstream.mockRejectedValueOnce(new Error("down"));
    await expect(getMarineCurrent({ lat: 10, lon: 10 })).rejects.toThrow("down");
    await getMarineCurrent({ lat: 10, lon: 10 });
    expect(upstream).toHaveBeenCalledTimes(2);
  });
});

describe("hold last good values", () => {
  it("keeps the earlier value when a refetch returns null", async () => {
    const coords = { lat: 10, lon: 10 };
    upstream.mockResolvedValueOnce(raw({ wave_height: 2, wave_period: 8 }));
    await getMarineCurrent(coords);

    vi.advanceTimersByTime(TTL);
    upstream.mockResolvedValueOnce(raw({ wave_height: null, wave_period: 9 }));
    const merged = await getMarineCurrent(coords);

    expect(merged.current.wave_height).toBe(2); // held
    expect(merged.current.wave_period).toBe(9); // fresh wins
  });

  it("passes nulls through when the cell never had a good value", async () => {
    upstream.mockResolvedValueOnce(raw({ wave_height: null }));
    const result = await getMarineCurrent({ lat: 10, lon: 10 });
    expect(result.current.wave_height).toBeNull(); // normalize.ts applies the resting sea
  });
});

describe("failure", () => {
  it("serves the stale entry when the refetch fails", async () => {
    const coords = { lat: 10, lon: 10 };
    upstream.mockResolvedValueOnce(raw({ wave_height: 2 }));
    await getMarineCurrent(coords);

    vi.advanceTimersByTime(TTL);
    upstream.mockRejectedValueOnce(new Error("down"));
    const result = await getMarineCurrent(coords);

    expect(result.current.wave_height).toBe(2);
  });

  it("throws on a cold cell when upstream fails", async () => {
    upstream.mockRejectedValueOnce(new Error("down"));
    await expect(getMarineCurrent({ lat: 10, lon: 10 })).rejects.toThrow("down");
  });
});

describe("size cap (mocked to 3)", () => {
  const cell = (n: number) => ({ lat: n * 10, lon: 0 });

  it("evicts the oldest cell once the cap is exceeded", async () => {
    for (const n of [1, 2, 3, 4]) await getMarineCurrent(cell(n));
    expect(upstream).toHaveBeenCalledTimes(4);

    await getMarineCurrent(cell(4)); // still cached
    expect(upstream).toHaveBeenCalledTimes(4);

    await getMarineCurrent(cell(1)); // was evicted
    expect(upstream).toHaveBeenCalledTimes(5);
  });

  it("counts a refreshed cell as newest", async () => {
    await getMarineCurrent(cell(1)); // t=0
    vi.advanceTimersByTime(10 * MINUTE);
    await getMarineCurrent(cell(2));
    await getMarineCurrent(cell(3)); // t=10min
    vi.advanceTimersByTime(6 * MINUTE); // cell 1 stale, 2 and 3 still fresh

    await getMarineCurrent(cell(1)); // refresh -> newest
    await getMarineCurrent(cell(4)); // over cap: evicts cell 2, not cell 1
    expect(upstream).toHaveBeenCalledTimes(5);

    await getMarineCurrent(cell(1)); // fresh, kept
    await getMarineCurrent(cell(3)); // fresh, kept
    expect(upstream).toHaveBeenCalledTimes(5);

    await getMarineCurrent(cell(2)); // evicted
    expect(upstream).toHaveBeenCalledTimes(6);
  });
});
