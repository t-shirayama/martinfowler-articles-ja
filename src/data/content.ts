import type { Article, ArticleStatus, PageDefinition, TagCard, TagSlug } from '../types'

export const siteBase = import.meta.env.BASE_URL

export const contentBase = `${siteBase.replace(/\/$/, '')}/content`

export const tagCards: TagCard[] = [
  {
    slug: 'application-architecture',
    title: 'application architecture',
    subtitle: 'アプリケーションアーキテクチャ',
    description: 'モジュール分割、サービス境界、デプロイ、進化のさせ方を中心に学ぶタグです。',
    href: '/tags/application-architecture',
  },
  {
    slug: 'api-design',
    title: 'API design',
    subtitle: 'API設計',
    description: '公開インターフェース、互換性、利用しやすさ、段階的変更の設計判断を扱います。',
    href: '/tags/api-design',
  },
  {
    slug: 'design',
    title: 'design',
    subtitle: '設計',
    description: '設計の役割、依存関係、GUIやイベント駆動などの設計判断を扱います。',
    href: '/tags/design',
  },
  {
    slug: 'domain-driven-design',
    title: 'domain driven design',
    subtitle: 'ドメイン駆動設計',
    description: '境界づけられたコンテキスト、集約、ドメインモデルなどを整理します。',
    href: '/tags/domain-driven-design',
  },
  {
    slug: 'refactoring',
    title: 'refactoring',
    subtitle: 'リファクタリング',
    description: '既存コードの改善、変更容易性、段階的な設計改善を学ぶタグです。',
    href: '/tags/refactoring',
  },
  {
    slug: 'testing',
    title: 'testing',
    subtitle: 'テスト',
    description: 'テスト戦略、テストピラミッド、モック、非決定性への対処を扱います。',
    href: '/tags/testing',
  },
  {
    slug: 'web-services',
    title: 'web services',
    subtitle: 'Webサービス',
    description: 'REST、サービス連携、契約、SOAとの関係を整理します。',
    href: '/tags/web-services',
  },
]

