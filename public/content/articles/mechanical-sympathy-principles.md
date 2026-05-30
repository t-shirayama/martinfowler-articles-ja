# Principles of Mechanical Sympathy

## 要約

Mechanical Sympathy は、ソフトウェアが動くハードウェアの性質を理解し、それに逆らわない形で設計する考え方です。
この記事は、CPU のメモリ階層、キャッシュライン、false sharing、single writer principle、natural batching を通じて、性能を引き出すための日常的な設計原則を説明します。

扱われる例は、ETL パイプライン、マルチスレッドアプリケーション、AI の text embedding サービスなどです。
低レベルな最適化の話に見えますが、中心にあるのは、予測しやすいデータアクセス、書き込み所有権の明確化、待ち時間を増やさないバッチ化という、システム全体にも応用できる設計判断です。

## 読むときの観点

- 「速いコード」ではなく、ハードウェアが得意な動きにソフトウェアを合わせる考え方として読む。
- ランダムアクセス、キャッシュライン、false sharing が、なぜアプリケーション設計に影響するのかを見る。
- mutex で共有資源を守る設計と、single writer に所有させる設計の違いを押さえる。
- バッチサイズやタイムアウトを固定する前に、キューの自然な流れを使えないか考える。
- 最適化の前に、観測性と目標設定が必要だという注意を忘れない。

## 原文の翻訳

この10年で、ハードウェアは大きく進歩してきました。コンシューマ向け GPU のあり方を変えた unified memory から、ノートパソコン上で10億パラメータ級の AI モデルを動かせる neural engine まで、さまざまな進化があります。

それでもソフトウェアは、いまだに遅いことがあります。単純な serverless function の cold start に数秒かかったり、CSV ファイルをデータベースの行に変換するだけの ETL パイプラインに何時間もかかったりします。

2011年、高頻度取引のエンジニアだった Martin Thompson は、こうした問題に気づき、その原因を Mechanical Sympathy の欠如に見ました。彼はこの言葉を Formula 1 のチャンピオンから借りました。

> レーシングドライバーになるのにエンジニアである必要はない。しかし Mechanical Sympathy は必要だ。
>
> Sir Jackie Stewart, Formula 1 World Champion

私たちはふつうレースカーを運転しているわけではありませんが、この考え方はソフトウェア実務者にも当てはまります。ソフトウェアが走るハードウェアに対して「sympathy」を持つことで、驚くほど高性能なシステムを作れます。機械的共感を備えた LMAX Architecture は、単一の Java スレッドで毎秒数百万件のイベントを処理します。

Martin の仕事に刺激を受け、私はこの10年、性能に敏感なシステムを作ってきました。Wayfair で数百万の商品に対して提供される AI inference platform から、Protocol Buffers より高速な新しい binary encoding まで、さまざまです。

この記事では、私がそうしたシステムを作るときに日々使っている Mechanical Sympathy の原則を扱います。これらの原則は、ほとんどあらゆる場所、あらゆる規模で適用できます。

### それほどランダムではないメモリアクセス

Mechanical Sympathy は、CPU がメモリをどのように保存し、アクセスし、共有するかを理解するところから始まります。

図1: CPU のメモリがどのように構成されるかを示す抽象図

Intel のチップから Apple silicon まで、現代の多くの CPU は、レジスタ、バッファ、キャッシュの階層としてメモリを構成しています。それぞれアクセス遅延が異なります。

- 各 CPU コアは、高速なレジスタとバッファを持ちます。これらはローカル変数や実行中の命令などを保存するために使われます。
- 各 CPU コアは、独自の Level 1 (L1) Cache を持ちます。これはコアのレジスタやバッファよりずっと大きいものの、少し遅くなります。
- 各 CPU コアは、独自の Level 2 (L2) Cache を持ちます。これは L1 cache よりさらに大きく、L1 cache と L3 cache の間のバッファのように使われます。
- 複数の CPU コアは、Level 3 (L3) Cache を共有します。これは圧倒的に大きいキャッシュですが、L1 や L2 よりかなり遅くなります。このキャッシュは CPU コア間でデータを共有するために使われます。
- すべての CPU コアは main memory、つまり RAM へのアクセスを共有します。このメモリは、CPU がアクセスするには桁違いに遅いものです。

