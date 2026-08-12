import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  Pressable,
  Platform,
  Alert,
  Dimensions,
  Switch,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { AvatarFrame } from '@/components/AvatarFrame';
import { DailyRewardModal } from '@/components/DailyRewardModal';
import { useUserStore } from '@/store/userStore';
import { useAudio } from '@/hooks/useAudio';
import { isToday } from '@/utils';
import { MAX_ENERGY } from '@/constants/economy';

const { width: SW, height: SH } = Dimensions.get('window');

interface HitboxItem {
  id: string;
  left: string;
  top: string;
  width: string;
  height: string;
  label: string;
  premium?: boolean;
}

/**
 * Strict TypeScript 17-Hitbox Core Lobby Screen Component
 * File Path: app/lobby.tsx (Expo Router TypeScript Structure)
 * Retains 100% of your exact measured layout matrix dimensions.
 */
export default function LobbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [dailyModal, setDailyModal] = useState<boolean>(false);
  const [soundInstance, setSoundInstance] = useState<Audio.Sound | null>(null);

  // --- 1. Real-Time Global States from your User Store Context ---
  const {
    username,
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
  } = useUserStore();

  const { playMusic, stopMusic } = useAudio();
  const currentAvatar = avatars?.find((avatar) => avatar.id === selectedAvatarId);

  // --- 2. Background Track Loops Handler on Screen Target Focus ---
  useFocusEffect(
    useCallback(() => {
      playMusic('menu_music');
      tickEnergy();
      
      const claimed = isToday(dailyReward?.lastClaimed);
      if (!claimed) {
        const t = setTimeout(() => setDailyModal(true), 900);
        return () => clearTimeout(t);
      }
      
      return () => {
        stopMusic();
      };
    }, [dailyReward?.lastClaimed, playMusic, stopMusic, tickEnergy])
  );

  useEffect(() => {
    const id = setInterval(() => tickEnergy(), 60_000);
    return () => clearInterval(id);
  }, [tickEnergy]);

  // --- 3. Stable Native UI Tap Feedback Sound Player ---
  async function playTapSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/click.mp3'),
        { shouldPlay: true }
      );
      setSoundInstance(sound);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('[Audio Engine] Sound asset missing or click error:', error);
    }
  }

  useEffect(() => {
    return soundInstance ? () => { soundInstance.unloadAsync(); } : undefined;
  }, [soundInstance]);

  // --- 4. Centralized Action Pipeline Route Switch Listener ---
  const handleActionTrigger = async (actionName: string) => {
    console.log(`[Lobby Hitbox Engine] Mapped interaction captured: ${actionName}`);

    if (actionName === 'friends') {
      console.log('[Lobby Engine] Friends action ignored per project directive.');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.log('Haptics engine unavailable on active device hardware layer');
    }

    await playTapSound();

    switch (actionName) {
      case 'profile_lvl_playername':
      case 'avatar_wing_frame':
        router.push('/profile');
        break;
      case 'shop':
        router.push('/shop');
        break;
      case 'leaderboard':
        router.push('/leaderboard');
        break;
      case 'achievement':
        router.push('/achievement');
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'dailyreward':
        setDailyModal(true);
        break;
      case 'play':
        router.push('/play');
        break;
      case 'admob':
        router.push('/admob');
        break;
      case 'gem_pack':
        router.push('/gem_pack');
        break;
      case 'legendary_pack':
        router.push('/legendary_pack');
        break;
      default:
        Alert.alert("Interaction Captured", `Action Variable Name executed: ${actionName}`);
        break;
    }
  };

  // --- 5. Pristine 1080x2340 Proportional Percentage Hitbox Matrix Array ---
  const hitboxes: HitboxItem[] = [
    { id: 'profile_lvl_playername', left: '4.53%', top: '1.70%', width: '20.32%', height: '13.93%', label: 'Profile UI' },
    { id: 'coin', left: '28.72%', top: '2.37%', width: '19.35%', height: '5.39%', label: coins?.toLocaleString() || '0' },
    { id: 'gem', left: '50.97%', top: '2.54%', width: '20.32%', height: '4.94%', label: gems?.toString() || '0' },
    { id: 'stamina', left: '74.19%', top: '2.64%', width: '20.32%', height: '4.94%', label: `${energy || 0}/${MAX_ENERGY || 20}` },
    { id: 'spinwheel', left: '67.42%', top: '10.70%', width: '25.15%', height: '9.89%', label: 'Spin Wheel' },
    { id: 'settings', left: '74.00%', top: '21.50%', width: '16.00%', height: '6.50%', label: 'Settings' },
    { id: 'avatar_wing_frame', left: '8.40%', top: '23.20%', width: '85.14%', height: '32.36%', label: 'Avatar Center Frame' },
    { id: 'stand_avatar', left: '29.69%', top: '56.58%', width: '37.73%', height: '6.74%', label: 'Stand Avatar Area' },
    { id: 'play', left: '21.95%', top: '65.00%', width: '54.18%', height: '9.89%', label: '🚀 PLAY' },
    { id: 'legendary_pack', left: '3.57%', top: '75.78%', width: '19.35%', height: '6.74%', label: 'Legendary Pack', premium: true },
    { id: 'gem_pack', left: '74.19%', top: '76.19%', width: '19.35%', height: '7.19%', label: 'Gem Pack', premium: true },
    { id: 'admob', left: '30.66%', top: '76.40%', width: '37.73%', height: '5.84%', label: 'Watch Ad' },
    { id: 'leaderboard', left: '4.53%', top: '83.99%', width: '15.48%', height: '13.93%', label: 'Leaderboard' },
    { id: 'dailyreward', left: '22.92%', top: '84.60%', width: '15.48%', height: '13.03%', label: 'Daily Reward' },
    { id: 'shop', left: '41.30%', top: '84.95%', width: '15.48%', height: '12.58%', label: 'Shop Center' },
    { id: 'friends', left: '59.68%', top: '84.84%', width: '15.48%', height: '12.58%', label: 'Friends (Locked)' },
    { id: 'achievement', left: '80.00%', top: '84.51%', width: '15.48%', height: '12.58%', label: 'Achievements' },
  ];

  return (
    <View style={styles.viewViewportContainer}>
      <ImageBackground
        source={require('../assets/background/lobby_bg.png')}
        style={styles.responsiveImageContainerBg}
        resizeMode="stretch"
      >
        {hitboxes.map((box) => {
          const isPremium = box.premium;
          const PressableComponent = isPremium ? GlowWrapper : WaveWrapper;

          return (
            <PressableComponent
              key={box.id}
              accessibilityLabel={box.id}
              style={[
                styles.hitboxAbsoluteNode,
                {
                  left: box.left,
                  top: box.top,
                  width: box.width,
                  height: box.height,
                  backgroundColor: debugMode ? 'rgba(16, 185, 129, 0.35)' : 'transparent',
                  borderWidth: debugMode ? 1 : 0,
                  borderColor: box.id === 'settings' ? '#f43f5e' : '#10b981',
                }
              ]}
              onPress={() => handleActionTrigger(box.id)}
            >
              {debugMode && (
                <View style={styles.debugLabelMeshCellContainer}>
                  <Text style={styles.debugLabelMeshText} numberOfLines={1}>
                    {box.id === 'coin' || box.id === 'gem' || box.id === 'stamina' ? box.label : box.id}
                  </Text>
                </View>
              )}
            </PressableComponent>
          );
        })}

        <DailyRewardModal
          visible={dailyModal}
          onClose={() => setDailyModal(false)}
          onClaim={claimDailyReward}
        />

        <View style={[styles.debugPanel, { bottom: insets.bottom + 20 }]}>
          <Text style={styles.debugText}>Show Hitboxes (Debug Mesh):</Text>
          <Switch
            value={debugMode}
            onValueChange={setDebugMode}
            trackColor={{ false: '#475569', true: '#3b82f6' }}
            thumbColor={debugMode ? '#60a5fa' : '#cbd5e1'}
          />
        </View>

      </ImageBackground>
    </View>
  );
}

