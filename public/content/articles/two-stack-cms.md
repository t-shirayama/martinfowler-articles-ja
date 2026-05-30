# Two Stack CMS

## 要約

Two Stack CMSは、コンテンツ作成とコンテンツ配信の要求が大きく異なる場合に、編集側のスタックと配信側のスタックを分けるアーキテクチャです。編集側では専門ツールや複雑なワークフローを支え、配信側では世界規模の読者に対する可用性、拡張性、性能を優先します。

この記事では、グローバルな製品カタログを持つマーケティングサイトを題材に、CCS(Content Creation Stack)、CDS(Content Delivery Stack)、Preview/Liveの分割、adapter layer、非同期連携、運用上の学びを説明しています。

対応範囲: 原文はinfodeckです。通常ページで見えるタイトル、概要、目次に加え、`fallback.html`で公開されているデッキ本文の検索用テキストを翻訳しています。スライド画像だけに含まれる可能性のある未取得情報や、操作で初めて見える未確認のビルド内容は補っていません。謝辞は省略しています。

## 読むときの観点

- CMSをひとつのシステムとして考えるのではなく、編集と公開で異なる品質特性を持つものとして読む。
- PreviewとLiveを同じCDS内の別sliceに分けることで、安全な確認と本番配信を両立している。
- adapter layerは単なる接続部ではなく、独立した編集ツール群と公開ワークフローを調整する役割を担う。
- 非同期通信はシステム特性をよくする一方、編集者へのフィードバックを難しくする。

## 原文の翻訳

私たちは、リッチなコンテンツを持つ多くのWebサイトを構築します。その際には、よく使われるContent Management System、つまりCMSを使うことがしばしばあります。ある最近のプロジェクトでは、グローバルな製造業者のためのマーケティングサイトを扱いました。そのサイトは、複雑でインタラクティブなコンテンツを必要とし、高い可用性と大きなトラフィックへの対応も求められました。

私たちの対応は、editing-publishing separation patternを適用し、コンテンツ作成と配信のために、別々の2つのソフトウェアスタックを構築することでした。このデッキでは、このアーキテクチャの概要と、スタック間の統合、安全な本番相当プレビューの提供、システムの進化とスケーリングへの対応について説明します。

### グローバル製品カタログのためのTwo-Stack CMS

私たちは、グローバルな読者を支えながら、既存の編集ツール群の複雑な調整にも対応するために、Two-Stack CMSの構築でediting-publishing separation patternを適用しました。

グローバルな製造業者のためのマーケティングサイトを構築する依頼には、2つの大きな課題がありました。

### 複雑なコンテンツ

サイトは新鮮で魅力的でなければなりません。そのため、デザイン性の高いページ構造、多数の画像や動画、インタラクティブなページ、製品仕様のための社内システムへのリンクが必要でした。

Webサイトの執筆者は、購入したものも社内で構築したものも含め、さまざまなツールを使います。私たちはそれらのツールを支えつつ、ツール間と関係するさまざまなグループ間のワークフローを調整する方法を提供しなければなりません。

調整問題の重要な部分が翻訳です。グローバルサイトは20を超える国と、ほぼ100のロケールを支える必要があります。画像、製品の提供可否、価格は国ごとに異なります。

### グローバルな読者

グローバルなマーケティングサイトには大きなトラフィックがあります。1日の訪問者は6桁に達し、1日のページビューは200万を超えます。

サイトには高い可用性が必要です。頻繁な更新を受けるにもかかわらず、ダウンタイムは許されません。

### 従来のCMS設計

従来のCMS設計は、2つの異なるニーズを混同しています。

編集時には、少数の熟練ユーザーがコンテンツを頻繁に更新します。

公開後には、非常に多くの読者がいますが、更新はまれです。

私たちはこれを**Editing-Publishing Separation** patternと呼びます。

### 作成と配信に異なるスタックを使う

そこで私たちは、コンテンツ作成と配信に異なるスタックを使いました。

編集者はContent Creation Stack(CCS)を使い、専門化されたシステム群を用いてコンテンツを反復的に作成します。

