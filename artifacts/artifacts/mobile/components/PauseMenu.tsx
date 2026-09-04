import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { layoutStyles, usePopupChromeSize } from '@/theme/webLayout';
import { GradientButton } from '@/components/GradientButton';

interface PauseMenuProps {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ visible, onResume, onRestart, onExit }) => {
  const popupH = usePopupChromeSize();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onResume}>
      <View style={layoutStyles.popupBackdrop}>
        <View style={[layoutStyles.popupCard, { height: popupH }]}>
          <Ionicons name="pause-circle-outline" size={54} color={GameColors.accentGold} />
          <Text style={layoutStyles.popupTitle}>Game Paused</Text>
          <ScrollView style={layoutStyles.popupScroller} contentContainerStyle={layoutStyles.popupScrollContent}>
            <GradientButton title="Resume" onPress={onResume} style={styles.fullButton} />
            <TouchableOpacity style={styles.outline} onPress={onRestart}>
              <Text style={styles.outlineText}>Restart</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onExit} style={styles.exit}>
              <Text style={styles.exitText}>Exit to Lobby</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullButton: { width: '100%' },
  outline: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GameColors.border,
    marginTop: 12,
  },
  outlineText: { ...Typography.caption, color: GameColors.textWhite, fontFamily: 'Inter_600SemiBold' },
  exit: { padding: 8, marginTop: 8 },
  exitText: { ...Typography.small, color: GameColors.accentRed },
});