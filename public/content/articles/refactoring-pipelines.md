# Refactoring with Loops and Collection Pipelines

## 要約

この記事は、ループで書かれたコレクション処理を、コレクションパイプラインへリファクタリングする過程を、複数の小さな例で示します。`filter`、`map`、`reduce`、`groupBy` などの操作を組み合わせることで、データがどのように選別され、変換され、集約されるかを読み取りやすくします。

単にループをなくすことが目的ではありません。著者が重視しているのは、**処理の意図をコードの形に表す**ことです。途中では、重複検出、ネストしたループ、グループ化、検証ロジックなどを扱い、パイプライン化によって隠れていた概念を名前付きの操作や関数として取り出していきます。

## 読むときの観点

- ループの中で行われている「選別」「変換」「集約」を分けて読む。
- パイプラインの各段階が、ドメイン上の意図を表しているかを見る。
- パフォーマンスより明瞭さを優先してよい場面と、測定に基づいて例外扱いする場面を区別する。
- 副作用をパイプラインに入れるときの読みにくさや遅延評価への影響に注意する。
- パイプライン化だけでなく、Extract Method や Inline Temp などのリファクタリングが読みやすさを支えている点を見る。

## 原文の翻訳

プログラミングでよくある仕事の1つは、オブジェクトのリストを処理することです。多くのプログラマは自然にループを使います。最初に学ぶ基本的な制御構造の1つだからです。しかし、リスト処理を表す方法はループだけではありません。近年では、私が **コレクションパイプライン** と呼ぶ別のやり方を使う人が増えています。このスタイルは関数型プログラミングの一部と見なされることが多いですが、私は Smalltalk でよく使っていました。オブジェクト指向言語がラムダをサポートし、第一級関数を扱いやすくするライブラリを備えるにつれて、コレクションパイプラインは魅力的な選択肢になります。

### 単純なループをパイプラインへリファクタリングする

まず単純なループの例から始め、コレクションパイプラインへ変える基本的な手順を示します。

著者のリストがあり、それぞれが次のようなデータ構造を持つとします。この例では C# を使います。

```csharp
public string Name { get; set; }
public string TwitterHandle { get; set; }
public string Company { get; set; }
```

ループは次のようになります。

```csharp
static public IEnumerable<String> TwitterHandles(IEnumerable<Author> authors, string company) {
  var result = new List<String> ();
  foreach (Author a in authors) {
    if (a.Company == company) {
      var handle = a.TwitterHandle;
      if (handle != null)
        result.Add(handle);
    }
  }
  return result;
}
```

ループをコレクションパイプラインへリファクタリングするとき、私の最初のステップは、ループ対象のコレクションに Extract Variable を適用することです。実際には、その前にループへ Extract Method を適用できないか考えることが多いです。ループを独立した関数にすると、操作しやすくなるからです。

```csharp
static public IEnumerable<String> TwitterHandles(IEnumerable<Author> authors, string company) {
  var result = new List<String> ();
  var loopStart = authors;
  foreach (Author a in loopStart) {
    if (a.Company == company) {
      var handle = a.TwitterHandle;
      if (handle != null)
        result.Add(handle);
    }
  }
  return result;
}
```

この変数が、パイプライン操作の出発点になります。今は良い名前がないので、一時的に意味の通る名前を使い、後で変更するつもりで進めます。

次に、ループの中の振る舞いを見ます。最初に見えるのは条件判定なので、これを `filter` 操作へ移せます。C# では LINQ の名前に合わせて `Where` を使います。

```csharp
static public IEnumerable<String> TwitterHandles(IEnumerable<Author> authors, string company) {
  var result = new List<String> ();
  var loopStart = authors
    .Where(a => a.Company == company);
  foreach (Author a in loopStart) {
    if (a.Company == company) {
      var handle = a.TwitterHandle;
      if (handle != null)
        result.Add(handle);
    }
  }
  return result;
}
```

