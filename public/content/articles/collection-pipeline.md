# Collection Pipeline

## 要約

Collection Pipelineは、コレクションを受け取り、変換し、次の操作へ渡す一連の処理として計算を組み立てるパターンです。
Unixのパイプ、SmalltalkやRubyのメソッドチェーン、Clojureのスレッディングマクロなど、見た目は違っても同じ考え方が現れます。

この記事は、`filter`、`map`、`reduce`、`group-by`、`flat-map` などの操作を使い、単純な集計から多対多関係の反転までを例にして、パイプラインの考え方を説明します。
また、ループや内包表記との比較、遅延評価、並列化、不変性、デバッグ、使いどころも扱います。

## 読むときの観点

- 個々の操作ではなく、コレクションが段階的に形を変える流れを見る。
- `map` と `reduce`、`group-by` とハッシュ、`flat-map` と入れ子の解消の関係を押さえる。
- パイプラインが読みやすくなる条件と、メソッド抽出が必要になる境界を意識する。
- ループ、内包表記、集合演算、遅延評価、並列処理との使い分けを考える。

## 原文の翻訳

Collection Pipelineは、ソフトウェアにおける最も一般的で、気持ちのよいパターンのひとつです。Unixのコマンドライン、よくできたオブジェクト指向言語、そして近ごろ大きな注目を集めている関数型言語に存在します。環境によって形は少しずつ違い、よく使う操作の名前も違いますが、いったんこのパターンに慣れると、**これなしではやっていきたくなくなります**。

### 最初の出会い

私がCollection Pipelineパターンに初めて出会ったのは、Unixを使い始めたときでした。たとえば、自分のblikiエントリのうち、本文に `nosql` を含むものをすべて探したいとします。これは `grep` でできます。

```sh
grep -l 'nosql' bliki/entries
```

次に、それぞれのエントリの単語数を知りたいかもしれません。

```sh
grep -l 'nosql' bliki/entries/* | xargs wc -w
```

さらに単語数で並べ替えたいかもしれません。

```sh
grep -l 'nosql' bliki/entries/* | xargs wc -w | sort -nr
```

そして最後に、合計行を除いて上位3件だけを表示します。

```sh
grep -l 'nosql' bliki/entries/* | xargs wc -w | sort -nr | head -4 | tail -3
```

それ以前、あるいはそれ以後に出会った他のコマンドライン環境と比べても、これは非常に強力でした。

後になってSmalltalkを使い始めたとき、同じパターンに出会いました。`someArticles` に記事オブジェクトのコレクションがあり、それぞれの記事がタグのコレクションと単語数を持っているとします。`#nosql` タグを持つ記事だけを選ぶには、次のようにします。

```smalltalk
someArticles select: [ :each | each tags includes: #nosql]
```

`select` メソッドは、単一のLambdaを引数に取ります。これは角括弧で定義され、Smalltalkでは「ブロック」と呼ばれます。このLambdaは真偽値を返す関数を定義し、それを `someArticles` の各要素に適用し、Lambdaがtrueになる記事だけを含むコレクションを返します。

その結果をソートするには、コードを広げます。

```smalltalk
(someArticles
      select: [ :each | each tags includes: #nosql])
      sortBy: [:a :b | a words > b words]
```

#### Smalltalkの構文

Smalltalkでは、オブジェクトへ送るメッセージを空白で区切ります。そのため、現在の多くのOO言語で `anArticle.tags` と書くところを、Smalltalkでは `anArticle tags` と書きます。メッセージが引数を取る場合は、コロンと引数を加えます。したがって `anArticle tags includes: #nosql` となります。`#nosql` はシンボルです。複数の引数が必要な場合は、`aList copyFrom: 1 to: 3` のように追加のキーワードを加えます。

Lambdaを指定するには角括弧を使い、引数を縦棒で区切ります。たとえば `aList sortBy: [:a :b | a words > b words]` です。

`sortBy` メソッドもLambdaを取るメソッドで、今回は要素のソートに使うコードを受け取ります。`select` と同じように新しいコレクションを返すので、パイプラインを続けられます。

```smalltalk
((someArticles
      select: [ :each | each tags includes: #nosql])
      sortBy: [:a :b | a words > b words])
      copyFrom: 1 to: 3
```

Unixのパイプラインとの中心的な共通点は、関わっている各メソッド、つまり `select`、`sortBy`、`copyFrom` が、レコードのコレクションに対して動作し、レコードのコレクションを返すことです。Unixではそのコレクションはストリームで、レコードはストリーム内の行です。Smalltalkではオブジェクトのコレクションですが、基本的な考え方は同じです。

近ごろ私はRubyでプログラムを書くことが多くなりました。Rubyの構文では、パイプラインの前段を括弧で囲む必要がないため、Collection Pipelineを組み立てやすくなります。

```ruby
some_articles
  .select{|a| a.tags.include?(:nosql)}
  .sort_by{|a| a.words}
  .take(3)
```

オブジェクト指向言語を使うとき、Collection Pipelineをメソッドチェーンとして作るのは自然なやり方です。しかし同じ考え方は、関数呼び出しの入れ子でも実現できます。

基本に戻って、Common Lispで似たパイプラインをどう作るかを見てみましょう。各記事を `articles` という構造体に保存し、`article-words` や `article-tags` のような関数でフィールドにアクセスできるとします。`some-articles` 関数は、開始点となる記事群を返します。

最初のステップは、nosqlの記事だけを選ぶことです。

```lisp
(remove-if-not
   (lambda (x) (member 'nosql (article-tags x)))
   (some-articles))
```

SmalltalkやRubyの場合と同じように、`remove-if-not` という関数を使っています。この関数は、操作対象のリストと述語を定義するLambdaの両方を受け取ります。次に、式を広げてソートします。ここでもLambdaを使います。

```lisp
(sort
   (remove-if-not
      (lambda (x) (member 'nosql (article-tags x)))
      (some-articles))
   (lambda (a b) (> (article-words a) (article-words b))))
```

その後、`subseq` で上位3件を選びます。

