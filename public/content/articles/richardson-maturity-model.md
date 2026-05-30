# Richardson Maturity Model

## 要約

Richardson Maturity Model は、REST 的なWebサービスに近づくための要素を段階的に整理するモデルです。
Level 0 は HTTP を単なる通信トンネルとして使い、Level 1 でリソースを導入し、Level 2 で HTTP の動詞とステータスコードを活用し、Level 3 でハイパーメディアコントロールによる発見可能性を加えます。

このモデルは、REST そのものの定義ではありません。
むしろ、HTTPベースのサービスを設計するときに、リソース、動詞、ステータスコード、リンクをどのように組み合わせるとWebらしい性質に近づくのかを理解するための学習用の枠組みです。

## 読むときの観点

- Level 0 から Level 3 へ進むにつれて、何がHTTP独自の仕組みに移っていくかを見る。
- リソースの導入が、単一のエンドポイントから個別の対象への分割であることを意識する。
- GET の安全性、2xx以外のステータスコード、キャッシュ可能性の関係を見る。
- ハイパーメディアコントロールが、URIを固定知識にせず次の操作を応答から発見する仕組みであることを押さえる。
- RMM のレベルをRESTの合否判定としてではなく、設計上の考え方を学ぶための段階として読む。

## 原文の翻訳

RESTの栄光へ向かう段階

Richardson Maturity Model は Leonard Richardson が作ったモデルで、REST のアプローチを構成する主要な要素を3つの段階に分けて説明するものです。
この段階では、**リソース、HTTP動詞、ハイパーメディアコントロール**が順に導入されます。

最近、私は同僚数人が取り組んでいる『Rest In Practice』のドラフトを読んでいました。
彼らの狙いは、企業が直面する多くの統合問題を、RESTful Webサービスでどのように扱えるかを説明することです。
その中心にあるのは、Web が大規模にスケールする分散システムが実際にうまく動くことの存在証明であり、そこから考え方を取り出せば、統合システムをより簡単に構築できるという見方です。

図1: RESTへ向かう段階。

Webスタイルのシステムが持つ具体的な性質を説明するために、著者たちは Leonard Richardson が作り、QCon の講演で説明した RESTful maturity のモデルを使っています。
このモデルは、こうした技術を考えるうえでよい枠組みなので、私自身の説明も試みてみようと思いました。
なお、ここで示すプロトコル例は説明用にすぎません。
実際にコードを書いてテストする価値があるとは思わなかったので、細部には問題があるかもしれません。

### Level 0

このモデルの出発点は、HTTP をリモートのやり取りのための転送システムとして使うことです。
しかし、ここではWebの仕組みは何も使っていません。
本質的には、HTTP を自分たちのリモート対話機構のためのトンネルとして使っています。
その機構はたいてい、**Remote Procedure Invocation** に基づいています。

図2: Level 0 におけるやり取りの例。

医師の診察予約を取りたいとしましょう。
予約ソフトウェアはまず、指定した日にその医師の空き枠がいつあるかを知る必要があります。
そこで、その情報を得るために病院の予約システムへリクエストを送ります。
Level 0 のシナリオでは、病院はあるURIにサービスエンドポイントを公開します。
私はそのエンドポイントへ、リクエストの詳細を含むドキュメントをPOSTします。

```http
POST /appointmentService HTTP/1.1
[various other headers]
<openSlotRequest date = "2010-01-04" doctor = "mjones"/>
```

するとサーバーは、この情報を示すドキュメントを返します。

```http
HTTP/1.1 200 OK
[various headers]

<openSlotList>
  <slot start = "1400" end = "1450">
    <doctor id = "mjones"/>
  </slot>
  <slot start = "1600" end = "1650">
    <doctor id = "mjones"/>
  </slot>
</openSlotList>
```

この例ではXMLを使っていますが、内容は実際には何でもかまいません。
JSON、YAML、キー・バリューの組、あるいは任意の独自形式でもよいのです。

次の段階は診察予約を取ることです。
これもまた、エンドポイントへドキュメントをPOSTすることで行えます。

```http
POST /appointmentService HTTP/1.1
[various other headers]

<appointmentRequest>
  <slot doctor = "mjones" start = "1400" end = "1450"/>
  <patient id = "jsmith"/>
</appointmentRequest>
```

問題がなければ、予約が取れたことを示す応答を受け取ります。

```http
HTTP/1.1 200 OK
[various headers]

<appointment>
  <slot doctor = "mjones" start = "1400" end = "1450"/>
  <patient id = "jsmith"/>
</appointment>
```