次の部分は著者そのものではなく Twitter ハンドルを扱っています。そこで `map` 操作を使えます。C# ではこれは `Select` と呼ばれます。私には `map` が `Select` と呼ばれるのは少し奇妙に見えますが、LINQ の主目的がデータベースアクセスの抽象化であり、SQL に似た名前が選ばれたためです。

```csharp
static public IEnumerable<String> TwitterHandles(IEnumerable<Author> authors, string company) {
  var result = new List<String> ();
  var loopStart = authors
    .Where(a => a.Company == company)
    .Select(a => a.TwitterHandle);
  foreach (string handle in loopStart) {
    if (handle != null)
      result.Add(handle);
  }
  return result;
}
```

さらに条件判定があるので、これも `filter` へ移します。

```csharp
static public IEnumerable<String> TwitterHandles(IEnumerable<Author> authors, string company) {
  var result = new List<String> ();
  var loopStart = authors
    .Where(a => a.Company == company)
    .Select(a => a.TwitterHandle)
    .Where(h => h != null);
  foreach (string handle in loopStart) {
    if (handle != null)
      result.Add(handle);
  }
  return result;
}
```

この時点でループがしていることは、ループ対象のコレクション内のすべてを結果コレクションへ追加するだけです。したがってループを取り除き、パイプラインの結果を返せます。

```csharp
static public IEnumerable<String> TwitterHandles(IEnumerable<Author> authors, string company) {
  return authors
    .Where(a => a.Company == company)
    .Select(a => a.TwitterHandle)
    .Where(h => h != null);
}
```

コレクションパイプラインで好きなのは、リストの要素がパイプラインを通っていくときの論理の流れが見えることです。私には、「著者を取り、会社が一致するものを選び、Twitter ハンドルを取り出し、null のハンドルを取り除く」という結果の定義に近く読めます。

このコードの形は、構文や演算子名が違う言語でもなじみやすいものです。たとえば Java、Ruby、Clojure、F# では次のようになります。

```java
public List<String> twitterHandles(List<Author> authors, String company) {
  return authors.stream()
          .filter(a -> a.getCompany().equals(company))
          .map(a -> a.getTwitterHandle())
          .filter(h -> null != h)
          .collect(toList());
}
```

```ruby
def twitter_handles authors, company
  authors
    .select {|a| company == a.company}
    .map    {|a| a.twitter_handle}
    .reject {|h| h.nil?}
end
```

```clojure
(defn twitter-handles [authors company]
  (->> authors
       (filter #(= company (:company %)))
       (map :twitter-handle)
       (remove nil?)))
```

```fsharp
let twitterHandles (authors : seq<Author>, company : string) =
  authors
      |> Seq.filter(fun a -> a.Company = company)
      |> Seq.map(fun a -> a.TwitterHandle)
      |> Seq.choose (fun h -> h)
```

パイプラインで考えることに慣れると、知らない言語でも比較的早く適用できるようになります。基本的な考え方が同じなので、構文や関数名が知らないものでも翻訳しやすいのです。

#### パイプライン内のリファクタリングと内包表記

ある振る舞いがパイプラインとして表現されると、パイプライン内のステップの並び替えによってできるリファクタリングがあります。たとえば `map` の後に `filter` がある場合、多くは `filter` を `map` の前へ移せます。

```csharp
static public IEnumerable<String> TwitterHandles(IEnumerable<Author> authors, string company) {
  return authors
    .Where(a => a.Company == company)
    .Where(a => a.TwitterHandle != null)
    .Select(a => a.TwitterHandle);
}
```

隣り合う2つの filter は、論理積でまとめられます。

```csharp
static public IEnumerable<String> TwitterHandles(IEnumerable<Author> authors, string company) {
  return authors
    .Where(a => a.Company == company && a.TwitterHandle != null)
    .Select(a => a.TwitterHandle);
}
```

C# のコレクションパイプラインが、このように単純な filter と map の形になったら、LINQ 式へ置き換えることもできます。