```lisp
(subseq
   (sort
      (remove-if-not
         (lambda (x) (member 'nosql (article-tags x)))
         (some-articles))
      (lambda (a b) (> (article-words a) (article-words b))))
 0 3)
```

パイプラインはそこにあり、ステップごとに進めると、かなりよい形で組み上がっていくのがわかります。しかし最終的な式だけを見たとき、そのパイプライン性が明らかかどうかは疑問です。UnixのパイプラインやSmalltalk/Rubyの形では、関数の線形の並びが実行順と一致しています。データが左上から始まり、さまざまなフィルターを通って右や下へ進む様子を容易に思い描けます。Lispは関数を入れ子にするので、**最も内側の関数から外側へ読む**ことで順序を解決する必要があります。

このLispの例は、それほど慣用的ではないという問題もあります。Lispでは名前付き関数を使うのが一般的で、`#'some-function` 構文で簡単に参照できます。必要に応じて特定用途の小さな関数を作るのです。たとえば次のように分解した方がよいかもしれません。

```lisp
(defun nosqlp (article)
  (member 'nosql (article-tags article)))

(subseq
 (sort
  (remove-if-not #'nosqlp (some-articles))
  #'< :key #'article-words)
 0 3)
```

最近の人気のあるLispであるClojureは、この問題を避け、次のように書けます。

```clojure
(->> (articles)
     (filter #(some #{:nosql} (:tags %)))
     (sort-by :words >)
     (take 3))
```

`->>` シンボルはスレッディングマクロです。Lispの強力な構文マクロ機能を使い、それぞれの式の結果を次の式の引数へ通していきます。ライブラリの慣習、たとえば変換関数では対象コレクションを最後の引数にする、といった約束に従えば、入れ子の関数列を線形のパイプラインに変えられます。

ただし、多くの関数型プログラマーにとって、このような線形の形にすることは重要ではありません。そうしたプログラマーは、入れ子になった関数の深さによる順序を問題なく扱います。そのため、`->>` のような演算子が人気のあるLispに入るまでには長い時間がかかりました。

最近、関数型プログラミングの愛好者がCollection Pipelineの長所を称え、それをOO言語には欠けている関数型言語の強力な機能だと言うのをよく耳にします。古いSmalltalk使いである私は、これを少し腹立たしく感じます。Smalltalk使いはそれを広く使っていたからです。

Collection PipelineがOOプログラミングの機能ではないと言われる理由は、C++、Java、C#のような人気のあるOO言語が、SmalltalkのLambda利用を採用しなかったためです。その結果、Collection Pipelineパターンを支える豊富なコレクションメソッドを持てませんでした。多くのOOプログラマーにとって、Collection Pipelineは姿を消しました。私のようなSmalltalk使いは、Javaが大きな存在になったときにLambdaの欠如を呪いましたが、それを受け入れるしかありませんでした。

Javaで使えるものを使ってCollection Pipelineを作ろうとする試みはいろいろありました。結局のところ、OOの人間にとって、関数とはメソッドをひとつ持つクラスにすぎません。しかし、できあがったコードはあまりにごちゃごちゃしていて、その技法に慣れた人でさえ諦めがちでした。RubyがCollection Pipelineを快適に支援していたことは、私が2000年頃にRubyを本格的に使い始めた主な理由のひとつです。Smalltalk時代から、そうしたものがとても恋しかったのです。

現在では、Lambdaは高度で使いにくい言語機能だという評判をかなり振り払いました。主流言語ではC#が何年も前からLambdaを持ち、Javaもようやく加わりました。したがって、Collection Pipelineは多くの言語で実用的になっています。

Javaで最初のパイプラインを書くと、次のようになります。

```java
articles.stream()
  .filter(a -> a.getTags().contains("nosql"))
  .sorted(Comparator.comparing(Article::getWords).reversed())
  .limit(3)
  .collect(toList());
```

予想どおり、Javaはいくつかの点でかなり冗長です。JavaのCollection Pipelineの特徴は、パイプライン関数がコレクションクラスではなく、Streamクラスに定義されていることです。このStreamはIOストリームとは別物です。そのため、最初に記事のコレクションをストリームへ変換し、最後にリストへ戻す必要があります。

### Collection Pipelineの定義

私はCollection Pipelineを、ソフトウェアをモジュール化し合成する方法のパターンだと考えています。多くのパターンと同じように、これはさまざまな場所に現れますが、表面的な見た目は違います。しかし背後にあるパターンを理解していれば、新しい環境で何をすべきかを把握しやすくなります。

Collection Pipelineは、アイテムのコレクションを受け渡す一連の操作を並べます。各操作はコレクションを入力として受け取り、別のコレクションを出力します。ただし最後の操作は、単一の値を出力する終端操作かもしれません。個々の操作は単純ですが、それらをつなぎ合わせることで複雑な振る舞いを作れます。物理世界のパイプをつなぐようなものなので、パイプラインという比喩が使われます。

Collection Pipelineは、Pipes and Filtersパターンの特殊な場合です。Pipes and Filtersにおけるフィルターは、Collection Pipelineにおける操作に対応します。ここで「filter」ではなく「operation」と呼ぶのは、filterがCollection Pipeline内の操作の一種の一般的な名前だからです。別の見方をすれば、Collection Pipelineは、高階関数を合成する特定の、しかしよくある場合です。そこでは、すべての関数が何らかのシーケンスデータ構造に作用します。

このパターンには定着した名前がありません。そのため、私は新語に頼る必要があると感じました。

操作と、操作間で渡されるコレクションは、文脈によって異なる形を取ります。

Unixでは、コレクションはテキストファイルであり、そのアイテムはファイル内の行です。各行には空白で区切られた複数の値が含まれます。各値の意味は、行内での順序によって与えられます。操作はUnixプロセスであり、コレクションはパイプライン演算子によって構成されます。あるプロセスの標準出力が、次のプロセスの標準入力へ流れます。

オブジェクト指向プログラムでは、コレクションはコレクションクラス、つまりリスト、配列、セットなどです。コレクション内のアイテムはオブジェクトです。それらのオブジェクト自体がコレクションであったり、さらにコレクションを含んでいたりすることもあります。操作はコレクションクラス自体、通常は何らかの上位スーパークラスに定義された各種メソッドです。操作はメソッドチェーンで合成されます。

