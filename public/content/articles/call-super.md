# Call Super

## 要約

Call Superは、フレームワークを継承して拡張するときに、サブクラス側が毎回`super`のメソッド呼び出しを忘れずに書かなければならない、という小さなにおいです。Fowlerは、毎回覚えておく必要があるAPIは悪いAPIの兆候であり、基底クラス側がTemplate Methodとhook methodを用意して、共通処理を忘れない構造にするべきだと述べています。

ただし、JUnitのようにフレームワークの上にさらに別のフレームワークを重ねる場合は、単純なhook methodの追加が利用者を混乱させることがあります。その場合は、より上位のTemplate Methodを上書きする、`final`で誤用を防ぐ、annotationのようなメタデータを使う、といった選択肢を検討します。

## 読むときの観点

- `super`呼び出しを利用者に覚えさせる設計は、API側に改善余地がある。
- Template Methodは、共通処理とサブクラス固有処理を分離するための代表的な手段である。
- hook methodは空実装、既定実装、abstractのどれにするかで拡張の意図が変わる。
- 継承を公開されたインターフェースとして扱う場合、`final`やsealの使い方には慎重さが必要になる。
- 多段のフレームワークでは、利用者が既に知っている拡張点を壊さないことも設計上の重要な制約になる。

## 原文の翻訳

Call Superは、OOフレームワークでときどき現れる小さなにおいです。好みによってはanti-patternと呼んでもかまいません。症状はかなり簡単に見分けられます。何らかのフレームワークへ差し込むために、スーパークラスを継承しているとします。ドキュメントには「独自のことをしたいなら、`process`メソッドをサブクラス化すればよい。ただし、そのメソッドの先頭でスーパークラスを呼び出すことを忘れないことが重要だ」といったことが書かれています。たとえば、次のような形です。

```java
public class EventHandler ...
  public void handle (BankingEvent e) {
    housekeeping(e);
  }
public class TransferEventHandler extends EventHandler...
  public void handle(BankingEvent e) {
    super.handle(e);
    initiateTransfer(e);
  }
```

毎回何かを忘れずにやらなければならないなら、それは**悪いAPIの兆候**です。そうではなく、APIが`housekeeping`呼び出しを覚えておくべきです。通常のやり方は、`handle`メソッドをTemplate Methodにすることです。

```java
public class EventHandler ...
  public void handle (BankingEvent e) {
    housekeeping(e);
    doHandle(e);
  }
  protected void doHandle(BankingEvent e) {
  }
public class TransferEventHandler extends EventHandler ...
  protected void doHandle(BankingEvent e) {
    initiateTransfer(e);
  }
```

ここでは、スーパークラスがpublic methodを定義し、サブクラスが上書きするための別メソッドを提供しています。この別メソッドは、しばしばhook methodと呼ばれます。これでサブクラスを書く人は、`super`呼び出しについて頭を悩ませる必要がなくなります。さらに、スーパークラスを書く人は、必要ならサブクラスメソッドの後に呼び出しを追加する自由も得られます。

hook methodの定義にはいくつかのやり方があります。この例では空実装を示しました。多くのサブクラスが独自の追加振る舞いを必要としない場合には、これが有用です。多くのサブクラスが同じことをしなければならない場合は、既定実装を検討できます。その既定実装自体をTemplate Methodにして、共通の筋書きの中で変化を許すこともできます。すべてのサブクラスが独自の振る舞いを提供するべきなら、スーパークラスのhook methodをabstractにできます。

このやり方の問題のひとつは、あるメソッドがhook methodであること、つまりフレームワーク作者が上書きされると期待しているメソッドであることを示す方法が、たいてい存在しないことです。慣習はあります。`handle`と`doHandle`の組み合わせは、よくあるものです。しかし多くの場合、仕組みを説明しなければなりません。説明する最良の方法のひとつは例を示すことです。私がこの種のケースを見るとき、たいてい最善なのは既存のサブクラスを見て、それが何をしているか確認することです。

この例ではhook methodはひとつで、比較的明らかです。しかし多くの場合、メソッドは多数あり、そのすべてが、サブクラスがどれだけ制御を引き受けたいかに応じてhookになりえます。私のHTML layout classのabstract base classをざっと見るだけでも、上書き可能なメソッドが半ダースほどあります。単純なことをしたいサブクラスは小さなhookを上書きし、もっと凝ったことをしたいサブクラスはより広い範囲のメソッドを上書きします。

