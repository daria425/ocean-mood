// Complete inputs for the layers currently drawn. Ocean data supplies these now;
// future interaction/audio can compose inputs upstream of the same update path.
export type SceneParams = {
  amplitude: number; // 0..1: swell height, scaled by the artistic WATER settings.
  wavelength: number; // 0..1: higher values spread the crests farther apart.
  speed: number; // 0..1: wave travel speed; integrated into a continuous phase.
  dirX: number; // Unit direction's x component: travel along the horizontal plane.
  dirY: number; // Unit direction's y component; update both components together.
  ribbonSpeed: number; // 0..1: current-driven ribbon motion, integrated separately.
  ribbonLength: number; // 0..1: extra ribbon reach; geometry stays allocated.
  ribbonDirX: number; // Current heading in the ocean plane; update x/y together.
  ribbonDirY: number;
  palette: number; // 0..1: blend the existing cold and warm colours.
};

export type SceneController = {
  // Accept complete, already-smoothed inputs. Polling/easing belongs upstream;
  // this applies values directly and never rebuilds geometry or resets phase.
  updateParams(params: SceneParams): void;
  dispose(): void;
};
