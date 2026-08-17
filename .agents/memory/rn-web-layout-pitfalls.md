---
name: React Native Web layout pitfalls
description: Third-party RN components that silently ignore absolute positioning on web and wreck the layout.
---

## A third-party layer component may ignore `style={StyleSheet.absoluteFill}` on web

`LottieView` (lottie-react-native) applies the `style` prop to an element *inside* its own wrapper on web. The wrapper stays in normal document flow, so a "background animation layer" that is correctly absolute on native becomes a full-height block element on web, pushing everything after it down by one viewport height per layer.

**Symptom:** the screen renders its background but appears to have no content. A DOM scan shows the content exists at `y ≈ N × viewportHeight` (two stacked layers → y ≈ 1800 in a 900px viewport), often with zero/near-zero height because the flex parent has no space left. It reads like missing assets, not like a layout bug — the giveaway is that the offset is an exact multiple of the viewport height.

**Rule:** wrap any full-screen third-party visual layer in your own absolutely-positioned `View` rather than trusting its `style` prop:

```tsx
<View style={styles.animationLayer} pointerEvents="none">
  <LottieView source={...} style={StyleSheet.absoluteFill} autoPlay loop />
</View>
```

`pointerEvents="none"` matters too: a full-screen layer that does honour absolute positioning will otherwise swallow taps meant for the controls beneath it.

**How to apply:** whenever a component is rendered purely as a decorative full-bleed layer, own its positioning yourself. Verify on web specifically — native honours the style prop, so this class of bug never reproduces on a device.

---

## lottie-react-native needs a web-only peer

Web rendering pulls in `@lottiefiles/dotlottie-react`, which is an optional peer and therefore absent until something requests it. Bundling fails with `Unable to resolve module @lottiefiles/dotlottie-react` from inside `lottie-react-native/lib/module/LottieView/index.web.js`.

Install the version that satisfies the host package's declared peer range rather than `latest` — `latest` resolved to a major far ahead of the `^0.6.5` the library expects.
