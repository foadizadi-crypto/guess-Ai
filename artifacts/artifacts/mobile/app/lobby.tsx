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
  Image,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { AvatarFrame } from '@/components/AvatarFrame';
import { AnimatedIcon } from '@/components/AnimatedIcon';
import { DailyRewardModal } from '@/components/DailyRewardModal';
import { useUserStore } from '@/store/userStore';
import { useAudio } from '@/hooks/useAudio';
import { isToday } from '@/utils';
import { MAX_ENERGY } from '@/constants/economy';

const { width: SW, height: SH } = Dimensions.get('window');
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface HitboxItem {
  id: string;
  left: string;
  top: string;
  width: string;
  height: string;
  label: string;
  premium?: boolean;
  hasTextOverlay?: boolean;
}

// --- 1. Static Asset Mapping Table for your Button Icons Folder ---
// Place your individual button PNG images directly inside: assets/icon/
const buttonIcons: Record<string, any> = {
  coin: require('../assets/icon/coin.png'),
  gem: require('../assets/icon/gem.png'),
  stamina: require('../assets/icon/stamina.png'),
  spinwheel: require('../assets/icon/spinwheel.png'),
  settings: require('../assets/icon/settings.png'),
  play: require('../assets/icon/play.png'),
  legendary_pack: require('../assets/icon/legendary_pack.png'),
  gem_pack: require('../assets/icon/gem_pack.png'),
  admob: require('../assets/icon/AdMob_BG.png'),
  leaderboard: require('../assets/icon/leaderboard.png'),
  dailyreward: require('../assets/icon/daily-reward.jpg'),
  shop: require('../assets/icon/shop.png'),
  friends: require('../assets/icon/friends.png'),
  achievement: require('../assets/icon/achievement.png'),
  stand_avatar: require('../assets/icon/avatar_pedestal.png'),
};

/**
 * Production-Grade 1080x2340 Icon Asset-Driven Lobby Screen Component
 * File Path: app/lobby.tsx (Strict Expo Router TSX Compliance)
 * Loads custom button image files dynamically into your exact measured percentage bounds.
 */
