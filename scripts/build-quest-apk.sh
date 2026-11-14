#!/usr/bin/env bash
set -euo pipefail

# Script de compilation APK pour Meta Quest 3 (Horizon OS) via Bubblewrap (TWA WebXR)
# Prérequis sur votre machine locale : Node.js >= 18, Java JDK 17+, Android SDK (ou laissez Bubblewrap les installer).

echo "=== Uranie VR — Préparation APK Meta Quest 3 ==="
echo "1. Assurez-vous que l'application est déployée en HTTPS (ou utilisez l'URL de partage publiée)."
echo "2. Initialisation / mise à jour du projet Android Meta Quest..."

if [ ! -f "./twa-manifest.json" ]; then
  echo "Erreur : twa-manifest.json introuvable."
  exit 1
fi

npx --yes @bubblewrap/cli update --manifest="./twa-manifest.json" || npx --yes @bubblewrap/cli init --manifest="./twa-manifest.json"
npx --yes @bubblewrap/cli build

echo ""
echo "APK généré : app-release-signed.apk"
echo "Pour l'installer sur votre Meta Quest 3 branché en USB (mode développeur activé) :"
echo "  adb install -r app-release-signed.apk"