関数型言語でも、コレクションはオブジェクト指向言語の場合と似たコレクションです。ただし、今回のアイテムは汎用的なコレクション型そのものです。OOのCollection Pipelineがオブジェクトを使うところで、関数型言語はハッシュマップを使います。トップレベルコレクションの要素がコレクションであったり、ハッシュマップの要素がコレクションであったりすることもあります。つまりOOの場合と同じように、任意に複雑な階層構造を持てます。操作は関数であり、入れ子にして合成することも、Clojureの矢印演算子のように線形表現を作れる演算子で合成することもできます。

このパターンは他の場所にも現れます。関係モデルが最初に定義されたとき、関係代数が一緒にありました。これは、中間コレクションが関係に制約されたCollection Pipelineだと考えられます。ただしSQLはパイプライン方式を使わず、むしろ後で述べる内包表記に近い方式を使います。

このような一連の変換という考え方は、プログラム構造化の一般的な方法です。そのため、Pipes and Filtersアーキテクチャパターンが使われます。コンパイラーはしばしばこの方式で動きます。ソースコードから構文木へ、さまざまな最適化を経て、出力コードへと変換します。Collection Pipelineの特徴は、各段階の共通データ構造がコレクションであることです。そのため、**共通して現れるパイプライン操作**の集合が生まれます。

### さらに多くのパイプラインと操作

ここまで使ってきたひとつの例のパイプラインは、Collection Pipelineでよく使われる操作のうち、いくつかだけを使っています。ここからは、いくつかの例を通してさらに多くの操作を見ていきます。最近の私はRubyに慣れているのでRubyを使いますが、このパターンを支援する他の言語でも、通常は同じパイプラインを作れます。

#### 総単語数を得る（mapとreduce）

```yaml
- title: NoDBA
  words: 561
  tags: [nosql, people, orm]
  type: :bliki
- title: Infodeck
  words: 1145
  tags: [nosql, writing]
  type: :bliki
- title: OrmHate
  words: 1718
  tags: [nosql, orm]
  type: :bliki
- title: ruby
  words: 1313
  tags: [ruby]
  type: :article
- title: DDD_Aggregate
  words: 482
  tags: [nosql, ddd]
  type: :bliki

5219
```

最も重要なパイプライン操作のうち2つは、単純な課題で説明できます。リスト内のすべての記事の総単語数をどう得るかです。最初の操作は `map` です。これは、入力コレクションの各要素に与えられたLambdaを適用した結果をメンバーとするコレクションを返します。

```ruby
[1, 2, 3].map{|i| i * i} # => [1, 4, 9]
```

これを使うと、記事のリストを各記事の単語数のリストへ変換できます。その時点で、やや扱いにくいCollection Pipeline操作である `reduce` を適用できます。この操作は、入力コレクションを単一の結果へ縮約します。このような処理を行う関数は、しばしばreductionと呼ばれます。reductionは単一の値へ縮約することが多いため、Collection Pipelineでは最後のステップにしか現れないことがよくあります。

Rubyの一般的な `reduce` 関数は、2つの変数を持つLambdaを受け取ります。ひとつは各要素用の通常の変数で、もうひとつはaccumulatorです。縮約の各ステップで、新しい要素を使ってLambdaを評価した結果をaccumulatorの値に設定します。数値のリストは次のように合計できます。

```ruby
[1, 2, 3].reduce {|acc, each| acc + each} # => 6
```

この2つの操作があれば、総単語数の計算は2ステップのパイプラインになります。

```ruby
some_articles
  .map{|a| a.words}
  .reduce {|acc, w| acc + w}
```

最初のステップは、記事のリストを単語数のリストに変換する `map` です。2つ目のステップは、単語数のリストにreductionを実行し、合計を作ります。

パイプライン操作には、Lambdaとして関数を渡すことも、定義済み関数の名前として渡すこともできます。ここで、Collection Pipelineの各ステップを構成する関数の表現方法がいくつかあることに触れておく価値があります。ここまでは各ステップでLambdaを使ってきましたが、別の方法として、単に関数名を使うこともできます。このパイプラインをClojureで書くなら、自然な書き方は次のようになります。

```clojure
(->> (articles)
     (map :words)
     (reduce +))
```

この場合、関係する関数の名前だけで十分です。`map` に渡された関数は入力コレクションの各要素に対して実行され、`reduce` は各要素とaccumulatorを使って実行されます。Rubyでも同じスタイルを使えます。ここで `words` は、コレクション内の各オブジェクトに定義されたメソッドです。

```ruby
some_articles
  .map(&:words)
  .reduce(:+)
```

一般に、関数名を使う方が少し短くなりますが、各オブジェクトへの単純な関数呼び出しに限られます。Lambdaを使うと、少し構文は増えますが柔軟性が高まります。Rubyでプログラムを書くとき、私はたいていLambdaを好みます。しかしClojureで作業しているなら、可能なときは関数名を使う方に傾くでしょう。どちらを選んでも大きな問題ではありません。

#### 型ごとの記事数を得る（group-by）

```yaml
- title: NoDBA
  words: 561
  tags: [nosql, people, orm]
  type: :bliki
- title: Infodeck
  words: 1145
  tags: [nosql, writing]
  type: :bliki
- title: OrmHate
  words: 1718
  tags: [nosql, orm]
  type: :bliki
- title: ruby
  words: 1313
  tags: [ruby]
  type: :article
- title: DDD_Aggregate
  words: 482
  tags: [nosql, ddd]
  type: :bliki

{bliki: 4, article: 1}
```

次のパイプライン例では、型ごとの記事数を求めます。出力は単一のハッシュマップで、キーが型、値が対応する記事数です。ここで「map」は操作を指す場合もデータ構造を指す場合もあるため、この記事ではデータ構造には「hashmap」または「dictionary」を使い、関数には「map」だけを使います。ただし日常会話では、hashmapがmapと呼ばれることもよくあります。

