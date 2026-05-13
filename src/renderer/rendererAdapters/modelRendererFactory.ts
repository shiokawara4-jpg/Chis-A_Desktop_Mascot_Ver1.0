import type { ModelFormat, ModelRendererAdapter } from '../../core';
import { MmdRendererAdapter } from './mmdRendererAdapter';
import { VrmRendererAdapter } from './vrmRendererAdapter';

export const createModelRendererAdapter = (modelFormat: ModelFormat): ModelRendererAdapter => {
  switch (modelFormat) {
    case 'pmx':
      return new MmdRendererAdapter();
    case 'vrm':
      return new VrmRendererAdapter();
  }
};
