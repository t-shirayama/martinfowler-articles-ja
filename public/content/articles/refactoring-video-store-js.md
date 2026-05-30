# Refactoring a JavaScript video store

## 要約

この記事は、『Refactoring』初版の冒頭に置かれたビデオレンタル店の例題を、現代のJavaScriptでどうリファクタリングできるかを検討するものです。

最初の関数は、レンタル明細の計算とテキスト出力をひとつの長い関数にまとめています。そこから関数抽出を行い、さらにHTML出力を追加しやすくするために、4つの設計方向を比較します。トップレベル関数へ移す方法、出力形式をパラメータで切り替える方法、クラスへ計算ロジックを移す方法、そして中間データ構造へ変換する方法です。

## 読むときの観点

- リファクタリングは、最終形だけでなく、そこへ進む小さな手順に価値がある。
- 計算ロジックと表示ロジックを分けると、出力形式を増やしやすくなる。
- JavaScriptでは、クラス、関数、データ変換など複数のスタイルが自然に選べる。
- どの形を選ぶかは、共通の文脈をどこに置くか、関心をどう分けるかによって変わる。

## 原文の翻訳

この記事でリファクタリング本に言及するときは、初版のことを指している。この記事は、私が第2版の作業を始める前に書いたものだからだ。

何年も前、リファクタリング本を書いていたとき、私はビデオを借りる顧客の請求額を計算する、非常に単純なコードのリファクタリング例で本を始めた。当時は、そうするには店へ行かなければならなかった。最近そのリファクタリング例について考えていた。特に、それが現代のJavaScriptで書かれていたらどう見えるだろうか、という点である。

どんなリファクタリングも、ある特定の方向へコードを改善することだ。その方向は、開発チームのコーディングスタイルに合っている必要がある。本の例はJavaで書かれていたし、Java、とりわけ当時のJavaは、ある種のコーディングスタイル、つまりオブジェクト指向のスタイルを強く示唆していた。ところがJavaScriptでは、どのようなスタイルを目指すかについて、ずっと多くの選択肢がある。ES6、つまりECMAScript 2015を使えばJava風のオブジェクト指向スタイルを書くこともできるが、すべてのJavaScript論者がそのスタイルを好むわけではない。クラスを使うことを悪いものだと考える人も多い。

### 最初のビデオ店コード

さらに考えるために、まずコードを紹介する必要がある。これは、私が世紀の変わり目に書いた元の例をJavaScriptにしたものだ。

```javascript
function statement(customer, movies) {
  let totalAmount = 0;
  let frequentRenterPoints = 0;
  let result = `Rental Record for ${customer.name}\n`;
  for (let r of customer.rentals) {
    let movie = movies[r.movieID];
    let thisAmount = 0;

    // determine amount for each movie
    switch (movie.code) {
      case "regular":
        thisAmount = 2;
        if (r.days > 2) {
          thisAmount += (r.days - 2) * 1.5;
        }
        break;
      case "new":
        thisAmount = r.days * 3;
        break;
      case "childrens":
        thisAmount = 1.5;
        if (r.days > 3) {
          thisAmount += (r.days - 3) * 1.5;
        }
        break;
    }

    //add frequent renter points
    frequentRenterPoints++;
    // add bonus for a two day new release rental
    if(movie.code === "new" && r.days > 2) frequentRenterPoints++;

    //print figures for this rental
    result += `\t${movie.title}\t${thisAmount}\n` ;
    totalAmount += thisAmount;
  }
  // add footer lines
  result += `Amount owed is ${totalAmount}\n`;
  result += `You earned ${frequentRenterPoints} frequent renter points\n`;

  return result;
}
```

ここではES6を使っている。このコードは2つのデータ構造を扱う。どちらもJSONレコードのリストにすぎない。顧客レコードは次のような形である。

```json
{
  "name": "martin",
  "rentals": [
    {"movieID": "F001", "days": 3},
    {"movieID": "F002", "days": 1}
  ]
}
```

映画の構造は次のようになる。

```javascript
{
  "F001": {"title": "Ran",                     "code": "regular"},
  "F002": {"title": "Trois Couleurs: Bleu",    "code": "regular"}
  // etc
}
```

元の本では、映画はJavaのオブジェクト構造の中のオブジェクトとして存在していた。このエッセイでは、JSON構造をパラメータとして渡すほうを好む。Repositoryのような何らかのグローバルな参照機構を使うのは、このアプリケーションには適切でないと仮定する。

`statement`メソッドは、レンタル明細の単純なテキスト出力を表示する。

```text
Rental Record for martin
  Ran 3.5
  Trois Couleurs: Bleu 2
Amount owed is 5.5
You earned 2 frequent renter points
```

この出力は、例題コードの基準で見ても粗い。数字をもう少しまともに整形する気にもならなかったのか、と言われるかもしれない。ただし、本が書かれたのはJava 1.1の時代であり、`String.format`が言語に追加される前だったことを思い出してほしい。そのことは、私の怠慢を少しは許してくれるかもしれない。

`statement`関数は、Long Methodという臭いの例である。大きさだけでも疑うには十分だ。しかし、コードの臭いが悪いというだけでは、それ自体はリファクタリングを行う十分な理由にはならない。まずい分解のコードが問題になるのは、理解しにくいからだ。理解しにくいコードは、新機能を追加するにせよデバッグするにせよ、変更しにくい。だから、あるコードを読んで理解する必要がないなら、その悪い構造はあなたに害を与えず、しばらく放っておいてもかまわない。

このコード片に関心を持つきっかけを作るには、変更する理由が必要である。本で使った理由は、`statement`メソッドのHTML版を書くことだった。たとえば、次のようなものを出力したい。