誰かが先にその枠を取ってしまった、といった問題がある場合は、応答本文の中に何らかのエラーメッセージが入ります。

```http
HTTP/1.1 200 OK
[various headers]
<appointmentRequestFailure>
  <slot doctor = "mjones" start = "1400" end = "1450"/>
  <patient id = "jsmith"/>
  <reason>Slot not available</reason>
</appointmentRequestFailure>
```

ここまでのところ、これは素直なRPCスタイルのシステムです。
単に plain old XML、つまり POX をやり取りしているだけなので単純です。
SOAP や XML-RPC を使う場合も、基本的には同じ仕組みです。
違いは、XMLメッセージを何らかのエンベロープで包むことだけです。

### Level 1 - Resources

RMM において REST の栄光へ向かう最初の段階は、リソースを導入することです。
ここでは、すべてのリクエストを単一のサービスエンドポイントへ送るのではなく、**個々のリソースとやり取りする**ようになります。

図3: Level 1 はリソースを追加する。

最初の問い合わせでは、特定の医師を表すリソースを持つかもしれません。

```http
POST /doctors/mjones HTTP/1.1
[various other headers]

<openSlotRequest date = "2010-01-04"/>
```

応答が持つ基本的な情報は同じですが、各予約枠は個別にアドレス指定できるリソースになっています。

```http
HTTP/1.1 200 OK
[various headers]

<openSlotList>
  <slot id = "1234" doctor = "mjones" start = "1400" end = "1450"/>
  <slot id = "5678" doctor = "mjones" start = "1600" end = "1650"/>
</openSlotList>
```

具体的なリソースがあるので、予約を取るということは、特定の予約枠へPOSTすることになります。

```http
POST /slots/1234 HTTP/1.1
[various other headers]
<appointmentRequest>
  <patient id = "jsmith"/>
</appointmentRequest>
```

すべてうまくいけば、以前と似た応答を受け取ります。

```http
HTTP/1.1 200 OK
[various headers]

<appointment>
  <slot id = "1234" doctor = "mjones" start = "1400" end = "1450"/>
  <patient id = "jsmith"/>
</appointment>
```

ここでの違いは、誰かが予約について何かをする必要がある場合、たとえば検査を予約する場合、まず予約リソースを取得するということです。
そのリソースは、たとえば `http://royalhope.nhs.uk/slots/1234/appointment` のようなURIを持ち、そこへPOSTすることになります。

私のようなオブジェクト指向寄りの人間には、これはオブジェクトIDの考え方に似ています。
どこか空中にある関数を呼び出して引数を渡すのではなく、**特定のオブジェクトに対してメソッドを呼び出し**、他の情報を引数として渡すのです。

### Level 2 - HTTP Verbs

ここまで Level 0 と Level 1 のやり取りでは、すべて HTTP の POST 動詞を使ってきました。
しかし、GET を代わりに、あるいは併用して使う人もいます。
これらのレベルでは、大きな違いはありません。
どちらも、HTTPを通じて自分たちのやり取りをトンネルするための仕組みとして使われているからです。
Level 2 はここから離れ、HTTP動詞を、HTTPそのものの中で使われるやり方にできるだけ近く使います。

図4: Level 2 はHTTP動詞を追加する。

予約枠の一覧を得るには、GET を使いたいところです。

```http
GET /doctors/mjones/slots?date=20100104&status=open HTTP/1.1
Host: royalhope.nhs.uk
```

応答は、POSTを使った場合と同じものになります。

```http
HTTP/1.1 200 OK
[various headers]

<openSlotList>
  <slot id = "1234" doctor = "mjones" start = "1400" end = "1450"/>
  <slot id = "5678" doctor = "mjones" start = "1600" end = "1650"/>
</openSlotList>
```

Level 2 では、このようなリクエストにGETを使うことが重要です。
HTTP は GET を安全な操作として定義しています。
つまり、何らかの状態に意味のある変更を加えない操作です。
そのため、GET は任意の回数、任意の順序で安全に呼び出せ、毎回同じ結果を得られます。
このことの重要な帰結は、**リクエスト経路上のどの参加者もキャッシュを使える**ようになることです。
これは、Webが高い性能を発揮するための重要な要素です。

HTTP にはキャッシュを支援するさまざまな仕組みがあり、通信に参加するすべての者がそれを使えます。
HTTPのルールに従うことで、私たちはその能力を活用できるのです。

予約を取るには、状態を変更するHTTP動詞、つまり POST または PUT が必要です。
ここでは前と同じく POST を使います。

```http
POST /slots/1234 HTTP/1.1
[various other headers]

<appointmentRequest>
  <patient id = "jsmith"/>
</appointmentRequest>
```