```csharp
static public IEnumerable<String> TwitterHandles(IEnumerable<Author> authors, string company) {
  return from a in authors
         where a.Company == company && a.TwitterHandle != null
         select a.TwitterHandle;
}
```

私は LINQ 式をリスト内包表記の一種と考えています。リスト内包表記をサポートする言語なら、同じようなことができます。リスト内包表記とパイプライン形式のどちらを好むかは趣味の問題です。私はパイプラインが好みです。一般にはパイプラインのほうが強力で、すべてのパイプラインを内包表記へ変えられるわけではありません。

### ネストしたループ: 本の読者

2つ目の例では、二重にネストした単純なループをリファクタリングします。読者が本を読めるオンラインシステムがあるとします。ある日付に各読者が読んだ本を知らせるデータサービスがあり、このサービスは読者IDをキー、本IDのコレクションを値とするマップを返します。

```java
Map<String, Collection<String>> getBooksReadOn(Date date);
```

この例では Java を使います。先頭が大文字のメソッド名に飽きたからです。

```java
public Set<String> getReadersOfBooks(Collection<String> readers, Collection<String> books, Date date) {
  Set<String> result = new HashSet<>();
  Map<String, Collection<String>> data = dataService.getBooksReadOn(date);
  for (Map.Entry<String, Collection<String>> e : data.entrySet()) {
    for (String bookId : books) {
      if (e.getValue().contains(bookId) && readers.contains(e.getKey())) {
         result.add(e.getKey());
      }
    }
  }
  return result;
}
```

いつもの最初のステップとして、ループ対象に Extract Variable を適用します。Java の型式は長くなりがちなので、IntelliJ の自動リファクタリングが入力を省いてくれることがありがたくなります。

```java
final Set<Map.Entry<String, Collection<String>>> entries = data.entrySet();
for (Map.Entry<String, Collection<String>> e : entries) {
  ...
}
```

ループ内の仕事は条件式の中にあります。まず `readers.contains(e.getKey())` を filter に移します。

```java
final Set<Map.Entry<String, Collection<String>>> entries = data.entrySet().stream()
        .filter(e -> readers.contains(e.getKey()))
        .collect(Collectors.toSet());
```

もう1つの条件は内側のループ変数を参照しているので少し面倒です。マップエントリの値が、引数 `books` のどれかを含んでいるかを調べています。これは集合の積集合で表せます。Java 標準には直接の積集合メソッドがないので、教育用の単純な実装を用意します。

```java
public static <T> Set<T> intersection(Collection<T> a, Collection<T> b) {
  Set<T> result = new HashSet<T>(a);
  result.retainAll(b);
  return result;
}
```

実際のプロジェクトなら Guava や Apache Commons のような一般的なライブラリを使うでしょう。これで条件をパイプラインへ移せます。

```java
return data.entrySet().stream()
        .filter(e -> readers.contains(e.getKey()))
        .filter(e -> !Utils.intersection(e.getValue(), books).isEmpty())
        .map(e -> e.getKey())
        .collect(Collectors.toSet());
```

`intersection` の使い方は少し複雑です。読むたびに何をしているのか考えなければならないので、抽出すべきです。否定の `!` が式の先頭にあり、述語の `isEmpty` が末尾にあるため、間に実質的な式が入ると読みづらくなります。

```java
public static <T> boolean hasIntersection(Collection<T> a, Collection<T> b) {
  return !intersection(a,b).isEmpty();
}
```

```java
public Set<String> getReadersOfBooks(Collection<String> readers, Collection<String> books, Date date) {
  Map<String, Collection<String>> data = dataService.getBooksReadOn(date);
  return data.entrySet().stream()
          .filter(e -> readers.contains(e.getKey()))
          .filter(e -> Utils.hasIntersection(e.getValue(), books))
          .map(e -> e.getKey())
          .collect(Collectors.toSet());
}
```