```html
<h1>Rental Record for <em>martin</em></h1>
<table>
  <tr><td>Ran</td><td>3.5</td></tr>
  <tr><td>Trois Couleurs: Bleu</td><td>2</td></tr>
</table>
<p>Amount owed is <em>5.5</em></p>
<p>You earned <em>2</em> frequent renter points</p>
```

先に述べたように、このエッセイでは、このコードをリファクタリングして追加の出力レンダリングを加えやすくする方法をいくつか探る。どの方法も、出発点は同じである。単一のメソッドを分解し、ロジックの異なる部分を捉える関数群に分けることだ。この分解を終えたら、それらの関数をどのように配置すれば別のレンダリングを支えられるか、4つの方法を探っていく。

### いくつかの関数へ分解する

このように長すぎる関数を扱うとき、私が最初に考えるのは、論理的なコードのまとまりを探し、Extract Methodを使って独立した関数にすることだ。リファクタリングカタログが書かれた当時はオブジェクト指向の語彙が一般的だったので、私は関数、サブルーチン、手続き、あるいは類似のものを指して「method」という語を使った。JavaScriptでは「function」を使うほうが自然だろうが、ここでは本のリファクタリング名を使っている。最初に目に入るまとまりは`switch`文である。

私のIDEであるIntelliJは、このリファクタリングを自動的に行うことを提案してくれる。しかし正しくは行ってくれない。JavaScriptの能力は、Javaのリファクタリングほど堅牢でも成熟してもいないからだ。そこで私は手作業で行う。候補となる抽出部分が使っているデータを見ることになる。そこには3つのデータがある。

- `thisAmount`は、抽出されるコードによって計算される値である。これは関数内で初期化し、最後に返せばよい。
- `r`は、ループ内で調べているレンタルである。これはパラメータとして渡せる。
- `movie`は、そのレンタルに対応する映画であり、直前に作られた一時変数である。このような一時変数は、手続き的なコードをリファクタリングするとき、たいてい邪魔になる。だから私はまずReplace Temp with Queryを使い、抽出したコードのどこからでも呼べる関数へ変えることを好む。

Replace Temp with Queryを行うと、コードは次のようになる。

```javascript
function statement(customer, movies) {
  let totalAmount = 0;
  let frequentRenterPoints = 0;
  let result = `Rental Record for ${customer.name}\n`;
  for (let r of customer.rentals) {
    let thisAmount = 0;
    switch (movieFor(r).code) {
      case "regular":
        thisAmount = 2;
        if (r.days > 2) thisAmount += (r.days - 2) * 1.5;
        break;
      case "new":
        thisAmount = r.days * 3;
        break;
      case "childrens":
        thisAmount = 1.5;
        if (r.days > 3) thisAmount += (r.days - 3) * 1.5;
        break;
    }
    frequentRenterPoints++;
    if(movieFor(r).code === "new" && r.days > 2) frequentRenterPoints++;
    result += `\t${movieFor(r).title}\t${thisAmount}\n` ;
    totalAmount += thisAmount;
  }
  result += `Amount owed is ${totalAmount}\n`;
  result += `You earned ${frequentRenterPoints} frequent renter points\n`;
  return result;

  function movieFor(rental) { return movies[rental.movieID]; }
}
```

次に`switch`文を抽出する。

```javascript
function statement(customer, movies) {
  let totalAmount = 0;
  let frequentRenterPoints = 0;
  let result = `Rental Record for ${customer.name}\n`;

  for (let r of customer.rentals) {
    const thisAmount = amountFor(r);
    frequentRenterPoints++;
    if(movieFor(r).code === "new" && r.days > 2) frequentRenterPoints++;
    result += `\t${movieFor(r).title}\t${thisAmount}\n` ;
    totalAmount += thisAmount;
  }
  result += `Amount owed is ${totalAmount}\n`;
  result += `You earned ${frequentRenterPoints} frequent renter points\n`;
  return result;

  function movieFor(rental) { return movies[rental.movieID]; }

  function amountFor(r) {
    let thisAmount = 0;
    switch (movieFor(r).code) {
      case "regular":
        thisAmount = 2;
        if (r.days > 2) thisAmount += (r.days - 2) * 1.5;
        break;
      case "new":
        thisAmount = r.days * 3;
        break;
      case "childrens":
        thisAmount = 1.5;
        if (r.days > 3) thisAmount += (r.days - 3) * 1.5;
        break;
    }
    return thisAmount;
  }
}
```

次に、常連客ポイントの計算へ目を向ける。同じように、そのコードを抽出できる。しかし抽出された関数が親スコープの変数を更新する形になるのは好きではない。そのような副作用はコードを推論しにくくする。そこで、関数本体に副作用がないように変える。

```javascript
function frequentRenterPointsFor(rental) {
  return (movieFor(rental).code === "new" && rental.days > 2) ? 2 : 1;
}
```

理解しているうちに、抽出した2つの関数を少しきれいにしておく。

```javascript
function amountFor(rental) {
  let result = 0;
  switch (movieFor(rental).code) {
    case "regular":
      result = 2;
      if (rental.days > 2) result += (rental.days - 2) * 1.5;
      return result;
    case "new":
      result = rental.days * 3;
      return result;
    case "childrens":
      result = 1.5;
      if (rental.days > 3) result += (rental.days - 3) * 1.5;
      return result;
  }
  return result;
}

function frequentRenterPointsFor(rental) {
  return (movieFor(rental).code === "new" && rental.days > 2) ? 2 : 1;
}
```

