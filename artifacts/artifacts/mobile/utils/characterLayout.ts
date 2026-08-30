/**
 * Generic avatar + wing compositor.
 *
 * Size comes from each asset's own canvas + detected content box.
 * Attachment uses one formula for every pair: the wing root lands on the
 * center of the avatar's back. There is no per-combination table.
 */

export interface ContentBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface AssetMetrics {
  canvasW: number;
  canvasH: number;
  box: ContentBox;
}

export type CharacterStageMode = "platform" | "preview";

export interface CharacterLayoutInput {
  stageW: number;
  stageH: number;
  avatar: AssetMetrics;
  wing?: AssetMetrics;
  mode: CharacterStageMode;
}

export interface LayerRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CharacterLayout {
  avatar: LayerRect;
  wing?: LayerRect;
  backX: number;
  backY: number;
}

const FULL_BOX: ContentBox = { left: 0, top: 0, right: 1, bottom: 1 };

/** Upper back, measured down the visible figure (not the padded canvas). */
const BACK_Y_IN_CONTENT = 0.38;
/** Wing medallion / root, measured down the visible wing art. */
const WING_ROOT_Y_IN_CONTENT = 0.5;
/** How wide the visible wings should be vs the visible avatar. */
const WING_SPAN_VS_AVATAR = 2.25;
/** Lobby pedestal line, as a fraction of the (extended) stage height. */
const PLATFORM_GROUND_Y = 0.89;

function clampBox(box: ContentBox): ContentBox {
  const left = Math.max(0, Math.min(1, box.left));
  const top = Math.max(0, Math.min(1, box.top));
  const right = Math.max(left + 0.05, Math.min(1, box.right));
  const bottom = Math.max(top + 0.05, Math.min(1, box.bottom));
  return { left, top, right, bottom };
}

function contentSize(canvasW: number, canvasH: number, box: ContentBox) {
  return {
    w: Math.max(1, (box.right - box.left) * canvasW),
    h: Math.max(1, (box.bottom - box.top) * canvasH),
  };
}

export function normalizeMetrics(metrics: AssetMetrics): AssetMetrics {
  return {
    canvasW: Math.max(1, metrics.canvasW),
    canvasH: Math.max(1, metrics.canvasH),
    box: clampBox(metrics.box ?? FULL_BOX),
  };
}

export function computeCharacterLayout(input: CharacterLayoutInput): CharacterLayout | null {
  if (input.stageW <= 0 || input.stageH <= 0) return null;

  const avatar = normalizeMetrics(input.avatar);
  const avatarContent = contentSize(avatar.canvasW, avatar.canvasH, avatar.box);
  const aspect = avatar.canvasW / avatar.canvasH;

  const groundY = input.mode === "platform" ? input.stageH * PLATFORM_GROUND_Y : input.stageH * 0.92;
  const desiredContentH =
    input.mode === "platform"
      ? Math.min(input.stageH * 0.78, groundY * 0.9)
      : input.stageH * 0.72;

  let canvasH = desiredContentH / (avatar.box.bottom - avatar.box.top);
  let canvasW = canvasH * aspect;

  // Keep a very wide figure from overflowing the stage horizontally.
  const contentW = (avatar.box.right - avatar.box.left) * canvasW;
  const maxContentW = input.stageW * 0.62;
  if (contentW > maxContentW) {
    const s = maxContentW / contentW;
    canvasW *= s;
    canvasH *= s;
  }

  const contentCenterX = avatar.box.left + (avatar.box.right - avatar.box.left) / 2;
  const avatarLeft = input.stageW / 2 - contentCenterX * canvasW;
  const avatarTop =
    input.mode === "platform"
      ? groundY - avatar.box.bottom * canvasH
      : input.stageH / 2 - ((avatar.box.top + avatar.box.bottom) / 2) * canvasH;

  const backX = avatarLeft + contentCenterX * canvasW;
  const backY =
    avatarTop +
    (avatar.box.top + BACK_Y_IN_CONTENT * (avatar.box.bottom - avatar.box.top)) * canvasH;

  const layout: CharacterLayout = {
    avatar: { left: avatarLeft, top: avatarTop, width: canvasW, height: canvasH },
    backX,
    backY,
  };

  if (!input.wing) return layout;

  const wing = normalizeMetrics(input.wing);
  const wingAspect = wing.canvasW / wing.canvasH;
  const visibleAvatarW = (avatar.box.right - avatar.box.left) * canvasW;

  let wingCanvasW =
    (visibleAvatarW * WING_SPAN_VS_AVATAR) / (wing.box.right - wing.box.left);
  let wingCanvasH = wingCanvasW / wingAspect;

  const maxWingH = input.stageH * (input.mode === "platform" ? 1.2 : 0.98);
  if (wingCanvasH > maxWingH) {
    const s = maxWingH / wingCanvasH;
    wingCanvasW *= s;
    wingCanvasH *= s;
  }

  const wingRootX = wing.box.left + (wing.box.right - wing.box.left) / 2;
  const wingRootY = wing.box.top + WING_ROOT_Y_IN_CONTENT * (wing.box.bottom - wing.box.top);

  layout.wing = {
    left: backX - wingRootX * wingCanvasW,
    top: backY - wingRootY * wingCanvasH,
    width: wingCanvasW,
    height: wingCanvasH,
  };

  return layout;
}

export { FULL_BOX };
export const LAYOUT_CONSTANTS = {
  BACK_Y_IN_CONTENT,
  WING_ROOT_Y_IN_CONTENT,
  WING_SPAN_VS_AVATAR,
  PLATFORM_GROUND_Y,
};