これを行うには、まず記事のリストを記事の型でグループ化する必要があります。ここで使うコレクション操作は `group-by` です。この操作は、各要素に対して与えられたコードを実行し、その結果をインデックスとするハッシュに要素を入れます。

```ruby
some_articles
  .group_by {|a| a.type}
```

あとは各グループの記事数を得ればよいだけです。一見すると、これは `map` 操作で記事数を数えるだけの単純な仕事です。しかし複雑なのは、各グループについて2つのデータ、つまりグループ名と件数を返す必要があることです。より単純ではありますが関連する問題として、先ほどの `map` 例は値のリストを使っていた一方、`group-by` 操作の出力はハッシュマップです。

ハッシュマップをキーと値のペアのリストとして扱うと便利なことがよくあります。単純なUnixの例を越えると、この問題はCollection Pipelineでよく出てきます。渡すコレクションはリストであることが多いものの、ハッシュであることもあります。両者を簡単に変換できる必要があります。そのためのコツは、ハッシュをペアのリスト、つまり各ペアがキーと対応する値であるリストとして考えることです。

ハッシュの各要素がどのように表現されるかは言語によって異なりますが、単純で一般的な方法は、各ハッシュ要素を2要素配列 `[key, value]` として扱うことです。Rubyはまさにこれを行い、さらにペアの配列を `to_h` メソッドでハッシュに戻せます。したがって、次のように `map` を適用できます。

```ruby
some_articles
  .group_by {|a| a.type}
  .map {|pair| [pair[0], pair[1].size]}
  .to_h
```

このようにハッシュと配列の間を行き来することは、Collection Pipelineではかなり一般的です。配列参照でペアにアクセスするのは少し扱いにくいので、Rubyでは次のようにペアを2つの変数へ直接分解できます。

```ruby
some_articles
  .group_by {|a| a.type}
  .map {|key, value| [key, value.size ]}
  .to_h
```

分解代入は関数型プログラミング言語で一般的な技法です。関数型言語では、このようなリストとハッシュのデータ構造を頻繁に受け渡すからです。Rubyの分解構文はかなり最小限ですが、この単純な目的には十分です。

Clojureでこれを行っても、ほとんど同じ形になります。

```clojure
(->> (articles)
     (group-by :type)
     (map (fn [[k v]] [k (count v)]))
     (into {}))
```

Clojureでは `juxt` を使って、`map` の中で複数の関数を実行することもできます。

```clojure
(->> (articles)
     (group-by :type)
     (map (juxt first (comp count second)))
     (into {}))
```

私はLambdaを使う版の方が明確だと感じます。ただし私はClojure、あるいは関数型プログラミング全般についてはつまみ食い程度の人間です。

#### タグごとの記事数を得る

```yaml
:nosql:
  :articles: 4
  :words: 3906
:people:
  :articles: 1
  :words: 561
:orm:
  :articles: 2
  :words: 2279
:writing:
  :articles: 1
  :words: 1145
:ruby:
  :articles: 1
  :words: 1313
:ddd:
  :articles: 1
  :words: 482
```

次のパイプラインでは、リストに出てくる各タグについて、記事数と単語数を生成します。これを行うには、コレクションのデータ構造をかなり組み替える必要があります。現時点でトップレベルのアイテムは記事であり、ひとつの記事が複数のタグを含みます。これを行うには、データ構造をほどき、トップレベルがタグで、そのタグが複数の記事を含む形にしなければなりません。

このことは、多対多関係を反転し、記事ではなくタグを集約要素にする、と考えることもできます。

パイプラインの開始点となるコレクションの階層構造をこのように組み替えると、より複雑なパイプラインになります。しかし、それでもこのパターンの能力の範囲内です。このような場合は、小さなステップへ分けることが重要です。変換全体を小さな断片に分解し、それらをつなぎ合わせると、こうした変換はたいていずっと考えやすくなります。それこそがCollection Pipelineパターンの要点です。

最初のステップはタグに注目することです。データ構造を展開し、タグと記事の組み合わせごとに1レコードを持つようにします。私はこれを、リレーショナルデータベースで関連テーブルを使って多対多関係を表現する方法に似ていると考えています。これを行うため、記事を受け取り、各タグと記事のペア、つまり2要素配列を出力するLambdaを作ります。そして、そのLambdaをすべての記事に `map` します。

```ruby
some_articles
  .map {|a| a.tags.map{|tag| [tag, a]}}
```

これは次のような構造を生みます。

```ruby
[
  [ [:nosql, Article(NoDBA)]
    [:people, Article(NoDBA)]
    [:orm, Article(NoDBA)]
  ]
  [ [:nosql, Article(Infodeck)]
    [:writing, Article(Infodeck)]
  ]
  # more rows of articles
]
```

`map` の結果は、ペアのリストのリストです。各記事ごとに入れ子になったリストがあります。この入れ子のリストが邪魔なので、`flatten` 操作で平らにします。

```ruby
some_articles
  .map {|a| a.tags.map{|tag| [tag, a]}}
  .flatten 1
```

結果は次のようになります。

```ruby
[
  [:nosql, Article(NoDBA)]
  [:people, Article(NoDBA)]
  [:orm, Article(NoDBA)]
  [:nosql, Article(Infodeck)]
  [:writing, Article(Infodeck)]
  # more rows of articles
]
```

余分な入れ子を持つリストを生成し、それを平らにする必要がある作業は非常によくあるため、多くの言語はこれを1ステップで行う `flat-map` 操作を提供しています。

```ruby
some_articles
  .flat_map {|a| a.tags.map{|tag| [tag, a]}}
```

このようなペアのリストが得られれば、それをタグでグループ化するのは単純です。

```ruby
some_articles
  .flat_map {|a| a.tags.map{|tag| [tag, a]}}
  .group_by {|pair| pair.first}
```

結果は次のようになります。

```ruby
{
  :people:
    [ [:people, Article(NoDBA)] ]
  :orm:
    [ [:orm, Article(NoDBA)]
      [:orm, Article(OrmHate)]
    ]
  :writing:
    [  [:writing, Article(Infodeck)] ]
  # more records
}
```