Content Delivery Stack(CDS)は、Webサイトの読者への世界規模の配信と、販売店など外部プラットフォームへの配信を扱います。

編集者は特定の種類のコンテンツに関する専門家であり、その種類のコンテンツに合わせて作られた、カスタムまたは購入済みのさまざまなシステムを使います。たとえば写真担当者は、Webサイトに必要な画像を取得するためにDigital Asset Management systemを使います。

公開は、CCSからCDSへコンテンツをコピーする単一の転送操作によって制御されます。この転送操作が、CDSシステムへの唯一の書き手です。

2つのスタックでは、可用性と拡張性の要求が大きく異なります。CCSはより伝統的なバックオフィスアプリケーション群として管理できます。一方、CDSは高い拡張性と可用性を備える必要があります。グローバルなシステムでは、停止してよい時間などないからです。

### 安全なプレビュー

私たちは、公開しようとしているコンテンツの安全なプレビューを必要としていました。

ビジネスユーザーとコンテンツ作成者は、一般公開の前にコンテンツをレビューする必要があります。しかし、専門化されたCCSシステムでは、公開後に近い状態でコンテンツを見ることが難しくなります。

プレビューのためにすべてのコンテンツをCDSへ置くと、CDSはユーザー層ごとに異なるコンテンツを意識し、公開前に漏れ出さないよう保護する責任まで負うことになります。

コンテンツは公開前にレビューと承認を受ける必要があり、指定した日時に公開できなければなりません。

### PreviewとLiveのslice

私たちはCDSを、PreviewとLiveの別々のsliceに分けました。

どちらのsliceも同じコードベースを実行しますが、データベース内のコンテンツが異なります。Previewは、ビジネスユーザーとコンテンツ作成者が公開後に近い状態でサイトをレビューし、承認するためのものです。Liveは、エンドユーザーへコンテンツを配信します。

CCS内の各システムは、独立してコンテンツを公開します。公開されたコンテンツは、すぐにPreviewで利用できます。

Preview sliceは、選ばれたユーザーだけがアクセスできるよう保護されています。

Previewは、新機能のstagingやコンテンツのshowcaseにも使われます。

準備ができたら、コンテンツをCDS-Liveへ公開します。

sliceごとに、可用性と拡張性の要求は異なります。Liveは、大規模でグローバルな読者に向けて高可用かつスケーラブルです。Previewは少数の内部ユーザーだけを対象とし、ダウンタイムを許容できます。

### メタデータで流れを制御する

コンテンツのメタデータが、PreviewとLiveへの流れを制御します。

コンテンツ作成中、著者はCCSからCDS-Previewへ公開します。CDS Previewには各コンテンツの現在版だけがあり、過去の履歴はCCSが保持します。著者がレビューの準備ができたと判断すると、コンテンツの状態をready for reviewにし、レビュー担当者へリンクを送ります。レビュー担当者がコンテンツを承認すると、それはready for liveとマークされます。

すべてのコンテンツにはsunrise dateとsunset dateが付けられます。sunrise dateを過ぎ、かつコンテンツがready for liveになって初めて、CDS-PreviewからCDS-Liveへコピーします。sunset dateを過ぎると、そのコンテンツは両方のCDSスタックから削除されます。

### コンテンツ作成と配信のワークフロー

私たちは、コンテンツ作成と配信のワークフローを調整する必要がありました。

コンテンツ作成に使われるツールは独立したツールです。しかし、コンテンツ作成にはその組織固有のワークフローがあります。たとえば、ある製品では、ある言語の新しいテキストをすぐに公開しつつ、そのテキストを翻訳へ回し、翻訳が完了したら公開する必要がある、といった場合です。

CCSのツールは、私たちのワークフローを考慮するよう変更できないことがよくあります。社内製ツールであっても、CCSツールをワークフローの都合から切り離しておくほうがよいのです。

### adapter layer

私たちは、CCS同士、そしてCCSとCDSを統合するためにadapter layerを構築しました。

