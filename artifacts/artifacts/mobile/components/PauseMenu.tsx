import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { GradientButton } from '@/components/GradientButton';

interface PauseMenuProps {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ visible, onResume, onRestart, onExit }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onResume}>
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Ionicons name="pause-circle-outline" size={54} color={GameColors.accentGold} />
        <Text style={styles.title}>Game Paused</Text>
        <GradientButton title="Resume" onPress={onResume} style={styles.fullButton} />
        <TouchableOpacity style={styles.outline} onPress={onRestart}>
          <Text style={styles.outlineText}>Restart</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onExit} style={styles.exit}>
          <Text style={styles.exitText}>Exit to Lobby</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', backgroundColor: GameColors.card, borderWidth: 1, borderColor: GameColors.cardBorder, gap: 14 },
  title: { ...Typography.header, color: GameColors.textWhite, fontSize: 28 },
  fullButton: { width: '100%' },
  outline: { width: '100%', paddingVertical: 15, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: GameColors.border },
  outlineText: { ...Typography.caption, color: GameColors.textWhite, fontFamily: 'Inter_600SemiBold' },
  exit: { padding: 8 },
  exitText: { ...Typography.small, color: GameColors.accentRed },
});