export const articles: Article[] = [
  article('microservices', 'Microservices', 'マイクロサービス', '小さなサービス群としてシステムを分ける考え方と、その利点・難しさを整理します。', 'James Lewis and Martin Fowler', '2014-03-25', 'application-architecture', 'https://www.martinfowler.com/articles/microservices.html', '全文翻訳'),
  article('micro-frontends', 'Micro Frontends', 'マイクロフロントエンド', 'フロントエンドを独立した単位へ分割する設計の狙いと注意点を整理します。', 'Cam Jackson', '2019-06-19', 'application-architecture', 'https://www.martinfowler.com/articles/micro-frontends.html', '全文翻訳'),
  article('serverless-architectures', 'Serverless Architectures', 'サーバーレスアーキテクチャ', 'サーバーレスをアプリケーション構成の選択肢として整理します。', 'Mike Roberts', '2018-05-22', 'application-architecture', 'https://www.martinfowler.com/articles/serverless.html', '全文翻訳'),
  article('feature-toggles', 'Feature Toggles', 'フィーチャートグル', '機能のリリースとデプロイを分離するための設計判断を整理します。', 'Pete Hodgson', '2017-10-09', 'application-architecture', 'https://www.martinfowler.com/articles/feature-toggles.html', '全文翻訳'),
  article('refactoring-module-dependencies', 'Refactoring Module Dependencies', 'モジュール依存関係のリファクタリング', 'モジュール分割、依存関係、Dependency Injection を学ぶための記事です。', 'Martin Fowler', '2015-10-13', 'application-architecture', 'https://www.martinfowler.com/articles/refactoring-dependencies.html', '全文翻訳'),
  article('collection-pipeline', 'Collection Pipeline', 'コレクションパイプライン', 'コレクション操作を小さな変換の連鎖として表現するスタイルを整理します。', 'Martin Fowler', '2015-06-25', 'api-design', 'https://www.martinfowler.com/articles/collection-pipeline', '全文翻訳'),
  article('distributed-objects-microservices', 'Microservices and the First Law of Distributed Objects', 'マイクロサービスと分散オブジェクト第一法則', '分散オブジェクトへの警告とマイクロサービスの関係を整理します。', 'Martin Fowler', '2014-08-13', 'api-design', 'https://www.martinfowler.com/articles/distributed-objects-microservices.html', '全文翻訳'),
  article('copyright-api', 'APIs should not be copyrightable', 'APIは著作権で保護されるべきではない', 'APIの著作権性をめぐる問題とソフトウェア開発への影響を整理します。', 'Martin Fowler', '2014-12-16', 'api-design', 'https://www.martinfowler.com/articles/copyright-api.html', '全文翻訳'),
  article('bitemporal-history', 'Bitemporal History', '二時点履歴', '事実が有効だった時点と、その事実を知った時点を分けて扱うモデルを整理します。', 'Martin Fowler', '2021-04-07', 'api-design', 'https://www.martinfowler.com/articles/bitemporal-history.html', '全文翻訳'),
  article('command-oriented-interface', 'Command Oriented Interface', 'コマンド指向インターフェース', '問い合わせではなく命令としてインターフェースを設計する考え方を整理します。', 'Martin Fowler', '2003-11-23', 'api-design', 'https://www.martinfowler.com/bliki/CommandOrientedInterface.html', '全文翻訳'),
  article('command-query-separation', 'Command Query Separation', 'コマンドクエリ分離', '状態を変える操作と問い合わせを分ける設計原則を整理します。', 'Martin Fowler', '2005-12-05', 'api-design', 'https://www.martinfowler.com/bliki/CommandQuerySeparation.html', '全文翻訳'),
  article('constructor-initialization', 'Constructor Initialization', 'コンストラクタ初期化', 'オブジェクト生成時に必要な依存や値を渡す初期化スタイルを整理します。', 'Martin Fowler', '2006-02-07', 'api-design', 'https://www.martinfowler.com/bliki/ConstructorInitialization.html', '全文翻訳'),
  article('courtesy-implementation', 'Courtesy Implementation', '親切な実装', 'インターフェース利用者を助ける既定実装や補助実装の考え方を整理します。', 'Martin Fowler', '2004-08-12', 'api-design', 'https://www.martinfowler.com/bliki/CourtesyImplementation.html', '全文翻訳'),
  article('decorated-command', 'Decorated Command', '装飾されたコマンド', 'コマンドへ横断的な振る舞いを加える設計の考え方を整理します。', 'Martin Fowler', '2004-01-24', 'api-design', 'https://www.martinfowler.com/bliki/DecoratedCommand.html', '全文翻訳'),
  article('designed-inheritance', 'Designed Inheritance', '設計された継承', '継承を公開APIとして設計する際の責任と注意点を整理します。', 'Martin Fowler', '2006-10-06', 'api-design', 'https://www.martinfowler.com/bliki/DesignedInheritance.html', '全文翻訳'),
  article('duck-interface', 'Duck Interface', 'ダックインターフェース', '明示的な型ではなく振る舞いの一致で扱うインターフェースを整理します。', 'Martin Fowler', '2005-12-21', 'api-design', 'https://www.martinfowler.com/bliki/DuckInterface.html', '全文翻訳'),
  article('flag-argument', 'Flag Argument', 'フラグ引数', '呼び出し側が処理分岐を指定する引数の問題と代替を整理します。', 'Martin Fowler', '2011-06-23', 'api-design', 'https://www.martinfowler.com/bliki/FlagArgument.html', '全文翻訳'),
  article('fluent-interface', 'Fluent Interface', '流れるようなインターフェース', '読みやすいメソッド連鎖で意図を表すAPI設計を整理します。', 'Martin Fowler', '2005-12-20', 'api-design', 'https://www.martinfowler.com/bliki/FluentInterface.html', '全文翻訳'),
  article('foundation-platform', 'Foundation Platform', '基盤プラットフォーム', '共通基盤を作るプラットフォーム戦略の狙いと注意点を整理します。', 'Martin Fowler', '2003-06-03', 'api-design', 'https://www.martinfowler.com/bliki/FoundationPlatform.html', '全文翻訳'),
  article('getter-eradicator', 'Getter Eradicator', 'Getter撲滅', 'getter中心の設計を避け、オブジェクトに振る舞いを置く考え方を整理します。', 'Martin Fowler', '2006-02-22', 'api-design', 'https://www.martinfowler.com/bliki/GetterEradicator.html', '全文翻訳'),
  article('harvested-platform', 'Harvested Platform', '収穫されたプラットフォーム', '既存システムから共通プラットフォームを育てる考え方を整理します。', 'Martin Fowler', '2003-06-03', 'api-design', 'https://www.martinfowler.com/bliki/HarvestedPlatform.html', '全文翻訳'),
  article('header-interface', 'Header Interface', 'ヘッダーインターフェース', '利用側に公開する型情報やヘッダーをめぐる設計判断を整理します。', 'Martin Fowler', '2006-12-21', 'api-design', 'https://www.martinfowler.com/bliki/HeaderInterface.html', '全文翻訳'),
  article('hollywood-principle', 'Hollywood Principle', 'ハリウッド原則', 'フレームワークが利用者コードを呼び出す制御反転の考え方を整理します。', 'Martin Fowler', '2005-06-25', 'api-design', 'https://www.martinfowler.com/bliki/HollywoodPrinciple.html', '全文翻訳'),
  article('humane-interface', 'Humane Interface', '人にやさしいインターフェース', '利用者にとって自然で便利なAPIと最小性のトレードオフを整理します。', 'Martin Fowler', '2005-12-05', 'api-design', 'https://www.martinfowler.com/bliki/HumaneInterface.html', '全文翻訳'),
  article('implicit-interface-implementation', 'Implicit Interface Implementation', '暗黙的インターフェース実装', '明示宣言なしでインターフェースを満たす型システム上の考え方を整理します。', 'Martin Fowler', '2006-01-04', 'api-design', 'https://www.martinfowler.com/bliki/ImplicitInterfaceImplementation.html', '全文翻訳'),
  article('interface-implementation-pair', 'Interface Implementation Pair', 'インターフェース実装ペア', 'インターフェースと実装クラスを常に対で作る習慣の是非を整理します。', 'Martin Fowler', '2005-12-08', 'api-design', 'https://www.martinfowler.com/bliki/InterfaceImplementationPair.html', '全文翻訳'),
  article('inversion-of-control', 'Inversion Of Control', '制御の反転', '処理の主導権を呼び出し側からフレームワーク側へ移す設計を整理します。', 'Martin Fowler', '2005-06-26', 'api-design', 'https://www.martinfowler.com/bliki/InversionOfControl.html', '全文翻訳'),
  article('minimal-interface', 'Minimal Interface', '最小インターフェース', 'APIの表面積を小さく保つ設計判断と限界を整理します。', 'Martin Fowler', '2005-12-05', 'api-design', 'https://www.martinfowler.com/bliki/MinimalInterface.html', '全文翻訳'),
  article('open-inheritance', 'Open Inheritance', '開かれた継承', '利用者に継承拡張を許すAPI設計のリスクを整理します。', 'Martin Fowler', '2006-08-21', 'api-design', 'https://www.martinfowler.com/bliki/OpenInheritance.html', '全文翻訳'),
  article('overloaded-getter-setter', 'Overloaded Getter Setter', '多重責務のGetter/Setter', '単純なアクセサに複数の意味を背負わせる問題を整理します。', 'Martin Fowler', '2011-08-02', 'api-design', 'https://www.martinfowler.com/bliki/OverloadedGetterSetter.html', '全文翻訳'),
  article('parallel-change', 'Parallel Change', '並行変更', '互換性を保ちながらAPIを段階的に変更するリファクタリング手法を整理します。', 'Danilo Sato', '2014-05-13', 'api-design', 'https://www.martinfowler.com/bliki/ParallelChange.html', '全文翻訳'),
  article('published-interface', 'Published Interface', '公開インターフェース', '外部利用者が依存するインターフェースの互換性責任を整理します。', 'Martin Fowler', '2003-12-26', 'api-design', 'https://www.martinfowler.com/bliki/PublishedInterface.html', '全文翻訳'),
  article('required-interface', 'Required Interface', '要求インターフェース', 'コンポーネントが必要とする相手側のインターフェースを明示する考え方を整理します。', 'Martin Fowler', '2015-10-12', 'api-design', 'https://www.martinfowler.com/bliki/RequiredInterface.html', '全文翻訳'),
  article('role-interface', 'Role Interface', 'ロールインターフェース', '利用者が必要とする役割に合わせてインターフェースを分ける考え方を整理します。', 'Martin Fowler', '2006-12-22', 'api-design', 'https://www.martinfowler.com/bliki/RoleInterface.html', '全文翻訳'),
  article('rules-engine', 'Rules Engine', 'ルールエンジン', '業務ルールを外出しする道具の魅力とリスクを整理します。', 'Martin Fowler', '2009-01-07', 'api-design', 'https://www.martinfowler.com/bliki/RulesEngine.html', '全文翻訳'),
  article('seal', 'Seal', 'Seal', '拡張や継承を意図的に閉じる設計判断を整理します。', 'Martin Fowler', '2005-08-12', 'api-design', 'https://www.martinfowler.com/bliki/Seal.html', '全文翻訳'),
  article('setter-initialization', 'Setter Initialization', 'Setter初期化', 'setterで依存や値を注入する初期化スタイルを整理します。', 'Martin Fowler', '2006-02-09', 'api-design', 'https://www.martinfowler.com/bliki/SetterInitialization.html', '全文翻訳'),
  article('software-development-attitude', 'Software Development Attitude', 'ソフトウェア開発の姿勢', '設計や開発に向き合う態度が成果に与える影響を整理します。', 'Martin Fowler', '2004-03-08', 'api-design', 'https://www.martinfowler.com/bliki/SoftwareDevelopmentAttitude.html', '全文翻訳'),
  article('tell-dont-ask', 'Tell Dont Ask', '尋ねるな、命じよ', 'オブジェクトからデータを取り出すより振る舞いを依頼する設計原則を整理します。', 'Martin Fowler', '2013-09-05', 'api-design', 'https://www.martinfowler.com/bliki/TellDontAsk.html', '全文翻訳'),
  article('two-hard-things', 'Two Hard Things', '難しいことは二つある', '名前付けとキャッシュ無効化にまつわる有名な言葉と設計上の示唆を整理します。', 'Martin Fowler', '2009-07-14', 'api-design', 'https://www.martinfowler.com/bliki/TwoHardThings.html', '全文翻訳'),
  article('typed-collection', 'Typed Collection', '型付きコレクション', 'コレクションに型制約を持たせる設計の意図と変化を整理します。', 'Martin Fowler', '2003-06-17', 'api-design', 'https://www.martinfowler.com/bliki/TypedCollection.html', '全文翻訳'),
  article('uniform-access-principle', 'Uniform Access Principle', '統一アクセス原則', 'フィールドと計算値を同じ形で扱う言語設計上の考え方を整理します。', 'Martin Fowler', '2011-04-20', 'api-design', 'https://www.martinfowler.com/bliki/UniformAccessPrinciple.html', '全文翻訳'),
  article('user-defined-field', 'User Defined Field', 'ユーザー定義フィールド', '利用者が任意項目を追加できる仕組みの設計上の難しさを整理します。', 'Martin Fowler', '2013-07-23', 'api-design', 'https://www.martinfowler.com/bliki/UserDefinedField.html', '全文翻訳'),
  article('is-design-dead', 'Is Design Dead?', '設計は死んだのか', 'アジャイル開発における設計の位置づけを考える記事です。', 'Martin Fowler', '2004-05', 'design', 'https://www.martinfowler.com/articles/designDead.html', '全文翻訳'),
  article('inversion-of-control-containers-and-dependency-injection', 'Inversion of Control Containers and the Dependency Injection pattern', '制御の反転コンテナと依存性注入パターン', '依存関係を外から渡す設計とコンテナの役割を整理します。', 'Martin Fowler', '2004-01-23', 'design', 'https://www.martinfowler.com/articles/injection.html', '全文翻訳'),
  article('gui-architectures', 'GUI Architectures', 'GUIアーキテクチャ', '画面、モデル、プレゼンテーションロジックの分け方を学ぶ記事です。', 'Martin Fowler', '2006-07-18', 'design', 'https://www.martinfowler.com/eaaDev/uiArchs.html', '全文翻訳'),
  article('what-do-you-mean-by-event-driven', 'What do you mean by “Event-Driven”?', '「イベント駆動」とは何を意味するのか', 'イベント駆動という言葉の複数の意味を切り分けます。', 'Martin Fowler', '2017-02-07', 'design', 'https://www.martinfowler.com/articles/201701-event-driven.html', '全文翻訳'),
  article('modifiability-design-in-agility', 'Modifiability: Or is there Design in Agility', '変更容易性: アジャイルに設計はあるのか', '変更しやすさを中心に、アジャイルと設計の関係を整理します。', 'Ian Cartwright, Erik Doernenberg, Dave Farley, Fred George, Daniel Terhorst-North, Martin Fowler', '2007-03', 'design', 'http://www.infoq.com/presentations/modifiability-fowler'),
  article('data-monolith-to-mesh', 'How to Move Beyond a Monolithic Data Lake to a Distributed Data Mesh', 'モノリシックなデータレイクから分散データメッシュへ', '集中型データレイクの限界と、ドメイン指向のデータ所有へ移る考え方を整理します。', 'Zhamak Dehghani', '2019-05-20', 'domain-driven-design', 'https://www.martinfowler.com/articles/data-monolith-to-mesh.html', '全文翻訳'),
  article('xapo-architecture-experience', 'Decentralizing the Practice of Architecture at Xapo Bank', 'Xapo Bankにおけるアーキテクチャ実践の分散化', 'アーキテクチャ判断を中央集権からチーム主体へ移す実践と運営モデルを整理します。', 'Anouska ("Noush") Streets, Kamil Dziublinski, and Andrew Harmel-Law', '2023-07-18', 'domain-driven-design', 'https://www.martinfowler.com/articles/xapo-architecture-experience.html', '全文翻訳'),
  article('anemic-domain-model', 'Anemic Domain Model', '貧血ドメインモデル', '振る舞いを持たないドメインモデルの問題を読むためのメモです。', 'Martin Fowler', '2003-11-25', 'domain-driven-design', 'https://www.martinfowler.com/bliki/AnemicDomainModel.html', '全文翻訳'),
  article('bounded-context', 'Bounded Context', '境界づけられたコンテキスト', 'モデルが有効な境界を明確にするDDDの中心概念を整理します。', 'Martin Fowler', '2014-01-15', 'domain-driven-design', 'https://www.martinfowler.com/bliki/BoundedContext.html', '全文翻訳'),
  article('cqrs', 'CQRS', 'CQRS', 'コマンドとクエリを分ける設計の狙いと使いどころを整理します。', 'Martin Fowler', '2011-07-14', 'domain-driven-design', 'https://www.martinfowler.com/bliki/CQRS.html', '全文翻訳'),
  article('contextual-validation', 'Contextual Validation', '文脈に応じた検証', '検証ロジックをオブジェクト自身へ固定せず、利用文脈に応じて扱う考え方を整理します。', 'Martin Fowler', '2005-12-07', 'domain-driven-design', 'https://www.martinfowler.com/bliki/ContextualValidation.html', '全文翻訳'),
  article('contradictory-observations', 'Contradictory Observations', '矛盾する観察', 'モデルや認識が衝突したときに、観察の文脈を分けて考える見方を整理します。', 'Martin Fowler', '2009-03-03', 'domain-driven-design', 'https://www.martinfowler.com/bliki/ContradictoryObservations.html', '全文翻訳'),
  article('currency-as-value', 'Currency As Value', '値としての通貨', '通貨を列挙や単なる文字列ではなく値として扱う設計判断を整理します。', 'Martin Fowler', '2003-08-26', 'domain-driven-design', 'https://www.martinfowler.com/bliki/CurrencyAsValue.html', '全文翻訳'),
  article('customer-loyalty-software', 'Customer Loyalty Software', '顧客ロイヤルティソフトウェア', '顧客ロイヤルティ領域を題材に、モデル化と業務理解の観点を整理します。', 'Martin Fowler', '2007-09-04', 'domain-driven-design', 'https://www.martinfowler.com/bliki/CustomerLoyaltySoftware.html', '全文翻訳'),
  article('ddd-aggregate', 'DDD_Aggregate', 'DDDの集約', '整合性境界としての集約を読むためのメモです。', 'Martin Fowler', '2013-04-23', 'domain-driven-design', 'https://www.martinfowler.com/bliki/DDD_Aggregate.html', '全文翻訳'),
  article('domain-driven-design', 'Domain Driven Design', 'ドメイン駆動設計', '複雑な業務領域をモデル化するための考え方を整理します。', 'Martin Fowler', '2020-04-22', 'domain-driven-design', 'https://www.martinfowler.com/bliki/DomainDrivenDesign.html', '全文翻訳'),
  article('eager-read-derivation', 'Eager Read Derivation', 'Eager Read Derivation', '読み取り時に必要な派生値を先に計算しておく設計上のトレードオフを整理します。', 'Martin Fowler', '2009-02-10', 'domain-driven-design', 'https://www.martinfowler.com/bliki/EagerReadDerivation.html', '全文翻訳'),
  article('evans-classification', 'Evans Classification', 'Evansの分類', 'Eric Evansによるオブジェクト分類を通じて、ドメインモデル内の役割を整理します。', 'Martin Fowler', '2005-12-14', 'domain-driven-design', 'https://www.martinfowler.com/bliki/EvansClassification.html', '全文翻訳'),
  article('type-instance-homonym', 'Type Instance Homonym', '型とインスタンスの同名問題', '型とインスタンスに同じ言葉が使われるときのモデリング上の混乱を整理します。', 'Martin Fowler', '2007-01-11', 'domain-driven-design', 'https://www.martinfowler.com/bliki/TypeInstanceHomonym.html', '全文翻訳'),
  article('ubiquitous-language', 'Ubiquitous Language', 'ユビキタス言語', 'ドメイン専門家と開発者が共有する言葉をモデルとコードへ反映する考え方を整理します。', 'Martin Fowler', '2006-10-31', 'domain-driven-design', 'https://www.martinfowler.com/bliki/UbiquitousLanguage.html', '全文翻訳'),
  article('value-object', 'Value Object', '値オブジェクト', '同一性ではなく値で扱うオブジェクトの性質と設計上の使いどころを整理します。', 'Martin Fowler', '2016-11-14', 'domain-driven-design', 'https://www.martinfowler.com/bliki/ValueObject.html', '全文翻訳'),
  article('refactoring-2nd-ed', 'The Second Edition of “Refactoring”', '「リファクタリング」第2版', '第2版で重視された変更点と、現代的なリファクタリング観を整理します。', 'Martin Fowler', '2018-06-01', 'refactoring', 'https://www.martinfowler.com/articles/refactoring-2nd-ed.html'),
  article('codemods-api-refactoring', 'Refactoring with Codemods to Automate API Changes', 'CodemodによるAPI変更の自動リファクタリング', 'API変更を機械的に広げるための自動化アプローチを整理します。', 'Juntao QIU | 邱俊涛', '2025-01-22', 'refactoring', 'https://www.martinfowler.com/articles/codemods-api-refactoring.html', '全文翻訳'),
  article('refactoring-video-store-js', 'Refactoring a JavaScript video store', 'JavaScript版ビデオレンタル例題のリファクタリング', '古典的な例題をJavaScriptで読み直すためのメモです。', 'Martin Fowler', '2016-05-18', 'refactoring', 'https://www.martinfowler.com/articles/refactoring-video-store-js/'),
  article('class-too-large', 'Refactoring: This class is too large', 'リファクタリング: このクラスは大きすぎる', '大きすぎるクラスを分割する考え方を整理します。', 'Clare Sudbery', '2020-04-14', 'refactoring', 'https://www.martinfowler.com/articles/class-too-large.html'),
  article('refactoring-pipelines', 'Refactoring with Loops and Collection Pipelines', 'ループとコレクションパイプラインのリファクタリング', 'ループ処理を読みやすい変換列として整理するメモです。', 'Martin Fowler', '2015-07-14', 'refactoring', 'https://www.martinfowler.com/articles/refactoring-pipelines.html'),
  article('microservice-testing', 'Testing Strategies in a Microservice Architecture', 'マイクロサービスアーキテクチャのテスト戦略', 'サービス分割後のテスト戦略を整理します。', 'Toby Clemson', '2014-11-18', 'testing', 'https://www.martinfowler.com/articles/microservice-testing'),
  article('practical-test-pyramid', 'The Practical Test Pyramid', '実践的なテストピラミッド', 'テストの粒度とバランスを考えるためのメモです。', 'Ham Vocke', '2018-02-26', 'testing', 'https://www.martinfowler.com/articles/practical-test-pyramid.html'),
  article('mocks-arent-stubs', "Mocks Aren't Stubs", 'モックはスタブではない', 'テストダブルの種類と設計への影響を整理します。', 'Martin Fowler', '2007-01-02', 'testing', 'https://www.martinfowler.com/articles/mocksArentStubs.html'),
  article('non-determinism-tests', 'Eradicating Non-Determinism in Tests', 'テストの非決定性を根絶する', '不安定なテストを減らすための観点を整理します。', 'Martin Fowler', '2011-04-14', 'testing', 'https://www.martinfowler.com/articles/nonDeterminism.html'),
  article('qa-in-production', 'QA in Production', '本番環境でのQA', '本番環境を品質確認の場として扱う考え方を整理します。', 'Rouan Wilsenach', '2017-04-04', 'testing', 'https://www.martinfowler.com/articles/qa-in-production.html'),
  article('microservices-guide', 'Microservices Guide', 'マイクロサービスガイド', 'マイクロサービスに関する主要記事への入口として、概念、設計、移行、運用の論点を整理します。', 'Martin Fowler', '日付記載なし', 'web-services', 'https://www.martinfowler.com/microservices', '全文翻訳'),
  article('enterprise-integration-using-rest', 'Enterprise Integration Using REST', 'RESTによるエンタープライズ統合', 'RESTをエンタープライズ統合に使うときの設計原則と実装上の注意点を整理します。', 'Brandon Byars', '2013-11-18', 'web-services', 'https://www.martinfowler.com/articles/enterpriseREST.html', '全文翻訳'),
  article('richardson-maturity-model', 'Richardson Maturity Model', 'リチャードソン成熟度モデル', 'RESTfulなサービス設計を段階的に捉えるためのモデルを整理します。', 'Martin Fowler', '2010-03-18', 'web-services', 'https://www.martinfowler.com/articles/richardsonMaturityModel.html', '全文翻訳'),
  article('does-my-bus-look-big-in-this', 'Does My Bus Look Big in This?', 'このバス、大きすぎませんか？', 'ESBを中心にしたSOAへの違和感と、サービス連携の設計判断を読むためのページです。', 'Jim Webber and Martin Fowler', '2008-03', 'web-services', 'http://www.infoq.com/presentations/soa-without-esb', '全文翻訳'),
  article('consumer-driven-contracts', 'Consumer-Driven Contracts: A Service Evolution Pattern', 'コンシューマ駆動契約: サービス進化パターン', 'サービス提供者と利用者の契約を、進化可能な形で管理する考え方を整理します。', 'Ian Robinson', '2006-06-12', 'web-services', 'https://www.martinfowler.com/articles/consumerDrivenContracts.html', '全文翻訳'),
]