Java では、静的ユーティリティメソッドと通常のオブジェクトメソッドの間を行き来するのが少しぎこちなくなります。それでも私は、パイプライン版のほうが理解しやすいと感じます。2つの filter は1つの条件式にまとめられますが、私は通常、1つの filter を1つの要素として読むほうが分かりやすいと思います。

### Equipment Offerings

次の例では、特定の地域に対して優先される equipment offering を、単純な基準で印付けします。組織が複数の地域で機器を提供しているとします。ある機器を要求したとき、望んだものがそのまま手に入ることもありますが、多くの場合は代替品が提示されます。たとえばボストンで除雪機が欲しいのに店になければ、雪かきシャベルを提示されるかもしれません。一方、マイアミではそもそも除雪機を提供していないので、得られるのは雪かきシャベルだけです。

データは概ね次のような形になります。

```yaml
products: ['snow-blower', 'snow-shovel']
regions: ['boston', 'miami']
offerings:
  - {region: 'boston', supported: 'snow-blower', supplied: 'snow-blower'}
  - {region: 'boston', supported: 'snow-blower', supplied: 'snow-shovel'}
  - {region: 'miami',  supported: 'snow-blower', supplied: 'snow-shovel'}
```

対象のコードは、これらの offering の一部を preferred として印付けします。つまり、ある地域である機器を支えるために優先される offering です。この例は C# です。

```csharp
var checkedRegions = new HashSet<Region>();
foreach (Offering o1 in equipment.AllOfferings()) {
  Region r = o1.Region;
  if (checkedRegions.Contains(r)) {
    continue;
  }

  Offering possPref = null;
  foreach(var o2 in equipment.AllOfferings(r)) {
    if (o2.isPreferred) {
      possPref = o2;
      break;
    }
    else {
      if (o2.isMatch || possPref == null) {
        possPref = o2;
      }
    }
  }
  possPref.isPreferred = true;
  checkedRegions.Add(r);
}
```

私の疑いは、このループがしていることにはもっと理解しやすい論理があり、リファクタリングによってそれを表面に出せるだろうというものです。

外側のループから始め、初期ループ変数に Extract Variable を適用します。次に `o1` が単に `Region` を得るための踏み台でしかないことに気づき、`Select(o => o.Region)` で map します。`checkedRegions` は同じ地域を複数回処理しないための制御変数です。これは臭いですが、重複を避けるのはパイプラインでは簡単です。

```csharp
var loopStart = equipment.AllOfferings()
  .Select(o => o.Region)
  .Distinct();
```

次の関心は `possPref` です。これは独立したメソッドにしたほうが扱いやすいので、Extract Method を適用します。

```csharp
var loopStart = equipment.AllOfferings()
  .Select(o => o.Region)
  .Distinct();
foreach (Region r in loopStart) {
  var possPref = possiblePreference(equipment, r);
  possPref.isPreferred = true;
}
```

```csharp
static Offering possiblePreference(Equipment equipment, Region region) {
  Offering possPref = null;
  foreach (var o2 in equipment.AllOfferings(region)) {
    if (o2.isPreferred) {
      possPref = o2;
      break;
    }
    else {
      if (o2.isMatch || possPref == null) {
        possPref = o2;
      }
    }
  }
  return possPref;
}
```

このメソッドの先頭の条件は、条件に合う最初の offering を探しています。これは detect 操作、C# では `FirstOrDefault` の仕事です。最後の条件はもう少しややこしく、リストの最初の offering を仮候補にしつつ、`isMatch` に合う offering があればそのたびに上書きします。最後に合ったものを再現するには `LastOrDefault` を使います。

```csharp
static Offering possiblePreference(Equipment equipment, Region region) {
  var allOfferings = equipment.AllOfferings(region);
  return allOfferings.FirstOrDefault(o => o.isPreferred)
    ?? allOfferings.LastOrDefault(o => o.isMatch)
    ?? allOfferings.First();
}
```

`possiblePreference` は、ドメイン上の意味に沿った形で論理を明確に述べるようになりました。コードが何をしているのかを解読しなくても、意図を理解できます。

