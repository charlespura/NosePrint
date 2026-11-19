// In-memory hand-off between screens (pixel buffers are too large for route params).
import type { RGBAImage } from '../processing/core';
import { DEFAULT_PARAMS, type Params, type Shape } from '../processing/pipeline';
import { DEFAULT_TEXT, type FrameId, type TextOptions } from '../processing/layout';

export interface DesignSettings {
  params: Params;
  shape: Shape;
  frame: FrameId;
  text: TextOptions;
}

interface Session extends DesignSettings {
  sourceUri: string | null;
  source: RGBAImage | null;   // full decoded photo
  cropped: RGBAImage | null;  // square crop at full resolution (<= 2048)
  designId: string | null;    // set when editing a saved design
}

export const session: Session = {
  sourceUri: null, source: null, cropped: null, designId: null,
  shape: 'circle', params: DEFAULT_PARAMS, frame: 'none', text: DEFAULT_TEXT,
};

export function resetSession(): void {
  Object.assign(session, {
    sourceUri: null, source: null, cropped: null, designId: null,
    params: DEFAULT_PARAMS, frame: 'none', text: DEFAULT_TEXT,
  });
}

export function currentSettings(): DesignSettings {
  return { params: session.params, shape: session.shape, frame: session.frame, text: session.text };
}