CPU のバッファは非常に小さいため、プログラムは遅いキャッシュや main memory に頻繁にアクセスする必要があります。このアクセスのコストを隠すために、CPU は賭けをします。

- 最近アクセスされたメモリは、近いうちにまたアクセスされる可能性が高い。
- 最近アクセスされたメモリの近くにあるメモリは、近いうちにアクセスされる可能性が高い。
- メモリアクセスは、同じパターンに従う可能性が高い。

実際には、これらの賭けによって、線形アクセスは同一ページ内のアクセスより速く、同一ページ内のアクセスはページをまたぐランダムアクセスよりはるかに速くなります。

**予測しやすい逐次的なデータアクセス**を可能にするアルゴリズムやデータ構造を選びましょう。たとえば ETL パイプラインを作るなら、キーごとに1件ずつ問い合わせるのではなく、ソースデータベース全体を逐次スキャンし、不要なキーを取り除きます。

### キャッシュラインと false sharing

L1、L2、L3 の各キャッシュの中では、メモリは通常 Cache Line と呼ばれる「かたまり」として保存されます。キャッシュラインは常に連続した 2 のべき乗の長さを持ち、多くの場合 64 bytes です。

CPU は常に、キャッシュラインの倍数単位でメモリを load、つまり「読み込み」、または store、つまり「書き込み」ます。ここから微妙な問題が生まれます。2つの CPU が、同じキャッシュラインにある別々の変数に書き込むとどうなるでしょうか。

図2: 2つの CPU が異なる変数にアクセスしていても、その変数が同じキャッシュラインにあると競合し得ることを示す抽象図

結果は False Sharing です。2つの CPU が、同じキャッシュライン内の別々の変数へのアクセスを奪い合い、共有された L3 cache を通じて交互にその変数へアクセスせざるを得なくなります。

false sharing を防ぐため、多くの低遅延アプリケーションでは、各キャッシュラインが実質的に1つの変数だけを含むように、空のデータでキャッシュラインを「pad」します。その差は驚くほど大きくなります。

- padding がない場合、cache line false sharing によって、スレッドを追加するにつれて遅延がほぼ線形に増えます。
- padding がある場合、スレッドを追加しても遅延はほぼ一定です。

重要なのは、false sharing は変数に書き込みが行われるときにだけ現れるという点です。読み込まれるだけであれば、各 CPU はそのキャッシュラインをローカルのキャッシュやバッファへコピーでき、キャッシュラインの状態を他の CPU のコピーと同期する心配はありません。

この振る舞いのため、false sharing の最も一般的な被害者のひとつが atomic variable です。atomic variable は、多くの言語において、スレッド間、ひいては CPU コア間で安全に共有し、変更できる数少ないデータ型のひとつです。

マルチスレッドアプリケーションで最後の性能を追いかけているなら、**複数のスレッドから書き込まれているデータ構造**がないか、そしてそのデータ構造が false sharing の被害を受けていないかを確認しましょう。

### Single Writer Principle

マルチスレッドシステムを作るときに生じる問題は false sharing だけではありません。race condition のような安全性と正しさの問題、スレッド数が CPU コア数を超えたときの context switching のコスト、mutex、つまり「lock」の重いオーバーヘッドもあります。

こうした観察から、私が最もよく使う機械的共感の原則にたどり着きます。Single Writer Principle です。

概念としては単純です。アプリケーションが書き込むデータ、たとえば in-memory variable や、アプリケーションが書き込む resource、たとえば TCP socket があるなら、そのすべての書き込みは単一のスレッドによって行われるべきです。

テキストを受け取り、そのテキストの vector embedding を生成する HTTP service の最小例を考えてみましょう。この embedding は、text embedding AI model によってサービス内で生成されます。この例では ONNX model と仮定しますが、TensorFlow、PyTorch、その他の AI runtime でも同じです。

図3: 素朴な text embedding service の抽象図

このサービスはすぐに問題にぶつかります。多くの AI runtime は、モデルに対する inference call を一度にひとつしか実行できません。上の素朴なアーキテクチャでは、この問題を回避するために mutex を使っています。残念ながら、複数のリクエストが同時にサービスへ到達すると、それらは mutex のためにキューに並び、すぐに head-of-line blocking に陥ります。

図4: batching と single-writer principle を使った text embedding service の抽象図