ここで POST と PUT のどちらを使うかのトレードオフは、この記事で踏み込むには大きすぎます。
いつか別の記事で扱うかもしれません。
ただし、POST/PUT を create/update と対応づける人がいますが、それは誤りだと指摘しておきたいです。
この2つの選択は、それとはかなり違う問題です。

Level 1 と同じPOSTを使ったとしても、リモートサービスの応答方法にはもうひとつ重要な違いがあります。
すべてうまくいった場合、サービスは新しいリソースが世界に生まれたことを示すために、201 のレスポンスコードを返します。

```http
HTTP/1.1 201 Created
Location: slots/1234/appointment
[various headers]

<appointment>
  <slot id = "1234" doctor = "mjones" start = "1400" end = "1450"/>
  <patient id = "jsmith"/>
</appointment>
```

201 の応答には、Location 属性が含まれます。
これは、クライアントが将来そのリソースの現在の状態をGETするために使えるURIです。
また、この応答にはそのリソースの表現も含まれているので、クライアントは今すぐ追加の呼び出しをせずに済みます。

誰かが先にその診察枠を予約してしまった場合のように、問題が起きたときにも違いがあります。

```http
HTTP/1.1 409 Conflict
[various headers]

<openSlotList>
  <slot id = "5678" doctor = "mjones" start = "1600" end = "1650"/>
</openSlotList>
```

この応答で重要なのは、何かがうまくいかなかったことを示すためにHTTPレスポンスコードを使っている点です。
この場合、誰かがすでに互換性のない形でリソースを更新してしまったことを示すには、409 がよい選択に見えます。
200 を返しつつエラー応答を本文に含めるのではなく、Level 2 ではこのように何らかのエラー応答を明示的に使います。
どのコードを使うかはプロトコル設計者が決めることですが、**エラーが発生したなら非2xxの応答があるべき**です。

Level 2 は、HTTP動詞とHTTPレスポンスコードの利用を導入します。

ここには、少し不整合が入り込んでいます。
REST の支持者は、すべてのHTTP動詞を使うことについて語ります。
また彼らは、REST はWebの実践上の成功から学ぼうとしているのだ、と言って自分たちのアプローチを正当化します。
しかし、World Wide Web では実際のところ PUT や DELETE はあまり使われていません。
PUT や DELETE をもっと使うことには筋の通った理由がありますが、Webの存在証明はその理由にはなりません。

Webの存在によって支えられている重要な要素は、安全な操作、たとえば GET と、安全ではない操作の強い分離です。
それに加えて、遭遇したエラーの種類を伝えるためにステータスコードを使うことです。

### Level 3 - Hypermedia Controls

最後のレベルでは、HATEOAS、つまり Hypertext As The Engine Of Application State という見栄えの悪い頭字語でよく呼ばれるものを導入します。
これは、空き枠の一覧から、予約を取るために何をすればよいかをどう知るのか、という問いに答えるものです。

図5: Level 3 はハイパーメディアコントロールを追加する。

Level 2 と同じ最初のGETから始めます。

```http
GET /doctors/mjones/slots?date=20100104&status=open HTTP/1.1
Host: royalhope.nhs.uk
```

しかし、応答には新しい要素が含まれます。

```http
HTTP/1.1 200 OK
[various headers]

<openSlotList>
  <slot id = "1234" doctor = "mjones" start = "1400" end = "1450">
     <link rel = "/linkrels/slot/book"
           uri = "/slots/1234"/>
  </slot>
  <slot id = "5678" doctor = "mjones" start = "1600" end = "1650">
     <link rel = "/linkrels/slot/book"
           uri = "/slots/5678"/>
  </slot>
</openSlotList>
```

各予約枠には、診察予約を取る方法を示すURIを含む link 要素が入るようになりました。

ハイパーメディアコントロールの要点は、次に何ができるかと、そのために操作すべきリソースのURIを教えてくれることです。
予約リクエストをどこへPOSTすべきかを私たちがあらかじめ知っている必要はありません。
応答の中のハイパーメディアコントロールが、**それをどう行うかを教えてくれる**のです。

POST は、ここでも Level 2 のものと同じです。

```http
POST /slots/1234 HTTP/1.1
[various other headers]
<appointmentRequest>
  <patient id = "jsmith"/>
</appointmentRequest>
```

そして応答には、次にできるさまざまなことを表す複数のハイパーメディアコントロールが含まれます。

