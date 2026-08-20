import React, { useEffect, useCallback, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  Alert,
  Switch,
  Image,
  Animated as RNAnimated,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import LottieView from "lottie-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";

import { AvatarFrame } from "@/components/AvatarFrame";
import { AnimatedIcon } from "@/components/AnimatedIcon";
import { DailyRewardModal } from "@/components/DailyRewardModal";
import { PlayerNameModal, isValidPlayerName } from "@/components/PlayerNameModal";
import { FullBodyAvatarStage } from "@/components/FullBodyAvatarStage";

import { useUserStore } from "@/store/userStore";
import { useAudio } from "@/hooks/useAudio";
import { useAdStore } from "@/store/adStore";
import { isToday } from "@/utils";

import {
  MAX_ENERGY,
  STAMINA_AD_REWARD,
  STAMINA_ADS_PER_DAY,
} from "@/constants/economy";
import { DAILY_REWARDS } from "@/constants";
import { ROUTES } from "@/navigation/routes";

const USE_NATIVE_DRIVER = Platform.OS !== "web";
const HITBOX_Z_BASE = 10000;

const ICON_SCALE = 1.2;
const HITBOX_SCALE = 1;

// =====================================================
// HITBOX ITEM (با قابلیت تنظیم scale جداگانه)
// =====================================================

interface HitboxItem {
  id: string;
  left: string;
  top: string;
  width: string;
  height: string;
  label: string;
  premium?: boolean;
  hasTextOverlay?: boolean;
  iconScale?: number; // ← جدید: برای تنظیم scale جداگانه
}

// =====================================================
// ICON ASSETS
// =====================================================

const buttonIcons: Record<string, any> = {
  coin: require("../assets/icon/coin.webp"),
  gem: require("../assets/icon/gem.webp"),
  stamina: require("../assets/icon/stamina.webp"),
  spinwheel: require("../assets/icon/spinwheel.webp"),
  settings: require("../assets/icon/settings.webp"),
  play: require("../assets/icon/play.webp"),
  legendary_pack: require("../assets/icon/legendary_pack.webp"),
  gem_pack: require("../assets/icon/gem_pack.webp"),
  admob: require("../assets/icon/AdMob_BG.png"),
  leaderboard: require("../assets/icon/leaderboard.webp"),
  dailyreward: require("../assets/icon/daily-reward.webp"),
  shop: require("../assets/icon/shop.webp"),
  friends: require("../assets/icon/friends.webp"),
  achievement: require("../assets/icon/achievement.webp"),
  stand_avatar: require("../assets/icon/avatar_pedestal.webp"),
};

// =====================================================
// ICON ANIMATION MAP
// =====================================================

const getIconAnimation = (id: string): "float" | "pulse" | "spin" | "none" => {
  switch (id) {
    case "play":
      return "pulse";
    case "spinwheel":
      return "spin";
    case "coin":
    case "gem":
    case "dailyreward":
    case "legendary_pack":
    case "gem_pack":
    case "stamina":
    case "admob":
      return "pulse";
    case "shop":
    case "friends":
    case "achievement":
    case "leaderboard":
      return "float";
    case "settings":
      return "none";
    default:
      return "float";
  }
};

// =====================================================
// LOBBY
// =====================================================

/**
 * Ambient background animation layers (wave.json + Particles.json).
 *
 * Switched OFF on request: the current artwork reads as a plain blue circle
 * and a handful of near-invisible dots over the lobby background. To bring
 * them back, drop replacement files with the SAME names into
 * assets/animations/ and set this to true. Do not delete those two files
 * while this stays in the tree — Metro resolves require() at build time, so a
 * missing asset breaks the bundle even though the layer never renders.
 *
 * The one-shot entry burst (splash.json) is unaffected and still plays.
 */
const SHOW_AMBIENT_FX = false;

export default function LobbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [dailyModal, setDailyModal] = useState<boolean>(false);
  // Gate for actions that require a saved Player Name (Play, avatar/pedestal tap).
  const [nameModalVisible, setNameModalVisible] = useState<boolean>(false);
  const pendingActionRef = useRef<string | null>(null);
  const [soundInstance, setSoundInstance] = useState<Audio.Sound | null>(null);
  // Plays the one-shot entry flourish (splash.json) each time the lobby mounts;
  // onAnimationFinish flips this back to false so it does not linger.
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // ===================================================
  // USER STORE
  // ===================================================

  const {
    username,
    setUsername,
    coins,
    gems,
    level,
    selectedAvatarId,
    dailyReward,
    claimDailyReward,
    energy,
    tickEnergy,
    avatars,
    equippedCosmetics,
    equippedWing,
  } = useUserStore();

  const addStamina = useUserStore((s) => s.addStamina);
  const showRewarded = useAdStore((s) => s.showRewarded);
  const reserveStaminaAd = useAdStore((s) => s.reserveStaminaAd);
  const releaseStaminaAd = useAdStore((s) => s.releaseStaminaAd);
  const adInFlight = useRef<boolean>(false);

  const { playMusic, stopMusic } = useAudio();

  const currentAvatar = avatars?.find(
    (avatar) => avatar.id === selectedAvatarId,
  );

  // ===================================================
  // REWARDED AD
  // ===================================================

  const handleWatchStaminaAd = useCallback(async () => {
    if (adInFlight.current) return;

    if (!reserveStaminaAd()) {
      Alert.alert(
        "No ads left today",
        `You can watch up to ${STAMINA_ADS_PER_DAY} ads a day for stamina. Come back tomorrow.`,
      );
      return;
    }

    adInFlight.current = true;
    let earned = false;

    try {
      earned = await showRewarded();
    } finally {
      adInFlight.current = false;
      if (!earned) {
        releaseStaminaAd();
      }
    }

    if (!earned) {
      Alert.alert(
        "No reward",
        "The ad did not finish, so no stamina was added.",
      );
      return;
    }

    addStamina(STAMINA_AD_REWARD);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    Alert.alert(
      "Stamina added",
      `+${STAMINA_AD_REWARD} stamina added to your reserve.`,
    );
  }, [addStamina, releaseStaminaAd, reserveStaminaAd, showRewarded]);

  // ===================================================
  // MUSIC / DAILY REWARD
  // ===================================================

  useFocusEffect(
    useCallback(() => {
      playMusic("menu_music");
      tickEnergy();

      const claimed = isToday(dailyReward?.lastClaimed);
      if (!claimed) {
        // Held back until the one-shot entry animation (splash.json, ~1.2s)
        // has finished, so the modal does not cover the flourish.
        const t = setTimeout(() => setDailyModal(true), 2000);
        return () => clearTimeout(t);
      }

      return () => {
        stopMusic();
      };
    }, [dailyReward?.lastClaimed, playMusic, stopMusic, tickEnergy]),
  );

  // ===================================================
  // ENERGY TIMER
  // ===================================================

  useEffect(() => {
    const id = setInterval(() => tickEnergy(), 60_000);
    return () => clearInterval(id);
  }, [tickEnergy]);

  // ===================================================
  // TAP SOUND + SPLASH
  // ===================================================

  async function playTapSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/audio/button_click.wav"),
        { shouldPlay: true },
      );
      setSoundInstance(sound);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log("[Audio Engine] Sound asset missing or click error:", error);
    }
  }

  useEffect(() => {
    return soundInstance
      ? () => {
          soundInstance.unloadAsync();
        }
      : undefined;
  }, [soundInstance]);

  // ===================================================
  // ACTION ROUTER
  // ===================================================

  // Actions that require a valid, saved Player Name before they proceed.
  const NAME_GATED_ACTIONS = ["play", "avatar_wing_frame", "stand_avatar"];

  const handleActionTrigger = async (actionName: string) => {
    if (
      NAME_GATED_ACTIONS.includes(actionName) &&
      !isValidPlayerName(useUserStore.getState().username)
    ) {
      pendingActionRef.current = actionName;
      setNameModalVisible(true);
      return;
    }

    await performAction(actionName);
  };

  // The actual navigation/side-effects for a hitbox action, once any Player
  // Name gating has already been satisfied. Split out from handleActionTrigger
  // so the post-name-save resume path can call it directly without re-running
  // (and risking a stale-closure re-trigger of) the gate check above.
  const performAction = async (actionName: string) => {
    console.log(`[Lobby Icon UI Engine] Action executed: ${actionName}`);

    if (["play", "spinwheel", "shop", "dailyreward"].includes(actionName)) {
      setShowSplash(true);
      setTimeout(() => setShowSplash(false), 1000);
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.log("Haptics engine unavailable");
    }

    await playTapSound();

    switch (actionName) {
      case "profile_lvl_playername":
        router.push(ROUTES.PROFILE);
        break;
      case "avatar_wing_frame":
      case "stand_avatar":
        router.push(ROUTES.CUSTOMIZATION);
        break;
      case "shop":
        router.push(ROUTES.SHOP);
        break;
      case "leaderboard":
        router.push(ROUTES.LEADERBOARD);
        break;
      case "achievement":
        router.push(ROUTES.ACHIEVEMENTS);
        break;
      case "settings":
        router.push(ROUTES.SETTINGS);
        break;
      case "dailyreward":
        setDailyModal(true);
        break;
      case "play":
        router.push(ROUTES.LEVEL_SELECT);
        break;
      case "admob":
        await handleWatchStaminaAd();
        break;
      case "gem_pack":
        router.push({ pathname: ROUTES.SHOP, params: { tab: "gems" } });
        break;
      case "legendary_pack":
        router.push({ pathname: ROUTES.SHOP, params: { tab: "cosmetics" } });
        break;
      case "coin":
        router.push({ pathname: ROUTES.SHOP, params: { tab: "play" } });
        break;
      case "gem":
        router.push({ pathname: ROUTES.SHOP, params: { tab: "gems" } });
        break;
      case "stamina":
        router.push(ROUTES.STAMINA);
        break;
      case "spinwheel":
        router.push(ROUTES.SPIN);
        break;
      case "friends":
        router.push(ROUTES.FRIENDS);
        break;
      default:
        console.warn(
          `[Lobby Engine] No destination wired for hitbox "${actionName}".`,
        );
        break;
    }
  };

  // Called when the player submits a valid name from the "HELLO, COMMANDER"
  // modal. Saves it to the existing user store, then resumes whichever
  // gated action (Play / avatar tap) originally triggered the prompt —
  // calling performAction directly so it never re-runs the name gate.
  const handleNameSubmit = useCallback(
    (name: string) => {
      setUsername(name);
      setNameModalVisible(false);
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      if (action) {
        performAction(action);
      }
    },
    [setUsername], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ===================================================
  // HITBOXES
  // ===================================================

  const hitboxes: HitboxItem[] = [
    {
      id: "profile_lvl_playername",
      left: "4.53%",
      top: "1.70%",
      width: "20.32%",
      height: "13.93%",
      label: "Profile",
    },
    {
      id: "settings",
      left: "85.00%",
      top: "4.00%",
      width: "16.00%",
      height: "6.50%",
      label: "Settings",
      iconScale: 0.8,
    },
    {
      id: "stamina",
      left: "82.00%",
      top: "13.00%",
      width: "20.32%",
      height: "4.94%",
      label: `${energy || 0}/${MAX_ENERGY || 20}`,
      hasTextOverlay: true,
      iconScale: 1.3 ,
    },
    {
      id: "gem",
      left: "82.00%",
      top: "20.50%",
      width: "20.32%",
      height: "4.94%",
      label: gems?.toString() || "0",
      hasTextOverlay: true,
      iconScale: 1.3 ,
    },
    {
      id: "coin",
      left: "83.00%",
      top: "28.00%",
      width: "19.35%",
      height: "5.39%",
      label: coins?.toLocaleString() || "0",
      hasTextOverlay: true,
      iconScale: 1.1 ,
    },
    {
      id: "spinwheel",
      left: "76.00%",
      top: "68.5.00%",
      width: "25.15%",
      height: "9.89%",
      label: "Spin",
      iconScale: 1 ,
    },
    {
      id: "avatar_wing_frame",
      left: "7.00%",
      top: "20.20%",
      width: "85.14%",
      height: "32.36%",
      label: "Avatar Frame",
    },
    // =================================================
    // STAND_AVATAR با ICON_SCALE = 3.5
    // =================================================
    {
      id: "stand_avatar",
      left: "29.69%",
      top: "56.58%",
      width: "37.73%",
      height: "6.74%",
      label: "Pedestal",
      iconScale: 2.5, // ← بزرگ‌تر از بقیه
    },
    {
      id: "play",
      left: "21.95%",
      top: "68.00%",
      width: "54.18%",
      height: "9.89%",
      label: "Play",
      iconScale: 1.3,
    },
    {
      id: "dailyreward",
      left: "1.00%",
      top: "71.00%",
      width: "19.35%",
      height: "6.74%",
      label: "Reward",
      iconScale: 1.7,
    },
    {
      id: "legendary_pack",
      left: "1.00%",
      top: "80.00%",
      width: "19.35%",
      height: "6.74%",
      label: "Legendary",
      premium: true,
      iconScale: 1.3,
    },
    {
      id: "gem_pack",
      left: "80.00%",
      top: "79.00%",
      width: "19.35%",
      height: "7.19%",
      label: "Gem Pack",
      premium: true,
      iconScale: 1.2,
    },
    {
      id: "admob",
      left: "30.66%",
      top: "78.40%",
      width: "37.73%",
      height: "5.84%",
      label: "AdMob",
    },
    {
      id: "achievement",
      left: "82.00%",
      top: "85.6.00%",
      width: "15.48%",
      height: "12.58%",
      label: "Badges",
      iconScale: 1.3,
    },
    {
      id: "friends",
      left: "53.60%",
      top: "85.00%",
      width: "15.48%",
      height: "12.58%",
      label: "Friends",
      iconScale: 1.3,
    },
    {
      id: "shop",
      left: "27.83%",
      top: "85.5.00%",
      width: "15.48%",
      height: "12.58%",
      label: "Shop",
      iconScale: 1.4,
    },
    {
      id: "leaderboard",
      left: "3.00%",
      top: "85.5.00%",
      width: "15.48%",
      height: "12.58%",
      label: "Leaderboard",
      iconScale: 1.5,
    },
  ];

  // ===================================================
  // RENDER ICON
  // ===================================================

  const renderComponentUI = (box: HitboxItem, animationDelay = 0) => {
    const scale = box.iconScale ?? ICON_SCALE; // ← استفاده از scale سفارشی

    switch (box.id) {
      case "profile_lvl_playername":
        return (
          <View style={styles.profileDynamicComponentCard}>
            <AvatarFrame
              imageKey={currentAvatar?.imageKey ?? "abigail"}
              frameId={equippedCosmetics?.frame}
              size={42}
              showLevel={false}
            />
            <View style={styles.profileTextWrapperMeta}>
              <Text style={styles.profileUserText} numberOfLines={1}>
                {username || "Player"}
              </Text>
              <Text style={styles.profileLvlText}>LVL {level}</Text>
            </View>
          </View>
        );

      case "avatar_wing_frame":
        return (
          <View style={styles.centerHeroStageWrapperFrame}>
            <FullBodyAvatarStage
              avatarId={currentAvatar?.id ?? selectedAvatarId}
              wingId={equippedWing}
              level={level}
            />
          </View>
        );

      case "coin":
      case "gem":
      case "stamina":
        return (
          <View style={styles.fullSizeContainer}>
            <AnimatedIcon
              animation={getIconAnimation(box.id)}
              delay={animationDelay}
              style={styles.fullSizeContainer}
            >
              <Image
                source={buttonIcons[box.id]}
                style={[
                  styles.buttonImageGraphic,
                  { transform: [{ scale }] }, // ← scale سفارشی
                ]}
              />
            </AnimatedIcon>
            <View style={styles.currencyTextContainerOverlay}>
              <Text style={styles.currencyPillValueText} numberOfLines={1}>
                {box.label}
              </Text>
            </View>
          </View>
        );

      default:
        const hasIconAsset = buttonIcons[box.id] !== undefined;
        return (
          <View style={styles.fullSizeContainer}>
            {hasIconAsset && (
              <AnimatedIcon
                animation={getIconAnimation(box.id)}
                delay={animationDelay}
                style={styles.fullSizeContainer}
              >
                <Image
                  source={buttonIcons[box.id]}
                  style={[
                    styles.buttonImageGraphic,
                    { transform: [{ scale }] }, // ← scale سفارشی
                  ]}
                />
              </AnimatedIcon>
            )}
          </View>
        );
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <View style={styles.viewViewportContainer}>
      <ExpoImage
        source={require("../assets/background/lobby_BG.webp")}
        style={styles.responsiveImageContainerBg}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
      />

      {/*
        Each Lottie layer is wrapped in its own absolutely-positioned View.
        On web, LottieView renders inside a wrapper element that does not
        inherit `position: absolute` from the style prop, so an unwrapped
        layer sits in normal flow and pushes everything below it down by a
        full screen height. The wrapper keeps the layers out of the flow, and
        pointerEvents="none" stops them from swallowing taps meant for the
        buttons underneath.
      */}
      {SHOW_AMBIENT_FX && (
        <>
          <View style={styles.animationLayer} pointerEvents="none">
            <LottieView
              source={require("../assets/animations/wave.json")}
              style={StyleSheet.absoluteFill}
              autoPlay
              loop
              resizeMode="cover"
            />
          </View>

          <View style={styles.animationLayer} pointerEvents="none">
            <LottieView
              source={require("../assets/animations/Particles.json")}
              style={StyleSheet.absoluteFill}
              autoPlay
              loop
              resizeMode="cover"
            />
          </View>
        </>
      )}

      {showSplash && (
        <View style={styles.animationLayer} pointerEvents="none">
          <LottieView
            source={require("../assets/animations/splash.json")}
            style={StyleSheet.absoluteFill}
            autoPlay
            loop={false}
            resizeMode="cover"
            onAnimationFinish={() => setShowSplash(false)}
          />
        </View>
      )}

      <View style={styles.contentOverlay}>
        {hitboxes.map((box, index) => {
          const isPremium = box.premium;
          const PressableComponent = isPremium ? GlowWrapper : WaveWrapper;

          const width = parseFloat(box.width);
          const height = parseFloat(box.height);
          const left = parseFloat(box.left);
          const top = parseFloat(box.top);

          const scaledWidth = width * HITBOX_SCALE;
          const scaledHeight = height * HITBOX_SCALE;
          const scaledLeft = left + (width - scaledWidth) / 2;
          const scaledTop = top + (height - scaledHeight) / 2;

          const areaPct = scaledWidth * scaledHeight;
          const zIndex = Math.max(1, Math.round(HITBOX_Z_BASE - areaPct));

          return (
            <PressableComponent
              key={box.id}
              accessibilityLabel={box.id}
              style={[
                styles.hitboxAbsoluteNode,
                {
                  left: `${scaledLeft}%`,
                  top: `${scaledTop}%`,
                  width: `${scaledWidth}%`,
                  height: `${scaledHeight}%`,
                  zIndex,
                  backgroundColor: debugMode
                    ? "rgba(244, 63, 94, 0.25)"
                    : "transparent",
                  borderWidth: debugMode ? 1 : 0,
                  borderColor: "#f43f5e",
                },
              ]}
              onPress={() => handleActionTrigger(box.id)}
            >
              {renderComponentUI(box, index * 85)}
              {debugMode && !box.hasTextOverlay && (
                <View style={styles.debugLabelMeshCellContainer}>
                  <Text style={styles.debugLabelMeshText} numberOfLines={1}>
                    {box.id}
                  </Text>
                </View>
              )}
            </PressableComponent>
          );
        })}

        <DailyRewardModal
          visible={dailyModal}
          amount={
            DAILY_REWARDS[dailyReward?.currentDay ?? 0]?.coins ??
            DAILY_REWARDS[0].coins
          }
          streak={dailyReward?.streak ?? 0}
          currentDay={dailyReward?.currentDay ?? 0}
          alreadyClaimed={isToday(dailyReward?.lastClaimed ?? null)}
          onClose={() => setDailyModal(false)}
          onClaim={claimDailyReward}
          energyReward={10}
        />

        <PlayerNameModal visible={nameModalVisible} onSubmit={handleNameSubmit} />

        <View
          style={[
            styles.debugPanel,
            {
              bottom: insets.bottom + 20,
            },
          ]}
        >
          <Text style={styles.debugText}>Caliper Debug Mode:</Text>
          <Switch
            value={debugMode}
            onValueChange={setDebugMode}
            trackColor={{
              false: "#475569",
              true: "#3b82f6",
            }}
            thumbColor={debugMode ? "#60a5fa" : "#cbd5e1"}
          />
        </View>
      </View>
    </View>
  );
}

// =====================================================
// PREMIUM GLOW WRAPPER
// =====================================================

function GlowWrapper({ style, onPress, children }: any) {
  const glowAnim = useRef(new RNAnimated.Value(0.15)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(glowAnim, {
          toValue: 0.55,
          duration: 1100,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        RNAnimated.timing(glowAnim, {
          toValue: 0.15,
          duration: 1100,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    ).start();
  }, [glowAnim]);

  return (
    <Pressable onPress={onPress} style={style}>
      <RNAnimated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "rgba(251, 191, 36, 0.15)",
            borderRadius: 12,
            borderWidth: 2,
            borderColor: "#fbbf24",
            opacity: glowAnim,
          },
        ]}
      />
      {children}
    </Pressable>
  );
}