adapter layerは、CCSシステム間のすべての通信と、CDSへのコンテンツ転送に責任を持ちます。私たちはApache Camel frameworkを使って、非同期の通信フローを構成しました。

説明のために、製品公開のワークフローを例にします。

STEP 1: 執筆者はProduct Catalog system内で、master locale、つまり基準となる言語の製品説明を書きます。必要に応じて、Product Catalogに組み込まれたexport機構を使い、CDS Previewへ公開するためにadapter layerへexportします。

公開後、その製品説明はmaster localeですぐにpreview可能になります。

STEP 2: master localeのコンテンツが承認されると、Product Catalog systemは、翻訳対象ロケールの一覧とともにmaster contentをadapter layerへexportします。

adapterはコンテンツをitem、つまりテキストの塊に分解し、それらをContent Translation Systemへ送ります。

STEP 3: Content Translation Systemは、翻訳者による各itemの翻訳作業を調整し、結果をadapterへ返します。

adapterは分割されたすべてのコンテンツと受け取った翻訳を追跡します。すべての翻訳がそろうと、それらを織り合わせてProduct Catalog systemへ戻します。

STEP 4: Product Catalog systemは、すべての翻訳を含むようになった製品説明を、previewのためにadapter layerへ再exportします。

adapter layerは、既存のツールをコンテンツ作成に使えるようにし、それらのツールを独立してupgradeしたり置き換えたりできるようにした点で成功しました。しかし、これらのcomponentの多くには、localization、cross-system validation、content compositionのまわりに厳しい制約がありました。そのため、それらのworkaroundをすべて扱うために、adapter layerには多くの複雑さが生まれました。

### コンテンツ配信の進化と拡張

コンテンツ配信は、進化し、scaleする必要があります。

Content Delivery Stackは、独立して進化できるcomponentで構成されます。

Preview stackとLive stackは、PreviewがLive systemを正確に反映するよう、同じcomponentを使います。component architectureは、より要求の厳しいLiveのcaseを中心に設計されています。私たちは、新しい機能を簡単に追加できるよう、componentを独立してupgrade可能にしたいと考えています。

contentへaccessするために、2つのAPIを提供します。基礎となるsoftwareは同じですが、2つのAPIは異なるserviceとsecurity特性を提供します。

Content Publishing Service APIは、content uploadに使われるRESTfulなread/write APIです。HTTPS経由でのみaccessでき、authenticationとauthorization controlで保護されています。

Digital AssetはDigital Asset Serverへuploadされます。その他すべてのtextual contentはAggregated Content Storeに保存されます。

Aggregated Content StoreはMongoDB NoSQL document databaseです。document storeは、schemaのないeditorial marketing contentと、多属性のproduct informationを保存するのに理想的な選択です。

Content Delivery Service APIはRESTfulなread-only APIであり、Aggregated Content Storeからcontentを取り出して、HTTP経由でPresentation Front Endへ提供します。contentはJSONで提供されます。

これはlocale awareであり、指定されたlocaleで利用可能なcontentだけを提供します。

また、presentationに依存しないraw contentをJSON形式で他のsystemへsyndicateします。たとえば、eCommerceやAmazonのようなdealerへのproduct feed syndicationです。

presentation front endは、content delivery serviceからのJSONをHTML pageへ変換します。UI designerが必要とするさまざまな方法でJSON dataを表現できるmoduleを使って、pageを構成します。このJSONからHTMLへの変換により、**Separated Presentation**が可能になります。

また、rich contentを外部systemへsyndicateする責任も持ちます。

Digital Asset Serverは画像を提供します。responsive designを支え、device resolutionに基づいて異なるsizeを配信するために必要な、オンザフライの画像変換を行う能力を持っています。

### CDSのインフラ

全体として、CDSのLive sliceには高い可用性と拡張性の両方が必要です。しかしPublishing APIには、同じ水準の可用性と拡張性は必要ありません。代わりに、HTTPSによる認証や認可といったセキュリティ上の要求があります。

