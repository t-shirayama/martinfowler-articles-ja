# Headless Component: a pattern for composing React UIs

## 要約

Headless Componentは、UI componentから見た目を取り除き、状態管理や振る舞いだけを再利用可能な形に切り出すパターンである。Reactではcustom hook、render props、Context APIなどで実装できる。

記事ではdropdownを例に、クリック、選択、keyboard navigation、accessibility、remote data fetchingといった要求が増えるにつれて、見た目とロジックが絡まりやすくなる様子を示す。Headless Componentにより、同じ振る舞いを保ちながら、異なる見た目やスタイルへ差し替えられる。

## 読むときの観点

- 見た目の再利用ではなく、振る舞いと状態の再利用に注目する。
- dropdownの例で、要求追加によりcomponentの責務がどう増えるかを見る。
- custom hookで十分な場合と、Context APIで宣言的なAPIを作る場合を比べる。
- 既存のGUIパターン、特にPresentation ModelやMVVMとの関係を見る。

## 原文の翻訳

以下は、原文の構成に沿って主要な主張を日本語でたどる抄訳です。

ReactはUI componentと状態管理の考え方を大きく変えた。しかし、単純に見えるcomponentも、要求が増えるとすぐ複雑になる。dropdownを考えると、最初は開閉状態と選択値だけで済む。そこへaccessibility、keyboard navigation、非同期データ取得、theme、複数選択、filteringなどが加わると、状態と表示ロジックが絡み合う。

Headless Componentは、こうした非視覚的なロジックを抽出し、見た目から切り離す。dropdownであれば、開閉状態、選択中の項目、keyboard操作、ARIA属性などを管理し、実際にどのHTMLやCSSで描画するかは利用側に任せる。**componentの「頭脳」と「見た目」を分ける**のがこのパターンの核である。

記事では、まず通常のdropdownを実装する。`isOpen`と`selectedItem`を`useState`で持ち、triggerをクリックするとlistを表示し、itemをクリックすると選択する。次に、`Trigger`と`DropdownMenu`へ分解し、見通しをよくする。これはHeadless Componentそのものではないが、複雑なUIを理解しやすくする第一歩である。

要求が増え、keyboard navigationを加えると、`Enter`、`Space`、`ArrowDown`、`ArrowUp`などの入力を扱う必要が出る。選択中index、focus、循環移動、ARIA属性なども必要になり、component内部の状態とイベント処理が増えていく。この段階で、見た目のJSXよりも振る舞いのコードが目立ち始める。

そこで`useDropdown`のようなcustom hookへ、dropdownの状態と操作を抽出する。hookは`isOpen`、`selectedItem`、`selectedIndex`、`toggleDropdown`、`updateSelectedItem`、`getAriaAttributes`などを返す。描画componentはそれらを受け取り、自分の好きなマークアップでUIを作る。これにより、Tailwind CSS版、別デザイン版、テスト用の簡単なUIなどを、同じロジックで実装できる。

テストでも利点がある。`SimpleDropdown`のような最小のテスト用componentを作り、`useDropdown`の振る舞いを、クリックやkeyboard操作を通じて検証できる。利用者が見るのと近い形でテストしつつ、見た目の詳細からは独立させられる。

別の実装方法として、Context APIを使った宣言的なHeadless Componentも紹介される。`Dropdown.Trigger`、`Dropdown.List`、`Dropdown.Option`のような階層を作り、それぞれの見た目を`as`で差し替えられるようにする。これはhookよりAPI設計が重くなる一方、利用側に自然な構造を提供しやすい。

さらに、remote data fetchingが加わると、loading、error、dataの状態も必要になる。これをdropdown本体に直接入れると再び複雑になるため、`fetchUsers`と`useService`のような汎用hookへ分ける。`Dropdown`は`useService`でデータ取得状態を扱い、`useDropdown`でdropdown固有の状態を扱う。こうして、データ取得とUI操作の関心を分けたまま組み合わせられる。

Headless Componentは新しい概念だけではない。デスクトップGUIで使われてきたView-Model、MVVM、Presentation Modelと通じる考え方がある。ただし、Reactではjsdomやheadless browserによるテスト、単方向データフロー、再描画モデルがあるため、古典的GUIとまったく同じ制約ではない。

このパターンは、再利用性、関心の分離、見た目の柔軟性をもたらす。一方で、抽象化の層が増えるため、単純なcomponentに無理に適用すると読みづらくなる。実務では、React ARIA、Headless UI、React Table、Downshiftのような成熟したライブラリがこの考え方を採用している。自作するより、要件に合う既存ライブラリを選ぶ方がよい場面も多い。
