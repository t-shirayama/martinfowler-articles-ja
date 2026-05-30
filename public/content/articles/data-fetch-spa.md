# Data Fetching Patterns in Single-Page Applications

## 要約

SPAでリモートデータを取得するとき、単に`fetch`を呼ぶだけでは、読み込み中、エラー、遅延、bundleサイズ、ユーザー操作後の待ち時間といった問題にぶつかる。この記事は、Reactの例を使いながら、Asynchronous State Handler、Parallel Data Fetching、Fallback Markup、Code Splitting、Prefetchingという5つのパターンを説明している。

重要なのは、どれか1つを常に使うことではない。画面の初期表示、依存関係のあるリクエスト、深いコンポーネントツリー、ユーザー操作で初めて必要になるデータなど、状況に応じて組み合わせる。

## 読むときの観点

- データ取得をどのコンポーネントで始めるかが、Request Waterfallを生むかどうかを見る。
- loading、error、dataの状態をUIとどう分離するかを確認する。
- Code Splittingはbundle削減と初回操作の遅延を同時に考える。
- Prefetchingは予測が当たると効くが、外れると余計な通信になる。

## 原文の翻訳

以下は、原文の構成に沿って主要な主張を日本語でたどる抄訳です。

現代のWebページは、1ページの表示に多数のリクエストを送ることがある。静的ファイルだけでなく、タイムライン、友人一覧、推薦、分析イベントなど、多くの非同期データ取得が含まれる。これはユーザーに早く感じてもらうためでもある。最初に基本的な画面を見せ、その後に追加部分を段階的に読み込む。

記事では、ユーザーのプロフィール画面を例にする。`/users/<id>`でユーザー概要を取得し、`/users/<id>/friends`で友人一覧を取得する。2つを分けるのは、友人一覧が大きくなりうるためで、現実のAPI設計でもよくある状況である。

最初の実装では、React componentの`useEffect`内でデータを取得し、`useState`でユーザー情報を保持する。しかし実際のネットワークは失敗や遅延を含むため、loading、error、dataを明示的に扱う必要がある。

Asynchronous State Handlerは、この非同期処理と状態管理をcustom hookなどへ切り出す。`useUser`や汎用的な`useService`は、loading、error、data、fetch関数を返し、UI componentからJSXではないロジックを分離する。小さなアプリではcomponent内に置いてもよいが、規模が大きくなると、**非同期状態の扱いを共通化することで重複と読みづらさを減らせる**。

次に問題になるのがRequest Waterfallである。親の`Profile`がユーザー情報を取得してから子の`Friends`が描画され、その後に友人一覧を取得すると、独立した2つのリクエストが順番に待たされる。Reactの描画は短くても、ネットワーク待ちは長くなりやすい。

Parallel Data Fetchingでは、独立したリクエストを上位で同時に開始する。`Promise.all`でユーザー概要と友人一覧をまとめて取得し、結果を`Profile`配下へ渡す。これはFetch-Then-Renderの考え方に近く、必要なデータをなるべく早く取りに行く。ただし、2つ目のリクエストに1つ目の結果が必要な場合、並列化はできない。

Fallback Markupは、loadingやerrorの表示をcomponent内部の条件分岐として書くのではなく、マークアップ上に宣言する考え方である。Reactの`Suspense`のように、処理中はfallbackを表示し、完了後に本体を表示する。これによりUIの意図は読みやすくなるが、fallbackをどの階層に置くかはユーザー体験に大きく影響する。粒度を誤ると、親は読み込み完了に見えるのに子がまだ骨組み表示のまま、といった不自然な状態になる。

Code Splittingは、最初からすべてのコードを読み込まず、必要になったときに別bundleを読み込む手法である。友人にhoverしたときだけ詳細カードを表示するなら、`UserDetailCard`や重いUIライブラリを初期bundleから外せる。Reactでは`React.lazy`と`Suspense`を使って実装できる。ただし、初回hover時にbundleの取得、parse、実行、その後のデータ取得が連鎖すると、体験が遅くなる。

Prefetchingは、その遅延を減らすため、ユーザーが必要とする前にデータや資源を読み込む。HTMLの`<link rel="preload">`で事前に静的に指定する方法もあれば、`mouseover`などのイベントで詳細データを先読みする方法もある。SWRの`preload`のような仕組みを使えば、詳細カードが表示される頃にはキャッシュからデータを読める。

最後に、これらのパターンは排他的ではない。静的な部分はSSRで出し、動的な部分はFetch-Then-Renderにし、重要度の低いセクションはCode Splittingし、ユーザー操作の直前にPrefetchingすることもある。**適切なデータ取得戦略は、画面構造、ユーザー操作、依存関係、性能制約の組み合わせで決まる**。