Aggregated Content Storeは、MongoDB replica setを実行する3台の大きなサーバーで構成され、どのサーバーからでも読み取りができるようになっています。

Content Delivery ServicesとPresentation FrontEndは、グローバルな読者に対して高可用性とzero-downtime deploymentを実現するために、Blue-Green Deploymentを使うよう構成されています。

zero-downtime deploymentによって、私たちはcontinuous deliveryを行えます。本番には3週間ごとに新機能をリリースします。1つのリリースサイクルより長くかかる機能にはFeature Flagsを使います。

Presentation FrontEndからContent Delivery Serviceへのすべてのリクエストは、短時間キャッシュされます。APIの前段にload balancerを置き、JSONレスポンスを15分のTTL、つまりmax-ageでキャッシュします。

エンドユーザーに最高の性能を提供するために、CDN edge serverを使ってHTTPレスポンスをページ単位でキャッシュします。これにより、ページレスポンスの92%が1秒以内に収まります。

画像と動画のDigital Asset Serverとして、AdobeのScene7 SaaSを使います。Scene7はオンザフライの画像変換を提供します。

### 学んだこと

非同期通信はシステム特性にはよいものですが、ユーザー体験には問題を起こします。

私たちは、CCSからCDSへのコンテンツ公開に非同期通信を選びました。システムの観点ではよい設計であり、結合を減らし、CCSの応答性を高めました。しかしこれは、コンテンツ作成者へのフィードバックを難しくしました。

コンテンツがPreviewで利用可能になるまで、数分かかることがありました。編集者には、どれくらい時間がかかるのかわかりません。さらに、CDSで失敗が起きても、CCSシステム内の編集者には直接のフィードバックがありませんでした。

これらの問題に対応するために、私たちはCDSにreporting APIを構築し、CCSからそれを使って編集者へ状況を表示しました。CCSで変更されたものの失敗により公開されていないコンテンツは赤、公開されたがPreviewで見えるのを待っているコンテンツは黄色、Previewで利用可能になったコンテンツは緑で示しました。将来への教訓は、非同期通信がユーザー体験にもたらす結果へ注意深く目を向けることです。

分散システムでのdebuggingとreportingは難しいものです。

コンテンツ作成には多くのシステムが関わっていたため、大規模なローンチに向けた進捗を報告することは困難でした。また、翻訳待ちのコンテンツなど、システムをまたぐ問題のdebugも難しくなりました。

私たちはSplunkを使ったstructured loggingによってこれを解決しました。特定のエラーに対するalertを生成し、大規模ローンチの進捗レポートを作るためです。

### Two Stack CMSが向いているとき

Two Stack CMSは、既存システムを活用したいときによい選択です。

ほとんどすべての組織には、Product CatalogやMedia Storeなど、専門化されたシステムがすでに存在し、eCommerce systemなど他のシステムへ構造化されたコンテンツを提供しています。

Two Stack CMSを使えば、コンテンツを重複させることなく、こうした専門化されたシステムを使い続けられます。これらのシステムを維持することで、専門的なコンテンツ作成ユーザーの能力を活かし、数千枚の画像、数百の製品仕様といった大量のコンテンツを効率よく扱えます。

私たちには、異なる横断的ニーズがあります。

CCSは頻繁に更新する少数の編集者を支え、Preview CDSは安全なアクセス権を持つ少数の読者を支え、Live CDSはコンテンツの変化が比較的少ない一方で、大量の読者を支えます。

では、どのようなときにTwo Stack CMSアーキテクチャを使うべきではないのでしょうか。

コンテンツ量が少なく、少数の訓練済みの人だけがコンテンツ作成と保守に責任を持つ場合、Two Stack CMSが追加する複雑さには見合う価値がありません。その複雑さは、コンテンツ作成者が使い方を覚えるのを難しくし、システム保守にも大きな労力を加えます。ただし、このスタイルで機能するよう設計されたツールによって、軽減される可能性はあります。

### 参考

軽量なスタイルでの似たアプローチについては、www.thoughtworks.comのCMSアーキテクチャを参照してください。
