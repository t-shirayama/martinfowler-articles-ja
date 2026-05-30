# Range

## 要約

`Range` は、開始値と終了値の組ではなく、範囲そのものをひとつの値オブジェクトとして扱うための分析パターンです。
範囲内に値が含まれるか、範囲同士が重なるか、隣り合うか、別の範囲を分割しているかといった操作を、呼び出し側に散らさずに表現できます。

この記事では、数値や日付など比較可能な値に対して `Range` を使う方法、開いた範囲や連続値の扱い、そして Java の日付範囲を例にした基本実装を説明しています。

## 読むときの観点

- 開始値と終了値のペアを、そのまま渡し回すことによる重複や漏れを見る。
- 範囲の包含、重なり、隣接、分割をドメイン操作として表す利点を押さえる。
- 離散値と連続値では、境界を含むかどうかの表現が変わることを意識する。
- open-ended range を生成メソッドで隠す設計を見る。

## 原文の翻訳

値がある範囲に入っているかを調べる比較は、かなりよく見かけます。
範囲はたいてい二つの値の組として扱われ、その両方と比較します。
`Range` は代わりに、**範囲全体をひとつのオブジェクトで表す**ことで、その範囲に値が含まれるかを調べたり、範囲同士を比較したりする操作を提供します。

## 仕組み

基本となるクラスはとても単純です。
範囲の開始と終了を表す二つのフィールドを持つクラスを用意します。
さらに、渡された値がその範囲に入っているかを調べる `includes` メソッドを提供します。

`Range` は、比較操作をサポートするどんな型にも使えます。
つまり `<`、`>`、`=`、`<=`、`>=` に相当する関係を持つ型です。
言語や型によって、これらの演算子そのものが使える場合もあれば、同等のメソッドになる場合もあります。
必要なのは、値を順位づけるための標準的な並び順です。

図1: パラメータ化された型記法で UML 上に範囲を示す。

言語がサポートしているなら、`Range` はパラメータ化されたクラスに自然に向いています。
UML では `Range<number>` や `Range<date>` のような型で、異なる種類の範囲を示せます。
これは実際には「数値の範囲」や「日付の範囲」というモデリング上の省略表現です。
そのため、私を含め多くの人は奇妙な名前を避け、`Number Range` や `Date Range` のような言葉を使うほうを好みます。

より洗練された `Range` では、並び順の基準を設定できます。
一般には、範囲に使う型のインスタンスを順位づけできる任意の関数でかまいません。
この並び順の基準は、本質的には関数、または関数を包むオブジェクトです。

「6より大きい」のような、終端のない範囲もおそらく必要になります。
これにはいくつかの扱い方があります。
ひとつは、`null` を無制限という意味で扱う方法です。
範囲チェックのコードは少し複雑になりますが、その複雑さはほぼ利用者から隠せます。
もうひとつは、極端な値、たとえば正の無限大を `Special Case` として作る方法です。
どちらを選んでも、`Range.greaterThan(6)` のような生成メソッドを用意すれば、クラスの利用者からは隠せます。

範囲の対象となる型が、整数や日付のような離散値ではなく、実数のような連続値である場合、上限や下限を範囲に含めるかどうかを示す別の情報が必要になります。
整数で「6より大きい」範囲を作るなら、下限を7にすればよいでしょう。
しかし実数で `6.0000000000001` を下限にしたくはありません。
その代わりに、境界を含むかどうかを示すブール値をいくつか使います。

値が範囲に入っているかを調べる操作だけでなく、範囲同士を比較する操作も含められます。
一方の範囲が別の範囲と重なるか、隣接するか、別の範囲を含むかを判定する操作です。
こうした操作は、ある範囲の集合が別の範囲のすべての値を含んでいるかを確認するときなどにとても役立ちます。

`Range` クラスは、言語がそれを使うなら、明らかにパラメータ化されたクラスに向いています。
そうでない場合は、抽象クラスを土台に作るか、特定用途ごとのサブタイプを作るかになります。
ただし、上限値や下限値を別の目的で取り出すことが多いなら、ダウンキャストのつらさが大きくなるため、具体的な範囲クラスにしたほうがよいでしょう。

範囲について考えるとき、最も一般的なのは開始と終了を持つ形です。
しかし、開始と長さ、あるいは終了と長さを持つ形も同じくらい役に立ちます。
開始、終了、長さの三つをすべて持ち、その間に明白な制約を置くこともできます。