しかし最初のステップと同じように、これも面倒な余分な入れ子を導入します。各関連の値が、記事のリストではなくキーと記事のペアのリストになっているからです。ペアのリストを記事のリストに置き換える関数を `map` することで、これを取り除けます。

```ruby
some_articles
  .flat_map {|a| a.tags.map{|tag| [tag, a]}}
  .group_by {|pair| pair.first}
  .map {|k,pairs| [k, pairs.map {|p| p.last}]}
```

これは次のようになります。

```ruby
{
  :people:    [ Article(NoDBA) ]
  :orm:       [ Article(NoDBA), Article(OrmHate) ]
  :writing:   [ Article(Infodeck) ]
  # more records
}
```

これで基本データはタグごとの記事に組み替えられ、多対多関係が反転しました。求める結果を作るには、必要な正確なデータを取り出す単純な `map` だけで十分です。

```ruby
some_articles
  .flat_map {|a| a.tags.map{|tag| [tag, a]}}
  .group_by {|pair| pair.first}
  .map {|k,pairs| [k, pairs.map {|p| p.last}]}
  .map {|k,v| [k, {articles: v.size, words: v.map(&:words).reduce(:+)}]}
  .to_h
```

これにより、ハッシュのハッシュという最終的なデータ構造が得られます。

```yaml
:nosql:
  :articles: 4
  :words: 3906
:people:
  :articles: 1
  :words: 561
:orm:
  :articles: 2
  :words: 2279
:writing:
  :articles: 1
  :words: 1145
:ruby:
  :articles: 1
  :words: 1313
:ddd:
  :articles: 1
  :words: 482
```

Clojureで同じ作業をしても、同じ形になります。

```clojure
(->> (articles)
     (mapcat #(map (fn [tag] [tag %]) (:tags %)))
     (group-by first)
     (map (fn [[k v]] [k (map last v)]))
     (map (fn [[k v]] {k {:articles (count v), :words (reduce + (map :words v))}}))
     (into {}))
```

Clojureの `flat-map` 操作は `mapcat` と呼ばれます。

このようなより複雑なパイプラインを組み立てるのは、先ほど示した単純なものより難しくなることがあります。私は、各ステップをひとつずつ慎重に進め、各ステップから出力されるコレクションが正しい形になっているかをよく見るのが最も簡単だと感じています。この形を可視化するには、たいていインデント付きでコレクション構造を表示する何らかのpretty-printが必要です。

また、ローリングなテストファーストのスタイルで進めるのも有用です。最初は、たとえば最初のステップのレコード数だけを見るような単純なアサーションでテストを書き、パイプラインに追加の段階を加えるにつれてテストを育てていきます。

ここでのパイプラインは、各段階から組み立てていくと意味が通りますが、最終的なパイプラインだけでは何が起きているかがあまり明確ではありません。最初の段階は、実質的には記事リストを各タグでインデックスする処理なので、その作業を独自の関数に抽出した方が読みやすいと思います。

```clojure
(defn index-by [f, seq]
    (->> seq
         (mapcat #(map (fn [key] [key %]) (f %)))
         (group-by first)
         (map (fn [[k v]] [k (map last v)]))))
(defn total-words [articles]
    (reduce + (map :words articles)))

(->> (articles)
     (index-by :tags)
     (map (fn [[k v]] {k {:articles (count v), :words (total-words v)}}))
     (into {}))
```

単語数の計算も独自の関数へ切り出す価値があると感じました。この分解は行数を増やしますが、理解しやすくなるなら、構造化のためのコードを追加することを私はいつでも歓迎します。短くて強力なコードはよいものですが、**短さは明確さに仕えるときだけ価値があります**。

Rubyのようなオブジェクト指向言語で同じ分解を行うには、新しい `index_by` メソッドをコレクションクラス自体に追加する必要があります。パイプラインの中では、コレクション自身のメソッドしか使えないからです。RubyではArrayにモンキーパッチを当てて、これを実現できます。

```ruby
class Array
  def invert_index_by &proc
    flat_map {|e| proc.call(e).map {|key| [key, e]}}
      .group_by {|pair| pair.first}
      .map {|k,pairs| [k, pairs.map {|p| p.last}]}
  end
end
```

ここでは名前を変えています。ローカル関数の文脈では単純な `index_by` という名前が意味を持ちますが、コレクションクラスの汎用メソッドとしてはそれほど意味を持たないからです。コレクションクラスにメソッドを置く必要があることは、OOアプローチの重大な欠点になりえます。プラットフォームによっては、ライブラリクラスにメソッドを追加すること自体が許されておらず、この種の分解はできません。

別のプラットフォームでは、このようなモンキーパッチでクラスを変更できます。しかし、それはクラスのAPIにグローバルに見える変更を起こすので、ローカル関数より慎重に考える必要があります。ここでの最善策は、C#の拡張メソッドやRubyのrefinementsのように、既存クラスを変更できるが、より小さな名前空間の文脈に限定できる仕組みを使うことです。それでも、単に関数を定義することに比べると、モンキーパッチを追加するには多くの儀式が必要です。

そのメソッドを定義できれば、Clojureの例と似た形でパイプラインを分解できます。

```ruby
total_words = -> (a) {a.map(&:words).reduce(:+)}
some_articles
  .invert_index_by {|a| a.tags}
  .map {|k,v| [k, {articles: v.size, words: total_words.call(v)}]}
  .to_h
```

ここでもClojureの場合と同じように単語数計算の関数を切り出しましたが、Rubyでは作った関数を呼ぶために明示的なメソッドを使わなければならないので、この分解はやや効果が薄いと感じます。大したことではありませんが、読みやすさに少し摩擦が加わります。もちろん本物のメソッドにすれば、`call` 構文はなくせます。しかし私は、もう少し踏み込んで、要約関数を含むクラスを追加したくなります。

```ruby
class ArticleSummary
  def initialize articles
    @articles = articles
  end
  def size
    @articles.size
  end
  def total_words
    @articles.map{|a| a.words}.reduce(:+)
  end
end
```

これは次のように使います。

