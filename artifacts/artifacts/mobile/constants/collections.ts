/**
 * collections.ts — Data-driven cosmetic collection definitions for Phase 2.
 *
 * All 7 collection types are defined here. No hardcoded values should appear
 * in UI components — they must read from these arrays.
 *
 * Collection targets (spec §3):
 *   Avatar:          50+   (10 coin-tier + 40 gem-tier)
 *   Frame:           10+
 *   Theme:           7+
 *   Entrance Effect: 6+
 *   Badge:           5+
 *   Title:           10+
 *   Particle Effect: 4+
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type CosmeticType =
  | 'avatar'
  | 'frame'
  | 'theme'
  | 'entranceEffect'
  | 'badge'
  | 'title'
  | 'particle';

export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type CosmeticCurrency = 'gems' | 'coins' | 'free';
export type CosmeticUnlockType = 'shop' | 'level' | 'achievement' | 'event' | 'season' | 'special';

/** Canonical cosmetic item shape — matches spec §4. */
export interface CosmeticItem {
  id: string;
  name: string;
  type: CosmeticType;
  rarity: CosmeticRarity;
  icon: string;                // Ionicons name used as in-app visual
  price: number;
  currency: CosmeticCurrency;
  unlockType: CosmeticUnlockType;
  description?: string;
  unlockLevel?: number;        // only for unlockType === 'level'
  preview?: string;            // reserved for future image asset path
}

export interface CollectionMeta {
  type: CosmeticType;
  label: string;
  icon: string;                // Ionicons name for collection card icon
  color: string;               // accent color for collection card
  description: string;
}

// ─── Collection metadata ──────────────────────────────────────────────────────

