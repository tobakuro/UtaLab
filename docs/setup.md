# UtaLab - 環境構築手順

チームメンバー向けのセットアップガイド。対象 OS は **Windows 10/11 + WSL2 (Ubuntu)** のみ。初見でも 1〜2 時間で開発開始できる状態を目指す。

---

## 0. 全体像

以下のツールを揃える。

1. **WSL2 (Ubuntu)**: Linux 実行環境
2. **Devbox**(Nix ベース環境管理): Node.js / Python / FFmpeg などを統合管理
3. **Docker Desktop**: DB や Redis をローカルで立ち上げる(MVP 時点では不要、Phase 2 以降で使用)
4. **VS Code + WSL 拡張**: エディタ
5. **Git + GitHub CLI**: バージョン管理

Devbox を使うことで Node.js 22、Python 3.11、FFmpeg、libsndfile、uv がすべて自動で揃う。各自のマシンを汚さず、プロジェクトごとに独立した環境が手に入る。

---

## 1. WSL2 のセットアップ

### 1.1 WSL2 のインストール

管理者権限の PowerShell で:

```powershell
wsl --install
```

これで Ubuntu が自動インストールされる。PC 再起動後、Ubuntu ターミナルが起動し、UNIX ユーザー名とパスワードを設定する。

すでに WSL2 を使っている場合は、バージョン確認:

```powershell
wsl --version
wsl -l -v
```

WSL バージョン 2、Ubuntu 22.04 以降が理想。

### 1.2 systemd の有効化

**これは必須**。有効化していないと後の Nix が動かない。

Ubuntu ターミナル内で:

```bash
sudo nano /etc/wsl.conf
```

以下の内容を貼り付け(既存の `[boot]` セクションがあれば `systemd=true` のみ追記):

```ini
[boot]
systemd=true
```

Ctrl+O で保存、Ctrl+X で終了。

**PowerShell に戻って** WSL を完全シャットダウン:

```powershell
wsl --shutdown
```

Docker Desktop を起動している場合は先に終了してから実行する。

再度 Ubuntu ターミナルを開き、有効化を確認:

```bash
ps -p 1 -o comm=
```

**`systemd`** と表示されれば成功。`init` と出たら 1.2 の手順を見直す。

### 1.3 作業場所の重要なルール

**プロジェクトは必ず WSL のホームディレクトリ配下(`~/` 以下)に置く**。

- ✅ 良い例: `~/utalab`(= `/home/your-name/utalab`)
- ❌ 悪い例: `/mnt/c/Github/utalab`(Windows ファイルシステム)

理由:

- `/mnt/c/` 配下は Windows ファイルシステムを経由するため、I/O が 10 倍以上遅い
- `pnpm install` で高確率で権限エラーが出る
- Demucs など音声処理で大量ファイル操作する際に致命的に遅くなる

Windows 側からファイルを見たい場合は、エクスプローラーのアドレスバーに `\\wsl$\Ubuntu\home\your-name\utalab` と入力すればアクセスできる。

### 1.4 以降の作業場所

**すべての作業は WSL Ubuntu ターミナル内で行う**。Windows PowerShell や CMD は WSL の再起動(`wsl --shutdown`)時のみ使う。

---

## 2. Devbox のインストール

Ubuntu ターミナル内で:

```bash
curl -fsSL https://get.jetify.com/devbox | bash
```

途中で sudo パスワードが求められる。Nix 自体が未インストールなら、Devbox が自動で Nix もインストールする(10〜15 分かかる場合あり)。

### 2.1 動作確認

ターミナルを閉じて開き直した後:

```bash
devbox version
nix --version
```

両方バージョンが表示されれば成功。

### 2.2 nix-daemon の恒久化

WSL 再起動後も自動で nix-daemon が起動するよう設定する。**これをやらないと、毎回 WSL 起動時に Nix が使えない**。

