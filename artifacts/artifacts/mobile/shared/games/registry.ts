import { rawConfig as goldRush } from '@/games/GoldRush/config';
import { rawConfig as twinLink } from '@/games/TwinLink/config';
import { rawConfig as countQuick } from '@/games/count-quick/config';
import { rawConfig as tickLock } from '@/games/TickLock/config';
import { rawConfig as lostItem } from '@/games/lost-item/config';
import { rawConfig as flipMind } from '@/games/FlipMind/config';
import { rawConfig as neonFlash } from '@/games/NeonFlash/config';
import { rawConfig as glitchSpy } from '@/games/GlitchSpy/config';
import { rawConfig as colorTrap } from '@/games/ColorTrap/config';
import type { RawGameConfig } from './rawConfig';

export const MINIGAME_RAW_CONFIGS: readonly RawGameConfig[] = [
  goldRush,
  twinLink,
  countQuick,
  tickLock,
  lostItem,
  flipMind,
  neonFlash,
  glitchSpy,
  colorTrap,
];
