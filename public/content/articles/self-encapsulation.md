# Self Encapsulation

## 要約

Self Encapsulation は、外部からのアクセスだけでなく、クラス内部から field を扱うときにも accessor method を通す考え方です。
これにより setter の検証や派生値の隠蔽、subclass による hook point の提供といった利点が得られることがあります。

ただし Fowler は、ほとんどの場合 self-encapsulation の価値は小さいと見ています。
通常は field へ直接アクセスし、必要が出たときに Self Encapsulate Field でリファクタリングする、という立場です。

## 読むときの観点

- data encapsulation と self-encapsulation の違いを分けて読む。
- internal access の範囲が小さいほど、accessor を通す価値も小さくなる点を見る。
- setter にロジックがある場合や継承構造がある場合は例外になりうる。
- 新しい class の抽出で問題を解けないか、という代替策にも注目する。

## 原文の翻訳

Data encapsulation は、オブジェクト指向スタイルにおける中心的な信条です。これは、オブジェクトの fields を public に露出すべきではなく、代わりにオブジェクトの外側からのすべてのアクセスは accessor methods、つまり getters と setters を通すべきだ、というものです。public にアクセスできる fields を許す言語もありますが、私たちは通常、プログラマにそうしないよう注意します。Self-encapsulation はさらに一歩進み、data field への内部からのすべてのアクセスも accessor methods を通すべきだと示します。

データ値そのものに触れるべきなのは accessor methods だけです。data field が外部に露出していない場合、これは追加の private accessor を加えることを意味します。

それなりにカプセル化された Java class の例を示します。

```java
class Charge…

  private int units;
  private double rate;

  public Charge(int units, double rate) {
    this.units = units;
    this.rate = rate;
  }
  public int getUnits() { return units; }
  public Money getAmount() { return Money.usd(units * rate); }
```

両方の fields は immutable です。`units` field は getter を通じて class の client に露出していますが、`rate` field は内部でだけ使われるため、getter は必要ありません。

self-encapsulation を使った版は次のようになります。

```java
class ChargeSE…

  private int units;
  private double rate;
  public ChargeSE(int units, double rate) {
    this.units = units;
    this.rate = rate;
  }
  public int getUnits()    { return units; }
  private double getRate() { return rate; }
  public Money getAmount() { return Money.usd(getUnits() * getRate()); }
```

Self encapsulation では、`getAmount` が両方の fields に getter を通じてアクセスする必要があります。これは、`rate` のための getter を追加しなければならないことも意味します。そして、それは private にすべきです。

mutable data をカプセル化することは、一般に良い考えです。更新関数には、検証やそれに伴うロジックを実行するコードを含められます。関数を通じてアクセスを制限することで、Uniform Access Principle を支えられます。つまり、どのデータが計算され、どのデータが保存されているかを隠せます。これらの accessors により、同じ public interface を保ったまま data structures を変更できます。

何がオブジェクトの「外側」なのかという詳細は、さまざまな Access Modifier によって言語ごとに異なります。しかし、ほとんどの環境は何らかの程度で data encapsulation を支えています。

私は self-encapsulation を義務づけている組織にいくつか出会ったことがあります。また、それを使うべきかどうかは、90年代から定期的に議論される話題でした。支持者は、encapsulation は非常に有益なので、内部アクセスにも取り入れたいのだと言いました。批判者は、それは不要な儀式であり、何が起きているのかを見えにくくする不要なコードにつながると主張しました。

この点についての私の見方は、ほとんどの場合、self-encapsulation には大きな価値がない、というものです。encapsulation の価値は、データアクセスの範囲に比例します。class は通常小さいので、少なくとも私の class はそうですが、その範囲内での直接アクセスが問題になることはありません。多くの accessor は、setter なら単純な代入、getter なら単純な取得です。そのため、内部でそれらを使う価値はほとんどありません。

しかし、self-encapsulation に手間をかける価値がある状況もよくあります。setter にロジックがあるなら、内部更新についてもそれを検討するのが賢明です。もう1つの状況は、その class が継承構造の一部である場合です。その場合、accessors は subclass が振る舞いを override するための貴重な hook point を提供します。

したがって、私のいつもの最初の一手は field へ直接アクセスすることです。ただし、状況が求めるなら Self Encapsulate Field を使ってリファクタリングします。self-encapsulation を検討させる力は、多くの場合、**新しい class を抽出する**ことで解決できます。

参考文献:

Kent Beck は、『Implementation Patterns』と『Smalltalk Best Practice Patterns』の両方で、Direct Access と Indirect Access という名前のもとに、これらのトレードオフを議論しています。
