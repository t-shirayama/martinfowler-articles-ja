# The DeepSeek Series: A Technical Overview

## 要約

DeepSeek の一連の技術レポートは、巨大な LLM を限られた計算資源でどう訓練し、推論させるかを追ったものです。この記事は DeepSeek-LLM、DeepSeek-V2、DeepSeek-V3、DeepSeek-R1 の4本をつなげて読み、スケーリング則、メモリ効率、MoE、HPC co-design、強化学習による推論能力の発現を整理しています。

中心にあるのは、モデルだけでなく、アルゴリズム、フレームワーク、ハードウェアを一体で設計するという考え方です。MLA、DeepSeekMoE、FP8、DualPipe、PTX レベルの最適化、GRPO を使った RL などが、それぞれ費用とメモリを抑えながら大規模化するための部品として位置づけられています。

## 読むときの観点

- DeepSeek の成果を単一の発明ではなく、4本の論文にまたがる設計の積み重ねとして読む。
- LLM のスケールはパラメータ数だけでなく、token、FLOPs、データ品質、学習安定性との関係で捉える。
- MoE、MLA、FP8、DualPipe は、推論と訓練の現実的な制約に応じた効率化として見る。
- R1-Zero は、教師ありデータなしでも検証可能な課題では推論行動が発現しうる事例として読む。
- HPC co-design は、モデルアーキテクチャと訓練インフラを別々に考えないという設計思想である。

## 原文の翻訳

この記事は、DeepSeek が公開した4本の技術レポートを一つの流れとして概観します。2024年1月の DeepSeek-LLM は、スケーリング則とデータ量、モデル規模のトレードオフを調べた初期の報告です。2024年6月の DeepSeek-V2 は、Multi-Head Latent Attention と DeepSeekMoE を導入し、メモリと訓練効率を高めます。2024年12月の DeepSeek-V3 は、671B パラメータの sparse MoE を、FP8 混合精度訓練と複雑な HPC co-design によって大規模化します。2025年1月の DeepSeek-R1 は、それまでの効率化の土台の上で、大規模な強化学習により chain-of-thought 能力を促します。

ここで扱うのは、DeepSeek をめぐる市場の反応ではなく、技術的な仕事そのもの、その利点、そして将来への示唆です。記事の前提には LLM 構築に関するかなり専門的な用語があります。

4本の論文に共通する課題は一つです。より大きな言語モデルを、できるだけ低い費用、少ないメモリ負荷、少ない訓練不安定性で作ることです。各段階で著者たちは、アーキテクチャとインフラの両方を洗練しています。この戦略はしばしば HPC co-design と呼ばれます。

### DeepSeek-LLM

DeepSeek-LLM は基礎を置く論文です。著者たちが問うたのは、事前訓練の計算予算が固定されているとき、モデルの規模と訓練データ量をどう選ぶべきか、という問題でした。以前の研究では、この2つの比率について異なる結論が出ていました。

DeepSeek-LLM は、スケールを単純なパラメータ数ではなく、non-embedding FLOPs/token として測ります。そして計算量を `C = M x D` として捉えます。ここで `C` は計算予算、`M` は non-embedding FLOPs/token、`D` はデータサイズです。この粒度の細かい表現によって、7B や 67B のモデルを 2T token の英中二言語データで訓練したときの振る舞いを予測しやすくします。

大規模言語モデルでは、訓練が突然かつ回復不能に発散することがあります。これは特に MoE や長い文脈を持つモデルで問題になります。DeepSeek-LLM は、学習率、バッチサイズ、その他のハイパーパラメータを慎重に調整することで、安定した大規模訓練が可能だと示します。ただしそれは、Transformer の設計と、訓練に使う HPC データセンターのインフラを一緒に考えることを必要とします。

データ品質も重要です。高品質なデータは、同じ token 数でもより大きなモデルを正当化できます。重複やスパムが多い 100B token と、コード、数学、多言語対話、事実情報を広く含む 100B token では、後者のほうが情報密度が高く、追加パラメータが学べる信号も豊かになります。

この論文の要点は、計算量が増えるときのバッチサイズや学習率に単純な冪乗則を当てはめること、英語と中国語を含む 2T token で 7B と 67B の基盤モデルを訓練すること、さらに SFT と DPO による調整を行うことです。その結果、DeepSeek-LLM 67B は数学やコーディング課題で LLaMA-2 70B を上回ったと報告されています。

