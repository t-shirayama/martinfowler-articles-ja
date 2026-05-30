# Microservices Guide

## 要約

このガイドは、martinfowler.com にあるマイクロサービス関連コンテンツへの案内です。
マイクロサービスの基本的な定義、採用判断のトレードオフ、モノリスからの移行、テスト、運用、インフラ、フロントエンド分割など、読む順番をつけるための入口になっています。

中心にあるメッセージは、マイクロサービスは有用なアーキテクチャスタイルである一方、多くの状況ではモノリスのほうがよいということです。
独立デプロイや技術選択の自由と引き換えに、分散システム、結果整合性、運用複雑性を受け入れる必要があります。

## 読むときの観点

- マイクロサービスを、サービスの小ささではなく、ビジネス能力、独立デプロイ、分散運用の設計判断として読む。
- 利点だけでなく、分散、整合性、運用のコストを採用判断に含める。
- 新規開発で最初から分割する場合と、モノリスから段階的に分割する場合の違いを見る。
- テスト、データ分割、インフラ自動化、DevOps文化が前提能力として求められる点を意識する。

## 原文の翻訳

手短に言えば、マイクロサービス・アーキテクチャスタイルとは、ひとつのアプリケーションを**小さなサービス群として開発する**アプローチです。
それぞれのサービスは自分自身のプロセスで動き、多くの場合 HTTP リソース API のような軽量な仕組みで通信します。
これらのサービスはビジネス能力を中心に作られ、完全に自動化されたデプロイ機構によって独立してデプロイできます。
サービスの中央集権的な管理は最小限に抑えられ、サービスごとに異なるプログラミング言語や異なるデータストレージ技術を使うこともあります。