外側のループに戻ると、`possiblePreference` をパイプラインの中で使えます。

```csharp
var preferredOfferings = equipment.AllOfferings()
  .Select(o => o.Region)
  .Distinct()
  .Select(r => possiblePreference(equipment, r))
  ;
foreach (Offering o in preferredOfferings) {
  o.isPreferred = true;
}
```

望むなら、`ForEach` で副作用もパイプラインへ入れられます。

```csharp
equipment.AllOfferings()
  .Select(o => o.Region)
  .Distinct()
  .Select(r => possiblePreference(equipment, r))
  .ToList()
  .ForEach(o => o.isPreferred = true)
  ;
```

これは議論のあるステップです。パイプライン内で副作用を持つ関数を使うことを嫌う人は多くいます。そのため `ForEach` を使うには中間の `ToList` が必要です。副作用を使うと、パイプの遅延評価も失われます。ただしこの例では、そもそも目的が変更対象のオブジェクトを選ぶことなので大きな問題ではありません。

どちらにせよ、私は元のループよりずっと明確だと感じます。`possiblePreference` の抽出が大きく効いていますし、ループを残したとしてもその抽出だけでかなり読みやすくなります。

### フライト記録のグループ化

次の例では、フライト遅延情報を要約するコードを見ます。元データは、米国運輸省 Bureau of Transportation Statistics の定時運航実績データです。前処理の後、データは次のような形になります。

```json
[
  {
    "origin":"BOS","dest":"LAX","date":"2015-01-12",
    "number":"25","carrier":"AA","delay":0.0,"cancelled":false
  },
  {
    "origin":"BOS","dest":"LAX","date":"2015-01-13",
    "number":"25","carrier":"AA","delay":0.0,"cancelled":false
  }
]
```

この例は JavaScript です。最近は何でも JavaScript で書かなければならないからです。

```javascript
export function airportData() {
  const data = flightData();
  const count = {};
  const cancellations = {};
  const totalDelay = {};
  for (let row of data) {
    const airport = row.dest;
    if (count[airport] === undefined) {
      count[airport] = 0;
      cancellations[airport] = 0;
      totalDelay[airport] = 0;
    }
    count[airport]++;
    if (row.cancelled) {
      cancellations[airport]++;
    }
    else {
      totalDelay[airport] += row.delay;
    }
  }

  const result = {};
  for (let i in count) {
    result[i] = {};
    result[i].meanDelay = totalDelay[i] / (count[i] - cancellations[i]);
    result[i].cancellationRate = cancellations[i] / count[i];
  }
  return result;
}
```

このループは、目的地空港 `dest` ごとにフライトデータを要約し、キャンセル率と平均遅延を計算します。中心となる活動は、フライトデータを目的地でグループ化することです。これはパイプラインの group 操作に向いています。JavaScript の `Array` にはグループ化操作がないので、underscore ライブラリを使います。

```javascript
import _ from 'underscore';

export function airportData() {
  const data = flightData();
  const working = _.groupBy(data, r => r.dest);
  ...
}
```

まず、各目的地のフライト記録数を `mapObject` で計算します。underscore で複数段のパイプラインを作るには `chain` から始め、最後に `value` で実体を取り出します。

```javascript
const working = _.chain(data)
  .groupBy(r => r.dest)
  .mapObject((val, key) => {return {count: val.length}})
  .value()
  ;
```

次にキャンセル数、最後に合計遅延をパイプラインへ移します。合計遅延は、キャンセルされていない行だけを filter し、delay へ map し、それを reduce で合計します。

```javascript
const summarize = function(flights) {
  return {
    numFlights:       flights.length,
    numCancellations: flights.filter(f => f.cancelled).length,
    totalDelay:       flights.filter(f => !f.cancelled).map(f => f.delay).reduce((a,b) => a + b)
  }
}
const formResult = function(airport) {
  return {
    meanDelay:        airport.totalDelay / (airport.numFlights - airport.numCancellations),
    cancellationRate: airport.numCancellations / airport.numFlights
  }
}
return _.chain(data)
  .groupBy(r => r.dest)
  .mapObject(summarize)
  .mapObject(formResult)
  .value()
  ;
```

