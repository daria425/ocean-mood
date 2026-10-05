import { OPEN_METEO, OUTPUT_DECIMALS, RESTING_SEA, VARIABLE_SPECS } from '../constants.js';
import { VARIABLES_TO_PARAMS_MAP, type ParamName } from '../mapping.js';
import type {
  MarineCurrentResponse,
  OceanResponse,
  OceanVariable,
  ParamValue,
  VariableSpec,
  Vector,
} from './types.js';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const round = (n: number) => Number(n.toFixed(OUTPUT_DECIMALS));

function scaleToUnit(raw: number, spec: Extract<VariableSpec, { kind: 'scalar' }>): number {
  const unit = clamp01((raw - spec.min) / (spec.max - spec.min));
  return round(spec.invert ? 1 - unit : unit);
}

// Compass degrees (0 = north) -> unit vector, x east, y north.
function degreesToVector(deg: number): Vector {
  const rad = (deg * Math.PI) / 180;
  return { x: round(Math.sin(rad)), y: round(Math.cos(rad)) };
}

function toParamValue(variable: OceanVariable, raw: number): ParamValue {
  const spec: VariableSpec = VARIABLE_SPECS[variable];
  return spec.kind === 'direction' ? degreesToVector(raw) : scaleToUnit(raw, spec);
}

// Null-safe, then scaled, then fanned out to every param the map lists.
function buildParams(current: MarineCurrentResponse['current']): OceanResponse['params'] {
  const params = {} as OceanResponse['params'];
  for (const variable of OPEN_METEO.variables) {
    const value = toParamValue(variable, current[variable] ?? RESTING_SEA[variable]);
    for (const name of VARIABLES_TO_PARAMS_MAP[variable]) {
      params[name as ParamName] = value;
    }
  }
  return params;
}

export function toOceanResponse(raw: MarineCurrentResponse): OceanResponse {
  return {
    location: { lat: round(raw.latitude), lon: round(raw.longitude) },
    time: raw.current.time,
    params: buildParams(raw.current),
  };
}