```bash
sudo systemctl start nix-daemon
sudo systemctl enable nix-daemon
```

確認:

```bash
systemctl is-enabled nix-daemon
```

**`enabled`** と表示されれば OK。

### 2.3 トラブルシューティング

**`devbox: command not found`**

PATH が通っていない。シェルを再起動するか、`~/.bashrc` に以下を追記:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

保存後:

```bash
source ~/.bashrc
```

**`cannot connect to socket at '/nix/var/nix/daemon-socket/socket': Connection refused`**

nix-daemon が起動していない。`systemctl is-active nix-daemon` を確認し、2.2 の手順を実行する。

**WSL 再起動しても systemd が起動しない**

Docker Desktop が WSL を掴んでいる可能性。Docker Desktop を終了してから `wsl --shutdown` を実行。

---

## 3. Git と GitHub のセットアップ

### 3.1 Git 初期設定

```bash
git config --global user.name "あなたの名前"
git config --global user.email "GitHub で使うメールアドレス"
```

GitHub でメールアドレスを非公開設定にしている場合は、GitHub の Settings → Emails で表示されるノーリプライアドレス(`12345678+username@users.noreply.github.com` のような形式)を使う。

### 3.2 改行コードの設定

WSL と Windows で改行コードが混ざらないよう、以下を設定:

```bash
git config --global core.autocrlf input
```

### 3.3 GitHub CLI(後で Devbox 経由で導入)

Git のクレデンシャル管理に `gh` を使うと楽。プロジェクトのセットアップ後に導入する(セクション 9 を参照)。

---

## 4. プロジェクトのクローン

### 4.1 ホームディレクトリへ移動

```bash
cd ~
```

### 4.2 リポジトリのクローン

```bash
git clone https://github.com/<ORG>/<REPO>.git utalab
cd utalab
```

`<ORG>/<REPO>` はチームリーダーから共有されるものに置き換え。

HTTPS でクローンする場合、パスワード認証は廃止されているため、PAT (Personal Access Token) または GitHub CLI の認証が必要(セクション 9 参照)。

### 4.3 リポジトリ内容の確認

```bash
ls -la
```

以下があることを確認:

- `devbox.json`(環境定義)
- `package.json`(Next.js 設定)
- `app/`(Next.js ソース)
- `docs/`(プロジェクトドキュメント)

---

## 5. Devbox 環境の起動

プロジェクトルートで:

```bash
devbox shell
```

### 5.1 初回起動

Nix がパッケージをダウンロード・展開する。**15〜30 分かかる**ので、時間に余裕を持って実行する。

進捗表示は以下のような形式:

```
[0/1 built, 7/347/397 copied (907.7 MiB/1.5 GiB), 288.1/311.3 MiB DL]
```

ネットワーク起因で以下のような警告が出ることがあるが、自動リトライされるので放置して良い:

```
warning: error: unable to download ...: HTTP error 200 (curl error: Stream error in the HTTP/2 framing layer); retrying from offset ...
```

### 5.2 2 回目以降

キャッシュから数秒で起動。

### 5.3 起動成功時の表示

```
🎤 utalab dev environment ready
   Node:  v22.22.2
   Python:  Python 3.11.15
(devbox) your-name@your-pc:~/utalab$
```

プロンプトが `(devbox)` で始まれば Devbox シェル内。

### 5.4 動作確認

Devbox シェル内で以下を実行:

```bash
node -v          # v22.x.x
python --version # Python 3.11.x
pnpm -v
uv --version
ffmpeg -version
```

すべてエラーなく表示されれば OK。

### 5.5 トラブルシューティング

**大文字の `Error:` で終了した場合**

再度 `devbox shell` を実行。キャッシュが残っているので続きから進む。

**10 分以上進捗が止まる**

Ctrl+C で中断して再実行。

**`Command 'nodenv' not found` という警告**