### DeepSeek-V2

DeepSeek-LLM が高いレベルのスケールのトレードオフを扱ったのに対し、DeepSeek-V2 は Transformer アーキテクチャの具体的な負荷に踏み込みます。大きな障害は2つあります。一つは、長い文脈で key/value vector を保存する attention KV cache がメモリを大量に使うことです。もう一つは、feed-forward 部分が Transformer の FLOPs の大きな割合を占めることです。

これらに対して DeepSeek-V2 は、Multi-Head Latent Attention と DeepSeekMoE を提案します。MLA は key/value vector を圧縮してメモリを減らし、DeepSeekMoE は sparse な Mixture-of-Experts によって、各 token で feed-forward 容量の一部だけを有効にします。

通常の attention では、各 token の Q/K/V が大きくなりがちです。MLA は key と value をより小さな latent vector に折りたたみます。簡単に言えば、標準的な QKV 計算を低ランク分解で置き換え、圧縮された KV latent vector を cache し、必要な K と V をその場で復元します。これにより、長い文脈を扱うときの KV cache の負担を下げます。

DeepSeekMoE は、feed-forward block に Mixture-of-Experts を採用します。MoE は、モデルを複数の expert に論理的に分け、token ごとに関連性の高い expert だけへルーティングする設計です。各 token が一部の expert だけを使うため、dense model より計算量を大きく減らせます。

DeepSeek は expert を細かく分け、shared expert と routed expert を使います。shared expert はすべての token に共通するパターンを扱い、routed expert は gating によって動的に選ばれる専門的な処理を担います。また device-limited routing により、token が任意の expert にアクセスするのではなく、親和性の高い限られた device 内で expert を選びます。これは H800 などのハードウェア制約の下で、device 間通信を抑えるために重要です。

MoE には expert の利用が偏る危険があります。そこで DeepSeekMoE は、expert-level、device-level、communication-level の balancing loss を導入します。これにより、expert collapse や通信の偏りを避けようとします。DeepSeek-V2 は約 236B の総パラメータを持ち、そのうち 21B を有効化し、8.1T token で事前訓練されます。SFT と RL による alignment も行われます。

ここで HPC co-design の効果がはっきり見え始めます。モデルアーキテクチャを訓練インフラと合わせて設計し、H800 の相互接続速度のような現実の制約を考慮した訓練方式を実装したことで、後の大きな成果の土台が作られました。

### DeepSeek-V3

DeepSeek-V3 は、V2 の上に sparse model をさらに拡張し、671B パラメータ、うち 37B を有効化するモデルを 14.8T token で訓練します。報告されている訓練量は 2.8M H800 GPU hours 未満です。著者たちは、アルゴリズム、フレームワーク、ハードウェアの co-design により、この経済的な訓練費用が実現したと強調しています。

V3 の新しさは、MLA の洗練、DeepSeekMoE の洗練、そして訓練・推論フレームワークの co-design です。MLA では、RoPE の扱いが改善され、128K context での安定性を高めます。compressed key と value の保存も統合され、multi-node inference でのメモリ通信がさらに削減されます。また、層ごとに cache を適応的に扱い、深い層では古い KV entry を刈り込むことで、長い文脈のメモリ使用を抑えます。

MoE 側では、V2 の補助損失をやめ、各 expert に動的な bias を持たせます。expert が過負荷なら bias を下げ、過小利用なら bias を上げます。gating は token との親和性にこの bias を加えて判断します。この方法により、token dropping を避け、1 token あたりの routed expert 数を 6 から 8 に増やし、補助損失が主目的に干渉する可能性を減らします。

671B の MoE を訓練するには、HPC レベルの解決が必要です。V3 は GEMM に FP8 mixed precision を採用してメモリを半減させつつ、block-wise scaling や短い蓄積間隔ごとの FP32 への promotion で overflow や underflow を抑えます。

さらに DualPipe は、forward/backward の計算と MoE の all-to-all dispatch を重ね合わせます。これにより、InfiniBand をまたぐ通信をローカルの行列演算の裏に隠します。PTX レベルの最適化や warp specialization も使われ、all-to-all dispatch の chunk size を調整し、Streaming Multiprocessor を通信と計算に動的に分けることで、token dispatch が GEMM を止めないようにします。

