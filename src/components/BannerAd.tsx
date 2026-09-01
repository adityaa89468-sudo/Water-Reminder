import React, { useEffect, useState, useRef } from 'react';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  BannerAdOptions,
  BannerAdPluginEvents,
  AdMobBannerSize
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { initAdMob, ADMOB_CONFIG } from '../utils/admobService';
import { Sparkles, ShieldCheck, Maximize2, ExternalLink, RefreshCw } from 'lucide-react';

interface BannerAdProps {
  unitId?: string;
  position?: 'bottom' | 'top' | 'inline';
  className?: string;
  showBadge?: boolean;
}

export const BannerAd: React.FC<BannerAdProps> = ({
  unitId = ADMOB_CONFIG.bannerUnitId,
  position = 'inline',
  className = '',
  showBadge = true
}) => {
  const isNative = Capacitor.isNativePlatform();
  const [adHeight, setAdHeight] = useState<number>(60);
  const [adWidth, setAdWidth] = useState<number>(320);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container dimensions dynamically on Web to auto-resize ad slot
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const clientWidth = containerRef.current.clientWidth;
        setAdWidth(clientWidth);
        // Adaptive height calculation based on Google AdMob standard adaptive banner ratios
        if (clientWidth <= 360) {
          setAdHeight(50);
        } else if (clientWidth <= 480) {
          setAdHeight(60);
        } else if (clientWidth <= 728) {
          setAdHeight(70);
        } else {
          setAdHeight(90);
        }
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Native Android AdMob Lifecycle
  useEffect(() => {
    if (!isNative) return;

    let isMounted = true;

    const setupNativeBanner = async () => {
      try {
        await initAdMob();

        // Register size change listener for dynamic auto-resizing
        const sizeListener = await AdMob.addListener(
          BannerAdPluginEvents.SizeChanged,
          (size: AdMobBannerSize) => {
            if (isMounted && size.height > 0) {
              setAdHeight(size.height);
              setAdWidth(size.width);
            }
          }
        );

        const loadListener = await AdMob.addListener(
          BannerAdPluginEvents.Loaded,
          () => {
            if (isMounted) {
              setIsLoaded(true);
              setLoadError(null);
            }
          }
        );

        const errorListener = await AdMob.addListener(
          BannerAdPluginEvents.FailedToLoad,
          (error: any) => {
            if (isMounted) {
              setLoadError(error?.message || 'Ad failed to load');
            }
          }
        );

        const options: BannerAdOptions = {
          adId: unitId,
          adSize: BannerAdSize.ADAPTIVE_BANNER, // Auto-resizing adaptive banner
          position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: false // Request real ads as instructed
        };

        await AdMob.showBanner(options);

        return () => {
          sizeListener.remove();
          loadListener.remove();
          errorListener.remove();
          AdMob.hideBanner().catch(() => {});
        };
      } catch (err: any) {
        console.warn('Native AdMob banner setup notice:', err);
        if (isMounted) {
          setLoadError(err?.message || 'Ad initialization notice');
        }
      }
    };

    const cleanupPromise = setupNativeBanner();

    return () => {
      isMounted = false;
      cleanupPromise.then(cleanup => {
        if (cleanup) cleanup();
      });
      AdMob.hideBanner().catch(() => {});
    };
  }, [isNative, unitId, position]);

  if (isNative) {
    // On native, AdMob overlays the native Android View.
    // The spacer dynamically auto-resizes to match the native ad's height so content isn't obscured.
    return (
      <div
        id="native-admob-adaptive-spacer"
        style={{ height: `${Math.max(adHeight, 50)}px`, minHeight: '50px' }}
        className={`w-full transition-all duration-300 pointer-events-none ${className}`}
        aria-hidden="true"
      />
    );
  }

  // Web / Browser Responsive Auto-Resizing Banner View
  return (
    <div
      ref={containerRef}
      id="responsive-banner-ad-container"
      className={`w-full overflow-hidden transition-all duration-300 ${className}`}
    >
      <div className="relative w-full rounded-2xl bg-gradient-to-r from-slate-100/90 via-sky-50/50 to-slate-100/90 dark:from-slate-900 dark:via-sky-950/20 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 shadow-xs flex flex-col justify-between">
        
        {/* Ad Header with AdMob Badge & Auto-Resize info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
              Ad
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>Google AdMob</span>
              <span className="text-[9px] text-sky-600 dark:text-sky-400 font-mono">
                (Adaptive Banner)
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              {adWidth > 0 ? `${Math.round(adWidth)}x${adHeight}px` : 'Auto-Resize'}
            </span>
          </div>
        </div>

        {/* Dynamic Ad Body Content */}
        <div
          style={{ minHeight: `${adHeight}px` }}
          className="w-full rounded-xl bg-white dark:bg-slate-950/80 border border-dashed border-sky-200 dark:border-sky-900/60 p-3 flex items-center justify-between gap-3 transition-all duration-300 hover:border-sky-400 dark:hover:border-sky-600"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Visual Icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>

            {/* Ad Unit Details */}
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  SipLumo Hydration Partner
                </h4>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Live Unit
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                Unit ID: {unitId}
              </p>
            </div>
          </div>

          {/* Call to action pill */}
          <div className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 px-2.5 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800/80">
            <span>Sponsored</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>

        {/* Footer meta text */}
        {showBadge && (
          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 text-[9px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-sky-500" />
              <span>Real AdMob Integration Active</span>
            </span>
            <span className="font-mono text-[8.5px]">
              App ID: {ADMOB_CONFIG.appId.slice(0, 18)}...
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

export default BannerAd;