これらの関数、特に`amountFor`については、さらにできることがある。本では実際にそうした。しかしこのエッセイでは、これらの関数本体についてはこれ以上調べない。

それが終わったので、関数本体へ戻る。私がよく使う一般的な戦術は、可変変数を取り除くことだ。ここには3つある。ひとつは最終的な文字列を集めており、残り2つはその文字列で使われる値を計算している。最初のものは構わないが、残り2つはなくしたい。これを始めるには、ループを分割する必要がある。まずループを単純化し、`const`をインライン化する。

```javascript
function statement(customer, movies) {
  let totalAmount = 0;
  let frequentRenterPoints = 0;
  let result = `Rental Record for ${customer.name}\n`;
  for (let r of customer.rentals) {
    frequentRenterPoints += frequentRenterPointsFor(r);
    result += `\t${movieFor(r).title}\t${amountFor(r)}\n` ;
    totalAmount += amountFor(r);
  }
  result += `Amount owed is ${totalAmount}\n`;
  result += `You earned ${frequentRenterPoints} frequent renter points\n`;
  return result;
}
```

次に、ループを3つの部分へ分ける。

```javascript
function statement(customer, movies) {
  let totalAmount = 0;
  let frequentRenterPoints = 0;
  let result = `Rental Record for ${customer.name}\n`;
  for (let r of customer.rentals) {
    frequentRenterPoints += frequentRenterPointsFor(r);
  }
  for (let r of customer.rentals) {
    result += `\t${movieFor(r).title}\t${amountFor(r)}\n`;
  }
  for (let r of customer.rentals) {
    totalAmount += amountFor(r);
  }
  result += `Amount owed is ${totalAmount}\n`;
  result += `You earned ${frequentRenterPoints} frequent renter points\n`;
  return result;
}
```

このようなリファクタリングの性能上の影響を心配するプログラマもいる。その場合は、ソフトウェア性能についての古いが今でも適切な記事を見るとよい。

この分割によって、計算を関数として抽出できるようになる。私はcollection pipelineが好きなので、ループもそれを使う形へ調整する。

```javascript
function totalFrequentRenterPoints() {
  return customer.rentals
    .map((r) => frequentRenterPointsFor(r))
    .reduce((a, b) => a + b, 0)
    ;
}
function totalAmount() {
  return customer.rentals
    .reduce((total, r) => total + amountFor(r), 0);
}
```

この2つのpipelineスタイルのどちらがより好みかは、自分でもよくわからない。

### 組み立てられた関数を見る

さて、現在地を見てみよう。コード全体は次のようになる。

```javascript
function statement(customer, movies) {
  let result = `Rental Record for ${customer.name}\n`;
  for (let r of customer.rentals) {
    result += `\t${movieFor(r).title}\t${amountFor(r)}\n`;
  }
  result += `Amount owed is ${totalAmount()}\n`;
  result += `You earned ${totalFrequentRenterPoints()} frequent renter points\n`;
  return result;

  function totalFrequentRenterPoints() {
    return customer.rentals
      .map((r) => frequentRenterPointsFor(r))
      .reduce((a, b) => a + b, 0)
      ;
  }
  function totalAmount() {
    return customer.rentals
      .reduce((total, r) => total + amountFor(r), 0);
  }
  function movieFor(rental) {
    return movies[rental.movieID];
  }
  function amountFor(rental) {
    let result = 0;
    switch (movieFor(rental).code) {
      case "regular":
        result = 2;
        if (rental.days > 2) result += (rental.days - 2) * 1.5;
        return result;
      case "new":
        result = rental.days * 3;
        return result;
      case "childrens":
        result = 1.5;
        if (rental.days > 3) result += (rental.days - 3) * 1.5;
        return result;
    }
    return result;
  }
  function frequentRenterPointsFor(rental) {
    return (movieFor(rental).code === "new" && rental.days > 2) ? 2 : 1;
  }
}
```

これで、かなりうまく組み立てられた関数になった。関数の中核コードは7行で、すべて出力文字列の整形に関わっている。計算コードは、独自のネストされた関数群へ移された。それぞれは小さく、目的を示す明確な名前を持っている。

しかし、HTMLを出す関数を書ける状態には、まだ少し届いていない。分解された関数はすべて全体の`statement`関数の中にネストされている。これにより、関数スコープ内の名前を参照できるので、抽出は簡単になる。たとえば`amountFor`が`movieFor`を呼ぶことや、与えられた`customer`と`movies`を参照することができる。しかし、これらの関数を参照する単純な`htmlStatement`関数は書けない。

同じ計算を使って異なる出力を支えるには、さらにリファクタリングが必要である。ここからは、コードをどう分解したいかによって複数の選択肢が出てくる。次にそれぞれのアプローチを見ていき、各方法がどう働くかを説明し、4つすべてを見たあとで比較する。

### パラメータで出力を決める

ひとつの道は、`statement`関数の引数として出力形式を指定することだ。このリファクタリングは、Add Parameterを使い、既存のテキスト整形コードを抽出し、パラメータが示すときに抽出した関数へ振り分けるコードを冒頭に書くところから始める。

```javascript
function statement(customer, movies, format = 'text') {
  switch (format) {
    case "text":
      return textStatement();
  }
  throw new Error(`unknown statement format ${format}`);

  function textStatement() {
    let result = `Rental Record for ${customer.name}\n`;
    for (let r of customer.rentals) {
      result += `\t${movieFor(r).title}\t${amountFor(r)}\n`;
    }
    result += `Amount owed is ${totalAmount()}\n`;
    result += `You earned ${totalFrequentRenterPoints()} frequent renter points\n`;
    return result;
  }
}
```

