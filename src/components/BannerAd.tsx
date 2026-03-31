import React, { useEffect } from 'react';
import { AdMob, BannerAdPosition, BannerAdSize, BannerAdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

interface BannerAdProps {
  unitId: string;
}

const BannerAd: React.FC<BannerAdProps> = ({ unitId }) => {
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative) {
      const showBanner = async () => {
        const options: BannerAdOptions = {
          adId: unitId,
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: true // Set to false for production
        };
        await AdMob.showBanner(options);
      };

      showBanner();

      return () => {
        AdMob.hideBanner();
      };
    }
  }, [isNative, unitId]);

  if (isNative) {
    // On native, the banner is rendered by the AdMob SDK outside the webview
    // We just need a spacer to prevent content from being hidden behind the ad
    return <div className="w-full h-[50px] bg-transparent" />;
  }

  return (
    <div className="w-full bg-slate-100 border-y border-slate-200 flex flex-col items-center justify-center p-2 min-h-[60px] overflow-hidden">
      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Advertisement</div>
      <div className="w-full max-w-[320px] h-[50px] bg-slate-200 rounded flex items-center justify-center border border-dashed border-slate-300">
        <span className="text-xs font-mono text-slate-500 truncate px-2">
          {unitId}
        </span>
      </div>
      <p className="text-[8px] text-slate-400 mt-1 italic">
        AdMob Banner Slot (Web Placeholder)
      </p>
    </div>
  );
};

export default BannerAd;