```ruby
some_articles
  .invert_index_by {|a| a.tags}
  .map {|k,v| [k, ArticleSummary.new(v)]}
  .map {|k,a| [k, {articles: a.size, words: a.total_words}]}
  .to_h
```

単一の用途で2つほどの関数を切り出すためだけに新しいクラスを導入するのは重すぎる、と感じる人は多いでしょう。私は、このような局所的な作業のためにクラスを導入することに抵抗はありません。この具体例ではそうしません。実際に抽出が必要なのは総単語数の関数だけだからです。しかし出力にもう少し情報が加われば、私はそのクラスに手を伸ばすでしょう。

### 代替案

Collection Pipelineパターンは、ここまで話してきた種類のことを実現する唯一の方法ではありません。最も明らかな代替は、多くの人が通常こうした場合に使ってきた単純なループです。

#### ループを使う

NoSQL記事上位3件のRuby版を比較します。

```ruby
# Collection Pipeline
some_articles
  .select{|a| a.tags.include?(:nosql)}
  .sort_by{|a| a.words}
  .take(3)

# Loop
result = []
some_articles.each do |a|
  result << a if a.tags.include?(:nosql)
end
result.sort_by!(&:words)
return result[0..2]
```

Collection Pipeline版は少し短く、私の目にはより明確です。主な理由は、パイプラインという考え方が私にとって馴染み深く、自然に明確だからです。とはいえ、ループ版もそれほど悪いわけではありません。

単語数のケースは次のとおりです。

```ruby
# Collection Pipeline
some_articles
  .map{|a| a.words}
  .reduce {|acc, w| acc + w}

# Loop
result = 0
some_articles.each do |a|
  result += a.words
end
return result
```

グループ化のケースです。

```ruby
# Collection Pipeline
some_articles
  .group_by {|a| a.type}
  .map {|pair| [pair[0], pair[1].size]}
  .to_h

# Loop
result = Hash.new(0)
some_articles.each do |a|
  result[a.type] += 1
end
return result
```

タグごとの記事数です。

```ruby
# Collection Pipeline
some_articles
  .flat_map {|a| a.tags.map{|tag| [tag, a]}}
  .group_by {|pair| pair.first}
  .map {|k,pairs| [k, pairs.map {|p| p.last}]}
  .map {|k,v| [k, {articles: v.size, words: v.map(&:words).reduce(:+)}]}
  .to_h

# Loop
result = Hash.new([])
some_articles.each do |a|
  a.tags.each do |t|
    result[t] += [a]
  end
end
result.each do |k,v|
  word_count = 0
  v.each do |a|
    word_count += a.words
  end
  result[k] = {articles: v.size, words: word_count}
end
return result
```

この場合、Collection Pipeline版はずっと短くなります。ただし比較は少し難しいところがあります。どちらの場合でも、私は意図を明らかにするためにリファクタリングするでしょう。

#### 内包表記を使う

いくつかの言語には、通常リスト内包表記と呼ばれる、単純なCollection Pipelineを映す構文があります。1000語を超えるすべての記事のタイトルを取り出すことを考えてみましょう。ここでは内包表記を持ち、JavaScript自身のCollection Pipeline作成能力も使えるCoffeeScriptで例を示します。

```coffeescript
# Pipeline
some_articles
  .filter (a) ->
    a.words > 1000
  .map (a) ->
    a.title

# Comprehension
(a.title for a in some_articles when a.words > 1000)
```

内包表記の正確な能力は言語によって異なりますが、単一の文で表現できる特定の操作列だと考えられます。この考え方は、いつ内包表記を使うかという判断の最初の部分を明らかにします。内包表記は、パイプライン操作の特定の組み合わせにしか使えないため、本質的には柔軟性が低いものです。とはいえ、内包表記は最も一般的なケース向けに定義されるので、多くの場合で選択肢になります。

内包表記は通常、それ自体をパイプラインの中に置けます。本質的には単一の操作として振る舞うからです。したがって、1000語を超えるすべての記事の総単語数を得るには、次のように書けます。

```coffeescript
# Pipeline
some_articles
  .filter (a) ->
    a.words > 1000
  .map (a) ->
    a.words
  .reduce (x, y) -> x + y

# Comprehension in a pipeline
(a.words for a in some_articles when a.words > 1000)
.reduce (x, y) -> x + y
```

問題は、内包表記が使えるケースにおいて、内包表記がパイプラインより優れているかどうかです。内包表記の支持者は優れていると言いますし、別の人はパイプラインも同じくらい理解しやすく、より一般的だと言うでしょう。私は後者のグループに入ります。

### 入れ子の演算子式

コレクションで行える有用なことのひとつに、集合演算による操作があります。赤い部屋、青い部屋、ホテルの正面側にある部屋、使用中の部屋を返す関数があるホテルを考えてみましょう。正面側にある、未使用の赤または青の部屋を見つける式は次のように書けます。

```ruby
# ruby
(front & (red | blue)) - occupied
```

```clojure
;; clojure
(difference
 (intersection
  (union reds blues)
  fronts)
 occ)
```

Clojureは集合演算をsetデータ型に定義しているため、ここにあるシンボルはすべてsetです。

これらの式をCollection Pipelineとして定式化することもできます。

```ruby
# ruby
red
  .union(blue)
  .intersect(front)
  .diff(occupied)
```

私は集合演算を通常のメソッドとして追加するため、Arrayにモンキーパッチを当てました。

```clojure
;; clojure
(->> reds
     (union blues)
     (intersection fronts)
     (remove occ))
```

ここでは、スレッディングに合う引数順にするため、Clojureの `remove` メソッドが必要です。しかし私は、特に中置演算子を使える場合には、入れ子の演算子式の形を好みます。より複雑な式は、パイプにするとかなり絡まりやすくなります。

とはいえ、パイプラインの途中に集合演算を投げ込むことが有用な場合もよくあります。部屋の色と場所が部屋レコードの属性であり、使用中の部屋のリストは別のコレクションにある場合を考えてみましょう。