過去に nodenv を入れていた痕跡。機能には影響しない。気になる場合のみ `~/.bashrc` から nodenv 関連行を削除。

### 5.6 direnv 連携(任意・推奨)

毎回 `devbox shell` を叩くのが面倒なら、direnv を導入する。プロジェクトディレクトリに `cd` した瞬間に自動で Devbox 環境が有効になる。

```bash
devbox global add direnv
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
source ~/.bashrc

cd ~/utalab
devbox generate direnv
direnv allow
```

---

## 6. 依存関係のインストール

Devbox シェル内で:

```bash
pnpm install
```

初回は 2〜3 分。`node_modules/` が生成される。

### 6.1 トラブルシューティング

**`ERR_PNPM_EACCES` (permission denied)**

プロジェクトが `/mnt/c/` 配下にある可能性。セクション 1.3 を参照して `~/` 配下に移動する。

**ネットワーク警告が大量に出る**

WSL2 のネットワーク特性。リトライで完了するなら問題ない。

---

## 7. 動作確認

### 7.1 Next.js の起動

```bash
pnpm dev
```

以下のような出力が出たら成功:

```
▲ Next.js 16.x.x
- Local:        http://localhost:3000
✓ Ready in 1.5s
```

Windows のブラウザで `http://localhost:3000` にアクセスし、Next.js の初期画面が表示されることを確認(WSL の localhost は自動で Windows に転送される)。

確認できたら Ctrl+C で停止。

### 7.2 Python ワーカーのセットアップ

`worker/` に AI 音声解析ワーカーが用意されている。以下でセットアップする。

```bash
cd ~/utalab/worker
uv add demucs librosa numpy soundfile
uv pip install crepe --no-build-isolation
cd ..
```

> `crepe` だけ `--no-build-isolation` が必要。パッケージのビルド設定が古いため。

#### 動作確認

著作権フリーの音声ファイルを用意して実行:

```bash
cd ~/utalab/worker
uv run python analyze.py <音声ファイルのパス> ./output_test
```

`output_test/melody.json` と `output_test/accompaniment.wav` が生成されれば成功。

> **初回は Demucs のモデルが自動ダウンロードされる（数百 MB、数分かかる）。**  
> GPU がなくても動くが、CPU のみの場合は 1 曲あたり 5〜15 分かかる。

---

## 8. VS Code の設定

### 8.1 WSL 拡張のインストール

Windows 側の VS Code を起動し、拡張機能検索で「WSL」を入れる(Microsoft 製)。

### 8.2 プロジェクトを開く

WSL ターミナル内で:

```bash
cd ~/utalab
code .
```

初回は VS Code Server が WSL 内にインストールされる。完了すると VS Code が WSL モードで開く。

### 8.3 トラブルシューティング

**`Exec format error` が出る**

WSL の interop 機能が一時的に動いていない。PowerShell で `wsl --shutdown` → Ubuntu ターミナルを開き直す → 再度 `code .` で解決することが多い。

### 8.4 推奨拡張

VS Code で以下を入れる(すべて WSL 側にインストール):

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Python
- Pylance
- GitLens(Git 操作を便利に)

---

## 9. GitHub 認証(GitHub CLI 使用)

### 9.1 GitHub CLI のインストール

Devbox シェル内で、`devbox.json` の packages に `gh` を追加:

```bash
devbox add gh
```

自動で `devbox shell` が再起動する。

### 9.2 認証

```bash
gh auth login
```

対話に答えると、ブラウザが開いて GitHub にログイン → 認証完了。これ以降 `git push` でパスワード入力が不要になる。

選択肢は以下がおすすめ:

- What account do you want to log into? → **GitHub.com**
- What is your preferred protocol for Git operations? → **HTTPS**
- Authenticate Git with your GitHub credentials? → **Yes**
- How would you like to authenticate GitHub CLI? → **Login with a web browser**

### 9.3 動作確認

```bash
gh auth status
```