最終的な関数の読みやすさの多くは、関数を抽出したことから来ています。それでも group 操作は、関数の目的をはっきりさせ、抽出の準備を整えるうえで大きく役立ちます。

このリファクタリングには別の潜在的な利点もあります。データがリレーショナルデータベースから来ており、性能問題がある場合です。ループからコレクションパイプラインへ変えることで、変換が SQL に近い形で表されます。大量のデータをデータベースから引いているなら、グループ化と第1段階の要約を SQL 側へ移すことを検討しやすくなります。私は通常、ロジックを SQL よりアプリケーションコードに置くことを好みますが、測定できる大きな性能改善があるなら性能最適化として扱います。明瞭なコードがあると最適化しやすい、という点もここで補強されます。

### 識別子

次の例では、ある人物が必要な識別子を持っているかを確認するコードを見ます。システムでは、顧客IDのような一意であってほしい識別子で人を識別することがよくあります。多くのドメインでは、複数の識別スキームを扱う必要があり、人物は複数のスキームの識別子を持つべきです。自治体なら、町ID、州ID、国IDを期待するかもしれません。

データ構造は単純です。`Person` クラスは識別子オブジェクトのコレクションを持ちます。識別子は scheme と value を持ち、論理削除済みであることを示す `void?` も持ちます。制約はデータモデルだけでは表せないため、次のような検証関数で確認します。この例は Ruby です。私は Ruby でプログラミングするのが好きだからです。

```ruby
def check_valid_ids required_schemes, note: nil
  note ||= Notification.new
  note.add_error "has no ids"  if @ids.size < 1

  used = []
  found_required = []
  dups = []

  for id in @ids
    next if id.void?
    if used.include?(id.scheme)
      dups << id.scheme
    else
      for req in required_schemes
        if id.scheme == req
          found_required << req
          required_schemes.delete req
          next
        end
      end
    end
    used << id.scheme
  end

  if dups.size > 0
    note.add_error "duplicate schemes: " + dups.join(", ")
  end

  if required_schemes.size > 0
    missing_names = ""
    for req in required_schemes
      missing_names += (missing_names.size > 0) ? ", " + req.to_s : req.to_s
    end
    note.add_error "missing schemes: " + missing_names
  end

  return note
end
```

このルーチンで私にとって最も強い臭いは、ループが2つのことを同時にしていることです。重複した識別子を見つけ、同時に不足している必須スキームも見つけています。同じコレクションに対して2つのことをしなければならないとき、プログラマが1つのループで両方を済ませたくなるのはよくあることです。

理由の1つは、ループをセットアップするコードを2回書きたくないことです。現代的なループ構文やパイプラインは、この負担を減らしてくれます。もう1つ、より有害な理由は性能への懸念です。性能上のホットスポットがループにあることは確かに多く、ループ融合が有効なこともあります。しかし、それは私たちが書くループ全体のごく一部です。したがって通常の原則に従うべきです。**測定された重大な性能問題がない限り、性能より明瞭さを優先する** のです。

2つのことをしているループに出会ったら、私は明瞭さのためにためらわずループを複製します。性能分析の結果、そのリファクタリングを戻すことは非常にまれです。

まず、Split Loop と呼ぶリファクタリングを行います。ループとそれに接続するコードを一貫したブロックにまとめ、Extract Method を適用します。それから、そのメソッドを複製して、重複チェック用と必須スキームチェック用の2つの足場を作ります。両方を呼ぶと通知にエラーが二重に入るので、それぞれの複製から関係ない更新を取り除きます。これによってテストを通しながら進められます。

#### 重複なしチェックのリファクタリング