次に、HTML生成関数を書き、dispatcherへ分岐を加えられる。

```javascript
function statement(customer, movies, format = 'text') {
  switch (format) {
    case "text":
      return textStatement();
    case "html":
      return htmlStatement();
  }
  throw new Error(`unknown statement format ${format}`);

  function htmlStatement() {
    let result = `<h1>Rental Record for <em>${customer.name}</em></h1>\n`;
    result += "<table>\n";
    for (let r of customer.rentals) {
      result += `  <tr><td>${movieFor(r).title}</td><td>${amountFor(r)}</td></tr>\n`;
    }
    result += "</table>\n";
    result += `<p>Amount owed is <em>${totalAmount()}</em></p>\n`;
    result += `<p>You earned <em>${totalFrequentRenterPoints()}</em> frequent renter points</p>\n`;
    return result;
  }
}
```

dispatcherのロジックには、データ構造を使いたくなるかもしれない。

```javascript
function statement(customer, movies, format = 'text') {
  const dispatchTable = {
    "text": textStatement,
    "html": htmlStatement
  };
  if (undefined === dispatchTable[format]) throw new Error(`unknown statement format ${format}`);
  return dispatchTable[format].call();
}
```

### トップレベル関数を使う

トップレベルのHTML statement関数を書く際の問題は、計算関数がテキストstatement関数の中にネストされていることだ。したがって明らかな進め方は、それらをトップの文脈へ移すことである。

そのために、まずほかの関数を参照していない関数を探す。この場合は`movieFor`である。関数を移動するとき、私はまず新しい文脈へ関数をコピーし、その文脈に合わせ、元の関数本体を移動先の関数呼び出しに置き換えるやり方を好む。

```javascript
function topMovieFor(rental, movies) {
  return movies[rental.movieID];
}

function statement(customer, movies) {
  // [snip]
  function movieFor(rental) {
    return topMovieFor(rental, movies);
  }
}
```

この時点でコンパイルし、テストできる。文脈の変更が問題を起こしたかどうかがわかる。それが終われば、転送用の関数をインライン化できる。

```javascript
function movieFor(rental, movies) {
  return movies[rental.movieID];
}
```

`amountFor`の中にも同様の変更がある。インライン化と同時に、トップレベル関数を古い名前に合わせて変更したので、唯一の違いは`movies`パラメータだけになる。

次に、ネストされた関数すべてで同じことを行う。

```javascript
function statement(customer, movies) {
  let result = `Rental Record for ${customer.name}\n`;
  for (let r of customer.rentals) {
    result += `\t${movieFor(r, movies).title}\t${amountFor(r, movies)}\n`;
  }
  result += `Amount owed is ${totalAmount(customer, movies)}\n`;
  result += `You earned ${totalFrequentRenterPoints(customer, movies)} frequent renter points\n`;
  return result;
}

function totalFrequentRenterPoints(customer, movies) {
  return customer.rentals
    .map((r) => frequentRenterPointsFor(r, movies))
    .reduce((a, b) => a + b, 0)
    ;
}

function totalAmount(customer, movies) {
  return customer.rentals
    .reduce((total, r) => total + amountFor(r, movies), 0);
}

function movieFor(rental, movies) {
  return movies[rental.movieID];
}

function amountFor(rental, movies) {
  let result = 0;
  switch (movieFor(rental, movies).code) {
    case "regular":
      result = 2;
      if (rental.days > 2) result += (rental.days - 2) * 1.5;
      return result;
    case "new":
      result = rental.days * 3;
      return result;
    case "childrens":
      result = 1.5;
      if (rental.days > 3) result += (rental.days - 3) * 1.5;
      return result;
  }
  return result;
}

function frequentRenterPointsFor(rental, movies) {
  return (movieFor(rental, movies).code === "new" && rental.days > 2) ? 2 : 1;
}
```

これでHTML版のstatement関数は簡単に書ける。

```javascript
function htmlStatement(customer, movies) {
  let result = `<h1>Rental Record for <em>${customer.name}</em></h1>\n`;
  result += "<table>\n";
  for (let r of customer.rentals) {
    result += `  <tr><td>${movieFor(r, movies).title}</td><td>${amountFor(r, movies)}</td></tr>\n`;
  }
  result += "</table>\n";
  result += `<p>Amount owed is <em>${totalAmount(customer, movies)}</em></p>\n`;
  result += `<p>You earned <em>${totalFrequentRenterPoints(customer, movies)}</em> frequent renter points</p>\n`;
  return result;
}
```

#### 部分適用されたローカル関数を宣言する

このようにグローバル関数を使うと、パラメータリストがかなり長くなることがある。そこで、グローバル関数のパラメータの一部またはすべてを埋めたローカル関数を宣言すると便利な場合がある。そのローカル関数は、グローバル関数の部分適用であり、あとで使える。JavaScriptでこれを行う方法はいくつかある。ひとつはローカル関数を変数に代入する方法だ。

```javascript
function htmlStatement(customer, movies) {
  const amount = () => totalAmount(customer, movies);
  const frequentRenterPoints = () => totalFrequentRenterPoints(customer, movies);
  const movie = (aRental) => movieFor(aRental, movies);
  const rentalAmount = (aRental) =>  amountFor(aRental, movies);
  let result = `<h1>Rental Record for <em>${customer.name}</em></h1>\n`;
  result += "<table>\n";
  for (let r of customer.rentals) {
    result += `  <tr><td>${movie(r).title}</td><td>${rentalAmount(r)}</td></tr>\n`;
  }
  result += "</table>\n";
  result += `<p>Amount owed is <em>${amount()}</em></p>\n`;
  result += `<p>You earned <em>${frequentRenterPoints()}</em> frequent renter points</p>\n`;
  return result;
}
```

