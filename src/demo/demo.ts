// DISPOSABLE: orchestration for the BFF -> params -> shader demo.
import { loadParams } from './data';
import { createScene } from './scene';

export async function startDemo(parent: HTMLElement) {
  const params = await loadParams();
  createScene(parent, params);
}
