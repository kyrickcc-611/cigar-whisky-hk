import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/ComingSoon';

export const metadata: Metadata = { title: '尋找酒吧' };

/** Phase 3 會實作：關鍵字搜尋、地區／類型篩選、距離排序、地圖模式 */
export default function BarsPage() {
  return (
    <ComingSoon
      phase="Phase 3"
      title="酒吧列表與搜尋即將推出"
      description="這裡將會有關鍵字搜尋、地區及類型篩選、即時營業狀態、以手機定位計算距離並排序，以及地圖模式顯示附近酒吧。"
    />
  );
}
