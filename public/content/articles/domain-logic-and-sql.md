# Domain Logic and SQL

## 要約

この記事は、business logic を SQL query や stored procedure の側に置くべきか、それとも application の memory 上の code に置くべきかを検討します。
題材は、特定条件を満たす注文月を求める小さな例ですが、論点は performance、modifiability、duplication、encapsulation、database portability、testability に広がります。

結論は単純ではありません。
SQL は強力な道具であり、特に selection と aggregation が中心の処理では大きな performance advantage を持ちます。
一方で、長く変化する enterprise application では、domain logic を memory 上の code に置くほうが変更しやすい場合も多くなります。

## 対応範囲

このページでは、原文の主要な議論を日本語訳・要約として掲載します。
コード例と本文全体の逐語訳ではありません。

## 読むときの観点

- SQL を単なる保存・取得の手段として隠していないかを考える。
- performance の議論と、変更容易性の議論を分けて読む。
- Domain Model と Transaction Script で、query 構造の変更がどこへ波及するかを見る。
- SQL に logic を置く場合、duplication、encapsulation、portability、testability をどう扱うかを考える。

## 原文の翻訳

ここ数十年で、database-oriented な software developer と、memory 上の application software developer のあいだには大きな隔たりが生まれてきました。
そのため、SQL や stored procedure のような database feature をどう使うべきかについて、多くの論争が起きます。
この記事では、business logic を SQL query に置くのか、memory 上の code に置くのかを、主に performance と maintainability の観点から検討します。

Enterprise application では、logic を複数の layer に分ける考え方がよく使われます。
多くの著者は異なる layer 名を使いますが、共通しているのは domain logic と data source logic を分けることです。
大量の enterprise data は relational database に保存されるため、この layering は business logic を relational database から分離しようとします。

多くの application developer、特にオブジェクト指向を強く好む developer は、relational database を隠しておくべき storage mechanism として扱いがちです。
SQL の複雑さから application developer を守ることを売りにする framework もあります。
しかし SQL は、単なる更新と取得の仕組みではありません。
SQL の query processing は多くの仕事を実行できます。
SQL を隠すことは、application developer が **強力な道具を使わない** ことにもなります。

### 複雑な query

Relational database は、標準的な query language として SQL を支えています。
SQL は、relational database が大きく成功した主要な理由のひとつです。
Database とやり取りする標準的な方法があったため、vendor independence がある程度確保され、relational database の普及を助けました。

SQL の強みのひとつは、大量のデータを少ない code で filter し、summarize できる query 能力です。
しかし強力な SQL query を使うと、domain logic が query の中に入り込みやすくなります。
これは layered enterprise application architecture の基本原則と緊張関係を持ちます。

原文では、Cuillen discount という架空の割引を例にします。
顧客が、ある月に Talisker を 5000 ドル超含む注文を少なくとも1つ行うと、その月は割引対象になります。
この条件を満たす月を求める方法として、Transaction Script、Domain Model、SQL に logic を置く方法の3つを比べます。

Transaction Script は、必要なデータを読み込み、memory 上で loop して対象を選びます。
Domain Model は、database table に対応する object を memory に作り、その object 上の method に domain logic を置きます。
SQL に logic を置く方法では、join、grouping、having などを使って、条件判定と集計を database 側で実行します。

### Performance

この種の議論では performance が最初に問題にされがちですが、原文では、performance を最初の問いにすべきではないという立場が示されます。
多くの場合、まず maintainable な code を書き、その後 profiler で hot spot を見つけ、必要な場所だけを高速だが分かりにくい code に置き換えるべきだ、という考え方です。

とはいえ、この例では complex SQL query が memory 上の approach より大幅に速くなります。
理由のひとつは、単純な in-memory approach が注文ごとに query を発行してしまうためです。
Multi-table query を使って memory 側の program も改善できますが、それでも database 側で selection と aggregation を行う SQL は有利です。

