/**
 * KeyboardAwareScrollViewCompat
 *
 * Drop-in replacement that uses only built-in RN primitives — no native modules
 * required, so it works in Expo Go without a development build.
 */
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
} from 'react-native';

type Props = ScrollViewProps & {
  /** Matches the react-native-keyboard-controller prop name for easy migration */
  bottomOffset?: number;
};

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = 'handled',
  bottomOffset = 16,
  style,
  contentContainerStyle,
  ...props
}: Props) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={bottomOffset}
    >
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        contentContainerStyle={contentContainerStyle}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
