# Bimodal IT

## 要約

Bimodal IT は、ソフトウェアシステムを「素早い変更を重視する front office」と「信頼性を重視する back office」に分けて管理する考え方です。

この記事は、その分け方がシステム単位に寄りすぎており、さらに「速度のためには品質を犠牲にできる」という誤った前提に立っていると批判しています。

代わりに、ソフトウェアシステムではなく business capability を中心に見て、それが utility なのか strategic なのかを考えるべきだと述べています。

## 読むときの観点

- 「速く変える領域」と「慎重に守る領域」を、システム単位で固定してよいのかを考える。
- front office の新しい施策が、back office の systems of record にも変更を要求する場面を想像する。
- 品質と速度を単純なトレードオフとして扱っていないかを見る。
- 管理手法を変えるなら、システム分類ではなく business capability の性質から判断する。

## 原文の翻訳

Bimodal IT とは、ソフトウェアシステムを管理と統制のために、二つのはっきり異なるカテゴリへ分けるべきだという、欠陥のある考え方です。

- Front Office systems、つまり systems of engagement は、素早い機能開発に最適化すべきだとされます。これらの systems of engagement は、顧客ニーズやビジネス機会の変化にすばやく反応する必要があります。欠陥は、この速い開発サイクルに必要なコストとして許容すべきだとされます。
- Back Office systems、つまり systems of record は、信頼性に最適化すべきだとされます。systems of record では、企業に損害を与える欠陥を出さないことが重要です。その結果、変更の速度を落とすことになります。

Bimodal IT という言葉は Gartner が使っています。McKinsey & Company は、同じ基本的な考えを "Two Speed IT" という名前で語っています。私は、これを "Bipolar IT" と呼びたくなる誘惑に抗うのが難しいのですが。

このアプローチについて初めて聞いたとき、私はうれしく思いました。こうした権威ある組織が、私の UtilityVsStrategicDichotomy と同じ結論にたどり着いたのだと思ったからです。しかしさらに読んでいくと、Bimodal IT は別物だとわかりました。さらに悪いことに、Bimodal IT は間違った方向へ進む道だと思います。

私の第一の問題意識は、この分離が business activity ではなく、software systems に基づいていることです。新しいアイデアをすばやく循環させたいなら、front office の systems of engagement と同じ頻度で、back office の systems of record も変更する必要が出てきます。巧妙な価格プランを考え出しても、それを支える systems of record を変更しなければ実現できません。

第二の問題は、bimodal という考えが TradableQualityHypothesis、つまり品質は速度と交換できるものだという考えに基づいていることです。これはよくある考えですが、誤りです。Thoughtworks で素早い機能提供のためにアジャイルなアプローチを使い始めたとき、私たちが学んだ印象的なことの一つは、本番環境の欠陥も劇的に減ったということでした。私たちのクライアントで通常見られるよりも一桁少ない欠陥で本番稼働することは珍しくありません。systems of record であってもです。重要なのは、**高い品質、つまり少ない欠陥こそが、短い cycle-time を可能にする重要な条件**だという点です。品質に注意を払わなければ、bimodal のアプローチに従う人たちは、実際には "systems of engagement" におけるイノベーションの速度を落とすことになります。

したがって、ここでの私の助言は、ソフトウェアプロジェクトの種類に応じて異なる管理アプローチを使うのは賢明だが、その区別を bimodal approach に基づけてはいけない、というものです。代わりに BusinessCapabilityCentric なアプローチを取り、自分たちの business capabilities が utility なのか strategic なのかを見るべきです。