single-writer principle を使ってリファクタリングすると、これらの問題を取り除けます。まず、モデルへのアクセスを専用の Actor thread で包みます。リクエストスレッドは mutex を奪い合う代わりに、actor へ非同期メッセージを送ります。

actor は single writer なので、独立したリクエストをひとつの batch inference call にまとめて underlying model へ渡し、その結果を個々のリクエストスレッドへ非同期に返せます。

**書き込み可能な resource を mutex で守ることは避けましょう**。代わりに、すべての書き込みを所有する単一のスレッド、つまり actor を用意し、他のスレッドから actor へ非同期メッセージで書き込みを依頼します。

### Natural Batching

single-writer principle を使うことで、私たちの単純な AI service から mutex を取り除き、batch inference call への対応を追加できました。では、actor はどのように batch を作ればよいのでしょうか。

あらかじめ決めた batch size まで待つと、十分なリクエストが来るまで、リクエストが上限なくブロックされる可能性があります。固定間隔で batch を作ると、リクエストは各 batch の間で、上限のある時間だけブロックされます。

これらのどちらよりもよい方法があります。Natural Batching です。

### Natural Batching と Smart Batching

Martin Thompson の元の記事では、Natural Batching ではなく Smart Batching という用語が使われていました。この記事のドラフトについて話していたとき、彼は現在では Natural という言葉のほうを好んでいると教えてくれました。私が Mechanical Sympathy のワークショップを行った際にも、batching がどのように「smart」なのかという質問を何度も受けたので、私も同意します。

natural batching では、actor はキューにリクエストがあるとすぐに batch の作成を始め、最大 batch size に達するかキューが空になるとすぐに batch を完了します。

Martin の natural batching に関する元の記事から具体例を借りると、これが時間とともに request あたりの latency をどのように償却するかが分かります。

| Strategy | Best (us) | Worst (us) |
| --- | ---: | ---: |
| Timeout | 200 | 400 |
| Natural | 100 | 200 |

この例では、各 batch の固定 latency が `100us` だと仮定しています。

timeout-based batching strategy では、timeout を `100us` と仮定すると、batch 内のすべてのリクエストが同時に受信された場合、best-case latency は `200us` になります。内訳は、リクエスト自体の `100us` と、batch を送る前に追加リクエストを待つ `100us` です。いくつかのリクエストが少し遅れて受信された場合、worst-case latency は `400us` になります。

natural batching strategy では、batch 内のすべてのリクエストが同時に受信された場合、best-case latency は `100us` です。いくつかのリクエストが少し遅れて受信された場合、worst-case latency は `200us` です。

どちらの場合も、natural batching の性能は timeout-based strategy の2倍よくなります。

単一の writer が書き込み、あるいは読み込みの batch を扱うなら、各 batch を貪欲に作りましょう。**データが利用可能になったら batch を開始し、データのキューが空になるか batch が満杯になったら完了する**のです。

これらの原則は個別のアプリケーションでうまく働きますが、システム全体にもスケールします。逐次的で予測しやすいデータアクセスは、in-memory array と同じくらい、巨大な data lake にも当てはまります。single-writer principle は、IO intensive なアプリケーションの性能を高めることも、CQRS architecture の強固な土台を提供することもできます。

Mechanical Sympathy を持ってソフトウェアを書くと、性能はあらゆる規模で自然についてきます。

ただし、先へ進む前に、最適化より先に observability を優先してください。測定できないものは改善できません。これらの原則を適用する前に、SLI、SLO、SLA を定義し、どこに注力すべきか、そしていつ止めるべきかを分かるようにします。

これらの原則を適用する前に、最適化より observability を優先し、性能を測定し、自分たちの目標を理解しましょう。

### さらに読む

Mechanical Sympathy の領域には、ここで扱った以上に多くの話題があります。ここでは扱わなかった概念について、Martin Thompson による記事をいくつか挙げます。

- Back Pressure
- Memory Barriers and Fences
- Let the Caller Choose

Martin は2010年に LMAX architecture について発表したとき、Mechanical Sympathy について語り始めました。その詳細は翌年このサイトに掲載されました。Martin はその年にブログを始め、その後の数年間で多くの記事を投稿しました。

この記事をレビューしていた読者のひとりが、Tiger Style coding methodology を教えてくれました。これはより広い範囲を扱うものですが、Mechanical Sympathy の原則と相性がよいと私は感じています。
