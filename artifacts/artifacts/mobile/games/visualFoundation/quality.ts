export type VisualQuality = 'high' | 'medium' | 'low';

export const particleCountFor = (quality: VisualQuality): number => {
  if (quality === 'high') return 16;
  if (quality === 'medium') return 7;
  return 0;
};

export const allowBlurFor = (quality: VisualQuality): boolean => quality === 'high';
export const allowBurstFor = (quality: VisualQuality): boolean => quality !== 'low';