まず重複なしのケースから始めます。何段階かに分けて不要なコードを切り落とし、そのたびにテストして間違いを防ぎます。`required_schemes` に関係する末尾のコードを取り除き、不要になった分岐も取り除きます。

次にいつもの Extract Variable を行います。

```ruby
input = @ids
for id in input
  next if id.void?
  if used.include?(id.scheme)
    dups << id.scheme
  end
  used << id.scheme
end
```

`void?` な識別子を除く filter を入力に追加し、ループ内の `next` を取り除けます。さらにループは識別子そのものではなく scheme を使っているので、識別子から scheme への map を追加します。

```ruby
input = @ids
  .reject{|id| id.void?}
  .map {|id| id.scheme}
```

この時点でループ本体は、単純な重複検出になっています。重複を見つけるパイプライン上のやり方は、scheme を自分自身でグループ化し、複数回出てくるものだけを選ぶことです。

```ruby
dups = @ids
  .reject{|id| id.void?}
  .map {|id| id.scheme}
  .group_by {|s| s}
  .select {|k,v| v.size > 1}
  .keys
```

良いパイプラインになりましたが、気になる点があります。最後の3ステップが重複を取り除くためのものだという知識は、コードではなく私の頭の中にあります。そこで Extract Method を使い、概念をコードに移します。

```ruby
def check_no_duplicate_ids required_schemes, note: nil
  dups = @ids
    .reject{|id| id.void?}
    .map {|id| id.scheme}
    .duplicates

  note.add_error "duplicate schemes: " + dups.join(", ") if dups.size > 0
  return note
end
```

```ruby
class Array
  def duplicates
    self
      .group_by {|s| s}
      .select {|k,v| v.size > 1}
      .keys
  end
end
```

ここでは Ruby の既存クラスにメソッドを追加する能力、いわゆる monkey-patching を使っています。最近の Ruby なら refinement も使えます。しかし多くのオブジェクト指向言語は monkey-patching をサポートしません。その場合はローカル関数を使うことになります。配列にメソッドを置くほうがパイプラインにはよくなじみますが、常に可能とは限りません。これは、メソッドをオブジェクトに結びつけない関数型のやり方のほうがうまく働く場面です。

このようなローカル変数があるとき、私はいつも Replace Temp with Query を考えます。`duplicate_identity_schemes` のような問い合わせメソッドがほかの `Person` メソッドにも役立ちそうなら抽出します。ただしこのケースでは、ローカル変数のままにしておくほうを選びます。

#### 必須スキームのチェックをリファクタリングする

重複なしチェックをきれいにしたので、次は必須スキームがそろっていることのチェックです。先ほどと同じく、重複チェックに関係するものを取り除くところから始めます。

この関数の中心に入るため、まず `found_required` 変数を見ます。重複チェックのときと同様、主に関心があるのは void ではない識別子の scheme です。そこで、scheme を変数に取り出します。

```ruby
schemes = @ids
  .reject{|i| i.void?}
  .map {|i| i.scheme}
```

`found_required` の目的は、`required_schemes` のリストにも、私たちの識別子の scheme にも含まれるものを集めることのように見えます。つまり集合の積集合です。しかしその変更はテストを失敗させました。よく見ると、`found_required` は後続コードでまったく使われていません。昔は使われていたものの、用途がなくなったまま残ったゾンビ変数だったのです。そこで変更を戻し、その変数を取り除きます。

次に、ループがパラメータ `required_schemes` から要素を削除していることに気づきます。収集用パラメータでない限り、パラメータを変更するのは私にとって厳禁です。そこで Remove Assignments to Parameters を適用し、`missing_schemes` を作ります。

```ruby
missing_schemes = required_schemes.dup
schemes = @ids
  .reject{|i| i.void?}
  .map {|i| i.scheme}
```

これにより、ループが列挙中のリストから要素を削除していたことも明らかになりました。これはパラメータ変更よりさらに悪いことです。

ここまで整理されると、必要なのは積集合ではなく、必須リストから持っている scheme を取り除く集合差だと分かります。