言語によっては、サブクラスが`handle`メソッドを上書きできないようsealできます。私はEnablingAttitudeを持っているので、特に継承が事実上公開されたインターフェースである場合、通常はこれをためらいます。sealを支持する議論は、サブクラスがスーパークラスを壊せなくなる、というものです。私は、間違ったものを上書きすることを「スーパークラスを壊す」とは考えていません。

サブクラスとスーパークラスは密接に協力しなければなりません。結局のところ、継承は非常に親密な関係です。全体としてうまくいくか、うまくいかないかのどちらかです。sealは、間違ったものを上書きしていると相手に示すよい方法になりえます。そのため、公開されていないインターフェース、つまりサブクラスが同じコードベースの一部である場合には、私は使う気になるでしょう。私がsealに問題を感じるのは、サブクラスが特に凝ったことをするために`handle`呼び出しを上書きしたいかもしれないからです。

私はサブクラスの必要を予測できません。だから「どうぞ。ただし責任は自分で負ってください」と言うほうを、「だめです」と言うより好みます。すべてがひとつのコードベースにあるなら、必要になったときにいつでもsealを外せます。

### Multi-Level Hooks

この種の状況では、call superに頼るべきではないことが見えてきたと思います。しかし、フレームワークが複数の階層を持つとややこしくなります。

ここでは、何度か話題に上がった実例、JUnitに切り替えます。JUnitはテストケース全体の実行を制御するためにTemplate Methodを使っています。次のような形です。

```java
public abstract class TestCase
  public void runBare() throws Throwable {
    setUp();
    try {
      runTest();
    }
    finally {
      tearDown();
    }
  }
  protected void setUp() throws Exception {
  }
  protected void tearDown() throws Exception {
  }
```

これはおなじみのTemplate Methodで、上書き用に2つの空のhook methodがあります。ここまでは順調です。必要に応じて、自分のset upコードやtear downコードを簡単に追加できます。

ややこしさは、利用者がJUnitからさらに別のフレームワークを派生させたいときに生じます。世の中には多くの例がありますが、ここではプロジェクト固有の規約がある単純なケースを考えます。たとえば次のようなものです。

```java
public class AlphaTestCase extends TestCase
   protected void setUp() throws Exception {
     alphaProjectSetup();
   }
```

ここでcall super問題にぶつかります。そこで先ほどの助言を使うなら、次のように再定義できます。

```java
public class AlphaTestCase  extends TestCase...
  final protected void setUp() throws Exception {
    alphaProjectSetup();
    doSetUp();
  }
  protected void doSetUp() throws Exception {
  }
```

これは動きますが、JUnitに慣れている人を混乱させるという問題にぶつかります。彼らが関わってきたどのプロジェクトでも、読んできたどの本でも、上書きすべきなのは`setUp`であって、この新奇な`doSetUp`ではない、と言っています。人々が混乱する可能性が非常に高いので、これは`final`を使うよいケースです。しかし`final`を使っても、別のsetup methodが生む混乱は非常につらいものです。

別の選択肢もあります。第2階層のフレームワークが、`setUp`を呼び出す側を上書きするのです。

```java
public class AlphaTestCase extends TestCase...
  public void runBare() throws Throwable {
    alphaProjectSetup();
    setUp();
    try {
      runTest();
    }
    finally {
      tearDown();
    }
  }
  protected void setUp() throws Exception {
  }
```

これで全員が通常どおり`setUp`を使えます。フレームワーク作者も、興味深い場所に他の振る舞いを追加したい場合に、より多くの選択肢を持てます。これは常に検討する価値のある選択肢です。Template Methodが今いる場所でうまく働かないなら、**ひとつ上の階層へ上がる**ことを考えてください。

もちろん、無料のtemplateなどありません。場合によっては、ソースが手に入らないため何をすべきか分からず、このやり方ができません。別の場合には、フレームワーク作者がDirectingAttitudeを持っていて、呼び出し側メソッドをsealし、上書きを止めているかもしれません。

たとえ可能だとしても、注意すべきことがあります。主要なフレームワーク作者が、あなたの上書きしたメソッドを変更する必要が出てきたらどうなるでしょうか。実際、JUnitは2004年10月9日にそうしました。いつものように、継承の力には責任が伴います。スーパークラスにどのような変更が起きているか、目を配らなければなりません。

いま利用可能になりつつあるもうひとつの選択肢は、Annotationを使うことです。JUnitや他のJavaベースのフレームワークは、ここ数か月、NUnitが先導した流れに続いてannotationを扱ってきました。annotationを使うと、メソッドに名前だけでなく、より多くのメタデータを与えられます。そのため、この種の状況でより多くの選択肢を持てます。しかし、それはまた別の日の話題です。
