import type { RendererDiagnosticEntry } from '../../core';

export type SerializedError = {
  name?: string;
  message: string;
  stack?: string;
  type?: string;
  loaded?: number;
  total?: number;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error instanceof ProgressEvent) {
    return `ProgressEvent: ${error.type}`;
  }

  return String(error);
};

export const serializeError = (error: unknown): SerializedError => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  if (error instanceof ProgressEvent) {
    return {
      message: `ProgressEvent: ${error.type}`,
      type: error.type,
      loaded: error.loaded,
      total: error.total
    };
  }

  return {
    message: String(error)
  };
};

export const reportRendererDiagnostic = async (entry: RendererDiagnosticEntry): Promise<void> => {
  try {
    await window.desktopMascot?.diagnostics.logRendererError({
      ...entry,
      occurredAt: entry.occurredAt ?? new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Failed to report renderer diagnostic.', error);
  }
};
