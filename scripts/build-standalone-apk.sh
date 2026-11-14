#!/usr/bin/env bash
set -euo pipefail

# Script de compilation d'un APK 100% autonome (hors-ligne) via Capacitor Android
# Prérequis locaux : Node.js >= 20, Java JDK 17+, Android SDK

echo "=== Uranie VR — Compilation APK Autonome Hors-Ligne (Capacitor) ==="
npm run build

if [ ! -d "android" ]; then
  echo "Création du projet Android Capacitor..."
  npx cap add android
fi

echo "Synchronisation du bundle dist/ dans Android..."
npx cap sync android

MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ] && ! grep -q "screenOrientation" "$MANIFEST"; then
  sed -i.bak 's/<activity/<activity android:screenOrientation="sensorLandscape"/' "$MANIFEST" || true
  rm -f "${MANIFEST}.bak"
fi

echo "Compilation Gradle assembleDebug..."
cd android
chmod +x gradlew
./gradlew assembleDebug
cd ..

cp android/app/build/outputs/apk/debug/app-debug.apk ./uranie-vr-autonome.apk

echo ""
echo "APK autonome généré : ./uranie-vr-autonome.apk"
echo "Pour l'injecter sur votre Meta Quest branché en USB :"
echo "  adb install -r uranie-vr-autonome.apk"
