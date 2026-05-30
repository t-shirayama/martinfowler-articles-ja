# Martin Fowler Articles JA

martinfowler.com に掲載されている記事を、日本語で読みやすく翻訳して整理するための非公式プロジェクトです。

martinfowler.com の FAQ「[Can I translate one of your web articles?](https://martinfowler.com/faq.html)」では、Web記事の翻訳について “I don't object to people doing translations” とし、翻訳を公開する場合は “must include a link to the original article” と説明されています。本プロジェクトはこの方針に沿い、各記事に原文へのリンクを明記したうえで、非公式の日本語訳・要約を公開します。

## 免責

このリポジトリは Martin Fowler 氏、martinfowler.com、Thoughtworks の公式プロジェクトではありません。
翻訳文の責任は本リポジトリの管理者にあります。原文の著作権は各著者および原サイトに帰属します。

各翻訳記事には、次の情報を明記します。

- 原文タイトル
- 原文URL
- 著者名
- 翻訳日
- 非公式の日本語訳であること

元サイトのデザイン、ロゴ、ブランド表現はコピーしません。GitHub Pages では、このプロジェクト独自の簡素な表示にします。

## 目的

- martinfowler.com の選定記事について、読みやすい日本語訳を管理する
- 原文へのリンク、著者名、翻訳日、非公式であることを各記事に明記する
- まずはシンプルな Markdown ベースの構成にする

## 構成

現時点では、タグ別の日本語訳・要約ページを公開します。
各記事ページには原文へのリンク、著者、原文日付、非公式であることを明記します。
martinfowler.com の FAQ にある翻訳方針に従い、全文翻訳を追加する場合も必ず原文へのリンクを掲載します。

GitHub Pages は GitHub Actions でビルドし、`dist/` を Pages にデプロイします。
画面は React + Vite で作成し、Markdown は `public/content/` 配下のファイルをブラウザで読み込んで表示します。

将来の記事ファイルは、次のような配置を想定します。

```text
public/
  content/
    articles/
      refactoring-module-dependencies.md
    tags/
      application-architecture.md
src/
  data/
    content.ts
PROGRESS.md
```

## 開発

```bash
npm install
npm run dev
npm run build
```

- 開発サーバー: `http://127.0.0.1:5173/martinfowler-articles-ja/`
- ビルド成果物: `dist/`
- Markdown本文: `public/content/`

## 学習優先度

設計、開発手法、アーキテクチャを学ぶための優先度です。
各タグの候補ページと翻訳状態は [PROGRESS.md](PROGRESS.md) に集約しています。

### 1. アーキテクチャまわり

- application architecture - アプリケーションアーキテクチャ
- enterprise architecture - エンタープライズアーキテクチャ
- microservices - マイクロサービス
- event architectures - イベントアーキテクチャ
- application integration - アプリケーション統合
- web services - Webサービス

### 2. 設計まわり

- design - 設計
- domain driven design - ドメイン駆動設計
- API design - API設計
- object collaboration design - オブジェクト協調設計
- encapsulation - カプセル化
- analysis patterns - 分析パターン
- programming style - プログラミングスタイル

### 3. 既存システム改善

- refactoring - リファクタリング
- refactoring boundary - リファクタリング境界
- technical debt - 技術的負債
- legacy modernization - レガシーモダナイゼーション
- bad things - 悪いこと・失敗例

### 4. 開発プロセスとデリバリー

- continuous delivery - 継続的デリバリー
- testing - テスト
- test categories - テスト分類
- build scripting - ビルドスクリプト
- version control - バージョン管理
- agile - アジャイル
- extreme programming - エクストリームプログラミング
- agile adoption - アジャイル導入

### 5. チーム、リード、計画

- technical leadership - 技術リーダーシップ
- team organization - チーム組織
- team environment - チーム環境
- collaboration - コラボレーション
- project planning - プロジェクト計画
- estimation - 見積もり
- requirements analysis - 要求分析
- documentation - ドキュメンテーション

### 6. 実装領域と周辺知識

- database - データベース
- security - セキュリティ
- web development - Web開発
- front-end - フロントエンド
- evolutionary design - 進化的設計
- generative AI - 生成AI

## 記事テンプレート

各記事は次の見出しで整理します。

```markdown
# Original Title

> これは非公式の日本語訳です。Martin Fowler 氏、martinfowler.com、Thoughtworks の公式翻訳ではありません。

- 原文: [Original Title](https://martinfowler.com/...)
- 著者: Martin Fowler
- 翻訳日: YYYY-MM-DD

## 要約

この記事で扱う主題、設計上の論点、読む価値を短くまとめます。

## 読むときの観点

- 重点的に確認したい設計判断を書く。
- 現場のコードやアーキテクチャへ引き寄せる観点を書く。

## 原文の翻訳

全文翻訳を追加する場合は、省略せずに配置します。
図表は Mermaid、draw.io からエクスポートした SVG/PNG、または Markdown 画像として可能な範囲で再現します。
```
