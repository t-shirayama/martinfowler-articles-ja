# Parallel Change

## 要約

Parallel Changeは、後方互換性のないインターフェース変更を安全に進めるため、変更をexpand、migrate、contractの3段階に分けるパターンです。
既存利用者を壊さずに新しい形を追加し、利用者を移行し、最後に古い形を取り除きます。

この記事は、座標を `x` と `y` から `Coordinate` に変える例を通じて、継続的デリバリー、リファクタリング、データベース変更、リモートAPI進化、デプロイ戦略に共通する移行の考え方を説明しています。

## 読むときの観点

- 破壊的変更を一度に行わず、追加、移行、削除に分ける意味を見る。
- migrate期間が長くなるほど、古い版と新しい版の併存コストが増える点に注意する。
- コンパイラで一気に利用箇所を直す方法との違いを考える。
- contractを完了しないと、開始前より悪い状態に残る危険を読む。

## 原文の翻訳

すべての利用者に影響するインターフェース変更には、2つの思考モードが必要です。変更そのものを実装することと、そのすべての利用箇所を更新することです。これらを同時にやろうとすると難しくなります。特に、その変更が複数のクライアントや外部クライアントを持つPublished Interfaceに対するものである場合はそうです。

Parallel Changeはexpand and contractとしても知られ、インターフェースに対する後方互換性のない変更を安全に実装するパターンです。**変更をexpand、migrate、contractという3つの明確な段階に分ける**ことで、それを実現します。

このパターンを理解するために、単純な `Grid` クラスの例を使いましょう。このクラスは、整数の `x` と `y` 座標の組を使ってセルの情報を保存し、提供します。セルは内部的には二次元配列に保存され、クライアントは `addCell()`、`fetchCell()`、`isEmpty()` メソッドを使ってグリッドとやり取りできます。

```java
class Grid {
  private Cell[][] cells;
  ...

  public void addCell(int x, int y, Cell cell) {
    cells[x][y] = cell;
  }
  public Cell fetchCell(int x, int y) {
    return cells[x][y];
  }

  public boolean isEmpty(int x, int y) {
    return cells[x][y] == null;
  }
}
```

リファクタリングの一環として、`x` と `y` がData Clumpであることに気づき、新しい `Coordinate` クラスを導入することにします。しかしこれは、`Grid` クラスのクライアントにとって後方互換性のない変更になります。すべてのメソッドと内部データ構造を一度に変更するのではなく、Parallel Changeパターンを適用することにします。

expand段階では、古い版と新しい版の両方をサポートするようにインターフェースを拡張します。この例では、既存のコードを変更せずに、新しい `Map<Coordinate, Cell>` データ構造と、`Coordinate` インスタンスを受け取れる新しいメソッドを導入します。

```java
class Grid {
  private Cell[][] cells;
  private Map<Coordinate, Cell> newCells;
  ...

  public void addCell(int x, int y, Cell cell) {
    cells[x][y] = cell;
  }
  public void addCell(Coordinate coordinate, Cell cell) {
    newCells.put(coordinate, cell);
  }

  public Cell fetchCell(int x, int y) {
    return cells[x][y];
  }

  public Cell fetchCell(Coordinate coordinate) {
    return newCells.get(coordinate);
  }

  public boolean isEmpty(int x, int y) {
    return cells[x][y] == null;
  }
  public boolean isEmpty(Coordinate coordinate) {
    return !newCells.containsKey(coordinate);
  }
}
```

既存のクライアントは古い版を使い続けられ、新しい変更はそれらに影響を与えずに段階的に導入できます。

migrate段階では、古い版を使っているすべてのクライアントを新しい版へ更新します。これは段階的に行えます。外部クライアントがいる場合、この段階が最も長くなるでしょう。

すべての利用箇所が新しい版へ移行したら、contract段階を行い、古い版を削除し、新しい版だけをサポートするようにインターフェースを変更します。

この例では、古いメソッドが削除された後、内部の二次元配列はもう使われないため、そのデータ構造を安全に削除し、`newCells` を `cells` に戻すことができます。

```java
class Grid {
  private Map<Coordinate, Cell> cells;
  ...
  public void addCell(Coordinate coordinate, Cell cell) {
    cells.put(coordinate, cell);
  }

  public Cell fetchCell(Coordinate coordinate) {
    return cells.get(coordinate);
  }

  public boolean isEmpty(Coordinate coordinate) {
    return !cells.containsKey(coordinate);
  }
}
```

