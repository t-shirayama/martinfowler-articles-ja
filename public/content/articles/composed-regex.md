# Composed Regex

## 要約

Composed Regex は、長い正規表現を意味のある小さな部品に分け、最後に組み立てることで読みやすくする考え方です。

この記事では、メソッドを小さく分けて名前を付ける Composed Method と同じ発想を、正規表現にも適用できると説明しています。コメント付きの正規表現や named capture group も助けにはなりますが、構造そのものを分解して名前を付けることで、正規表現を「解読するもの」ではなく「読むもの」に近づけられる、という点が中心です。

## 読むときの観点

- 正規表現の難しさを、構文そのものだけでなく、構造が見えないこととして捉える。
- コメントを足すより、名前と分割で意図を表現できないかを見る。
- 小さな regex 断片をどう組み合わせると、全体の流れが読みやすくなるかに注目する。
- 共通部品化しすぎると、かえって全体構造が見えにくくなる可能性も考える。

## 原文の翻訳

保守しやすいコードを書くための強力な道具のひとつは、大きなメソッドを、よく名付けられた小さなメソッドに分けることです。Kent Beck はこの技法を Composed Method パターンと呼んでいます。

> プログラムを詳細に理解し、その詳細をより高いレベルの構造へまとめられるなら、人はプログラムをずっと速く、正確に読める。
>
> -- Kent Beck

メソッドに有効なことは、他のものにも有効であることがよくあります。私が何度か見かけた、これがうまく使われていない領域のひとつが regular expression です。

あるホテルチェーンの frequent sleeper points を計算するルールが詰まったファイルがあるとしましょう。ルールはどれも、おおむね次のような形をしています。

```text
score 400 for 2 nights at Minas Tirith Airport
```

これらの各行から、points、つまり 400、宿泊数、つまり 2、そしてホテル名、つまり Minas Tirith Airport を取り出す必要があります。

これは明らかに regex 向きの作業です。きっと今あなたは、そうだ、必要なのはこういうものだ、と思っているでしょう。

```csharp
const string pattern =
  @"^score\s+(\d+)\s+for\s+(\d+)\s+nights?\s+at\s+(.*)";
```

すると、3つの値は group から取り出せます。

この regex がどう動くのか、正しいのかを理解することに、あなたがどれくらい慣れているかはわかりません。私のような人なら、このような regex を見て、それが何を言っているのかを注意深く読み解く必要があります。group がどこに対応しているのかを見るために、括弧を数えていることもよくあります。この例では実際にはそれほど難しくありませんが、もっと手強いものもたくさん見てきました。

このような pattern にはコメントを付けるとよい、という助言を読んだことがあるかもしれません。regex に変換するときには、多くの場合 switch が必要になります。そうすれば、次のように書けます。

```csharp
protected override string GetPattern() {
  const string pattern =
    @"^score
    \s+
    (\d+)          # points
    \s+
    for
    \s+
    (\d+)          # number of nights
    \s+
    night
    s?             # optional plural
    \s+
    at
    \s+
    (.*)           # hotel name
    ";

  return pattern;
}
```

これは追いやすくなりますが、コメントにはどうしても満足しきれません。私はときどき、コメントは悪いものだ、コメントを使うべきではない、と言っていると非難されることがあります。それは、どちらの意味でも間違っています。コメントは悪いものではありません。しかし、もっとよい選択肢があることはよくあります。私はいつも、**よい命名と構造**によって、コメントを必要としないコードを書こうとしています。いつも成功するわけではありませんが、たいていはうまくいっていると感じています。

人は regex を構造化しようとしないことが多いのですが、私はそれが役に立つと感じています。これを行う方法のひとつは次のようなものです。

```csharp
const string scoreKeyword = @"^score\s+";
const string numberOfPoints = @"(\d+)";
const string forKeyword = @"\s+for\s+";
const string numberOfNights = @"(\d+)";
const string nightsAtKeyword = @"\s+nights?\s+at\s+";
const string hotelName = @"(.*)";

const string pattern =  scoreKeyword + numberOfPoints +
  forKeyword + numberOfNights + nightsAtKeyword + hotelName;
```

私は pattern を**論理的なまとまり**に分け、最後にもう一度つなぎ合わせました。これで最後の式を見れば、式を構成する基本的なまとまりを理解できます。詳細を見たいときには、それぞれの regex を掘り下げればよいのです。

もうひとつの代案として、空白を分離し、実際の regex がより token のように見えるようにする方法があります。

```csharp
const string space = @"\s+";
const string start = "^";
const string numberOfPoints = @"(\d+)";
const string numberOfNights = @"(\d+)";
const string nightsAtKeyword = @"nights?\s+at";
const string hotelName = @"(.*)";

const string pattern =  start + "score" + space + numberOfPoints + space +
  "for" + space + numberOfNights + space + nightsAtKeyword +
   space + hotelName;
```

これは個々の token を少し明確にしてくれると思います。しかし、あちこちにある `space` 変数のせいで、全体構造は追いにくくなります。そのため、私は前の方法のほうを好みます。

とはいえ、これはひとつの疑問を浮かび上がらせます。すべての要素は空白で区切られています。たくさんの `space` 変数を入れたり、pattern の中に `\s+` を繰り返し入れたりするのは、DRY ではなく wet に感じられます。regex を sub-string に分けることのよい点は、ここからプログラミングのロジックを使って、自分の目的に合った抽象を作れることです。sub-string を受け取り、それらを空白で結合するメソッドを書けます。

```csharp
private String composePattern(params String[] arg) {
  return "^" + String.Join(@"\s+", arg);
}
```

このメソッドを使うと、次のようになります。

```csharp
const string numberOfPoints = @"(\d+)";
const string numberOfNights = @"(\d+)";
const string hotelName = @"(.*)";

const string pattern =  composePattern("score", numberOfPoints,
  "for", numberOfNights, "nights?", "at", hotelName);
```

あなたがこれらの代案をそのまま使うことはないかもしれません。それでも、regular expression をどうすればより明確にできるかを考えてほしいと思います。**コードは読み解かなければならないものではなく、そのまま読めるものであるべきです。**