export const COLLECTION_META: CollectionMeta[] = [
  { type: 'avatar',          label: 'Avatars',           icon: 'person-circle-outline',   color: '#64B5F6', description: 'Express yourself with a unique avatar' },
  { type: 'frame',           label: 'Frames',            icon: 'crop-outline',             color: '#FFD700', description: 'Premium borders for your avatar' },
  { type: 'theme',           label: 'Themes',            icon: 'color-palette-outline',    color: '#CE93D8', description: 'Transform the game\'s visual style' },
  { type: 'entranceEffect',  label: 'Entrance Effects',  icon: 'sparkles-outline',         color: '#FF7043', description: 'Make a grand entrance in every game' },
  { type: 'badge',           label: 'Badges',            icon: 'ribbon-outline',           color: '#A5D6A7', description: 'Show off your status and achievements' },
  { type: 'title',           label: 'Titles',            icon: 'text-outline',             color: '#FFCA28', description: 'Unique titles displayed on your profile' },
  { type: 'particle',        label: 'Particle Effects',  icon: 'bonfire-outline',          color: '#EF5350', description: 'Auras and effects that follow your avatar' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function a(
  id: string, name: string, rarity: CosmeticRarity, icon: string,
  price: number, currency: CosmeticCurrency, unlockType: CosmeticUnlockType,
  description = '', extra: Partial<CosmeticItem> = {},
): CosmeticItem {
  return { id, name, type: 'avatar', rarity, icon, price, currency, unlockType, description, ...extra };
}

// ─── AVATAR COLLECTION (50 total: 10 level/achievement-tier + 40 gem-tier) ──────

/**
 * Level/achievement-tier avatars — unlocked through gameplay, never purchased.
 * Ownership is read from the `avatars` Zustand slice, not `ownedCosmetics`.
 */
export const COIN_AVATAR_IDS = [
  'avatar_1', 'avatar_2', 'avatar_3', 'avatar_4', 'avatar_5',
  'avatar_6', 'avatar_7', 'avatar_8', 'avatar_9', 'avatar_10',
];

/** Full CosmeticItem descriptors for the 10 progression avatars, used in the gallery. */
export const COIN_AVATARS: CosmeticItem[] = [
  { id: 'avatar_1',  name: 'Abigail', type: 'avatar', rarity: 'common',    icon: 'person-outline',        price: 0, currency: 'free',  unlockType: 'special',     description: 'Your default companion — always ready.'           },
  { id: 'avatar_2',  name: 'Chlöe',   type: 'avatar', rarity: 'common',    icon: 'time-outline',          price: 0, currency: 'coins', unlockType: 'level',       description: 'Quick wit and sharp focus.',          unlockLevel: 5   },
  { id: 'avatar_3',  name: 'Daveigh', type: 'avatar', rarity: 'rare',      icon: 'library-outline',       price: 0, currency: 'coins', unlockType: 'level',       description: 'Ancient wisdom powers every level-up.',unlockLevel: 10  },
  { id: 'avatar_4',  name: 'Haley',   type: 'avatar', rarity: 'rare',      icon: 'eye-outline',           price: 0, currency: 'coins', unlockType: 'level',       description: 'Sees through the blur before anyone.', unlockLevel: 20  },
  { id: 'avatar_5',  name: 'Heather', type: 'avatar', rarity: 'epic',      icon: 'shield-outline',        price: 0, currency: 'coins', unlockType: 'level',       description: 'Blocks all distractions. Pure focus.',  unlockLevel: 30  },
  { id: 'avatar_6',  name: 'Kirsten', type: 'avatar', rarity: 'epic',      icon: 'leaf-outline',          price: 0, currency: 'coins', unlockType: 'level',       description: 'Fortune favors the bold — and the lucky.',unlockLevel: 40  },
  { id: 'avatar_7',  name: 'Linda',   type: 'avatar', rarity: 'epic',      icon: 'rocket-outline',        price: 0, currency: 'coins', unlockType: 'level',       description: 'Lightning reflexes. Zero hesitation.',  unlockLevel: 50  },
  { id: 'avatar_8',  name: 'Marilyn', type: 'avatar', rarity: 'epic',      icon: 'magnet-outline',        price: 0, currency: 'coins', unlockType: 'level',       description: 'Attracts coins like gravity.',           unlockLevel: 75  },
  { id: 'avatar_9',  name: 'Patty',   type: 'avatar', rarity: 'legendary', icon: 'sparkles-outline',      price: 0, currency: 'coins', unlockType: 'level',       description: 'Born to defeat blur. Legendary focus.', unlockLevel: 100 },
  { id: 'avatar_10', name: 'Sissy',   type: 'avatar', rarity: 'legendary', icon: 'hardware-chip-outline', price: 0, currency: 'coins', unlockType: 'achievement', description: 'Collect 5 avatars to unlock this legend.' },
];

export const GEM_AVATARS: CosmeticItem[] = [
  // ── Spec examples ─────────────────────────────────────────────────────
  a('gem_av_ai_robot',    'AI Robot',    'legendary', 'hardware-chip-outline',  200, 'gems', 'shop', 'A futuristic machine built to outsmart the blur'),
  a('gem_av_panda',       'Panda',       'common',    'leaf-outline',           40,  'gems', 'shop', 'Calm and focused — misses nothing'),
  a('gem_av_fox',         'Fox',         'rare',      'paw-outline',            60,  'gems', 'shop', 'Quick-witted and always a step ahead'),
  a('gem_av_owl',         'Owl',         'rare',      'moon-outline',           70,  'gems', 'shop', 'Sees through the dark and the blur alike'),
  a('gem_av_detective',   'Detective',   'epic',      'search-outline',         110, 'gems', 'shop', 'Every pixel is a clue — nothing escapes the detective'),
  a('gem_av_alien',       'Alien',       'epic',      'planet-outline',         120, 'gems', 'shop', 'Travelled light years to conquer this quiz'),
  a('gem_av_astronaut',   'Astronaut',   'rare',      'rocket-outline',         80,  'gems', 'shop', 'Trained for the unknown — blur is nothing'),
  a('gem_av_dragon',      'Dragon',      'legendary', 'flame-outline',          220, 'gems', 'shop', 'Ancient power, blazing precision'),
  a('gem_av_legend',      'Legend',      'legendary', 'trophy-outline',         300, 'gems', 'shop', 'A title earned, never given'),
  a('gem_av_crystal',     'Crystal',     'epic',      'diamond-outline',        150, 'gems', 'shop', 'Clear mind, crystal clarity'),
  a('gem_av_ghost',       'Ghost',       'rare',      'cloud-outline',          75,  'gems', 'shop', 'Unseen, unstoppable, uncanny'),
  a('gem_av_wizard',      'Wizard',      'epic',      'sparkles-outline',       130, 'gems', 'shop', 'Bends the rules of time and blur'),

  // ── Warriors & rogues ────────────────────────────────────────────────
  a('gem_av_ninja',       'Ninja',       'epic',      'eye-outline',            115, 'gems', 'shop', 'Silent answers strike the fastest'),
  a('gem_av_samurai',     'Samurai',     'rare',      'flash-outline',          85,  'gems', 'shop', 'Disciplined, precise, unstoppable'),
  a('gem_av_pirate',      'Pirate',      'common',    'boat-outline',           45,  'gems', 'shop', 'Sails the seas of blur for hidden treasure'),
  a('gem_av_viking',      'Viking',      'rare',      'shield-outline',         80,  'gems', 'shop', 'Fearless in the face of fog'),
  a('gem_av_knight',      'Knight',      'epic',      'shield-checkmark-outline', 125, 'gems', 'shop', 'Sworn to protect the streak'),
  a('gem_av_hunter',      'Hunter',      'rare',      'locate-outline',         70,  'gems', 'shop', 'Tracks every answer with precision'),

  // ── Mystics & casters ────────────────────────────────────────────────
  a('gem_av_warlock',     'Warlock',     'epic',      'eye-sharp',              135, 'gems', 'shop', 'Dark arts of speed and focus'),
  a('gem_av_priest',      'Priest',      'rare',      'infinite-outline',       65,  'gems', 'shop', 'Endless wisdom, endless patience'),
  a('gem_av_mage',        'Mage',        'epic',      'color-wand-outline',     120, 'gems', 'shop', 'Turns wrong answers into lessons'),
  a('gem_av_ranger',      'Ranger',      'common',    'map-outline',            40,  'gems', 'shop', 'Knows every path through the blur'),

  // ── Mythical ─────────────────────────────────────────────────────────
  a('gem_av_phoenix',     'Phoenix',     'legendary', 'sunny-outline',          250, 'gems', 'shop', 'Reborn after every wrong answer'),
  a('gem_av_unicorn',     'Unicorn',     'legendary', 'flower-outline',         280, 'gems', 'shop', 'Pure magic — answers appear like visions'),
  a('gem_av_titan',       'Titan',       'legendary', 'barbell-outline',        320, 'gems', 'shop', 'Brute-force knowledge on an epic scale'),

  // ── Deities ───────────────────────────────────────────────────────────
  a('gem_av_apollo',      'Apollo',      'legendary', 'musical-notes-outline',  260, 'gems', 'shop', 'Sun god of creative inspiration'),
  a('gem_av_hermes',      'Hermes',      'epic',      'send-outline',           140, 'gems', 'shop', 'Speed and cunning personified'),
  a('gem_av_athena',      'Athena',      'epic',      'library-outline',        155, 'gems', 'shop', 'Goddess of wisdom and strategy'),
  a('gem_av_neptune',     'Neptune',     'legendary', 'water-outline',          270, 'gems', 'shop', 'Ruler of depth — dives into every question'),

  // ── Tech & science ────────────────────────────────────────────────────
  a('gem_av_cyberpunk',   'Cyberpunk',   'epic',      'wifi-outline',           130, 'gems', 'shop', 'Jacked in and levelling up'),
  a('gem_av_hacker',      'Hacker',      'epic',      'terminal-outline',       145, 'gems', 'shop', 'Decodes the blur at machine speed'),
  a('gem_av_engineer',    'Engineer',    'rare',      'construct-outline',      75,  'gems', 'shop', 'Builds answers from scratch'),
  a('gem_av_scientist',   'Scientist',   'rare',      'flask-outline',          70,  'gems', 'shop', 'Tests every hypothesis instantly'),
  a('gem_av_doctor',      'Doctor',      'rare',      'medkit-outline',         65,  'gems', 'shop', 'Diagnoses blur in seconds'),

  // ── Professionals ─────────────────────────────────────────────────────
  a('gem_av_spy',         'Spy',         'epic',      'camera-outline',         110, 'gems', 'shop', 'Observes everything, reveals nothing'),
  a('gem_av_professor',   'Professor',   'common',    'school-outline',         50,  'gems', 'shop', 'Decades of blur-busting experience'),
  a('gem_av_scholar',     'Scholar',     'common',    'book-outline',           35,  'gems', 'shop', 'Knowledge is the only currency'),

  // ── Elemental ─────────────────────────────────────────────────────────
  a('gem_av_shadow',      'Shadow',      'epic',      'contrast-outline',       120, 'gems', 'shop', 'Moves between light and dark flawlessly'),
  a('gem_av_thunder',     'Thunder',     'legendary', 'thunderstorm-outline',   240, 'gems', 'shop', 'Strikes faster than the timer'),
  a('gem_av_frost',       'Frost',       'rare',      'snow-outline',           80,  'gems', 'shop', 'Cool under pressure — literally'),
  a('gem_av_inferno',     'Inferno',     'legendary', 'bonfire-outline',        290, 'gems', 'achievement', 'Unlocked by completing 50 perfect games'),
];

// ─── FRAME COLLECTION (10) ────────────────────────────────────────────────────
// Frames 0-4, 8-9 unlock via level milestones (auto-granted in store).
// Frames 5-7 are purchased with gems from the shop.

export const FRAMES: CosmeticItem[] = [
  { id: 'frame_0_simple',    name: 'Simple',           type: 'frame', rarity: 'common',    icon: 'ellipse-outline',         price: 0,   currency: 'free',  unlockType: 'special',              description: 'Clean and classic — your default frame'           },
  { id: 'frame_1_bronze',    name: 'Bronze',           type: 'frame', rarity: 'common',    icon: 'ellipse-outline',         price: 0,   currency: 'coins', unlockType: 'level',  unlockLevel: 10,  description: 'A sturdy bronze border for rising players'         },
  { id: 'frame_2_silver',    name: 'Silver',           type: 'frame', rarity: 'common',    icon: 'ellipse-outline',         price: 0,   currency: 'coins', unlockType: 'level',  unlockLevel: 50,  description: 'Polished silver — cool under pressure'             },
  { id: 'frame_3_gold',      name: 'Gold',             type: 'frame', rarity: 'rare',      icon: 'ellipse',                 price: 0,   currency: 'coins', unlockType: 'level',  unlockLevel: 100, description: 'The classic gold ring — bold and unmistakable'     },
  { id: 'frame_6_diamond',   name: 'Diamond',          type: 'frame', rarity: 'epic',      icon: 'diamond-outline',         price: 0,   currency: 'coins', unlockType: 'level',  unlockLevel: 200, description: 'Refracts light with diamond clarity'               },
  { id: 'frame_4_neon',      name: 'Neon',             type: 'frame', rarity: 'rare',      icon: 'radio-button-on-outline', price: 50,  currency: 'gems',  unlockType: 'shop',                    description: 'Glowing neon outlines that pulse with energy'      },
  { id: 'frame_7_fire',      name: 'Fire',             type: 'frame', rarity: 'epic',      icon: 'flame-outline',           price: 80,  currency: 'gems',  unlockType: 'shop',                    description: 'A fiery ring — your answers are unstoppable'       },
  { id: 'frame_5_galaxy',    name: 'Galaxy',           type: 'frame', rarity: 'epic',      icon: 'planet-outline',          price: 100, currency: 'gems',  unlockType: 'shop',                    description: 'Swirling cosmic energy around your avatar'          },
  { id: 'frame_8_animated',  name: 'Animated',         type: 'frame', rarity: 'legendary', icon: 'refresh-circle-outline',  price: 0,   currency: 'coins', unlockType: 'level',  unlockLevel: 400, description: 'A living animated frame — truly one-of-a-kind'     },
  { id: 'frame_9_legendary', name: 'Legendary Crown',  type: 'frame', rarity: 'legendary', icon: 'star-outline',            price: 0,   currency: 'coins', unlockType: 'level',  unlockLevel: 500, description: 'The ultimate crown — reserved for the absolute elite'},
];

// ─── THEME COLLECTION (7) ─────────────────────────────────────────────────────

export const THEMES: CosmeticItem[] = [
  { id: 'theme_classic',  name: 'Classic',  type: 'theme', rarity: 'common',    icon: 'sunny-outline',          price: 0,   currency: 'free',  unlockType: 'level',  unlockLevel: 1, description: 'The original GUESSAi look' },
  { id: 'theme_dark',     name: 'Dark',     type: 'theme', rarity: 'common',    icon: 'moon-outline',           price: 40,  currency: 'gems',  unlockType: 'shop',                  description: 'Deep dark mode with rich contrast' },
  { id: 'theme_cyber',    name: 'Cyber',    type: 'theme', rarity: 'rare',      icon: 'terminal-outline',       price: 70,  currency: 'gems',  unlockType: 'shop',                  description: 'Neon grids and matrix-style aesthetics' },
  { id: 'theme_neon',     name: 'Neon',     type: 'theme', rarity: 'rare',      icon: 'color-wand-outline',     price: 80,  currency: 'gems',  unlockType: 'shop',                  description: 'Vivid neon palette — impossible to miss' },
  { id: 'theme_space',    name: 'Space',    type: 'theme', rarity: 'epic',      icon: 'planet-outline',         price: 120, currency: 'gems',  unlockType: 'shop',                  description: 'Deep space aesthetics with star fields' },
  { id: 'theme_forest',   name: 'Forest',   type: 'theme', rarity: 'rare',      icon: 'leaf-outline',           price: 65,  currency: 'gems',  unlockType: 'shop',                  description: 'Earthy greens and natural textures' },
  { id: 'theme_golden',   name: 'Golden',   type: 'theme', rarity: 'legendary', icon: 'trophy-outline',         price: 200, currency: 'gems',  unlockType: 'shop',                  description: 'Everything glows gold — the prestige theme' },
];

// ─── ENTRANCE EFFECTS (6) ─────────────────────────────────────────────────────

export const ENTRANCE_EFFECTS: CosmeticItem[] = [
  { id: 'entrance_lightning', name: 'Lightning',   type: 'entranceEffect', rarity: 'rare',      icon: 'flash-outline',        price: 60,  currency: 'gems', unlockType: 'shop',        description: 'Strike in with a bolt of lightning' },
  { id: 'entrance_fire',      name: 'Fire',        type: 'entranceEffect', rarity: 'epic',      icon: 'flame-outline',        price: 100, currency: 'gems', unlockType: 'shop',        description: 'Walk through a wall of fire' },
  { id: 'entrance_smoke',     name: 'Smoke',       type: 'entranceEffect', rarity: 'common',    icon: 'cloud-outline',        price: 40,  currency: 'gems', unlockType: 'shop',        description: 'Appear dramatically from a smoke cloud' },
  { id: 'entrance_stars',     name: 'Stars',       type: 'entranceEffect', rarity: 'rare',      icon: 'star-outline',         price: 75,  currency: 'gems', unlockType: 'shop',        description: 'Arrive in a shower of golden stars' },
  { id: 'entrance_rainbow',   name: 'Rainbow',     type: 'entranceEffect', rarity: 'epic',      icon: 'color-palette-outline',price: 110, currency: 'gems', unlockType: 'shop',        description: 'Slide in on a rainbow arc' },
  { id: 'entrance_portal',    name: 'Portal',      type: 'entranceEffect', rarity: 'legendary', icon: 'infinite-outline',     price: 200, currency: 'gems', unlockType: 'shop',        description: 'Teleport in through a dimensional portal' },
];

// ─── BADGE COLLECTION (5) ─────────────────────────────────────────────────────

export const BADGES: CosmeticItem[] = [
  { id: 'badge_bronze',   name: 'Bronze Badge',   type: 'badge', rarity: 'common',    icon: 'ribbon-outline', price: 0,   currency: 'free',  unlockType: 'level',       unlockLevel: 5,  description: 'Awarded for reaching level 5' },
  { id: 'badge_silver',   name: 'Silver Badge',   type: 'badge', rarity: 'common',    icon: 'ribbon-outline', price: 30,  currency: 'gems',  unlockType: 'shop',                         description: 'A polished silver emblem of dedication' },
  { id: 'badge_gold',     name: 'Gold Badge',     type: 'badge', rarity: 'rare',      icon: 'ribbon',         price: 70,  currency: 'gems',  unlockType: 'shop',                         description: 'Gold status — you\'ve proven yourself' },
  { id: 'badge_platinum', name: 'Platinum Badge', type: 'badge', rarity: 'epic',      icon: 'ribbon',         price: 130, currency: 'gems',  unlockType: 'achievement', description: 'Complete all 10 achievements to unlock' },
  { id: 'badge_diamond',  name: 'Diamond Badge',  type: 'badge', rarity: 'legendary', icon: 'ribbon',         price: 0,   currency: 'free',  unlockType: 'special',                      description: 'The ultimate badge — for true GUESSAi legends' },
];

// ─── TITLE COLLECTION (10) ────────────────────────────────────────────────────

export const TITLES: CosmeticItem[] = [
  { id: 'title_rookie',      name: 'Rookie',             type: 'title', rarity: 'common',    icon: 'person-outline',         price: 0,   currency: 'free',  unlockType: 'level',  unlockLevel: 1,  description: 'Every journey starts here' },
  { id: 'title_explorer',    name: 'Explorer',           type: 'title', rarity: 'common',    icon: 'compass-outline',        price: 25,  currency: 'gems',  unlockType: 'shop',                   description: 'Curious and unstoppable' },
  { id: 'title_detective',   name: 'Detective',          type: 'title', rarity: 'rare',      icon: 'search-outline',         price: 55,  currency: 'gems',  unlockType: 'shop',                   description: 'Solves every blur case' },
  { id: 'title_blur_hunter', name: 'Blur Hunter',        type: 'title', rarity: 'rare',      icon: 'locate-outline',         price: 65,  currency: 'gems',  unlockType: 'shop',                   description: 'The blur never escapes you' },
  { id: 'title_genius',      name: 'Genius',             type: 'title', rarity: 'rare',      icon: 'bulb-outline',           price: 70,  currency: 'gems',  unlockType: 'shop',                   description: 'IQ off the charts, literally' },
  { id: 'title_master',      name: 'Master',             type: 'title', rarity: 'epic',      icon: 'school-outline',         price: 100, currency: 'gems',  unlockType: 'shop',                   description: 'Mastery in every category' },
  { id: 'title_champion',    name: 'Champion',           type: 'title', rarity: 'epic',      icon: 'trophy-outline',         price: 120, currency: 'gems',  unlockType: 'shop',                   description: 'A champion is made in the heat of battle' },
  { id: 'title_legend',      name: 'Legend',             type: 'title', rarity: 'legendary', icon: 'star-outline',           price: 200, currency: 'gems',  unlockType: 'achievement',            description: 'Unlocked by becoming number 1 on the leaderboard' },
  { id: 'title_oracle',      name: 'The Oracle',         type: 'title', rarity: 'legendary', icon: 'eye-outline',            price: 250, currency: 'gems',  unlockType: 'shop',                   description: 'Sees the answer before the question ends' },
  { id: 'title_clarity_leg', name: 'The Clarity Legend', type: 'title', rarity: 'legendary', icon: 'diamond-outline',        price: 0,   currency: 'free',  unlockType: 'special',                description: 'The rarest title — reserved for the absolute elite' },
];

// ─── PARTICLE EFFECTS (4) ─────────────────────────────────────────────────────

export const PARTICLES: CosmeticItem[] = [
  { id: 'particle_fire',      name: 'Fire Aura',      type: 'particle', rarity: 'epic',      icon: 'flame-outline',         price: 120, currency: 'gems', unlockType: 'shop',    description: 'Engulf yourself in dancing flames' },
  { id: 'particle_lightning', name: 'Lightning Aura', type: 'particle', rarity: 'epic',      icon: 'flash-outline',         price: 130, currency: 'gems', unlockType: 'shop',    description: 'Crackling electricity orbits your avatar' },
  { id: 'particle_rainbow',   name: 'Rainbow Aura',   type: 'particle', rarity: 'rare',      icon: 'color-palette-outline', price: 90,  currency: 'gems', unlockType: 'shop',    description: 'A prismatic trail follows your every move' },
  { id: 'particle_galaxy',    name: 'Galaxy Aura',    type: 'particle', rarity: 'legendary', icon: 'planet-outline',        price: 220, currency: 'gems', unlockType: 'shop',    description: 'Stars and nebulae swirl around you' },
];

// ─── Combined maps for O(1) lookup ────────────────────────────────────────────

export const ALL_COSMETICS: CosmeticItem[] = [
  ...GEM_AVATARS,
  ...FRAMES,
  ...THEMES,
  ...ENTRANCE_EFFECTS,
  ...BADGES,
  ...TITLES,
  ...PARTICLES,
];

/** Look up any cosmetic item by ID in O(1). */
export const COSMETIC_BY_ID: Map<string, CosmeticItem> = new Map(
  ALL_COSMETICS.map((c) => [c.id, c]),
);

/** Get all items of a specific collection type. */
export function getCollection(type: CosmeticType): CosmeticItem[] {
  return ALL_COSMETICS.filter((c) => c.type === type);
}

/** Total items in a collection. */
export function getCollectionTotal(type: CosmeticType): number {
  if (type === 'avatar') return COIN_AVATARS.length + GEM_AVATARS.length; // 50
  return getCollection(type).length;
}