その結果、DeepSeek-V3 はコード、数学、一部の多言語タスクで高い性能を示し、同規模の open-source LLM を上回ると報告されています。ここでの本質は、FP8、DualPipe、PTX レベルの最適化、洗練された MLA/MoE が合わさり、安定した訓練で極端なスケールを実現している点です。

### DeepSeek-R1

DeepSeek-R1 と DeepSeek-R1-Zero は、アーキテクチャとしては DeepSeek-V3 と同じです。違いは、V3 の事前訓練済み基盤モデルに対して、どのような post-training を行うかにあります。

R1-Zero は極端な試みです。教師ありの warmup を行わず、基盤モデルから直接 RL を行います。使われるのは Group Relative Policy Optimization です。古い policy から複数の出力をサンプルし、それぞれに rule-based reward を与え、グループ内の平均と標準偏差で advantage を正規化し、PPO に似た clipped objective で更新します。

報酬は主に2つです。数学やコードのように客観的な正解を持つ課題では、数式ソルバーやコード実行、テストケースで正しさを検証する accuracy reward を使います。もう一つは、`<think>` と `<answer>` のような明示的な marker を使った構造化された推論過程に対する format reward です。

言い換えると、著者たちはモデルの周りにテスト・検証の harness を作り、強化学習でそれを繰り返し使い、単純な accuracy と format の報酬でモデルを穏やかに導きました。その結果、自己検証、長い chain-of-thought、複数の解法を試す探索的推論、解答を疑って推論経路を修正する反省のような行動が現れます。

R1-Zero は研究上とても興味深い結果です。生の報酬信号だけから複雑な chain-of-thought パターンを学んだからです。しかし問題もあります。人が整えた文体を見ていないため出力が読みにくく、複数言語が混ざることがあります。また、一般的な会話や安全性プロンプトのための SFT データがないため、数学やコードでは正しい答えを出せても、単純な Q&A では不自然になることがあります。さらに、rule-based reward は検証可能な課題には強い一方で、創造的な文章作成などには広げにくいものです。

そこで DeepSeek-R1 は、R1-Zero の弱点を埋めるため、少量の cold-start SFT、RL、rejection sampling、追加の SFT、さらに広い場面に向けた RL を組み合わせます。まず、人間にとって読みやすい chain-of-thought データを少量集め、基盤モデルに短い SFT を行います。次に、数学やコードのような検証可能タスクで大規模 RL を行います。その後、複数の応答を生成して自動検証と人手確認で良いものを選び、新しい SFT データを作ります。最後に、一般的な有用性、安全性、ロールプレイなどを含む多様な prompt で追加の RL を行います。

最終的な狙いは、検証可能タスクで強い chain-of-thought を保ちつつ、日常的なユーザー要求にも広く対応し、より安全で制御された出力を維持することです。

### 一連の流れ

4本の論文は、スケーリング則、MoE、HPC scheduling、大規模 RL という異なる角度を扱っています。しかし一貫している流れがあります。

第一に、費用とメモリの効率です。MLA、MoE gating、device-limited routing、FP8 訓練、DualPipe は、制約のある環境でもハードウェア利用率を最大化するための方法です。PTX 命令や warp specialization のような HPC レベルの scheduling は、H800 の限られた相互接続速度による通信の重さを隠します。

第二に、sparse model と HPC co-design です。V2 から V3 にかけて MoE は発展し、671B パラメータのモデルを H800 cluster 上で現実的に訓練できるところまで進みます。著者たちは、数百Bパラメータ級の LLM を安く訓練する唯一の道は HPC co-design だと繰り返し強調します。

第三に、推論能力の発現です。R1 は標準的な教師あり訓練を超え、RL 信号によって深い chain-of-thought を形作ります。事前訓練済みモデルのスケールと、狙いを定めた post-training の相乗効果により、反省や多段階の検証のような高度な推論パターンが現れます。

全体として DeepSeek のシリーズは、trillion-token 規模の LLM 訓練では、アーキテクチャ、アルゴリズム、フレームワーク、ハードウェアを一体で設計しなければならないことを示しています。将来に向けては、toolchain builder がこうした HPC 最適化をモデルコンパイルや訓練装置の一部として取り込むこと、AI 研究チームがアーキテクチャ構想の早い段階から HPC の専門知識と密接に協働することが重要になるでしょう。
