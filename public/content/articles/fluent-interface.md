# Fluent Interface

## 要約

Fluent Interface は、読みやすく流れるように使えることを重視した API スタイルです。内部 DSL に近い性質を持ち、メソッドチェーンだけでなく、利用時の文脈全体で意味が立ち上がることが重要です。

一方で、普通の constructor、setter、追加メソッドより設計と実装に手間がかかります。単独では意味が弱いメソッド名や、値を返す setter など、通常の API とは異なる設計上の習慣も必要になります。

## 読むときの観点

- Fluent Interface を単なる method chaining と同一視しない。
- API が読みやすく流れるか、内部 DSL としての質を持つかを見る。
- Command Query Separation など通常の API 慣習を、どこまで緩めるかを考える。
- 値オブジェクトの設定や仕様記述のような、宣言的な文脈との相性を意識する。

## 原文の翻訳

数か月前、私は Eric Evans と一緒にワークショップに参加しました。そこで彼がある種のインターフェーススタイルについて話し、私たちはそれを fluent interface と名付けることにしました。これは一般的なスタイルではありませんが、もっと知られてよいものだと思います。おそらく例で説明するのがいちばんよいでしょう。

最も単純な例は、Eric の `timeAndMoney` ライブラリから来ていると思います。通常のやり方で時間間隔を作るなら、次のような形になるでしょう。

```java
TimePoint fiveOClock, sixOClock;
...
TimeInterval meetingTime = new TimeInterval(fiveOClock, sixOClock);
```

`timeAndMoney` ライブラリの利用者は、次のように書きます。

```java
TimeInterval meetingTime = fiveOClock.until(sixOClock);
```

顧客向けの注文を作るという、よくある例を続けましょう。注文には、数量と商品を持つ明細があります。明細は skippable にできます。つまり、注文全体を遅らせるより、その明細なしで配送するほうを望む、という意味です。注文全体に rush の状態を与えることもできます。

この種のものを組み立てるとき、私が最もよく見るのは次のような形です。

```java
private void makeNormal(Customer customer) {
    Order o1 = new Order();
    customer.addOrder(o1);
    OrderLine line1 = new OrderLine(6, Product.find("TAL"));
    o1.addLine(line1);
    OrderLine line2 = new OrderLine(5, Product.find("HPK"));
    o1.addLine(line2);
    OrderLine line3 = new OrderLine(3, Product.find("LGV"));
    o1.addLine(line3);
    line2.setSkippable(true);
    o1.setRush(true);
}
```

本質的には、さまざまなオブジェクトを作り、それらを互いに配線しています。コンストラクタですべてを設定できない場合、配線を完了するために一時変数が必要になります。コレクションへ要素を追加する場合には特にそうです。

同じ組み立てを fluent style で行うと、次のようになります。

```java
private void makeFluent(Customer customer) {
    customer.newOrder()
            .with(6, "TAL")
            .with(5, "HPK").skippable()
            .with(3, "LGV")
            .priorityRush();
}
```

このスタイルについておそらく最も重要なのは、その意図が内部 Domain Specific Language に近いものを作ることにある、という点です。実際、私たちがそれを表す言葉として `fluent` を選んだのはそのためです。多くの面で、このふたつの用語は同義です。API は主に、読みやすく、流れるように使えることを目指して設計されます。この流暢さの代償は、考える面でも API の構築そのものでも、より多くの手間がかかることです。コンストラクタ、setter、追加メソッドからなる単純な API のほうが、ずっと書きやすいのです。

実際、よい fluent API を考え出すにはかなりの思考が必要です。

この小さな例の問題のひとつは、私がカルガリーの喫茶店で朝食をとりながら、さっと作ったものだということです。よい fluent API を作るには時間がかかります。もっとよく練られた fluent API の例を見たいなら、JMock を見てください。JMock は、どんな mocking ライブラリでもそうであるように、複雑な振る舞いの仕様を作る必要があります。ここ数年で多くの mocking ライブラリが作られてきましたが、JMock には非常にうまく流れる fluent API があります。

期待値の例を示します。

```java
mock.expects(once()).method("m").with( or(stringContains("hello"),
                                          stringContains("howdy")) );
```

私は Steve Freeman と Nat Price が JAOO2005 で JMock API の進化についてすばらしい講演をするのを見ました。彼らはその後、それを OOPSLA 論文としてまとめています。

これまで私たちは、主にオブジェクトの設定を作る fluent API を見てきました。多くの場合、それは value object を含みます。これが定義上の特徴なのかはわかりませんが、宣言的な文脈に現れやすい何かがあるのではないかと疑っています。私たちにとって fluency の重要なテストは、Domain Specific Language としての質です。API の使用が言語のような流れを持てば持つほど、それはより fluent になります。

このような fluent API を作ると、API についていくつか普通ではない習慣が生まれます。最も明白なもののひとつは、値を返す setter です。注文の例では、`with` は注文に明細を追加し、注文を返します。波括弧の世界では、変更メソッドは `void` である、というのが一般的な慣習です。私はこれを好んでいます。Command Query Separation の原則に従っているからです。しかしこの慣習は fluent interface の邪魔になるので、この場合には慣習を一時停止してよいと思っています。

戻り値の型は、fluent な動作を続けるために必要なものに基づいて選ぶべきです。JMock は、次に何が必要になりそうかに応じて型を移していくことを重視しています。このスタイルのよい利点のひとつは、メソッド補完、つまり IntelliSense が、次に何を入力すべきかを教えてくれることです。IDE の中のウィザードに少し似ています。一般に、動的言語は構文があまり散らからない傾向があるため、DSL にはより向いていると私は感じます。しかしメソッド補完を使えることは、静的言語にとっての利点です。

Fluent Interface におけるメソッドの問題のひとつは、それ単独ではあまり意味をなさないことです。メソッドブラウザやメソッドごとのドキュメントを見ても、`with` の意味はあまり伝わりません。実際、そこに単独で置かれているなら、私はそれを意図を十分に伝えない、悪い名前のメソッドだと主張するでしょう。それが強みを見せるのは、fluent な動作の文脈においてだけです。この問題を回避する方法のひとつは、この文脈だけで使われる builder object を使うことかもしれません。

Eric が述べていたことのひとつは、これまで彼が fluent interface を使ったり見たりしてきたのは、主に value object の設定まわりだということです。Value object にはドメイン上意味のある identity がないので、簡単に作って捨てることができます。そのため fluency は、古い値から新しい値を作ることに乗ります。その意味で、注文の例はそれほど典型的ではありません。Evans Classification では、それは entity だからです。

私はまだ fluent interface をそれほど多く見ていません。したがって、その強みと弱みについて私たちはまだあまり知らない、と結論づけています。だから、それを使うべきだという勧めは、どれもまだ予備的なものにすぎません。しかし私は、これはもっと実験されるべき時期に来ていると思っています。

これについては、Piers Cawley によるよい続編があります。

更新、2008年6月23日。この投稿を書いて以来、この用語はかなり広く使われるようになりました。それは、私に心地よい満足感を与えてくれます。私は、現在取り組んでいる本の中で、fluent interface と internal DSL についての考えを磨き直しました。また、よくある誤解にも気づきました。多くの人が fluent interface と method chaining を同一視しているようです。確かに chaining は、fluent interface でよく使われる技法です。しかし、**本当の fluency はそれ以上のもの**です。

上で示した JMock の例は method chaining を使っていますが、nested functions と object scoping も使っています。