-- [James Lewis and Martin Fowler (2014)](https://www.martinfowler.com/articles/microservices.html)

これは、martinfowler.com にあるマイクロサービス関連資料へのガイドです。

2013年の終わりごろ、私の周囲でマイクロサービスについて多くの議論が起きているのを聞きながら、私はマイクロサービスに明確な定義がないことを気にかけるようになりました。
それは [SOA で多くの問題を引き起こした](https://www.martinfowler.com/bliki/ServiceOrientedAmbiguity.html) のと同じ運命です。
そこで私は、このスタイルの経験豊かな実践者のひとりである同僚の [James Lewis](https://twitter.com/boicy) と一緒に記事を書くことにしました。

私たちは、現場で見てきたマイクロサービスアーキテクチャに共通する特徴を列挙することで、[マイクロサービススタイルのしっかりした定義](https://www.martinfowler.com/articles/microservices.html)を示すためにその記事を書きました。

- Componentization via Services: サービスによるコンポーネント化
- Organized around Business Capabilities: ビジネス能力を中心に組織化する
- Products not Projects: プロジェクトではなくプロダクトとして扱う
- Smart endpoints and dumb pipes: 賢いエンドポイントと単純なパイプ
- Decentralized Governance: 分散されたガバナンス
- Decentralized Data Management: 分散されたデータ管理
- Infrastructure Automation: インフラストラクチャの自動化
- Design for failure: 障害を前提に設計する
- Evolutionary Design: 進化的設計

その記事では、「マイクロサービスはどのくらいの大きさなのか」「マイクロサービスと Service-Oriented Architecture の違いは何か」といった、よくある問いも取り上げました。
その記事は、マイクロサービスへの関心を促すきっかけになりました。

「私たちはそれを使うべきなのか、使うべきではないのか。

……そもそも、それはいったい何なのか。」

私の[短い入門トーク](https://www.martinfowler.com/videos.html#microservices)では、最も重要な定義上の特徴を取り上げ、マイクロサービスとモノリスを比較し、最初のマイクロサービスシステムを本番投入する前にやるべき重要なことを概説しています。
トークはおよそ25分です。

### マイクロサービスはいつ使うべきか

どんなアーキテクチャスタイルにもトレードオフがあります。
つまり、使われる文脈に応じて評価しなければならない強みと弱みがあります。
これはマイクロサービスにも確かに当てはまります。
マイクロサービスは有用なアーキテクチャですが、**多くの、実際にはほとんどの状況では、モノリスのほうがうまくいく**でしょう。

マイクロサービスには利点があります。

- [Strong Module Boundaries](https://www.martinfowler.com/articles/microservice-trade-offs.html#boundaries): マイクロサービスはモジュール構造を強化します。これは、より大きなチームでは特に重要です。
- [Independent Deployment](https://www.martinfowler.com/articles/microservice-trade-offs.html#deployment): 単純なサービスはデプロイしやすく、自律しているため、問題が起きたときにシステム障害を引き起こしにくくなります。
- [Technology Diversity](https://www.martinfowler.com/articles/microservice-trade-offs.html#diversity): マイクロサービスでは、複数の言語、開発フレームワーク、データストレージ技術を混在させられます。

しかし、コストも伴います。

- [Distribution](https://www.martinfowler.com/articles/microservice-trade-offs.html#distribution): 分散システムはプログラムするのが難しくなります。リモート呼び出しは遅く、常に失敗の危険があるためです。
- [Eventual Consistency](https://www.martinfowler.com/articles/microservice-trade-offs.html#consistency): 分散システムで強い整合性を維持するのはきわめて難しいため、誰もが結果整合性を扱わなければなりません。
- [Operational Complexity](https://www.martinfowler.com/articles/microservice-trade-offs.html#ops): 定期的に再デプロイされる多数のサービスを管理するには、成熟した運用チームが必要です。

以上は [Microservice Trade-Offs](https://www.martinfowler.com/articles/microservice-trade-offs.html) からの要約です。

### 採用判断に関するリンク

- [Microservice Premium](https://www.martinfowler.com/bliki/MicroservicePremium.html): マイクロサービス・アーキテクチャスタイルはこの一年ほど非常に注目されてきました。最近の O'Reilly software architecture conference では、ほとんどすべてのセッションがマイクロサービスに触れているように見えました。誇大宣伝を疑う感度が一斉に点滅するほどです。その結果のひとつとして、チームがマイクロサービスを採用することに前のめりになりすぎ、マイクロサービス自体が複雑さを持ち込むことに気づかない例を見てきました。これはプロジェクトのコストとリスクに**プレミアムを上乗せする**ものであり、しばしばプロジェクトを深刻な問題に追い込みます。Martin Fowler、2015年5月13日、bliki。
- [Monolith First](https://www.martinfowler.com/bliki/MonolithFirst.html): マイクロサービスアーキテクチャを使うチームの話を聞くうちに、共通するパターンに気づきました。成功したマイクロサービスの話のほとんどは、大きくなりすぎたモノリスから始まり、それを分割しています。一方、最初からマイクロサービスシステムとして作ったという話のほとんどは、深刻な問題に行き着いています。このパターンから、多くの同僚は、アプリケーションがマイクロサービスに見合うほど大きくなると確信していても、**新しいプロジェクトをマイクロサービスから始めるべきではない**と主張するようになりました。Martin Fowler、2015年6月3日、bliki。
- [Don’t start with a monolith](https://www.martinfowler.com/articles/dont-start-monolith.html): この数か月、成功するマイクロサービスアーキテクチャに到達する唯一の方法は、まずモノリスから始めることだと繰り返し聞いてきました。Simon Brown の言葉を借りれば、構造のよいモノリスを作れないのに、構造のよいマイクロサービス群を作れると考える理由は何でしょうか。この主張の最新で、いつものように非常に説得力のある形は、まさにこのサイトで Martin Fowler によって示されました。私はその初期ドラフトにコメントする機会があったため、このことについて考える時間がありました。そして、普段なら彼に同意することが多く、私が見解を共有する人たちも彼に同意しているように見えたからこそ、よく考えました。そのうえで私は、**モノリスから始めることは通常まさに誤りだ**と強く確信しています。Stefan Tilkov、2015年6月9日、article。
- [Microservice Prerequisites](https://www.martinfowler.com/bliki/MicroservicePrerequisites.html): マイクロサービス・アーキテクチャスタイルの利用について人々と話すと、多くの楽観論を耳にします。開発者はより小さな単位で作業することを楽しみ、モノリスよりよいモジュール性を期待します。しかし、どんなアーキテクチャ判断にもトレードオフがあります。特にマイクロサービスには運用上の大きな影響があり、運用側は単一で明確なモノリスではなく、小さなサービスのエコシステムを扱うことになります。したがって、一定の基礎能力がないなら、**マイクロサービススタイルの採用を検討すべきではありません**。Martin Fowler、2014年8月28日、bliki。
- [Microservices and the First Law of Distributed Objects](https://www.martinfowler.com/articles/distributed-objects-microservices.html): 『Patterns of Enterprise Application Architecture』で私は「オブジェクトを分散させるな」と述べました。この助言は、私がマイクロサービスに関心を持っていることと矛盾するのでしょうか。Martin Fowler、2014年8月13日、article。
- [Interview with Sam Newman about Microservices](https://gotopia.tech/bookclub/episodes/moving-to-microservices-with-sam-newman-and-martin-fowler): GOTO conferences から、Sam Newman の著書『Monoliths to Microservices』について Sam と対談してほしいと依頼されました。これは、マイクロサービスとは何か、いつ使うべきかについての一般的な会話になりました。Sam は、主な理由を独立デプロイ性、データの分離、組織構造の反映の3つと考えています。私は最初の点にはより懐疑的ですが、データと人はソフトウェア開発の複雑な部分だと考えています。Martin Fowler、2020年9月4日、video。

### マイクロサービスを作る

マイクロサービスアーキテクチャはかなり新しいものですが、幸いなことに私たちは Thoughtworks で、その[ごく初期の登場](https://www.thoughtworks.com/radar/techniques/microservices)から関わってきました。
それらとどう向き合うのがよいかをまとまりのある形で知るには、私たちの経験と公開されている事例にもとづいて Sam Newman が書いた書籍 [Building Microservices](https://www.amazon.com/gp/product/1491950358/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=1491950358&linkCode=as2&tag=martinfowlerc-20) が最良の入門です。

### 構築に関するリンク

- [Testing Strategies in a Microservice Architecture](https://www.martinfowler.com/articles/microservice-testing): ここ数年、サービスベースのアーキテクチャは、より小さく、より焦点の絞られた「マイクロ」サービスへと移行してきました。このアプローチには、各コンポーネントを独立してデプロイ、スケール、保守できることや、複数チームによる並行開発を可能にすることなど、多くの利点があります。しかし、追加のネットワーク分割が導入されると、モノリシックなインプロセスアプリケーションに適用していたテスト戦略を見直す必要があります。ここでは、独立してデプロイ可能な複数コンポーネントによって増えるテストの複雑さを管理し、異なるサービスの守り手として複数チームが行動しても、テストとアプリケーションを正しく保つためのいくつかのアプローチを議論します。Toby Clemson、2014年11月18日、infodeck。
- [How to break a Monolith into Microservices](https://www.martinfowler.com/articles/break-monolith-into-microservices.html): モノリシックなシステムが扱いきれないほど大きくなると、多くの企業はそれをマイクロサービス・アーキテクチャスタイルへ分解することに惹かれます。それは価値ある旅ですが、簡単ではありません。うまく進めるには、単純なサービスから始め、その後、ビジネスにとって重要で頻繁に変化する垂直方向の能力にもとづくサービスを切り出す必要があると学んできました。これらのサービスは最初は大きめで、できれば残されたモノリスに依存しないほうがよいです。移行の各ステップは、全体のアーキテクチャに対する**原子的な改善**であるべきです。Zhamak Dehghani、2018年4月24日、article。
- [Micro Frontends](https://www.martinfowler.com/articles/micro-frontends.html): よいフロントエンド開発は難しいものです。大きく複雑なプロダクトで、多くのチームが同時に作業できるようにフロントエンド開発をスケールさせるのは、さらに難しくなります。この記事では、フロントエンドのモノリスを、より小さく管理しやすい多数の部分に分割する近年の流れを説明し、このアーキテクチャがフロントエンドコードに取り組むチームの有効性と効率をどのように高めるかを示します。利点とコストに加えて、利用可能ないくつかの実装選択肢を扱い、この技法を示す完全なサンプルアプリケーションにも踏み込みます。Cam Jackson、2019年6月19日、article。
- [How to extract a data-rich service from a monolith](https://www.martinfowler.com/articles/extract-data-rich-service.html): モノリスをより小さなサービスへ分割するとき、最も難しいのは、実はモノリスのデータベースにあるデータを分割することです。データが豊富なサービスを抽出するには、移行中つねにデータの単一の書き込みコピーを保つ一連の手順に従うと有用です。その手順は、既存のモノリス内で論理的な分離を作るところから始まります。サービスの振る舞いを別モジュールへ分け、次にデータを別テーブルへ分けます。これらの要素は、その後、新しい自律的なサービスへ個別に移せます。Praful Todkar、2018年8月30日、article。
- [Infrastructure As Code](https://www.martinfowler.com/bliki/InfrastructureAsCode.html): Infrastructure as Code は、コンピューティングとネットワークのインフラストラクチャをソースコードで定義し、それを他のソフトウェアシステムと同じように扱えるようにするアプローチです。そのコードはソース管理に置くことで監査可能性と [ReproducibleBuilds](https://www.martinfowler.com/bliki/ReproducibleBuild.html) を支え、テストの実践や [ContinuousDelivery](https://www.martinfowler.com/bliki/ContinuousDelivery.html) の規律の対象にできます。このアプローチは、拡大する [CloudComputing](https://www.martinfowler.com/bliki/CloudComputing.html) プラットフォームに対応するためにこの10年ほど使われてきたもので、今後のコンピューティングインフラを扱う**支配的な方法**になるでしょう。Martin Fowler、2016年3月1日、bliki。
- [Dev Ops Culture](https://www.martinfowler.com/bliki/DevOpsCulture.html): アジャイルソフトウェア開発は、要求分析、テスト、開発の間にあったサイロの一部を崩してきました。デプロイ、運用、保守も、ソフトウェア開発プロセスの他の部分から同じように分離されてきた活動です。DevOps ムーブメントは、こうしたサイロを取り除き、開発と運用の協働を促すことを目指しています。Rouan Wilsenach、2015年7月9日、bliki。
- [Circuit Breaker](https://www.martinfowler.com/bliki/CircuitBreaker.html): ソフトウェアシステムが、別プロセスで動くソフトウェア、おそらくネットワーク上の別マシンにあるソフトウェアへリモート呼び出しを行うのは一般的です。インメモリ呼び出しとリモート呼び出しの大きな違いのひとつは、リモート呼び出しは失敗したり、タイムアウトに達するまで応答なしに固まったりすることがある点です。さらに悪いことに、応答しない提供側に多数の呼び出し元が集中すると、重要なリソースを使い果たし、複数システムにまたがる連鎖的な障害につながります。Michael Nygard は優れた著書 [Release It](https://www.amazon.com/gp/product/0978739213/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=0978739213&linkCode=as2&tag=martinfowlerc-20) で、この種の破滅的な連鎖を防ぐ Circuit Breaker パターンを広めました。Circuit Breaker の基本的な考え方は非常に単純です。保護したい関数呼び出しを Circuit Breaker オブジェクトで包み、そのオブジェクトが失敗を監視します。失敗が一定のしきい値に達すると Circuit Breaker はトリップし、それ以後の呼び出しは保護された呼び出しをまったく実行せずにエラーを返します。通常は、Circuit Breaker がトリップしたときに何らかの監視アラートも必要になります。Martin Fowler、2014年3月6日、bliki。
