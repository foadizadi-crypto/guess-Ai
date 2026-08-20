import React, { useCallback, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';

const MAX_NAME_LENGTH = 20;

/** A saved name must have at least one non-whitespace character. */
export function isValidPlayerName(name: string): boolean {
  return name.trim().length > 0;
}

interface PlayerNameModalProps {
  visible: boolean;
  onSubmit: (name: string) => void;
}

/**
 * Blocking "commander" name-entry modal. Shown whenever the player attempts
 * to Play or open their avatar without a saved, valid username. Has no
 * dismiss/close affordance by design — it only disappears once a valid name
 * is submitted and saved to the existing user store.
 */
export const PlayerNameModal: React.FC<PlayerNameModalProps> = ({
  visible,
  onSubmit,
}) => {
  const [draft, setDraft] = useState('');

  const trimmed = draft.trim();
  const canContinue = isValidPlayerName(draft);

  const handleContinue = useCallback(() => {
    if (!canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(trimmed);
    setDraft('');
  }, [canContinue, trimmed, onSubmit]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {
        /* No-op: the modal cannot be dismissed without a valid name. */
      }}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} />
        <View style={styles.card}>
          <Text style={styles.title}>HELLO, COMMANDER</Text>
          <Text style={styles.sub}>What&apos;s your name?</Text>

          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Name"
            placeholderTextColor={GameColors.textSecondary}
            maxLength={MAX_NAME_LENGTH}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            testID="player-name-input"
          />

          <TouchableOpacity
            style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.85}
            testID="player-name-continue"
          >
            <Text style={styles.continueText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: GameColors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: GameColors.cardBorder,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...Typography.header,
    color: GameColors.accentGold,
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    letterSpacing: 1,
  },
  sub: {
    ...Typography.caption,
    color: GameColors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: GameColors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: GameColors.textWhite,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    marginBottom: 16,
  },
  continueBtn: {
    width: '100%',
    backgroundColor: GameColors.accentGold,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  continueText: {
    ...Typography.body,
    color: GameColors.backgroundPrimary,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 16,
  },
});