別の方法は、それらをネストした関数として宣言することだ。

```javascript
function htmlStatement(customer, movies) {
  let result = `<h1>Rental Record for <em>${customer.name}</em></h1>\n`;
  result += "<table>\n";
  for (let r of customer.rentals) {
    result += `  <tr><td>${movie(r).title}</td><td>${rentalAmount(r)}</td></tr>\n`;
  }
  result += "</table>\n";
  result += `<p>Amount owed is <em>${amount()}</em></p>\n`;
  result += `<p>You earned <em>${frequentRenterPoints()}</em> frequent renter points</p>\n`;
  return result;

  function amount() { return totalAmount(customer, movies); }
  function frequentRenterPoints() { return totalFrequentRenterPoints(customer, movies); }
  function rentalAmount(aRental) { return amountFor(aRental, movies); }
  function movie(aRental) { return movieFor(aRental, movies); }
}
```

さらに別の方法として`bind`を使うこともできる。そこは読者自身で調べてもらうことにする。ここでは、上の形のほうが追いやすいと感じるので、私は使わない。

### クラスを使う

オブジェクト指向は私にとってなじみ深いので、クラスとオブジェクトを考えるのは自然なことだ。ES6は古典的なオブジェクト指向のための良い構文を導入した。この例にそれをどう適用するか見てみよう。

最初のステップは、データをオブジェクトで包むことだ。顧客から始める。

```javascript
// customer.es6
export default class Customer {
  constructor(data) {
    this._data = data;
  }
  get name() { return this._data.name; }
  get rentals() { return this._data.rentals; }
}

// statement.es6
import Customer from './customer.es6';
function statement(customerArg, movies) {
  const customer = new Customer(customerArg);
  let result = `Rental Record for ${customer.name}\n`;
  for (let r of customer.rentals) {
    result += `\t${movieFor(r).title}\t${amountFor(r)}\n`;
  }
  result += `Amount owed is ${totalAmount()}\n`;
  result += `You earned ${totalFrequentRenterPoints()} frequent renter points\n`;
  return result;
}
```

ここまでのクラスは、元のJavaScriptオブジェクトを包む単純なラッパにすぎない。次に、レンタルにも同様のラッパを作る。

```javascript
// rental.es6
export default class Rental {
  constructor(data) {
    this._data = data;
  }
  get days() { return this._data.days; }
  get movieID() { return this._data.movieID; }
}

// customer.es6
import Rental from './rental.es6';

export default class Customer {
  constructor(data) {
    this._data = data;
  }
  get name() { return this._data.name; }
  get rentals() { return this._data.rentals.map(r => new Rental(r)); }
}
```

単純なJSONオブジェクトをクラスで包んだので、Move Methodの対象ができた。関数をトップレベルへ移したときと同じように、最初に扱うのはほかの関数を呼ばないもの、つまり`movieFor`である。しかしこの関数には映画一覧という文脈が必要であり、新しく作るレンタルオブジェクトから利用できるようにしなければならない。

```javascript
// class Customer
constructor(data, movies) {
  this._data = data;
  this._movies = movies;
}
get rentals() { return this._data.rentals.map(r => new Rental(r, this._movies)); }

// class Rental
constructor(data, movies) {
  this._data = data;
  this._movies = movies;
}
get movie() {
  return this._movies[this.movieID];
}
```

支えるデータが整ったら、関数を移せる。先ほどと同じように、最初のステップは中核となる振る舞いを新しい文脈に置き、その文脈に合わせ、元の関数を新しいものの呼び出しに調整することだ。動くようになれば、元の関数呼び出しをインライン化するのは比較的簡単である。

同じ基本的な手順を使って、2つの計算も`Rental`へ移せる。

```javascript
// class Rental
get frequentRenterPoints() {
  return (this.movie.code === "new" && this.days > 2) ? 2 : 1;
}
get amount() {
  let result = 0;
  switch (this.movie.code) {
    case "regular":
      result = 2;
      if (this.days > 2) result += (this.days - 2) * 1.5;
      return result;
    case "new":
      result = this.days * 3;
      return result;
    case "childrens":
      result = 1.5;
      if (this.days > 3) result += (this.days - 3) * 1.5;
      return result;
  }
  return result;
}
```

次に、2つの合計関数を`Customer`へ移せる。

```javascript
// statement.es6
function statement(customerArg, movies) {
  const customer = new Customer(customerArg, movies);
  let result = `Rental Record for ${customer.name}\n`;
  for (let r of customer.rentals) {
    result += `\t${r.movie.title}\t${r.amount}\n`;
  }
  result += `Amount owed is ${customer.amount}\n`;
  result += `You earned ${customer.frequentRenterPoints} frequent renter points\n`;
  return result;
}

// class Customer
get frequentRenterPoints() {
  return this.rentals
    .map((r) => r.frequentRenterPoints)
    .reduce((a, b) => a + b, 0)
    ;
}
get amount() {
  return this.rentals
    .reduce((total, r) => total + r.amount, 0);
}
```

計算ロジックが`Rental`と`Customer`オブジェクトへ移ったので、HTML版のstatementを書くのは簡単である。

```javascript
function htmlStatement(customerArg, movies) {
  const customer = new Customer(customerArg, movies);
  let result = `<h1>Rental Record for <em>${customer.name}</em></h1>\n`;
  result += "<table>\n";
  for (let r of customer.rentals) {
    result += `  <tr><td>${r.movie.title}</td><td>${r.amount}</td></tr>\n`;
  }
  result += "</table>\n";
  result += `<p>Amount owed is <em>${customer.amount}</em></p>\n`;
  result += `<p>You earned <em>${customer.frequentRenterPoints}</em> frequent renter points</p>\n`;
  return result;
}
```