// ─── Custom Animated Response Effect Framework Wrappers ───

function GlowWrapper({ style, onPress, children }: any) {
  const glowAnim = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.65, duration: 1100, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.15, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, [glowAnim]);

  return (
    <Pressable onPress={onPress} style={style}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#ffffff',
            opacity: glowAnim,
            borderRadius: 6,
            borderWidth: 2.5,
            borderColor: '#fbbf24',
          }
        ]}
      />
      {children}
    </Pressable>
  );
}

function WaveWrapper({ style, onPress, children, accessibilityLabel }: any) {
  const waveScale = useRef(new Animated.Value(0)).current;
  const waveOpacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (accessibilityLabel === 'friends') return;

    waveScale.setValue(0.2);
    waveOpacity.setValue(0.65);
    Animated.parallel([
      Animated.timing(waveScale, { toValue: 1.35, duration: 450, useNativeDriver: true }),
      Animated.timing(waveOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPress={onPress}
      style={[style, { overflow: 'hidden' }]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          width: '50%',
          height: '50%',
          borderRadius: 999,
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          transform: [{ scale: waveScale }],
          opacity: waveOpacity,
        }}
      />
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  viewViewportContainer: {
    flex: 1,
    backgroundColor: '#02000A',
  },
  responsiveImageContainerBg: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  hitboxAbsoluteNode: {
    position: 'absolute',
    borderRadius: 6,
  },
  debugLabelMeshCellContainer: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 3,
    paddingHorizontal: 2,
  },
  debugLabelMeshText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  debugPanel: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  debugText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 6,
  }
});