## 使いどころ

`Range` は、私がいつも使っているパターンです。
適切な範囲クラスを書くのは簡単ですし、一度作ってしまえば、値のペアを使うより範囲を使うほうが楽になります。
モデリングでも、値のペアより `Range` を使うほうが明示的で、しかも同じくらい直感的です。

## 例: 日付範囲（Java）

例として日付範囲を使います。
これはよく必要になる範囲であり、連続範囲の余分な複雑さをうまく避けられます。
Java 標準の日付ではなく、日付精度だけを持つ私自身の date クラスを使っています。

基本的なコンストラクタとアクセサはとても単純です。

```java
class DateRange...
  public DateRange (Date start, Date end) {
    this (new MfDate(start), new MfDate(end));
  }

  public DateRange (MfDate start, MfDate end) {
    this.start = start;
    this.end = end;
  }
```

```java
class DateRange...
  public MfDate end(){
    return end;
  }

  public MfDate start() {
    return start;
  }

  public String toString() {
    if (isEmpty()) return "Empty Date Range";
    return start.toString() + " - " + end.toString();
  }

  public boolean isEmpty() {
    return start.after(end);
  }
```

どの `Range` の利用でも、提供すべき中心的なメソッドは `includes` です。

```java
class DateRange...
  public boolean includes (MfDate arg) {
    return !arg.before(start) && !arg.after(end);
  }
```

私は、終端のない範囲や空の範囲のために追加のコンストラクタを用意するのが好きです。

```java
class DateRange...
  public static DateRange upTo(MfDate end) {
    return new DateRange(MfDate.PAST, end);
  }

  public static DateRange startingOn(MfDate start) {
    return new DateRange(start, MfDate.FUTURE);
  }

  public static DateRange EMPTY =
      new DateRange(new MfDate(2000,4,1), new MfDate(2000,1,1));
```

範囲同士を比較する操作を提供すると便利です。

```java
class DateRange...
  public boolean equals (Object arg) {
    if (! (arg instanceof DateRange)) return false;
    DateRange other = (DateRange) arg;
    return start.equals(other.start) && end.equals(other.end);
  }

  public int hashCode() {
    return start.hashCode();
  }

  public boolean overlaps(DateRange arg) {
    return arg.includes(start) || arg.includes(end) || this.includes(arg);
  }

  public boolean includes(DateRange arg) {
    return this.includes(arg.start) && this.includes(arg.end);
  }
```

たいていのアプリケーションでは、これで十分です。
しかし状況によっては、ほかにも役立つ振る舞いがあります。
そのひとつは、二つの範囲の間にどんな隙間があるかを調べることです。

```java
class DateRange...
  public DateRange gap(DateRange arg){
    if (this.overlaps(arg)) return DateRange.EMPTY;
    DateRange lower, higher;
    if (this.compareTo(arg) < 0) {
      lower = this;
      higher = arg;
    }
    else {
      lower = arg;
      higher = this;
    }
    return new DateRange(lower.end.addDays(1), higher.start.addDays(-1));
  }

  public int compareTo(Object arg) {
    DateRange other = (DateRange) arg;
    if (!start.equals(other.start)) return start.compareTo(other.start);
    return end.compareTo(other.end);
  }
```

もうひとつは、二つの日付範囲が隣り合っているかを検出することです。

```java
class DateRange...
  public boolean abuts(DateRange arg) {
    return !this.overlaps(arg) && this.gap(arg).isEmpty();
  }
```

さらに、範囲の集合が別の範囲を完全に分割しているかを見ることもできます。

```java
class DateRange...
  public boolean partitionedBy(DateRange[] args) {
    if (!isContiguous(args)) return false;
    return this.equals(DateRange.combination(args));
  }

  public static DateRange combination(DateRange[] args) {
    Arrays.sort(args);
    if (!isContiguous(args)) {
      throw new IllegalArgumentException("Unable to combine date ranges");
    }
    return new DateRange(args[0].start, args[args.length -1].end);
  }

  public static boolean isContiguous(DateRange[] args) {
    Arrays.sort(args);
    for (int i=0; i<args.length - 1; i++) {
      if (!args[i].abuts(args[i+1])) return false;
    }
    return true;
  }
```