// =====================================================
// WAVE PRESS EFFECT
// =====================================================

function WaveWrapper({ style, onPress, children }: any) {
  const waveScale = useRef(new RNAnimated.Value(0)).current;
  const waveOpacity = useRef(new RNAnimated.Value(0)).current;

  const handlePressIn = () => {
    waveScale.setValue(0.2);
    waveOpacity.setValue(0.5);
    RNAnimated.parallel([
      RNAnimated.timing(waveScale, {
        toValue: 1.35,
        duration: 400,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      RNAnimated.timing(waveOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPress={onPress}
      style={[
        style,
        {
          overflow: "visible",
        },
      ]}
    >
      <RNAnimated.View
        style={{
          position: "absolute",
          top: "25%",
          left: "25%",
          width: "50%",
          height: "50%",
          borderRadius: 999,
          backgroundColor: "rgba(255, 255, 255, 0.35)",
          transform: [{ scale: waveScale }],
          opacity: waveOpacity,
        }}
      />
      {children}
    </Pressable>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  viewViewportContainer: {
    flex: 1,
    backgroundColor: "#02000A",
  },
  responsiveImageContainerBg: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  animationLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentOverlay: {
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  hitboxAbsoluteNode: {
    position: "absolute",
    borderRadius: 8,
    justifyContent: "center",
    overflow: "visible",
  },
  fullSizeContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonImageGraphic: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    // transform از خود کامپوننت می‌آید
  },
  profileDynamicComponentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 99,
    padding: 4,
    width: "100%",
    height: "100%",
  },
  profileTextWrapperMeta: {
    marginLeft: 4,
    flex: 1,
    justifyContent: "center",
  },
  profileUserText: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  profileLvlText: {
    color: "#38bdf8",
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 1,
  },
  currencyTextContainerOverlay: {
    position: "absolute",
    left: "35%",
    right: "12%",
    alignItems: "center",
    justifyContent: "center",
  },
  currencyPillValueText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    textAlign: "center",
  },
  centerHeroStageWrapperFrame: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  debugLabelMeshCellContainer: {
    position: "absolute",
    bottom: -12,
    alignSelf: "center",
    backgroundColor: "#f43f5e",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    zIndex: 10,
  },
  debugLabelMeshText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
  },
  debugPanel: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  debugText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
    marginRight: 6,
  },
});