```ruby
schemes = @ids
  .reject{|i| i.void?}
  .map {|i| i.scheme}
missing_schemes = required_schemes - schemes
```

次にエラーメッセージを作る2つ目のループを見ます。これは scheme を文字列に変換してカンマで連結しているだけなので、`join` の仕事です。

```ruby
if missing_schemes.size > 0
  missing_names = missing_schemes.join(", ")
  note.add_error "missing schemes: " + missing_names
end
```

#### 2つのメソッドを統合する

両方のメソッドはきれいになり、1つのことだけをするようになりました。どちらも void ではない識別子の scheme リストを必要とするので、Extract Method を使いたくなります。

```ruby
def identity_schemes
  @ids
    .reject{|i| i.void?}
    .map {|i| i.scheme}
end
```

それから小さな整理をいくつか行います。コレクションが空かどうかを `size` で調べるより、意図が明らかな `empty?` を使います。`missing_names` 変数は十分な仕事をしていないので Inline Temp します。Ruby の1行条件式にも変えます。

最終的には、個別メソッドの価値が小さくなったので、それらと抽出した `identity_schemes` を呼び出し元へインライン化します。

```ruby
def check_valid_ids required_schemes, note: nil
  note ||= Notification.new
  note.add_error "has no ids"  if @ids.size < 1
  identity_schemes = @ids.reject{|i| i.void?}.map {|i| i.scheme}
  dups = identity_schemes.duplicates
  note.add_error("duplicate schemes: " + dups.join(", ")) unless dups.empty?
  missing_schemes = required_schemes - identity_schemes
  note.add_error "missing schemes: " + missing_schemes.join(", ") unless missing_schemes.empty?
  return note
end
```

最終メソッドは私の好みからすると少し長めですが、まとまりは気に入っています。もっと大きくなるなら Replace Method with Method Object を使って分けたくなるでしょう。それでも、検証がどのエラーをチェックしているかを伝える点では、かなり明確になりました。

### 最後に

これで一連のリファクタリング例は終わりです。コレクションパイプラインが、コレクションを操作するコードの論理をどのように明確にできるか、そしてループをコレクションパイプラインへ変えることがしばしばかなり素直にできることが伝わっていればと思います。

どんなリファクタリングにも逆方向のリファクタリングがあるように、コレクションパイプラインをループへ戻すこともできます。ただ、私はほとんどそれをしません。

現在の多くの言語は第一級関数を備え、コレクションパイプラインに必要な操作を含むコレクションライブラリを持っています。もしコレクションパイプラインに慣れていないなら、出会ったループをこのようにリファクタリングしてみるのは良い練習です。最終的なパイプラインが元のループより明確でなければ、終わったあとで戻せます。たとえ戻すとしても、その練習からこの技法について多くを学べます。私はこのプログラミングパターンを長い間使ってきて、自分のコードを読む助けとして価値があると感じています。だから、自分のチームも同じ結論に至るかどうか探ってみる価値があります。

### 脚注と謝辞

最初の一手として、ループそのものに Extract Method を考えることも多くあります。C# の `Select` という名前は LINQ の SQL 由来の名前付けから来ています。隣り合う filter を結合するとき、場合によっては短絡評価が必要です。否定を含む真偽値式は、述語と否定が離れるため読みづらくなることがあります。条件を満たす最後の要素を検出する操作がない言語では、先に反転してから最初の要素を検出できます。

F# の例をより自然にするのを Kit Eason が助けてくれました。Les Ramer は C# を改善し、Richard Warburton は Java の曖昧な表現を修正し、Daniel Sandbecker は Ruby 例の誤りを見つけてくれました。Thoughtworks のメーリングリストでは Andrew Kiellor、Bruno Trecenti、David Johnston、Duncan Cragg、Karel Alfonso、Korny Sietsma、Matteo Vaccari、Pete Hodgson、Piyush Srivastava、Scott Robinson、Steven Lowe、Vijay Aravamudhan が草稿について議論してくれました。