export default function LobbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [dailyModal, setDailyModal] = useState<boolean>(false);
  const [soundInstance, setSoundInstance] = useState<Audio.Sound | null>(null);

  // --- 2. Real-Time Global States from your User Store Context ---
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

  // --- 3. Background Track Loops Handler on Screen Target Focus ---
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

  // --- 4. Stable Native UI Tap Feedback Sound Player ---
  async function playTapSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/audio/button_click.wav'),
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

  // --- 5. Centralized Action Pipeline Route Switch Listener ---
  const handleActionTrigger = async (actionName: string) => {
    console.log(`[Lobby Icon UI Engine] Action executed: ${actionName}`);

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

  // --- 6. Pristine 1080x2340 Proportional UI Component Matrix Array ---
  const hitboxes: HitboxItem[] = [
    { id: 'profile_lvl_playername', left: '4.53%', top: '1.70%', width: '20.32%', height: '13.93%', label: 'Profile' },
    { id: 'coin', left: '28.72%', top: '2.37%', width: '19.35%', height: '5.39%', label: coins?.toLocaleString() || '0', hasTextOverlay: true },
    { id: 'gem', left: '50.97%', top: '2.54%', width: '20.32%', height: '4.94%', label: gems?.toString() || '0', hasTextOverlay: true },
    { id: 'stamina', left: '74.19%', top: '2.64%', width: '20.32%', height: '4.94%', label: `${energy || 0}/${MAX_ENERGY || 20}`, hasTextOverlay: true },
    { id: 'spinwheel', left: '67.42%', top: '10.70%', width: '25.15%', height: '9.89%', label: 'Spin' },
    { id: 'settings', left: '74.00%', top: '21.50%', width: '16.00%', height: '6.50%', label: 'Settings' },
    { id: 'avatar_wing_frame', left: '8.40%', top: '23.20%', width: '85.14%', height: '32.36%', label: 'Avatar Frame' },
    { id: 'stand_avatar', left: '29.69%', top: '56.58%', width: '37.73%', height: '6.74%', label: 'Pedestal' },
    { id: 'play', left: '21.95%', top: '65.00%', width: '54.18%', height: '9.89%', label: 'Play' },
    { id: 'legendary_pack', left: '3.57%', top: '75.78%', width: '19.35%', height: '6.74%', label: 'Legendary', premium: true },
    { id: 'gem_pack', left: '74.19%', top: '76.19%', width: '19.35%', height: '7.19%', label: 'Gem Pack', premium: true },
    { id: 'admob', left: '30.66%', top: '76.40%', width: '37.73%', height: '5.84%', label: 'AdMob' },
    { id: 'leaderboard', left: '4.53%', top: '83.99%', width: '15.48%', height: '12.58%', label: 'Leaderboard' },
    { id: 'dailyreward', left: '22.92%', top: '84.60%', width: '15.48%', height: '12.58%', label: 'Reward' },
    { id: 'shop', left: '41.30%', top: '84.95%', width: '15.48%', height: '12.58%', label: 'Shop' },
    { id: 'friends', left: '59.68%', top: '84.84%', width: '15.48%', height: '12.58%', label: 'Friends' },
    { id: 'achievement', left: '80.00%', top: '84.51%', width: '15.48%', height: '12.58%', label: 'Badges' },
  ];

  // Dynamically renders the correct local graphic or component based on ID
  const renderComponentUI = (box: HitboxItem, animationDelay = 0) => {
    switch (box.id) {
      case 'profile_lvl_playername':
        return (
          <View style={styles.profileDynamicComponentCard}>
            <AvatarFrame 
              imageKey={currentAvatar?.imageKey ?? 'abigail'} 
              frameId={equippedCosmetics?.frame} 
              size={42} 
              showLevel={false} 
            />
            <View style={styles.profileTextWrapperMeta}>
              <Text style={styles.profileUserText} numberOfLines={1}>{username || 'Player'}</Text>
              <Text style={styles.profileLvlText}>LVL {level}</Text>
            </View>
          </View>
        );

      case 'avatar_wing_frame':
        return (
          <View style={styles.centerHeroStageWrapperFrame}>
            <AvatarFrame 
              imageKey={currentAvatar?.imageKey ?? 'abigail'} 
              frameId={equippedCosmetics?.frame} 
              size={130} 
              showLevel 
              level={level} 
            />
          </View>
        );

      case 'coin':
      case 'gem':
      case 'stamina':
        return (
          <View style={styles.fullSizeContainer}>
            <AnimatedIcon animation="pulse" delay={animationDelay} style={styles.fullSizeContainer}>
              <Image source={buttonIcons[box.id]} style={styles.buttonImageGraphic} />
            </AnimatedIcon>
            <View style={styles.currencyTextContainerOverlay}>
              <Text style={styles.currencyPillValueText} numberOfLines={1}>{box.label}</Text>
            </View>
          </View>
        );

      default:
        // Renders the specific PNG asset from your icons folder directly
        const hasIconAsset = buttonIcons[box.id] !== undefined;
        const isFriendsLocked = box.id === 'friends';

        return (
          <View style={[styles.fullSizeContainer, isFriendsLocked && { opacity: 0.45 }]}>
            {hasIconAsset && (
              <AnimatedIcon
                animation={box.id === 'spinwheel' ? 'spin' : 'float'}
                delay={animationDelay}
                style={styles.fullSizeContainer}
              >
                <Image source={buttonIcons[box.id]} style={styles.buttonImageGraphic} />
              </AnimatedIcon>
            )}
          </View>
        );
    }
  };

  return (
    <View style={styles.viewViewportContainer}>
      <ImageBackground
        source={require('../assets/background/lobby_BG.png')}
        style={styles.responsiveImageContainerBg}
        resizeMode="stretch"
      >
        {hitboxes.map((box, index) => {
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
                  backgroundColor: debugMode ? 'rgba(244, 63, 94, 0.25)' : 'transparent',
                  borderWidth: debugMode ? 1 : 0,
                  borderColor: '#f43f5e',
                }
              ]}
              onPress={() => handleActionTrigger(box.id)}
            >
              {renderComponentUI(box, index * 85)}
              
              {debugMode && !box.hasTextOverlay && (
                <View style={styles.debugLabelMeshCellContainer}>
                  <Text style={styles.debugLabelMeshText} numberOfLines={1}>{box.id}</Text>
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
          <Text style={styles.debugText}>Caliper Debug Mode:</Text>
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
  const glowAnim = useRef(new RNAnimated.Value(0.15)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(glowAnim, { toValue: 0.55, duration: 1100, useNativeDriver: USE_NATIVE_DRIVER }),
        RNAnimated.timing(glowAnim, { toValue: 0.15, duration: 1100, useNativeDriver: USE_NATIVE_DRIVER }),
      ])
    ).start();
  }, [glowAnim]);

  return (
    <Pressable onPress={onPress} style={style}>
      <RNAnimated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(251, 191, 36, 0.15)',
            borderRadius: 12,
            borderWidth: 2,
            borderColor: '#fbbf24',
            opacity: glowAnim,
          }
        ]}
      />
      {children}
    </Pressable>
  );
}

function WaveWrapper({ style, onPress, children, accessibilityLabel }: any) {
  const waveScale = useRef(new RNAnimated.Value(0)).current;
  const waveOpacity = useRef(new RNAnimated.Value(0)).current;

  const handlePressIn = () => {
    if (accessibilityLabel === 'friends') return;

    waveScale.setValue(0.2);
    waveOpacity.setValue(0.5);
    RNAnimated.parallel([
      RNAnimated.timing(waveScale, { toValue: 1.35, duration: 400, useNativeDriver: USE_NATIVE_DRIVER }),
      RNAnimated.timing(waveOpacity, { toValue: 0, duration: 400, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPress={onPress}
      style={[style, { overflow: 'hidden' }]}
    >
      <RNAnimated.View
        style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          width: '50%',
          height: '50%',
          borderRadius: 999,
          backgroundColor: 'rgba(255, 255, 255, 0.35)',
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
    borderRadius: 8,
    justifyContent: 'center',
  },
  fullSizeContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonImageGraphic: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  profileDynamicComponentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 99,
    padding: 4,
    width: '100%',
    height: '100%',
  },
  profileTextWrapperMeta: {
    marginLeft: 4,
    flex: 1,
    justifyContent: 'center',
  },
  profileUserText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  profileLvlText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 1,
  },
  currencyTextContainerOverlay: {
    position: 'absolute',
    left: '35%',
    right: '12%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPillValueText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  centerHeroStageWrapperFrame: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugLabelMeshCellContainer: {
    position: 'absolute',
    bottom: -12,
    alignSelf: 'center',
    backgroundColor: '#f43f5e',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    zIndex: 10,
  },
  debugLabelMeshText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  debugPanel: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
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
