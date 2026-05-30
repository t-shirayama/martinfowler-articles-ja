# Test Invariant

## 要約

Test Invariant は、Design by Contract の invariant という考え方を TDD に取り込むための小さなアイデアです。クラスが常に満たすべき性質を、テストコードから呼び出せる共通メソッドとして表し、テストの setup や exercise の後で確認します。

Martin Fowler は、この方法を自分で試したわけではないと断りつつ、DbC と TDD をつなぐ興味深い考えとして紹介しています。テスト対象が操作の前後で守るべき条件を明示できるなら、通常のアサーションに加えて不変条件を確認することで、意図しない状態の崩れを見つけやすくなります。

## 読むときの観点

- DbC の invariant は、クラスが常に満たすべき性質として読む。
- TDD では、不変条件を検査するメソッドを本番クラス側に置き、テストコードから確認する形になる。
- これは確立済みの実践というより、DbC と TDD を組み合わせるための思考実験として読む。

## 原文の翻訳

Design by Contract（DbC）の支持者と Test Driven Development（TDD）の支持者の間には、長く続いている、とはいえ控えめな議論があります。ここではその議論に踏み込むつもりはありません。ただ、Daniel Jackson と話していたときに出てきた、両者を組み合わせるためのアイデアを紹介します。

DbC では、各クラスに対して invariant を定義します。この invariant は、そのクラスについて常に真でなければならない性質を述べるものです。オブジェクトは、何かの処理の途中でない限り、常に自分の invariant を満たしていなければなりません。Eiffel では、クラスの invariant はメソッド呼び出しの前、つまり事前条件の確認時と、呼び出しの後、つまり事後条件の確認時に自動的にチェックされます。invariant の確認に失敗すると例外が投げられます。必要であれば、性能上の理由から本番利用時にはこのチェックを無効にできます。

この考え方を TDD に適用するなら、本番クラスの中に invariant をテストするための共通メソッドを定義し、それをテストコードから確認します。**Test Invariant は、操作の前後でオブジェクトが満たすべき条件をテストの一部として明示する考え方**です。

いつものように、ささやかな例を使ってみましょう。

```java
public class Bowler ...
    int overs, runs, wickets;
```

ボウラーに対する単純な invariant は、これらの値がすべて負でないことです。したがって、次のように invariant を定義できます。

```java
public boolean passesInvariant() {
    return (runs >= 0 && overs >= 0 && wickets >= 0);
}
```

そして、テストの setup と exercise の後でこれを使います。

```java
public void testConcedingRunsAddsToRunsScore() {
    Bowler botham = new Bowler();       // setup - showing my age
    assert botham.passesInvariant();
    botham.concedeRuns(4);              // exercise
    assert botham.passesInvariant();
    assertEquals(4, botham.getRuns());  // verify
}
```

私はこれを自分で試したことはありませんし、ほかにこのやり方をしている人も知りません。それでも、興味深い考えとして触れておきたいと思いました。