#### 構文としてのクラスを使わない

ES2015のクラス構文には議論がある。必要ないと感じる人もいるし、Java開発者への皮肉が添えられることも多い。まったく同じ一連のリファクタリング手順を取れば、次のような結果にもできる。

```javascript
function statement(customerArg, movies) {
  const customer = createCustomer(customerArg, movies);
  let result = `Rental Record for ${customer.name()}\n`;
  for (let r of customer.rentals()) {
    result += `\t${r.movie().title}\t${r.amount()}\n`;
  }
  result += `Amount owed is ${customer.amount()}\n`;
  result += `You earned ${customer.frequentRenterPoints()} frequent renter points\n`;
  return result;
}

function createCustomer(data, movies) {
  return {
    name: () => data.name,
    rentals: rentals,
    amount: amount,
    frequentRenterPoints: frequentRenterPoints
  };

  function rentals() {
    return data.rentals.map(r => createRental(r, movies));
  }
  function frequentRenterPoints() {
    return rentals()
      .map((r) => r.frequentRenterPoints())
      .reduce((a, b) => a + b, 0)
      ;
  }
  function amount() {
    return rentals()
      .reduce((total, r) => total + r.amount(), 0);
  }
}
```

`createRental`も同じ形で、データと映画一覧をクロージャに保持し、`movie`、`amount`、`frequentRenterPoints`などの関数を返す。

このアプローチはFunction As Objectパターンを使っている。コンストラクタ関数である`createCustomer`と`createRental`は、関数参照のJavaScriptオブジェクト、つまりハッシュを返す。各コンストラクタ関数には、オブジェクトのデータを保持するクロージャが含まれる。返された関数オブジェクトは同じ関数文脈にいるので、そのデータにアクセスできる。私はこれを、クラス構文を使うのとまったく同じパターンだが、別の方法で実装したものだと見ている。私は明示的な構文のほうを好む。より明示的であり、自分の考えを明確にしてくれるからだ。

### データ変換

これまでのすべてのアプローチでは、statementを出力する関数が、必要なデータを計算するために別の関数を呼んでいた。別の方法は、このデータそのものをデータ構造の中に入れて、statement出力関数へ渡すことだ。このアプローチでは、計算関数を使って顧客データ構造を変換し、出力関数が必要とするすべてのデータを持つようにする。

リファクタリングの用語で言えば、これはKent Beckが昨年の夏に私に説明してくれた、まだ書かれていないSplit Phaseリファクタリングの例である。このリファクタリングでは、計算を2つのフェーズに分け、その2つが中間データ構造でやり取りする。私は、中間データ構造を導入するところからこのリファクタリングを始める。

```javascript
function statement(customer, movies) {
  const data = createStatementData(customer, movies);
  let result = `Rental Record for ${data.name}\n`;
  for (let r of data.rentals) {
    result += `\t${movieFor(r).title}\t${amountFor(r)}\n`;
  }
  result += `Amount owed is ${totalAmount()}\n`;
  result += `You earned ${totalFrequentRenterPoints()} frequent renter points\n`;
  return result;

  function createStatementData(customer, movies) {
    let result = Object.assign({}, customer);
    return result;
  }
}
```

この場合、私は元の顧客データ構造に要素を加えて豊かにしている。そのため、`Object.assign`の呼び出しから始めている。完全に新しいデータ構造を作ることもできる。どちらを選ぶかは、変換後のデータ構造が元の構造とどれだけ違うかによる。

次に、レンタルの各行にも同じことを行う。`createRentalData`は`createStatementData`の内側にネストしておく。`createStatementData`の呼び出し側は、内部がどのように組み立てられているかを知る必要がないからだ。

```javascript
function createStatementData(customer, movies) {
  let result = Object.assign({}, customer);
  result.rentals = customer.rentals.map(r => createRentalData(r));
  return result;

  function createRentalData(rental) {
    let result = Object.assign({}, rental);
    return result;
  }
}
```

それから、変換されたデータを埋め始める。まずはレンタルされた映画のタイトルである。

```javascript
function createRentalData(rental) {
  let result = Object.assign({}, rental);
  result.title = movieFor(rental).title;
  return result;
}
```

続いて金額の計算、さらに合計へ進む。

```javascript
function statement(customer, movies) {
  const data = createStatementData(customer, movies);
  let result = `Rental Record for ${data.name}\n`;
  for (let r of data.rentals) {
    result += `\t${r.title}\t${r.amount}\n`;
  }
  result += `Amount owed is ${data.totalAmount}\n`;
  result += `You earned ${data.totalFrequentRenterPoints} frequent renter points\n`;
  return result;

  function createStatementData(customer, movies) {
    let result = Object.assign({}, customer);
    result.rentals = customer.rentals.map(r => createRentalData(r));
    result.totalAmount = totalAmount();
    result.totalFrequentRenterPoints = totalFrequentRenterPoints();
    return result;

    function createRentalData(rental) {
      let result = Object.assign({}, rental);
      result.title = movieFor(rental).title;
      result.amount = amountFor(rental);
      return result;
    }
  }
}
```

計算関数の結果をすべてデータとして置くようにしたので、関数を移してstatementレンダリング関数から分離できる。まず、すべての計算関数を`createStatementData`の中へ移す。

