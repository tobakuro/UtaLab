import Link from 'next/link';

function TopTab({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center border-r border-gray-700 px-5 text-sm font-bold transition-colors ${
        active ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

function BigButton({
  href,
  icon,
  label,
  sub,
  color,
}: {
  href: string;
  icon: string;
  label: string;
  sub: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 rounded text-white transition-opacity hover:opacity-90 ${color}`}
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-base font-black tracking-wide">{label}</span>
      <span className="text-xs opacity-75">{sub}</span>
    </Link>
  );
}

function MidButton({
  href,
  icon,
  label,
  color,
  disabled,
}: {
  href: string;
  icon: string;
  label: string;
  color: string;
  disabled?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-center gap-2 rounded text-sm font-bold text-white transition-opacity hover:opacity-90 ${color} ${
        disabled ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function SmallButton({ icon, label, color = 'bg-indigo-950' }: { icon: string; label: string; color?: string }) {
  return (
    <div className={`flex items-center justify-center gap-1 rounded text-xs font-bold text-gray-300 ${color}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-700 text-[10px] font-bold text-white">
        {n}
      </span>
      <span className="text-xs text-gray-600">{text}</span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-200 font-sans">
      {/* ===== ヘッダー ===== */}
      <header className="flex h-12 shrink-0 items-stretch border-b-2 border-gray-800 bg-gray-950">
        <div className="flex items-center border-r border-gray-700 px-5">
          <span className="text-lg font-black tracking-widest text-white">UtaLab</span>
        </div>
        <nav className="flex items-stretch">
          <TopTab href="/" active>
            ホーム
          </TopTab>
          <TopTab href="/upload">アップロード</TopTab>
          <TopTab href="/test">採点デモ</TopTab>
        </nav>
        <div className="ml-auto flex items-stretch">
          <div className="flex items-center gap-1 border-l border-gray-700 bg-teal-800 px-4 text-xs font-bold text-white">
            🎙 マイク設定
          </div>
          <div className="flex items-center gap-1 border-l border-gray-700 px-4 text-xs font-bold text-red-400">
            ■ 停止
          </div>
        </div>
      </header>

      {/* ===== メインコンテンツ ===== */}
      <main className="flex flex-1 gap-3 p-3">
        {/* 左: 機能ボタングリッド */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Row 1: 大ボタン */}
          <div className="grid h-36 grid-cols-2 gap-2">
            <BigButton
              href="/upload"
              icon="🎵"
              label="曲をアップロード"
              sub="AI が自動解析"
              color="bg-red-700"
            />
            <BigButton
              href="/test"
              icon="🎤"
              label="採点デモ"
              sub="サンプル曲で試す"
              color="bg-teal-700"
            />
          </div>

          {/* Row 2: 中ボタン */}
          <div className="grid h-20 grid-cols-2 gap-2">
            <MidButton
              href="#"
              icon="📂"
              label="マイ楽曲"
              color="bg-orange-700"
              disabled
            />
            <MidButton
              href="#"
              icon="📊"
              label="スコア履歴"
              color="bg-teal-800"
              disabled
            />
          </div>

          {/* Row 3: 小ボタン */}
          <div className="grid h-14 grid-cols-3 gap-2">
            <SmallButton icon="📖" label="使い方" />
            <SmallButton icon="❓" label="よくある質問" />
            <SmallButton icon="💻" label="推奨環境" />
          </div>

          {/* Row 4: インフォ帯 */}
          <div className="grid h-10 grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded border border-gray-400 bg-white px-3 text-xs text-gray-600">
              <span>🎧</span>
              <span>イヤホン装着を推奨</span>
            </div>
            <div className="flex items-center gap-2 rounded border border-gray-400 bg-white px-3 text-xs text-gray-600">
              <span>🌐</span>
              <span>Chrome / Edge (デスクトップ)</span>
            </div>
          </div>
        </div>

        {/* 右: 説明パネル */}
        <div className="flex w-64 shrink-0 flex-col gap-2">
          <div className="flex-1 rounded border border-gray-300 bg-white p-4">
            <h3 className="mb-2 border-b border-gray-200 pb-1 text-sm font-bold text-gray-700">
              UtaLab とは
            </h3>
            <p className="text-xs leading-relaxed text-gray-600">
              任意の音声ファイルをアップロードするだけで、AI が自動解析してカラオケ採点ができます。
            </p>
            <div className="mt-4 space-y-2">
              <Step n="1" text="音声ファイルをアップロード" />
              <Step n="2" text="AI がボーカル分離・メロディ抽出（1〜2分）" />
              <Step n="3" text="伴奏に合わせて歌って採点！" />
            </div>
          </div>

          <div className="rounded border border-yellow-300 bg-yellow-50 p-3">
            <p className="text-xs font-bold text-yellow-800">⚠ ご注意</p>
            <p className="mt-1 text-xs leading-relaxed text-yellow-700">
              解析に1〜2分かかります。マイクへのアクセス許可と、イヤホン装着が必要です。
            </p>
          </div>
        </div>
      </main>

      {/* ===== 最新情報バー ===== */}
      <div className="flex h-8 items-center gap-2 border-t border-gray-300 bg-white px-4">
        <span className="shrink-0 rounded bg-orange-600 px-2 py-0.5 text-xs font-bold text-white">
          お知らせ
        </span>
        <span className="text-xs text-gray-500">
          MVP バージョン — 現在は個人利用のみ対応。音声ファイルをアップロードしてカラオケを楽しもう！
        </span>
      </div>

      {/* ===== フッター操作バー ===== */}
      <footer className="flex h-12 shrink-0 items-center border-t-2 border-gray-800 bg-gray-950 px-4">
        <div className="flex gap-2">
          <span className="flex h-8 items-center rounded bg-gray-800 px-3 text-xs text-gray-400">
            ← 遅
          </span>
          <span className="flex h-8 items-center rounded bg-gray-800 px-3 text-xs text-gray-400">
            速 →
          </span>
          <span className="flex h-8 items-center rounded bg-gray-800 px-3 text-xs text-gray-400">
            ♭
          </span>
          <span className="flex h-8 items-center rounded bg-gray-800 px-3 text-xs text-gray-400">
            ♯
          </span>
        </div>
        <div className="ml-auto flex gap-2">
          <Link
            href="/upload"
            className="flex h-9 items-center rounded bg-red-700 px-6 text-sm font-black text-white hover:bg-red-600"
          >
            スタート
          </Link>
          <span className="flex h-9 items-center rounded bg-gray-800 px-4 text-xs text-gray-400">
            ⏸ 一時停止
          </span>
        </div>
      </footer>
    </div>
  );
}