Domain Model には別の利点があります。
より賢い query に変える場合でも、変更を data loading の部分に閉じ込めやすく、domain object 上の business logic を変えずに済むことがあります。
Transaction Script では、query 構造の変更が script 全体へ広がりやすく、同じような data を使う複数の script があれば、それぞれを直さなければなりません。

ここに、Transaction Script と Domain Model の一般的な trade-off が現れます。
Domain logic が多い場合、database access の複雑さという初期コストは、domain logic を分離して保てる利点で回収できます。
一方、selection と aggregation が強い処理では、SQL のほうが自然に強い場合があります。

### 変更容易性

長く使われる enterprise application は必ず大きく変化します。
そのため、system は変更しやすく整理されていなければなりません。
Business logic を memory 上に置く大きな理由は、この modifiability です。

SQL は多くのことをできますが、すべてに向いているわけではありません。
ある処理はかなり技巧的な SQL を必要とし、ある処理は非標準拡張を使わなければ難しくなります。
Database portability が必要な場合、これは問題になります。

理解しやすさについては、team の得意不得意も重要です。
ある人にとって SQL は分かりやすい道具ですが、別の人にとっては cryptic に見えます。
原文では、例の3つの解法を見て、どれが domain logic をもっとも追いやすく変更しやすいかを考えるよう促しています。
多くの team が SQL に不慣れなら、domain logic を SQL から遠ざける理由になります。
同時に、それは team が SQL を少なくとも中級程度まで学ぶ理由にもなります。

Duplication も重要です。
Domain object に割引判定を集約していれば、条件を変えるときに `cuillen?` のような1箇所を変えればよくなります。
同じ logic を複数の SQL query に書くと、変更漏れが起きやすくなります。
ただし SQL 側でも view を使えば、duplication を減らせます。
問題は、組織上の分断により、application developer が view を定義できなかったり、database developer が bottleneck になったりすることです。

Encapsulation も単純ではありません。
View や stored procedure はある程度の encapsulation を提供できます。
しかし enterprise application では、data source が単一の relational database に限られないことも多く、legacy system、他 application、file などから来る場合があります。
その場合、完全な encapsulation は application code 内の layer で行う必要があり、domain logic も memory 側に置くほうが自然になります。

Database portability は project ごとの判断です。
SQL は標準化されていますが、実際には database vendor ごとの差異が多くあります。
多くの logic を SQL に置くなら、portability を期待しすぎず、vendor extension を使ってその技術に結びつく覚悟をしたほうがよい、という立場が示されます。
Portability が必要なら、logic は SQL の外に置くべきです。

Testability も設計上の重要な論点です。
SQL はしばしば十分に test されませんが、database 環境内で SQL を test する tool や、test database を使った evolutionary database technique は存在します。
一方、business logic を memory 上に置き、database interface を stub に置き換えられる設計にしておけば、test を速く回せることがあります。

### まとめ

結局のところ、rich query を使うか、domain logic を SQL に置くかは、ここで挙げられた要因を project の文脈で判断する問題です。
重要なのは、data が単一の論理的な relational database にあるのか、それとも複数の non-SQL source を含むさまざまな source に散らばっているのかです。

Data が散らばっているなら、memory 上に data source layer を作って data source を encapsulate し、domain logic を memory に置くべきです。
この場合、SQL の言語としての強みは中心問題ではありません。
すべての data が SQL にあるわけではないからです。

Data の大半が単一の論理的 database にある場合、主要な論点は2つです。
ひとつは programming language として SQL を使うか application language を使うか。
もうひとつは、code を database 側で実行するか memory 上で実行するかです。

Modifiability の懸念はまず優先すべきですが、critical な performance issue があればそれが上回ります。
In-memory approach を使っていて、powerful query で解決できる hot spot があるなら、その query を使うべきです。
ただし、できるだけ performance 改善用の query を data source query として整理し、SQL に domain logic を入れすぎないようにするのが望ましい、というのが原文の助言です。
