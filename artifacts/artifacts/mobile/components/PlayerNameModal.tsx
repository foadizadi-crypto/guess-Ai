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
  ActivityIndicator,
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
  /**
   * Called with the trimmed name once the player submits. Must resolve to
   * `{ ok: true }` once the server confirms the nickname was registered, or
   * `{ ok: false, message }` to keep the modal open and show an inline
   * error (e.g. "Already taken"). The modal has no dismiss affordance —
   * gameplay stays locked until this resolves with `ok: true`.
   */
  onSubmit: (name: string) => Promise<{ ok: boolean; message?: string }>;
}

/**
 * Blocking "commander" name-entry modal. Shown whenever a signed-in player
 * without a registered nickname attempts to Play or open their avatar.
 * Has no dismiss/close affordance by design — it only disappears once the
 * backend confirms the nickname was registered.
 */
export const PlayerNameModal: React.FC<PlayerNameModalProps> = ({
  visible,
  onSubmit,
}) => {
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = draft.trim();
  const canContinue = isValidPlayerName(draft) && !submitting;

  const handleContinue = useCallback(async () => {
    if (!canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    setError(null);
    const result = await onSubmit(trimmed);
    setSubmitting(false);
    if (result.ok) {
      setDraft('');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.message ?? 'Something went wrong. Please try again.');
    }
  }, [canContinue, trimmed, onSubmit]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {
        /* No-op: the modal cannot be dismissed without a valid, registered name. */
      }}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} />
        <View style={styles.card}>
          <Text style={styles.title}>HELLO, COMMANDER</Text>
          <Text style={styles.sub}>What&apos;s your nickname?</Text>

          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={(v) => {
              setDraft(v);
              if (error) setError(null);
            }}
            placeholder="Nickname"
            placeholderTextColor={GameColors.textSecondary}
            maxLength={MAX_NAME_LENGTH}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!submitting}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            testID="player-name-input"
          />

          {error && (
            <Text style={styles.errorText} testID="player-name-error">
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.85}
            testID="player-name-continue"
          >
            {submitting ? (
              <ActivityIndicator color={GameColors.backgroundPrimary} />
            ) : (
              <Text style={styles.continueText}>CONTINUE</Text>
            )}
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
    marginBottom: 8,
  },
  errorText: {
    ...Typography.small,
    color: GameColors.accentRed ?? '#ff5c5c',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  continueBtn: {
    width: '100%',
    backgroundColor: GameColors.accentGold,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
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