```javascript
function statement (customer, movies) {
  // body …
  function createStatementData (customer, movies) {
    // body …

    function createRentalData(rental) { … }
    function totalFrequentRenterPoints() { … }
    function totalAmount() { … }
    function movieFor(rental) { … }
    function amountFor(rental) { … }
    function frequentRenterPointsFor(rental) { … }
  }
}
```

次に、`createStatementData`を`statement`の外へ移す。

```javascript
function statement (customer, movies) { … }

function createStatementData (customer, movies) {
  function createRentalData(rental) { … }
  function totalFrequentRenterPoints() { … }
  function totalAmount() { … }
  function movieFor(rental) { … }
  function amountFor(rental) { … }
  function frequentRenterPointsFor(rental) { … }
}
```

このように関数を分離できたら、同じデータ構造を使ってHTML版のstatementを書ける。

```javascript
function htmlStatement(customer, movies) {
  const data = createStatementData(customer, movies);
  let result = `<h1>Rental Record for <em>${data.name}</em></h1>\n`;
  result += "<table>\n";
  for (let r of data.rentals) {
    result += `  <tr><td>${r.title}</td><td>${r.amount}</td></tr>\n`;
  }
  result += "</table>\n";
  result += `<p>Amount owed is <em>${data.totalAmount}</em></p>\n`;
  result += `<p>You earned <em>${data.totalFrequentRenterPoints}</em> frequent renter points</p>\n`;
  return result;
}
```

`createStatementData`を別モジュールへ移すこともできる。そうすれば、データを計算することとstatementをレンダリングすることの境界がさらに明確になる。

```javascript
// statement.es6
import createStatementData from './createStatementData.es6';
function htmlStatement(customer, movies) { … }
function statement(customer, movies) { … }

// createStatementData.es6
export default function createStatementData (customer, movies) {
  function createRentalData(rental) { … }
  function totalFrequentRenterPoints() { … }
  function totalAmount() { … }
  function movieFor(rental) { … }
  function amountFor(rental) { … }
  function frequentRenterPointsFor(rental) { … }
}
```

### アプローチを比較する

ここで一歩下がり、自分が得たものを見てみる。最初のコードは、単一のインライン関数として書かれていた。私が望んだのは、計算コードを重複させずにHTMLレンダリングを可能にするよう、このコードをリファクタリングすることだった。最初のステップでは、このコードをいくつかの関数に分け、それらを元の関数の中に置いた。そこから、4つの異なる道を探った。

`top-level-functions`では、すべての関数をトップレベル関数として書く。

```javascript
function htmlStatement(customer, movies)
function textStatement(customer, movies)
function totalAmount(customer, movies)
function totalFrequentRenterPoints(customer, movies)
function amountFor(rental, movies)
function frequentRenterPointsFor(rental, movies)
function movieFor(rental, movies)
```

`parameter-dispatch`では、トップレベル関数にパラメータを渡し、どの出力形式を発行するかを示す。

```javascript
function statement(customer, movies, format)
  function htmlStatement()
  function textStatement()
  function totalAmount()
  function totalFrequentRenterPoints()
  function amountFor(rental)
  function frequentRenterPointsFor(rental)
  function movieFor(rental)
```

`classes`では、計算ロジックをクラスへ移し、レンダリング関数がそれを使う。

```javascript
function textStatement(customer, movies)
function htmlStatement(customer, movies)
class Customer
  get amount()
  get frequentRenterPoints()
  get rentals()
class Rental
  get amount()
  get frequentRenterPoints()
  get movie()
```

`transform`では、計算ロジックを分離されたネスト関数へ分け、レンダリング関数のために中間データ構造を作る。

```javascript
function statement(customer, movies)
function htmlStatement(customer, movies)
function createStatementData(customer, movies)
  function createRentalData()
  function totalAmount()
  function totalFrequentRenterPoints()
  function amountFor(rental)
  function frequentRenterPointsFor(rental)
  function movieFor(rental)
```

比較の基準として、まず`top-level-functions`の例から始める。これは概念的に最も単純な選択肢だからだ。単純なのは、仕事を純粋関数の集合へ分け、どの関数もコードのどこからでも呼び出せるようにしているからである。これは使うのもテストするのも簡単だ。個々の関数は、テストケースでもREPLでも容易にテストできる。

`parameter-dispatch`は、ネストされた関数群という元の構造に近いため、最初のリファクタリングとしてはより良い。しかし選択肢を比較するときには、`top-level-functions`のほうが出発点として適している。

トップレベル関数の弱点は、反復的なパラメータ渡しが多くなることだ。ここでは`movies`を何度も渡している。さらに、`customer`も何度も渡している。これは、関数に共通文脈が必要であることを示している。共通文脈が小さいうちは問題にならないが、文脈が大きくなると騒がしくなる。

`parameter-dispatch`の方法では、計算関数を外へ出さず、ネストしたままにする。これはパラメータ渡しの騒がしさを避ける。しかし、呼び出し側は出力形式を文字列で指定しなければならない。出力形式を追加するたびにdispatcherを変更する必要もある。私はこのようなdispatcherロジックを書くのがあまり好きではない。

この2つの選択肢を見ると、私はいくつかのロジックのために明示的な共通文脈が欲しいが、そのロジックを使う異なる操作を呼び出す必要がある、という地点にいることがわかる。このような必要を感じると、私はすぐにオブジェクト指向を考える。オブジェクト指向とは本質的に、**共通文脈に対して独立して呼び出せる操作の集合**だからだ。これがクラス版の例につながる。クラス版では、顧客と映画という共通文脈を、顧客オブジェクトとレンタルオブジェクトの中に捉えられる。

