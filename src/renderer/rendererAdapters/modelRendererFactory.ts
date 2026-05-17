import type { ModelFormat, ModelRendererAdapter } from '../../core';
import type { MmdRendererAdapterOptions, MmdRendererWarning } from './mmdRendererAdapter';
import { MmdRendererAdapter } from './mmdRendererAdapter';
import { VrmRendererAdapter } from './vrmRendererAdapter';

export type RuntimeModelRendererAdapter = ModelRendererAdapter & {
  update?: (deltaSeconds: number) => void;
  getWarnings?: () => readonly MmdRendererWarning[];
  dispose: () => void;
};

export type ModelRendererAdapterFactoryOptions = MmdRendererAdapterOptions;

export const createModelRendererAdapter = (
  modelFormat: ModelFormat,
  options?: ModelRendererAdapterFactoryOptions
): RuntimeModelRendererAdapter => {
  switch (modelFormat) {
    case 'pmx':
      if (!options) {
        throw new Error('MmdRendererAdapter requires renderer adapter options.');
      }

      return new MmdRendererAdapter(options);
    case 'vrm':
      return new VrmRendererAdapter();
  }
};