export const featuredArticles = articles.slice(0, 8)

export const contentMap: Record<string, PageDefinition> = {
  '/': {
    title: 'ホーム',
    kind: 'home',
    markdownPath: `${contentBase}/home.md`,
  },
  '/tags': {
    title: 'タグ一覧',
    kind: 'tags',
    markdownPath: `${contentBase}/tags/index.md`,
  },
  '/articles': {
    title: '記事一覧',
    kind: 'articles',
    markdownPath: `${contentBase}/articles/index.md`,
  },
  ...Object.fromEntries(tagCards.map((tag) => [
    tag.href,
    {
      title: tag.title,
      kind: 'tag',
      tagSlug: tag.slug,
      markdownPath: `${contentBase}/tags/${tag.slug}.md`,
    },
  ])),
  ...Object.fromEntries(articles.map((item) => [
    item.href,
    {
      title: item.title,
      kind: 'article',
      articleSlug: item.slug,
      tagSlug: item.tagSlug,
      markdownPath: `${contentBase}/articles/${item.slug}.md`,
    },
  ])),
}

export function articlesForTag(tagSlug: TagSlug): Article[] {
  return articles.filter((item) => item.tagSlug === tagSlug)
}

export function tagForSlug(tagSlug: TagSlug): TagCard | undefined {
  return tagCards.find((tag) => tag.slug === tagSlug)
}

function article(
  slug: string,
  title: string,
  subtitle: string,
  description: string,
  authors: string,
  date: string,
  tagSlug: TagSlug,
  originalUrl: string,
  status: ArticleStatus = '日本語訳・要約',
): Article {
  const tag = tagCards.find((item) => item.slug === tagSlug)

  return {
    slug,
    title,
    subtitle,
    description,
    authors,
    date,
    originalUrl,
    status,
    tagSlug,
    tag: tag?.title ?? tagSlug,
    href: `/articles/${slug}`,
  }
}
