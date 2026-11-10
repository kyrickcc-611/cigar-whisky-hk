import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  phase: string;
  description: string;
}

/**
 * 尚未實作頁面的暫用畫面。
 * 每個 Phase 完成後會由真正頁面取代，避免 Phase 0 出現 404 死連結。
 */
export function ComingSoon({ title, phase, description }: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <div className="card text-center">
        <span className="badge mx-auto">
          <Clock className="h-3 w-3" />
          {phase}
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">{description}</p>
        <Link href="/" className="btn-secondary mt-6">
          <ArrowLeft className="h-4 w-4" />
          返回首頁
        </Link>
      </div>
    </div>
  );
}
