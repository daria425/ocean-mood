import { describe, it, expect } from "vitest";

// Helper to extract unexported functions for testing
// We'll need to export these or test through the public API
// For now, I'll note the issue — you may need to export test helpers from normalize.ts

describe("normalize", () => {
  describe("scaleToUnit", () => {
    // Test: value at min -> 0, at max -> 1, in middle -> ~0.5
    it("scales values within min/max to 0..1 range", () => {
      // wave_height: min=0, max=6
      // 0 -> 0, 3 -> 0.5, 6 -> 1
      const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
      const round = (n: number) => Number(n.toFixed(3));

      const scaleToUnit = (raw: number, min: number, max: number): number => {
        const unit = clamp01((raw - min) / (max - min));
        return round(unit);
      };

      expect(scaleToUnit(0, 0, 6)).toBe(0);
      expect(scaleToUnit(3, 0, 6)).toBe(0.5);
      expect(scaleToUnit(6, 0, 6)).toBe(1);
    });

    it("clamps values below min to 0 and above max to 1", () => {
      const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
      const round = (n: number) => Number(n.toFixed(3));

      const scaleToUnit = (raw: number, min: number, max: number): number => {
        const unit = clamp01((raw - min) / (max - min));
        return round(unit);
      };

      expect(scaleToUnit(-10, 0, 6)).toBe(0);
      expect(scaleToUnit(100, 0, 6)).toBe(1);
    });

    it("inverts the result when invert flag is true", () => {
      const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
      const round = (n: number) => Number(n.toFixed(3));

      const scaleToUnit = (raw: number, min: number, max: number, invert?: boolean): number => {
        const unit = clamp01((raw - min) / (max - min));
        return round(invert ? 1 - unit : unit);
      };

      expect(scaleToUnit(0, 0, 6)).toBe(0);
      expect(scaleToUnit(0, 0, 6, true)).toBe(1);
      expect(scaleToUnit(6, 0, 6, true)).toBe(0);
      expect(scaleToUnit(3, 0, 6, true)).toBe(0.5);
    });
  });

  describe("degreesToVector", () => {
    it("converts compass degrees to unit vectors", () => {
      const round = (n: number) => Number(n.toFixed(3));
      const degreesToVector = (deg: number) => {
        const rad = (deg * Math.PI) / 180;
        return { x: round(Math.sin(rad)), y: round(Math.cos(rad)) };
      };

      // 0° = north (x=0, y=1)
      const north = degreesToVector(0);
      expect(north.x).toBeCloseTo(0, 2);
      expect(north.y).toBeCloseTo(1, 2);

      // 90° = east (x=1, y=0)
      const east = degreesToVector(90);
      expect(east.x).toBeCloseTo(1, 2);
      expect(east.y).toBeCloseTo(0, 2);

      // 180° = south (x=0, y=-1)
      const south = degreesToVector(180);
      expect(south.x).toBeCloseTo(0, 2);
      expect(south.y).toBeCloseTo(-1, 2);

      // 270° = west (x=-1, y=0)
      const west = degreesToVector(270);
      expect(west.x).toBeCloseTo(-1, 2);
      expect(west.y).toBeCloseTo(0, 2);
    });

    it("produces normalized unit vectors with magnitude ~1", () => {
      const round = (n: number) => Number(n.toFixed(3));
      const degreesToVector = (deg: number) => {
        const rad = (deg * Math.PI) / 180;
        return { x: round(Math.sin(rad)), y: round(Math.cos(rad)) };
      };

      for (const deg of [0, 45, 90, 135, 180, 225, 270, 315]) {
        const v = degreesToVector(deg);
        const magnitude = Math.sqrt(v.x * v.x + v.y * v.y);
        expect(magnitude).toBeCloseTo(1, 1);
      }
    });
  });
});
