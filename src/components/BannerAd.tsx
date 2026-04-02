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
    <div className="w-full bg-white border border-slate-100 rounded-3xl flex flex-col items-center justify-center p-4 min-h-[100px] overflow-hidden shadow-sm">
      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
        Advertisement
        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
      </div>
      <div className="w-full max-w-[320px] h-[50px] bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-200 group hover:border-blue-200 transition-colors">
        <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-400 transition-colors truncate px-4">
          {unitId}
        </span>
      </div>
      <p className="text-[9px] text-slate-300 mt-3 italic font-medium">
        AdMob Banner Slot
      </p>
    </div>
  );
};

export default BannerAd;