オブジェクトをインスタンス化するときに文脈を一度設定すれば、その後のすべてのロジックはその共通文脈を使える。オブジェクトのメソッドは、トップレベル関数の場合の部分適用されたローカル関数に似ている。ただし、ここでは共通文脈がコンストラクタによって与えられる。したがって私は、トップレベル関数ではなくローカル関数だけを書く。呼び出し側はコンストラクタで文脈を示し、それからローカル関数を直接呼ぶ。ローカルメソッドは、オブジェクトインスタンスの共通文脈へ、概念上のトップレベル関数を部分適用したものと考えられる。

クラスを使うと、もうひとつの考え方が導入される。レンダリングロジックと計算ロジックを分けるという考え方だ。元の単一関数の欠点のひとつは、その2つを混ぜていることだった。関数へ分割するとある程度は分離されるが、それらはまだ同じ概念空間に存在している。これは少し不公平な言い方かもしれない。計算関数をひとつのファイルに置き、レンダリング関数を別ファイルに置き、適切なimport文でつなぐこともできるからだ。しかし私は、共通文脈がロジックをモジュールへまとめる自然な手がかりを与えると感じている。

私はオブジェクトを共通の部分適用の集合として説明したが、別の見方もある。オブジェクトは入力データ構造でインスタンス化されるが、そのデータを、計算関数を通じて公開される計算済みデータで豊かにしている。私はこれらをgetterにすることで、この見方を強めている。クライアントはそれらを生データとまったく同じように扱える。つまりUniform Access Principleを適用している。

これは、コンストラクタ引数からgetterの仮想データ構造への変換と考えることができる。`transform`の例も同じ考え方だが、初期データとすべての計算済みデータを結合した新しいデータ構造を作ることで実装している。オブジェクトが計算ロジックを`Customer`と`Rental`クラスの中にカプセル化するのと同じように、変換アプローチはそのロジックを`createStatementData`と`createRentalData`の中にカプセル化する。

このように基本的なList And Hashデータ構造を変換するアプローチは、関数型の考え方によく見られる特徴だ。`create…Data`関数は必要な文脈を共有でき、レンダリングロジックは複数の出力を単純な形で利用できる。

クラスを変換として考える場合と、変換アプローチそのものとの小さな違いは、変換計算がいつ起こるかである。ここでの変換アプローチは一度にまとめて変換する。一方、クラスは各呼び出しのたびに個別の変換を行う。計算がいつ起こるかは、相手の方式に合わせるよう簡単に切り替えられる。クラスの場合は、コンストラクタ内ですべての計算を行えば、一度に計算できる。変換の場合は、中間データ構造に関数を返すことで、必要に応じて再計算できる。

ほとんどの場合、この性能差は無視できる。もしこれらの関数のどれかが高価なら、たいてい最善なのはメソッドまたは関数を使い、最初の呼び出し後に結果をキャッシュすることだ。

では4つのアプローチがあるとして、私の好みはどれか。dispatcherロジックを書くのは好きではないので、`parameter-dispatch`アプローチは使わないだろう。`top-level-functions`は検討するが、共有文脈が大きくなるにつれて私の好みは急速に下がる。引数が2つだけでも、ほかの選択肢へ手を伸ばしたくなる。

クラスと変換アプローチの間で選ぶのは難しい。どちらも共通文脈を明示し、関心をうまく分離する良い方法を提供している。私は激しい勝負が好きではないので、2つに小さなゲームでもさせて勝者を選べばよいのかもしれない。

### さらなるリファクタリング

この探索では、計算関数とレンダリング関数を配置する4つの方法を見てきた。ソフトウェアは非常に可塑的な媒体であり、このほかにも多くのバリエーションがありうる。しかし、議論する上で最も興味深いのはこの4つだと思う。

これらの関数の配置以外にも、さらにリファクタリングはある。本の例では、新しい映画タイプでモデルを拡張しやすくするため、`amount`と`frequentRenterPoint`の計算を分解した。レンダリングコードにも、ヘッダー、行、フッターという共通パターンを取り出すなど、私なら加える変更がある。しかしこの記事で考えるには、この4つの道で十分だと思う。

結論があるとすれば、観察可能な計算としては同一のものを、筋の通った複数の方法で配置できるということだ。言語によって促されるスタイルは異なる。元の本のリファクタリングはJavaで行われ、Javaはクラスのスタイルを強く促す。JavaScriptは複数のスタイルをうまく支える。これは良いことでもあり、プログラマに選択肢を与えるからだ。そして悪いことでもある。プログラマに選択肢を与えてしまうからだ。

JavaScriptでプログラミングする難しさのひとつは、何が良いスタイルなのかについて合意が少ないことだ。これらの異なるスタイルを理解することは有用だ。しかし、それらを結びつけているものを理解するほうが重要である。小さな関数は、よく名づけられていれば、同時にも時間をかけても、さまざまな必要を支えるように組み合わせ、操作できる。

共通文脈は、ロジックをひとまとめにすることを示唆する。一方で、プログラミングの技法の多くは、関心をそのような明確な文脈の集合へどう分けるかを決めることにある。

### 謝辞

Vitor Gomesは、ES6のデフォルトパラメータ値について思い出させてくれた。

Beth Andres-Beck、Bill Wake、Chaoyang Jia、Greg Doench、Henrique Souza、Jay Fields、Kevin Yeung、Marcos Brizeno、Pete Hodgson、Ryan Boucherは、この投稿のドラフトについてメーリングリストで議論してくれた。

Ruben Bartelinkは、修正すべき多くの誤字を知らせてくれた。

Udo Borkowskiは、例に含まれるバグを指摘してくれた。