`Logged in to github.com as your-username` と表示されれば OK。

---

## 10. 起動確認チェックリスト

以下がすべて通れば環境構築完了。

- [ ] `ps -p 1 -o comm=` で `systemd` と表示される
- [ ] `systemctl is-enabled nix-daemon` で `enabled` と表示される
- [ ] `devbox version` が動く
- [ ] `devbox shell` に入れる(プロンプトが `(devbox)` になる)
- [ ] Devbox シェル内で `node -v` が v22 系
- [ ] Devbox シェル内で `python --version` が 3.11 系
- [ ] Devbox シェル内で `ffmpeg -version` が表示される
- [ ] `pnpm install` がエラーなく完了
- [ ] `pnpm dev` で Next.js の画面が `http://localhost:3000` に表示される
- [ ] `cd worker && uv run python analyze.py --help` がエラーなく動く
- [ ] `code .` で VS Code が WSL モードで開く
- [ ] `git config --global user.name` で自分の名前が表示される
- [ ] `gh auth status` で GitHub にログイン済みと表示される

---

## 11. 開発開始のお作法

### 11.1 毎回の作業開始時

```bash
cd ~/utalab
devbox shell      # direnv を入れていればこれも不要
git pull
pnpm install      # package.json に変更があった時のみ
pnpm dev
```

### 11.2 ブランチ運用

- 機能開発は `feature/機能名` ブランチで
- バグ修正は `fix/内容` ブランチで
- 直接 `main` にコミットしない

### 11.3 コミット前チェック

```bash
pnpm format:check  # Prettier フォーマット確認
pnpm lint          # ESLint 実行
pnpm build         # ビルドが通るか確認
```

---

## 12. トラブルシューティング集

| 症状                                                                  | 対処                                                                             |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `devbox shell` が遅い                                                 | 初回は 15〜30 分が正常。2 回目以降も遅いなら `devbox install` でキャッシュ再構築 |
| `pnpm install` で EACCES エラー                                       | プロジェクトが `/mnt/c/` 配下にある。`~/` 以下に移動する(1.3 参照)               |
| `pnpm dev` で `next: command not found`                               | `node_modules` が欠けている。`pnpm install` を実行                               |
| `cannot connect to nix daemon`                                        | nix-daemon が起動していない。`sudo systemctl start nix-daemon`                   |
| `code .` で Exec format error                                         | `wsl --shutdown`(PowerShell) → Ubuntu ターミナルを開き直す                       |
| マイク権限が取れない                                                  | ブラウザの設定でサイト別のマイク許可を確認。localhost なら HTTPS 不要            |
| `pnpm create next-app` で「既存ファイル警告」                         | `.devbox/` が既にある場合、一旦サブディレクトリで作成してから中身を移動する      |
| `npm naming restrictions: name can no longer contain capital letters` | フォルダ名を小文字にする(`mv UtaLab utalab`)                                     |
| WSL 起動後に systemd が動いていない                                   | Docker Desktop を終了してから `wsl --shutdown` を再実行                          |

---

## 13. 参考リンク

- [Devbox 公式](https://www.jetify.com/docs/devbox/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [pitchy](https://github.com/ianprime0509/pitchy)
- [Web Audio API (MDN)](https://developer.mozilla.org/ja/docs/Web/API/Web_Audio_API)
- [Demucs](https://github.com/facebookresearch/demucs)
- [CREPE](https://github.com/marl/crepe)
- [WSL 公式ドキュメント](https://learn.microsoft.com/ja-jp/windows/wsl/)

---

## 14. 困った時

- Slack の `#utalab-dev` チャンネル(チーム内の連絡手段に置き換え)
- プロジェクト担当: とばくろ

このドキュメントにない症状が出たら、解決後に「12. トラブルシューティング集」に追記して PR を出すこと。同じ問題で次のメンバーが詰まるのを防ぐ。