このパターンは、Continuous Deliveryを実践するときに特に役立ちます。3つの段階のどの時点でもコードをリリースできるからです。また、クライアントの移行と新しい版のテストを段階的に行えるため、変更のリスクを下げます。

インターフェースのすべての利用箇所を制御できる場合でも、このパターンに従うことには価値があります。一度にコードベース全体へ破壊を広げることを避けられるからです。migrate段階は短くできるかもしれませんが、修正すべきすべての利用箇所をコンパイラに見つけさせる方法の代替になります。

このパターンの適用例には、次のようなものがあります。

- リファクタリング: メソッドや関数のシグネチャを変更するとき。特にLong Term Refactoringを行う場合やPublished Interfaceを変更する場合です。リファクタリング中のこのパターンの変種として、古いメソッドを新しいAPIの観点で実装し、Inline Methodを使ってすべての利用箇所を一度に更新する方法があります。
- 古いメソッドを新しいメソッドへ委譲することも、migrate段階をより小さく安全なステップに分ける方法です。クライアントに公開されたAPIを変更する前に内部実装を先に変えられます。migrate段階が長い場合、2つの実装を別々に保守しなくて済むため有用です。
- データベースリファクタリング: これはevolutionary database designの重要な構成要素です。ほとんどのデータベースリファクタリングはParallel Changeパターンに従います。migrate段階は、すべてのデータベースアクセスコードが新しいスキーマで動くよう更新されるまでの、元のスキーマと新しいスキーマの移行期間になります。
- デプロイ: カナリアリリースやBlue Green Deploymentのようなデプロイ技法はParallel Changeパターンの応用です。古い版と新しい版のコードを並べてデプロイし、ユーザーを一方から他方へ段階的に移行することで、変更リスクを下げます。microservicesアーキテクチャでは、サービス間のバージョン依存による複雑なデプロイ調整を不要にすることもできます。
- リモートAPIの進化: 後方互換性のある形で変更できない場合、Parallel Changeを使ってリモートAPI、たとえばREST Webサービスを進化させられます。これは、公開APIに明示的なバージョンを使う方法の代替です。特定エンドポイントでAPIが受け取る、または返すpayloadを変更するときにこのパターンを適用できますし、古い版と新しい版を区別するために新しいエンドポイントを導入することもできます。

同じエンドポイントでParallel Changeを使う場合、payloadが拡張されたときに利用者を壊さないためのよい技法はPostel's Lawに従うことです。

migrate段階では、どちらの版のインターフェースを使うかを制御するためにFeature Flagを使えます。クライアント側のfeature toggleによって、クライアントは提供者の新しい版に対してforward-compatibleになり、提供者とクライアントのリリースを切り離せます。

Branch by Abstractionを実装するとき、Parallel Changeはクライアントと提供者の間に抽象化層を導入するよい方法です。また、提供者側に置き換えのための抽象化層を導入せずに、大規模な変更を行う別の方法でもあります。ただし、クライアントが非常に多い場合は、Branch by Abstractionを使うほうが、変更面を狭め、migrate段階の混乱を減らすうえでよりよい戦略です。

Parallel Changeを使う欠点は、migrate段階のあいだ、提供者が2つの異なる版をサポートしなければならず、クライアントがどちらが新しくどちらが古いのか混乱し得ることです。contract段階を実行しないと、開始時より悪い状態に陥る可能性があります。したがって、移行を成功させるには、**最後までやり切る規律が必要です**。

非推奨の注記、文書、TODOメモを追加すると、どの版が置き換え中なのかを、クライアントや同じコードベースで作業する他の開発者に知らせる助けになるでしょう。

### さらに読む

Industrial Logicのrefactoring albumは、Parallel Changeを行う例を文書化し、実演しています。

### 謝辞

この技法は、2006年にJoshua Kerievskyによってリファクタリング戦略として初めて文書化され、2010年のLean Software and Systems Conferenceで発表された彼の講演「The Limited Red Society」で紹介されました。

この記事の初稿にフィードバックをくれたJoshua Kerievskyに感謝します。また、Greg Dutcher、Badrinath Janakiraman、Praful Todkar、Rick Carragher、Filipe Esperandio、Jason Yip、Tushar Madhukar、Pete Hodgson、Kief Morrisをはじめ、多くのThoughtworksの同僚からのフィードバックにも感謝します。
