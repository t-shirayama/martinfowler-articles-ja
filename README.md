# Martin Fowler Articles JA

martinfowler.com に掲載されている記事を、日本語で読みやすく翻訳して整理するための非公式プロジェクトです。

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

## 初期構成案

最初の版では、翻訳本文はまだ追加せず、タグ別の候補一覧と運用方針だけを置きます。

将来の記事ファイルは、次のような配置を想定します。

```text
articles/
  domain-specific-language.md
  fluent-interface.md
```

## 学習優先度

10年目のエンジニアが設計、開発手法、アーキテクチャを学ぶための優先度です。
各タグの対象ページは `tags/` 配下の README に整理しています。

### 1. アーキテクチャまわり

- [application architecture](tags/application-architecture/README.md) - アプリケーションアーキテクチャ
- [enterprise architecture](tags/enterprise-architecture/README.md) - エンタープライズアーキテクチャ
- [microservices](tags/microservices/README.md) - マイクロサービス
- [event architectures](tags/event-architectures/README.md) - イベントアーキテクチャ
- [application integration](tags/application-integration/README.md) - アプリケーション統合
- [web services](tags/web-services/README.md) - Webサービス

### 2. 設計まわり

- [design](tags/design/README.md) - 設計
- [domain driven design](tags/domain-driven-design/README.md) - ドメイン駆動設計
- [API design](tags/api-design/README.md) - API設計
- [object collaboration design](tags/object-collaboration-design/README.md) - オブジェクト協調設計
- [encapsulation](tags/encapsulation/README.md) - カプセル化
- [analysis patterns](tags/analysis-patterns/README.md) - 分析パターン
- [programming style](tags/programming-style/README.md) - プログラミングスタイル

### 3. 既存システム改善

- [refactoring](tags/refactoring/README.md) - リファクタリング
- [refactoring boundary](tags/refactoring-boundary/README.md) - リファクタリング境界
- [technical debt](tags/technical-debt/README.md) - 技術的負債
- [legacy modernization](tags/legacy-modernization/README.md) - レガシーモダナイゼーション
- [bad things](tags/bad-things/README.md) - 悪いこと・失敗例

### 4. 開発プロセスとデリバリー

- [continuous delivery](tags/continuous-delivery/README.md) - 継続的デリバリー
- [testing](tags/testing/README.md) - テスト
- [test categories](tags/test-categories/README.md) - テスト分類
- [build scripting](tags/build-scripting/README.md) - ビルドスクリプト
- [version control](tags/version-control/README.md) - バージョン管理
- [agile](tags/agile/README.md) - アジャイル
- [extreme programming](tags/extreme-programming/README.md) - エクストリームプログラミング
- [agile adoption](tags/agile-adoption/README.md) - アジャイル導入

### 5. チーム、リード、計画

- [technical leadership](tags/technical-leadership/README.md) - 技術リーダーシップ
- [team organization](tags/team-organization/README.md) - チーム組織
- [team environment](tags/team-environment/README.md) - チーム環境
- [collaboration](tags/collaboration/README.md) - コラボレーション
- [project planning](tags/project-planning/README.md) - プロジェクト計画
- [estimation](tags/estimation/README.md) - 見積もり
- [requirements analysis](tags/requirements-analysis/README.md) - 要求分析
- [documentation](tags/documentation/README.md) - ドキュメンテーション

### 6. 実装領域と周辺知識

- [database](tags/database/README.md) - データベース
- [security](tags/security/README.md) - セキュリティ
- [web development](tags/web-development/README.md) - Web開発
- [front-end](tags/front-end/README.md) - フロントエンド
- [evolutionary design](tags/evolutionary-design/README.md) - 進化的設計
- [generative AI](tags/generative-ai/README.md) - 生成AI

## 翻訳記事テンプレート

各記事は次の見出しから始めます。

```markdown
# 日本語タイトル

> これは非公式の日本語訳です。Martin Fowler 氏、martinfowler.com、Thoughtworks の公式翻訳ではありません。

- 原文: [Original Title](https://martinfowler.com/...)
- 著者: Martin Fowler
- 翻訳日: YYYY-MM-DD

---
```
