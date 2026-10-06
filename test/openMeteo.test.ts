import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMarineCurrent, fetchWeatherDetail } from "../server/ocean/openMeteo.js";

afterEach(() => vi.unstubAllGlobals());

describe("Open-Meteo upstream requests", () => {
  it.each([
    [fetchMarineCurrent, "https://marine-api.open-meteo.com/v1/marine",
      "wave_height,wave_direction,wave_period,sea_level_height_msl,sea_surface_temperature,ocean_current_velocity,ocean_current_direction"],
    [fetchWeatherDetail, "https://api.open-meteo.com/v1/forecast",
      "temperature_2m,precipitation,is_day,wind_speed_10m,cloud_cover,snowfall"],
  ] as const)("uses the correct endpoint and current variables (%#)", async (fetchCurrent, endpoint, variables) => {
    const payload = { current: { temperature_2m: null, is_day: 0 } };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload)));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchCurrent({ lat: 35, lon: -40 })).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url.origin + url.pathname).toBe(endpoint);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      latitude: "35", longitude: "-40", current: variables,
    });
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([fetchMarineCurrent, fetchWeatherDetail])("rejects upstream HTTP errors (%#)", async (fetchCurrent) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));
    await expect(fetchCurrent({ lat: 35, lon: -40 })).rejects.toThrow("Open-Meteo responded 503");
  });

  it("propagates weather network failures to its future caller", async () => {
    const failure = new TypeError("network unavailable");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(failure));
    await expect(fetchWeatherDetail({ lat: 35, lon: -40 })).rejects.toBe(failure);
  });
});