```ruby
# ruby
rooms
  .select{|r| [:red, :blue].include? r.color}
  .select{|r| :front == r.location}
  .diff(occupied)
```

```clojure
;; clojure
(->> (rooms)
     (filter #( #{:blue :red} (:color %)))
     (filter #( #{:front} (:location %)))
     (remove (set (occupied))))
```

ここで `(set (occupied))` を示しているのは、Clojureでコレクションを包んだsetを、集合のメンバーシップ判定の述語として使う方法を見せるためです。

中置演算子は入れ子の演算子式には向いていますが、パイプラインとは相性がよくありません。面倒な括弧が必要になるからです。

```ruby
# ruby
((rooms
  .select{|r| [:red, :blue].include? r.color}
  .select{|r| :front == r.location}
  ) - occupied)
  .map(&:num)
  .sort
```

集合演算についてもうひとつ覚えておくべき点は、コレクションが通常はリストであり、順序を持ち、重複を許すということです。集合演算にとってそれが何を意味するかは、使っているライブラリの詳細を見る必要があります。Clojureでは集合演算を使う前にリストをsetに変換しなければなりません。Rubyは任意の配列を集合演算子に受け入れますが、入力の順序を保ちながら、出力では重複を除きます。

### 遅延評価

遅延評価の概念は関数型プログラミングの世界から来ました。動機になるのは、次のようなコードかもしれません。

```ruby
large_list
  .map{|e| slow_complex_method (e)}
  .take(5)
```

このようなコードでは、多くの要素に対して `slow_complex_method` を評価するのに多くの時間を費やし、その後、上位5件以外の結果をすべて捨てることになります。遅延評価があれば、基盤となるプラットフォームは必要なのが上位5件だけだと判断し、必要なものに対してだけ `slow_complex_method` を実行できます。

実際にはこれは実行時の利用方法にまでさらに踏み込みます。`slow_complex_method` の結果がUIのスクロールリストへ流し込まれると想像してみましょう。遅延パイプラインであれば、最終結果が画面内へスクロールしてきた要素に対してだけ、パイプラインを呼び出します。

Collection Pipelineが遅延評価になるには、Collection Pipelineの関数が遅延を考慮して作られていなければなりません。ClojureやHaskellのような関数型言語では、最初からこれを行うことが一般的です。別の場合には、特別なコレクションクラス群に遅延評価を組み込めます。JavaやRubyには、遅延コレクションの実装がいくつかあります。

一部のパイプライン操作は遅延評価では動けず、リスト全体を評価しなければなりません。ソートはその一例です。リスト全体がなければ、単一の先頭値でさえ決められません。遅延評価を真剣に扱うプラットフォームは、通常、遅延性を保てない操作を文書化します。

### 並列性

多くのパイプライン操作は、自然に並列呼び出しと相性がよいものです。`map` を使う場合、ある要素に対してそれを使った結果は、コレクション内の他の要素に依存しません。そのため、複数コアを持つプラットフォームで実行しているなら、`map` の評価を複数スレッドへ分配することで、それを活用できます。

多くのプラットフォームには、このように評価を並列に分配する機能があります。大きな集合に対して複雑な関数を走らせる場合、マルチコアプロセッサを活用することで大きな性能向上が得られることがあります。

ただし、並列化が常に性能を上げるわけではありません。並列分配をセットアップする時間が、並列化で得られる時間短縮を上回ることがあります。そのため多くのプラットフォームは、Clojureの `pmap` 関数が `map` の並列版であるように、明示的に並列性を使う代替操作を提供しています。どんな性能最適化でも同じですが、並列化操作が本当に性能改善をもたらすかどうかは、性能テストで検証すべきです。

### 不変性

Collection Pipelineは、不変データ構造に自然に向いています。パイプラインを作るとき、それぞれの操作が出力として新しいコレクションを生成すると考えるのは自然です。これを素朴に行うと多くのコピーが発生し、大量のデータでは問題になりえます。しかし実際には、ほとんどの場合問題になりません。通常コピーされるのは、大きなデータの塊ではなく、より小さなポインターの集合だからです。

問題になる場合でも、このような変換を効率よく行えるよう設計されたデータ構造を使えば、不変性を保てます。関数型プログラミング言語は、このスタイルで効率よく操作できるデータ構造を使う傾向があります。

必要なら、不変性を諦め、置き換えではなくコレクションを更新する操作を使うこともできます。非関数型言語のライブラリは、Collection Pipeline演算子の破壊的な版を提供していることがよくあります。私は、これらは**規律ある性能チューニング**の一部としてだけ使うことを強く勧めます。まず非変更操作で作業を始め、パイプラインに既知の性能ボトルネックがあるときだけ別のものを使ってください。

### デバッグ

Collection Pipelineのデバッグが難しいのではないか、という質問を何度か受けました。Rubyで次のようなパイプラインを考えてみましょう。

```ruby
def get_readers_of_books1(readers, books, date)
  data = @data_service.get_books_read_on(date)
  return data
    .select{|k,v| readers.include?(k)}
    .select{|k,v| !(books & v).empty?}
    .keys
end
```

現代のIDEはデバッグを大いに助けてくれますが、ここではRubyを使い、emacsだけで作業し、デバッガを鼻で笑っていると想像しましょう。

パイプの途中で中間変数を抽出したくなるかもしれません。

```ruby
def get_readers_of_books2(readers, books, date)
  data = @data_service.get_books_read_on(date)
  temp = data
    .select{|k,v| readers.include?(k)}
    .select{|k,v| !(books & v).empty?}
  pp temp
  return temp
    .keys
end
```

もうひとつ、少し小技めいた方法として、パイプライン内の `map` にprint文を忍び込ませることもできます。

```ruby
def get_readers_of_books(readers, books, date)
  data = @data_service.get_books_read_on(date)
  return data
    .select{|k,v| readers.include?(k)}
    .select{|k,v| !(books & v).empty?}
    .map {|e| pp e; e}.to_h
    .keys
end
```

この場合、`map` 操作の後でハッシュへ戻す必要があります。これはパイプライン内に副作用を要求するので、コードレビューに出たら叱られるべきものですが、コードが何をしているかを可視化する助けにはなります。

