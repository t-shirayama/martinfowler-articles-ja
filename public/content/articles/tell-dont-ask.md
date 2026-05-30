# Tell Dont Ask

## 要約

Tell-Don't-Askは、オブジェクトからデータを取り出して外側で判断するのではなく、そのオブジェクトにやるべきことを伝える、という設計原則です。データとそのデータを扱う振る舞いを同じ場所に置くことで、変更理由が近いものを同じコンポーネントに集めやすくなります。

ただしFowlerは、この原則を自分では強調して使わないと述べています。getterをすべて排除する姿勢は行き過ぎになりやすく、責任あるqueryメソッドが協調を単純にする場合もあるからです。

## 読むときの観点

- 「尋ねるな、命じよ」を、getter禁止ではなく、データと振る舞いの配置を考える手がかりとして読む。
- データを持つ側に振る舞いを移すと、結合して変わるものを近くに置ける。
- queryメソッドが悪いのではなく、外側へ判断を漏らしすぎることが問題になる。
- よい設計はトレードオフであり、レイヤリングなど他の関心が優先される場合もある。

## 原文の翻訳

Tell-Don't-Askは、オブジェクト指向とはデータと、そのデータに作用する関数をひとまとめにすることだ、と思い出させてくれる原則です。オブジェクトにデータを尋ね、そのデータに対して処理を行うのではなく、オブジェクトに何をすべきかを伝えるべきだ、ということを思い出させます。これにより、**データと一緒に振る舞いをオブジェクトへ移す**方向へ促されます。

例で明確にしてみましょう。ある値を監視し、その値が一定の上限を超えたら警報を出す必要があるとします。これを「ask」スタイルで書くなら、まずこうしたものを表すデータ構造を持つかもしれません。

```java
class AskMonitor...

  private int value;
  private int limit;
  private boolean isTooHigh;
  private String name;
  private Alarm alarm;

  public AskMonitor (String name, int limit, Alarm alarm) {
    this.name = name;
    this.limit = limit;
    this.alarm = alarm;
  }
```

そして、このデータへアクセスするためのアクセサを組み合わせます。

```java
class AskMonitor...

  public int getValue() {return value;}
  public void setValue(int arg) {value = arg;}
  public int getLimit() {return limit;}
  public String getName()  {return name;}
  public Alarm getAlarm() {return alarm;}
```

このデータ構造を、次のように使うことになります。

```java
AskMonitor am = new AskMonitor("Time Vortex Hocus", 2, alarm);
am.setValue(3);
if (am.getValue() > am.getLimit())
  am.getAlarm().warn(am.getName() + " too high");
```

「Tell Don't Ask」は、代わりにその振る舞いをmonitorオブジェクト自体の中へ置くよう促します。フィールドは同じものを使います。

```java
class TellMonitor...

  public void setValue(int arg) {
    value = arg;
    if (value > limit) alarm.warn(name + " too high");
  }
```

これは次のように使われます。

```java
TellMonitor tm = new TellMonitor("Time Vortex Hocus", 2, alarm);
tm.setValue(3);
```

多くの人は、tell-don't-askを有用な原則だと感じています。オブジェクト指向設計の根本原則のひとつは、システムの基本要素であるオブジェクトが、データと振る舞いの両方をまとめ持つように、データと振る舞いを結びつけることです。これはしばしばよいことです。なぜなら、そのデータと、それを操作する振る舞いは密接に結合しているからです。一方が変われば他方も変わり、一方を理解することは他方を理解する助けになります。**密接に結合しているものは、同じコンポーネントに置くべき**です。tell-don't-askを考えることは、プログラマがこの同居をどう増やせるかを見る助けになります。

しかし個人的には、私はtell-dont-askを使っていません。データと振る舞いを同じ場所に置くようにはしていますし、それはしばしば似た結果につながります。tell-dont-askで気になる点のひとつは、queryメソッドをすべて取り除こうとするGetterEradicatorになるよう人々を促してしまう例を見てきたことです。しかし、オブジェクトが情報を提供することで効果的に協調する場合もあります。よい例は、入力情報を受け取り、それを変換してクライアントを単純にするオブジェクトです。EmbeddedDocumentの利用などがそうです。責任あるqueryメソッドが問題を単純にする場面で、tellだけにこだわったためにコードがねじれ込むのを見たことがあります。私にとってtell-don't-askは、振る舞いとデータを同じ場所に置くための踏み石ですが、**強調する価値のある到達点だとは思っていません**。

### さらに読む

この原則は、Andy Huntと“Prag” Dave Thomas、つまりThe Pragmatic Programmersと結びつけられることが最も多いものです。彼らはIEEE Softwareのコラムと、自分たちのWebサイトの投稿でこの原則を説明しています。

### 注

そして実際には、データと振る舞いを同じ場所に置くという、より根本的な原則でさえ、レイヤリングのような他の関心を優先するために手放すべき場合があります。よい設計とはトレードオフの問題であり、データと振る舞いを同じ場所に置くことは、心に留めておくべき要素のひとつにすぎません。
