# Required Interface

## 要約

Required Interfaceは、やり取りのクライアント側が定義するインターフェースで、供給側コンポーネントがそのやり取りで使われるために何をしなければならないかを示します。
インターフェースを供給側が公開するものとしてだけでなく、クライアントが必要とする役割として捉える考え方です。

この記事は、Javaの `Comparable` と、既存クラスをrequired interfaceへ合わせるadapterの例を通じて、Role Interfaceへつながる見方を説明しています。

## 読むときの観点

- インターフェースを「提供者が公開するもの」ではなく「利用者が必要とするもの」として見る。
- `Comparable` のように、クライアント側のアルゴリズムが要求する形に注目する。
- 名前やメソッドシグネチャが一致しても、型として一致しない場合がある点を押さえる。
- adapterが、既存オブジェクトをrequired interfaceへ写像する役割を持つことを読む。

## 原文の翻訳

Required Interfaceは、やり取りのクライアントによって定義されるインターフェースです。そのやり取りで供給側コンポーネントが使われるために、何をする必要があるかを指定します。

Required Interfaceのよい例は、一般に「comparable」と呼ばれるインターフェースです。この種のインターフェースは、通常ソート関数によって要求されます。アルバムの集合があり、それをタイトルでソートしたいが、`The`、`A`、`An` のような冠詞は無視したいとします。任意のソート関数に対してrequired interfaceを実装することで、そのようにソートされるようにできます。

Javaでは、次のようになります。

```java
class Album...

public class Album implements Comparable<Album> {
  private String title;

  public Album(String title) {
    this.title = title;
  }
  public String getTitle() {
    return title;
  }

  @Override
  public int compareTo(Album o) {
    return this.sortKey().compareTo(o.sortKey());
  }
  private String sortKey() {
    return ignoreSortPrefixes(title).toLowerCase();
  }
  private static String ignoreSortPrefixes(String arg) {
    final String[] prefixes = {"an", "a", "the"};
    return Arrays.stream(prefixes)
            .map(s -> s + " ")
            .filter(s -> arg.toLowerCase().startsWith(s))
            .findFirst()
            .map(s -> arg.substring(s.length(), arg.length()))
            .orElse(arg)
            ;
  }
}
```

この場合、`Comparable` はさまざまなJavaのソート関数にとってのrequired interfaceです。より複雑な例では、その上に複数のメソッドが定義された、より豊かなインターフェースを持つこともあります。

人々はしばしば、インターフェースを、供給側がクライアントに何を公開するかの決定として考えます。しかしrequired interfaceは、クライアントによって指定され、多くの場合は定義されます。**クライアントが何を必要としているかから考える**と、より有用なインターフェースを得られることが多く、これはRole Interfaceの考え方へ向かいます。

### Adapterを使う

独立して定義された2つのモジュールを組み合わせたいとき、よくある問題が生じます。この場合、名前が一致していても困難に出会うことがあります。

タスクのrequired interfaceを持つタスクリストを考えます。

```java
class TaskList...

private List<Task> tasks;
private LocalDate deadline;
public LocalDate latestStart() {
  return deadline.minusDays(tasks.stream().mapToInt(t -> t.shortestLength()).sum());
}
}
```

```java
interface Task...

int shortestLength();
```

別の供給者から得た `Activity` クラスと統合したいとしましょう。

```java
class Activity...

public int shortestLength() {
  ...
```

Activityにはrequired interfaceのメソッドシグネチャと偶然一致するメソッドがあります。それでも、型定義が一致しないため、私はActivityのタスクリストを作ることは、正しく、できません。Activityクラスを変更できないなら、adapterを使う必要があります。

```java
public class ActivityAdapter implements Task {
  private Activity activity;

  public ActivityAdapter(Activity activity) {
    this.activity = activity;
  }
  @Override
  public int shortestLength() {
    return activity.shortestLength();
  }
}
```

ソフトウェアの世界ではadapterという用語をかなり自由に使いますが、ここではGang of Four本の意味で厳密に使っています。この用法では、adapterとは、あるオブジェクトを別のオブジェクトのrequired interfaceへ写像するオブジェクトです。

この場合、動的言語を使っているならadapterは不要です。しかしActivityクラスが異なるシグネチャのメソッドを使っていたなら、adapterが必要になります。

### 謝辞

Alexander ZagniotovとBruno Trecentiが、この記事の草稿にコメントしてくれました。
