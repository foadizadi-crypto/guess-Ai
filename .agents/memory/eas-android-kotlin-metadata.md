---
name: EAS Android Kotlin metadata compatibility
description: How to handle Expo SDK 54 Android builds when Google Mobile Ads ships newer Kotlin metadata.
---

Google Mobile Ads can ship Kotlin metadata newer than the compiler used by Expo SDK 54. EAS may fail with an incompatible metadata-version error even when the Java/Android dependency is otherwise compatible.

**Why:** The Ads dependency and Expo's Kotlin/KSP toolchain can advance on different schedules, and managed prebuild configuration alone may not affect every Gradle task.

**How to apply:** Keep the generated native Android project and lockfile synchronized for EAS, set the Gradle Kotlin version through expo-build-properties, and add `-Xskip-metadata-version-check` to Kotlin compile tasks only when the cloud log identifies this exact metadata mismatch.