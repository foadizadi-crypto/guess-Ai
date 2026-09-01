import { rawConfig as shadowMatch } from '@/games/shadow-match/config';
import { rawConfig as oddOneOut } from '@/games/odd-one-out/config';
import { rawConfig as countQuick } from '@/games/count-quick/config';
import { rawConfig as sizeCompare } from '@/games/size-compare/config';
import { rawConfig as lostItem } from '@/games/lost-item/config';
import { rawConfig as fragmentUnify } from '@/games/fragment-unify/config';
import { rawConfig as emotionMatch } from '@/games/emotion-match/config';
import { rawConfig as logicChain } from '@/games/logic-chain/config';
import { rawConfig as timelineBuilder } from '@/games/timeline-builder/config';
import type { RawGameConfig } from './rawConfig';

export const MINIGAME_RAW_CONFIGS: readonly RawGameConfig[] = [
  shadowMatch,
  oddOneOut,
  countQuick,
  sizeCompare,
  lostItem,
  fragmentUnify,
  emotionMatch,
  logicChain,
  timelineBuilder,
];