```http
HTTP/1.1 201 Created
Location: http://royalhope.nhs.uk/slots/1234/appointment
[various headers]
<appointment>
  <slot id = "1234" doctor = "mjones" start = "1400" end = "1450"/>
  <patient id = "jsmith"/>
  <link rel = "/linkrels/appointment/cancel"
        uri = "/slots/1234/appointment"/>
  <link rel = "/linkrels/appointment/addTest"
        uri = "/slots/1234/appointment/tests"/>
  <link rel = "self"
        uri = "/slots/1234/appointment"/>
  <link rel = "/linkrels/appointment/changeTime"
        uri = "/doctors/mjones/slots?date=20100104&status=open"/>
  <link rel = "/linkrels/appointment/updateContactInfo"
        uri = "/patients/jsmith/contactInfo"/>
  <link rel = "/linkrels/help"
        uri = "/help/appointment"/>
</appointment>
```

ハイパーメディアコントロールの明らかな利点のひとつは、クライアントを壊さずにサーバーがURI構造を変更できることです。
クライアントが `addTest` リンクのURIを探すかぎり、サーバーチームは初期の入口以外のURIを自由に組み替えられます。

さらに、クライアント開発者がプロトコルを探索する助けにもなります。
リンクは、次に何ができるかについて手がかりを与えます。
もちろん、すべての情報を与えるわけではありません。
`self` と `cancel` のどちらのコントロールも同じURIを指しています。
開発者は、一方がGETで、もう一方がDELETEだと理解する必要があります。
それでも少なくとも、より詳しい情報として何を考え、プロトコル文書の中で似たURIをどこに探すべきかの出発点を与えてくれます。

同じように、サーバーチームは応答に新しいリンクを入れることで、新しい機能を知らせることができます。
クライアント開発者が未知のリンクに注意を払っていれば、それらのリンクはさらなる探索のきっかけになります。

ハイパーメディアコントロールをどう表現するかについて、絶対的な標準はありません。
ここで私が使っているのは、REST in Practice チームの現在の推奨に従う方法で、ATOM に沿っています。
対象URIには `uri` 属性を持つ `<link>` 要素を使い、関係の種類を表すために `rel` 属性を使います。
要素自身への参照を示す `self` のようなよく知られた関係は裸の名前にし、そのサーバー固有のものは完全修飾URIにします。

ATOM は、よく知られた link relation の定義は IANA の Link Relations Registry であると述べています。
この記事を書いている時点では、そこにあるものは ATOM で使われているものに限られています。
ATOM は、一般に Level 3 の RESTfulness を先導するものと見なされています。

### レベルの意味

強調しておきたいのは、RMM は REST の要素について考えるよい方法ではあるものの、RESTそのもののレベルを定義するものではないということです。
Roy Fielding は、**RMMのLevel 3はRESTの前提条件である**ことを明確にしています。
ソフトウェアの多くの用語と同じように、RESTにも多くの定義があります。
しかし Roy Fielding がこの用語を作った以上、彼の定義はたいていの定義より重く扱われるべきです。

私がこのRMMを有用だと思うのは、RESTful な考え方の背後にある基本的な発想を、段階的に理解するよい方法を与えてくれるからです。
したがって、これは概念を学ぶための道具として見ており、何らかの評価メカニズムとして使うべきものではないと考えています。
RESTful なアプローチがシステム統合の正しい方法だと本当に確信するには、まだ十分な例があるとは思っていません。
ただし、非常に魅力的なアプローチであり、多くの状況で私が推奨するものだとは思っています。

このことを Ian Robinson と話していたとき、彼は Leonard Richardson が最初にこのモデルを提示したとき、自分が魅力を感じた点として、一般的な設計技法との関係を強調していました。

- Level 1 は、大きなサービスエンドポイントを複数のリソースへ分割することで、分割統治によって複雑さを扱うという問いに取り組みます。
- Level 2 は、標準的な動詞の集合を導入することで、似た状況を同じやり方で扱い、不要なばらつきを取り除きます。
- Level 3 は発見可能性を導入し、プロトコルをより自己文書化されたものにする方法を提供します。

その結果、このモデルは、私たちがどのようなHTTPサービスを提供したいのかを考え、それとやり取りする人々の期待を形づくる助けになります。

### 謝辞

Savas Parastatidis、Ian Robinson、Jim Webber はドラフトに対して重要なコメントをくれました。
Leonard Richardson は、私が彼の考えを誤って解釈することをできるだけ避けられるよう、質問に答えて大いに助けてくれました。
Aaron Swartz は、私の Level 3 のURIにあったいくつかの誤りを修正してくれました。

### 重要な改訂

2010年3月18日: 初回公開。
