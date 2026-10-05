import { Hono } from "hono";
import { CACHE } from "../constants.js";
import { cacheControl } from "../middleware/cacheControl.js";
import { parseCoords } from "./coords.js";
import { getMarineCurrent } from "./cache.js";
import { toOceanResponse } from "./normalize.js";

// A small Hono app of its own, mounted into the main app with app.route().
export const ocean = new Hono();

// Runs for every request to this sub-app, wrapping the handler below.
ocean.use("*", cacheControl(CACHE.browserMaxAgeSec));

ocean.get("/", async (c) => {
  // c.req.query('name') reads ?name=... from the URL (string or undefined).
  const coords = parseCoords(c.req.query("lat"), c.req.query("lon"));
  if (!coords) {
    return c.json(
      { error: "lat (-90..90) and lon (-180..180) are required numbers" },
      400,
    );
  }

  try {
    const oceanData = await getMarineCurrent(coords);
    return c.json(toOceanResponse(oceanData));
  } catch (err) {
    console.error("ocean fetch failed:", err);
    return c.json({ error: "Ocean API unavailable" }, 502);
  }
});