きちんとしたデバッガがあるなら、通常はデバッガ内で式を評価できます。そのため、パイプの中にブレークポイントを設定し、パイプの一部に基づく式を評価して、何が起きているかを見られます。

### いつ使うか

私はCollection Pipelineをパターンとして見ています。そしてどんなパターンにも、それを使うべき時と、別の道を取るべき時があります。自分の好きなパターンについて、使わない理由を思いつけないとき、私はいつも疑わしく感じます。

避けるべき最初の兆候は、言語の支援がないときです。Javaを使い始めた頃、私はCollection Pipelineを使えないことをとても残念に思いました。そのため多くの人と同じように、このパターンを形成できるオブジェクトを作る実験をしました。クラスを作り、無名内部クラスのようなものを使えば、Lambdaに近い形でパイプライン操作を作れます。しかし問題は、構文があまりに煩雑で、Collection Pipelineを効果的にしている明瞭さを圧倒してしまうことです。

そのため私は諦めてループを使いました。その後、Javaには関数型スタイルのライブラリがいくつも登場し、その多くは初期の言語にはなかったアノテーションを使っています。しかし私の感覚は変わっていません。きれいなLambda式を支えるよい言語支援がなければ、このパターンはたいてい、得られる価値より面倒の方が大きくなります。

反対するもうひとつの理由は、内包表記がある場合です。その場合、単純な式では内包表記の方が扱いやすいことが多いでしょう。ただし、柔軟性の高さが必要な場面では、それでもパイプラインが必要です。個人的には、単純なパイプラインは内包表記と同じくらい理解しやすいと感じますが、これはチームがコーディングスタイルとして決めるべき種類のことです。

> コードのブロックが「何を」するかと、それを「どう」するかの間に違いがあるときは、いつでもメソッドを抽出する。

適した言語であっても、別の限界にぶつかることがあります。パイプラインの大きさと複雑さです。この記事で示したものは小さく線形です。私の一般的な習慣は小さな関数を書くことです。半ダース行を超えると落ち着かなくなりますし、パイプラインにも似た規則があります。大きなパイプラインは、私のいつもの規則に従って別々のメソッドへ分解する必要があります。つまり、コードのブロックが何をするかと、それをどうするかの間に違いがあるときは、メソッドを抽出するのです。

パイプラインが最もよく機能するのは線形のときです。各ステップが単一のコレクション入力と単一の出力を持つ場合です。別々の入力や出力へ分岐させることも可能ですが、この記事ではそのような例はまとめていません。ここでも注意が必要です。長めの振る舞いを制御下に置く鍵は、通常、別々の関数へ分解することです。

そうは言っても、Collection Pipelineはすばらしいパターンであり、すべてのプログラマーが知っておくべきものです。特にRubyやClojureのように、それをよく支援する言語ではそうです。長く扱いにくいループが必要になるような処理を明確に捉え、コードを読みやすくし、その結果として拡張を安く簡単にできます。

### 操作カタログ

Collection Pipelineでよく見かける操作のカタログです。どの操作を利用できるか、何と呼ぶかは言語によって異なりますが、ここでは共通する能力から見ています。

| 操作 | 意味 |
| --- | --- |
| `collect` | Smalltalk由来の `map` の別名。Java 8では、ストリームからコレクションへ要素を集める終端操作という、まったく別の目的で使われる。 |
| `concat` | 複数のコレクションを1つのコレクションへ連結する。 |
| `difference` | 与えられたリストの内容をパイプラインから取り除く。 |
| `distinct` | 重複する要素を取り除く。 |
| `drop` | `slice` の一形態で、最初のn個以外を返す。 |
| `filter` | 各要素に真偽値関数を実行し、条件を満たしたものだけを出力に入れる。 |
| `flat-map` | コレクションに関数を `map` し、その結果を1段階だけ平らにする。 |
| `flatten` | コレクションから入れ子を取り除く。 |
| `fold` | `reduce` の別名。`foldl`（fold-left）や `foldr`（fold-right）として見かけることもある。 |
| `group-by` | 各要素に関数を実行し、その結果によって要素をグループ化する。 |
| `inject` | Smalltalkの `inject:into:` セレクターに由来する `reduce` の別名。 |
| `intersection` | 与えられたコレクションにも含まれる要素だけを残す。 |
| `map` | 入力の各要素に与えられた関数を適用し、その結果を出力に入れる。 |
| `mapcat` | `flat-map` の別名。 |
| `reduce` | 与えられた関数を使って入力要素を結合し、多くの場合は単一の出力値にする。 |
| `reject` | `filter` の逆で、述語に一致しない要素を返す。 |
| `select` | `filter` の別名。 |
| `slice` | 与えられた最初と最後の位置の間にあるリストの部分列を返す。 |
| `sort` | 与えられた比較器にもとづき、入力をソートしたコピーを出力する。 |
| `take` | `slice` の一形態で、最初のn個の要素を返す。 |
| `union` | このコレクションまたは与えられたコレクションに含まれる要素を返し、重複を取り除く。 |

### 謝辞

この記事の初期草稿にコメントしてくれた同僚たち、Sriram Narayanan、David Johnston、Badrinath Janakiraman、John Pradeep、Peter Gillard-Moss、Ola Bini、Manoj Mahalingam、Jim Arnold、Hugo Corbucci、Jonathan Reyes、Max Lincoln、Piyush Srivastava、Rebecca Parsons に感謝します。

### 重要な改訂

- 2015年6月25日: デバッグの節を追加。
- 2014年10月22日: union演算子を追加。
- 2014年10月17日: intersection演算子を追加。
- 2014年10月15日: 入れ子の演算子式とdifference演算子に関する節を追加。
- 2014年9月12日: distinctとsliceを操作カタログに追加。
- 2014年7月28日: 最終回を公開。
- 2014年7月24日: 代替案を含む第4回を公開。
- 2014年7月23日: インデックス反転の例を含む第3回を公開。
- 2014年7月22日: 最初の2つの例とカタログを含む第2回を公開。
- 2014年7月21日: 第1回を公開。
