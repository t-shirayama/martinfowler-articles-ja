# Role Interface

## 要約

Role Interfaceは、供給側コンポーネントの全機能を表すインターフェイスではなく、特定の協調関係で利用者が必要とするメソッドだけを表すインターフェイスです。1つの供給側コンポーネントは、相手との関わり方ごとに複数のrole interfaceを実装することがあります。

Fowlerは、header interfaceより手間はかかるものの、置き換え可能性が本当に必要な場面では、利用者が何を必要としているかをよく考えるべきだと述べています。リモートサービスでも、型チェックは必要なデータの存在を確認すればよく、余分なデータを返すこと自体は問題ではないとしています。

## 読むときの観点

- interfaceを供給側の全体像ではなく、利用者との協調の形として捉える。
- predecessorとsuccessorの例で、必要なメソッドだけに絞る利点を見る。
- header interfaceは作りやすいが、不要な実装を強いる可能性がある。
- Consumer Driven ContractsやInterface Segregation Principleとのつながりに注目する。

## 原文の翻訳

Role Interfaceは、supplierとconsumerのあいだの特定の相互作用を見て定義されます。supplier componentは通常、相互作用のパターンごとに複数のrole interfaceを実装します。これは、supplierが1つのインターフェイスだけを持つHeaderInterfaceとは対照的です。

例を見てみましょう。PERT形式のプロジェクト計画を扱うプログラムを考えます。この方式では、プロジェクトを一連のactivityへ分解します。そして、それらのactivityをネットワーク、厳密にはdirected acyclic graphに並べ、タスク間の依存関係を示します。たとえば「朝食をとる」がタスクなら、「コーヒーを淹れる」と「シリアルを混ぜる」はpredecessor activityになり得ます。

つまり、すべてのpredecessorが完了するまで、私は朝食を始められません。

各activityにはduration、つまりかかると予想される時間があります。このdurationとネットワーク内の関係を合わせると、ほかの情報を導き出せます。あるactivityのearliest startは、そのpredecessorたちのearliest finishのうち最も遅いものとして計算できます。activityのearliest finishは、そのearliest startにdurationを足したものです。同じようにlatest finishとlatest startも求められます。コードはおおよそ次のようになります。

```text
private int duration;
public MfDate earliestStart() {
  MfDate result = MfDate.PAST;
  for (?TYPE? p : predecessors())
    if (p.earliestFinish().after(result))
      result = p.earliestFinish();
  return result;
}

public MfDate earliestFinish() {
  return earliestStart().addDays(duration);
}
 public MfDate latestFinish() {
  MfDate result = MfDate.FUTURE;
  for (?TYPE? s : successors())
    if (s.latestStart().before(result))
      result = s.latestStart();
  return result;
}

public MfDate latestStart() {
  return latestFinish().minusDays(duration);
}
```

上のコードには穴があることに気づくでしょう。`?TYPE?`の部分です。activityにpredecessorとsuccessorを問い合わせたとき、どの型のオブジェクトが返ってくると考えるべきでしょうか。正確にはコレクションを返すので、本当の問いは、返されるコレクションの要素の型を何にするべきか、ということです。

header interfaceを使うなら、返されるインターフェイスはactivityになり、activityクラスのpublic methodを写し取ってInterfaceImplementationPairを作ることになります。

```text
public interface Activity ...
  MfDate earliestStart();
  MfDate earliestFinish();
  MfDate latestFinish();
  MfDate latestStart();

class ActivityImpl...
  List<Activity> predecessors() ...
  List<Activity> successors() ...
```

しかしrole interfaceでは、協調するオブジェクトが実際にどう使われるかを見ます。この場合、successorは`latestStart`のためだけに使われ、predecessorは`earliestFinish`のためだけに使われます。その結果、**実際に使うメソッドだけを持つ2つのインターフェイス**を作ります。

```text
public interface Successor {
  MfDate latestStart();
}
public interface Predecessor {
  MfDate earliestFinish();
}
class Activity
  List<Predecessor> predecessors() ...
  List<Successor> successors() ...
```

successorは、このオブジェクトに対して協調オブジェクトが演じるroleだと考えられます。オブジェクトと、他者との協調においてそれらが演じるroleを考えるこのアプローチには、オブジェクト指向の世界で長い歴史があります。

role interfaceの強みは、activityとそのsuccessorのあいだの実際の協調を明確に伝えられることです。多くの場合、あるクラスは別のクラスのすべてのメソッドを使うわけではないので、実際にどれが必要なのかを示せるのは有益です。これは後で置き換えが必要になったときに、特に役立ちます。header interfaceは、たとえ必要がなくてもすべてのメソッドを実装することを強制します。しかしrole interfaceなら、**必要なものだけを正確に実装すればよい**のです。

role interfaceの欠点は、作るのにより手間がかかることです。role interfaceを形にするには、それぞれの協調関係を見なければならないからです。header interfaceなら、public methodを複製するだけでよく、考える必要はありません。また、consumerに依存しているような感覚もあります。私が「感覚」と言うのは、形式的な依存関係があるわけではないからですが、それでも多くの人を不安にさせるには十分です。

そうした人たちはheader interfaceを好みます。自分のserviceを誰がどう使うかを気にするべきではない、と考えるからです。インターフェイスを公開し、利用者はそれが役に立つと思えば使えばよい、というわけです。

全体として、私はrole interfaceの方をずっと好んでいます。したがって、できるだけそちらへ進めることを勧めます。そうするには手間がかかりますが、私の考えでは、interfaceは本当に置き換え可能性が必要なときだけ使うべきであり、interfaceが必要なら、そのinterfaceのconsumerが何を必要としているかをよく考えるべきです。

web serviceのようなものを使うリモート処理の文脈で考えると、興味深いひねりがあります。リモートサービスにpredecessorの詳細を問い合わせるとしたら、何が返ってくると考えるべきでしょうか。role interfaceであるためには、earliest finishのデータだけを含むdocumentを返すべきだ、と主張する人もいるかもしれません。私はそうは思いません。求めたものより多くのデータを含むdocumentを返しても、まったく妥当だと考えます。

重要なのは、型チェックが関わるなら、それはearliest finishのデータが存在することだけを確認すべきだという点です。余分なデータを無視できるなら、それを提供することは悪ではありません。クラスが複数のinterfaceを実装してもよいのと同じです。この考え方はConsumer Driven Contractsの哲学に合っており、それが私にとってconsumer driven contractsを非常に魅力的にしている理由の1つです。

すでに述べたように、この考え方は長く存在しています。Trygve Reenskaugは、roleを分析し、それらを合成してclassにすることを中心に据えた方法論の本を書きました。Robert Martinはこの話題をInterface Segregation Principleとして語っています。role interfaceはその原則に従いますが、header interfaceは従いません。
