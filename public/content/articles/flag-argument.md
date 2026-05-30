# Flag Argument

## 要約

Flag Argument は、引数の値によって関数に異なる処理をさせる引数です。Fowler は一般に、フラグ引数よりも意図を明確に表す別メソッドを好みます。

ただし実装が複雑に絡み合っている場合や、UI やデータソースからそのまま真偽値が来る場合には、内部実装や呼び出し側の事情に合わせた判断も必要です。重要なのは、呼び出し側の意図が読みやすい API にすることです。

## 読むときの観点

- `book(martin, false)` と `regularBook(martin)` の読みやすさの差を見る。
- 公開 API では明示的なメソッドにし、内部では隠れたフラグ実装を残す選択肢を押さえる。
- フラグを呼び出し側が指定すべきか、オブジェクト状態から導出すべきかを分けて考える。
- 真偽値 setter では、呼び出し元のデータの来かたも API 設計に影響する。

## 原文の翻訳

Flag Argument は、その値に応じて関数に異なる操作をさせる種類の関数引数です。コンサートの予約を作りたいとしましょう。これには通常予約とプレミアム予約のふたつの方法があります。ここで Flag Argument を使うと、次のようなメソッド宣言になります。

```java
//pseudo-code
class Concert...
  public Booking book (Customer aCustomer, boolean isPremium) {...}
```

Flag Argument に対する私の一般的な反応は、それを避けることです。Flag Argument を使うより、別々のメソッドを定義するほうを好みます。

```java
class Concert...
  public Booking regularBook(Customer aCustomer) {...}
  public Booking premiumBook(Customer aCustomer) {...}
```

ここでの私の理由は、呼び出し時の意図を別々のメソッドのほうがより明確に伝えるからです。`book(martin, false)` を見たときにフラグ変数の意味を思い出す必要がある代わりに、`regularBook(martin)` なら簡単に読めます。

### 絡み合った実装

Flag Argument に対する私の一般的な嫌悪には、いくつかの微妙な点と帰結があります。最初のものは、絡み合った実装をどう扱うかです。

最も単純な場合、フラグへの反応は実質的に別のメソッドを呼ぶことです。

```java
public Booking book (Customer aCustomer, boolean isPremium) {
  if(isPremium)
   // logic for premium book
  else
   // logic for regular booking
}
```

しかし、ときにはロジックがもっと絡み合っています。

```java
public Booking book (Customer aCustomer, boolean isPremium) {
  lorem().ipsum();
  dolor();
  if(isPremium)
    sitAmet();
  consectetur();
  if(isPremium)
    adipiscing().elit();
  else {
    aenean();
    vitaeTortor().mauris();
  }
  eu.adipiscing();
}
```

この状況では、通常予約とプレミアム予約を大きな重複なしに別メソッドへ抽出しようとすると、面倒になることがあります。この場合の選択肢のひとつは、Flag Argument を持つメソッドを残しつつ、それを隠しておくことです。

```java
class Order...
  public Booking regularBook(Customer aCustomer) {
    return hiddenBookImpl(aCustomer, false);
  }
  public Booking premiumBook(Customer aCustomer) {
    return hiddenBookImpl(aCustomer, true);
  }
  private Booking hiddenBookImpl(Customer aCustomer,  boolean isPremium) {...}
```

ここでの要点は、`hiddenBookImpl` を呼ぶのは通常予約とプレミアム予約のメソッドだけであるべきだ、ということです。私はこれを醜い名前にして明示するのが好きです。そうしておくと、必要になったときに、他の誰もそれを呼んでいないことを確認するための regex probe を簡単に追加できるという利点もあります。

### フラグの導出

プレミアム予約処理を使うかどうかの判断が、顧客のステータスに依存している場合はどうでしょうか。エリート顧客はプレミアム予約を得て、通常顧客は通常の扱いを受けるとしましょう。この場合、もちろん boolean フラグを持つべきではありません。しかし顧客オブジェクト自体がフラグとして振る舞っているのでしょうか。

私はこれを、呼び出し側の意図を捉えることの問題だと見ます。予約方法が顧客ステータスだけに依存するなら、呼び出し側はプレミアム予約と通常予約の違いを気にする立場にありません。したがって、予約ルーチンが顧客ステータスに基づいて真のメソッドを導出するのは、まったく妥当です。**呼び出し側がどちらを望むかを指定する必要があるときだけ**、別々のメソッドが欲しくなります。

### Boolean Setting Method

これに関連するのが、boolean の設定メソッドにどう名前を付けるかという問題です。ここで私は Kent の助言に同意します。私は次のようにしたいと思います。

```java
void setOn();
void setOff();
```

次のようにするよりも、です。

```java
void setSwitch(boolean on);
```

しかし、ここでも Kent に同意する点として、これはメソッドがどのように使われるかに依存します。UI コントロールやデータソースのような boolean の供給元からデータを取り出しているなら、次のようにするよりも、`setSwitch(aValue)` のほうがよいと思います。

```java
if (aValue)
  setOn();
else
  setOff();
```

これは、API は呼び出し側にとって使いやすくなるように書かれるべきだ、という例です。したがって、呼び出し側がどこから来ているかを知っているなら、その情報を踏まえて API を設計すべきです。このことは、呼び出し側が両方の形でやって来るなら、場合によっては両方のスタイルを提供してもよい、という議論にもつながります。

同じ論理は `book` にも当てはまります。画面上にチェックボックスがあり、その値をそのまま `book` に渡しているだけなら、Flag Argument にもある程度の正当性があります。この例について、単純な選択だとは言いません。たいていの場合、`book` の Flag Argument は単純な boolean setter よりずっと理解しにくく、したがって明示的なメソッドを用意する価値がある、と私は主張するでしょう。
