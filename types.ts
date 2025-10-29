export interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

export type LightingEffect = 
  'sunlight' | 
  'shadows' | 
  'sunlight-and-shadows' |
  'remove-sunlight' |
  'remove-shadows' |
  'remove-sunlight-and-shadows';

export type SunlightIntensity = 1 | 2 | 3;

export type SunlightDirection = 'top' | 'left' | 'center' | 'right' | 'bottom';
