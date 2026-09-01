import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  AdMobBannerSize
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export const ADMOB_CONFIG = {
  appId: 'ca-app-pub-9364231981895017~3624609338',
  bannerUnitId: 'ca-app-pub-9364231981895017/3836574355'
};

let isInitialized = false;

/**
 * Initializes the AdMob SDK on native Android/iOS
 */
export async function initAdMob(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  if (isInitialized) {
    return true;
  }

  try {
    await AdMob.initialize({
      testingDevices: [],
      initializeForTesting: false // Real production ads
    });
    isInitialized = true;
    console.log('AdMob initialized successfully for real ads');
    return true;
  } catch (error) {
    console.warn('AdMob initialization error:', error);
    return false;
  }
}

/**
 * Shows an auto-resizing adaptive banner ad
 */
export async function showAdaptiveBanner(
  adUnitId: string = ADMOB_CONFIG.bannerUnitId,
  position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  await initAdMob();

  const options: BannerAdOptions = {
    adId: adUnitId,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: position,
    margin: 0,
    isTesting: false // Production real ads
  };

  try {
    await AdMob.showBanner(options);
    return true;
  } catch (error) {
    console.error('Failed to show AdMob adaptive banner:', error);
    return false;
  }
}

/**
 * Hides the active banner
 */
export async function hideBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.hideBanner();
  } catch (error) {
    console.warn('Failed to hide banner:', error);
  }
}

/**
 * Removes the banner from view
 */
export async function removeBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.removeBanner();
  } catch (error) {
    console.warn('Failed to remove banner:', error);
  }
}
