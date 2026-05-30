# Making Stubs

## 要約

テスト時にはサービスの本物の実装ではなく、スタブやモックに差し替えたいことがあります。この記事では、抽象ファクトリを使って差し替える方法と、サービス自身にプロトタイプを持たせて差し替える方法を紹介します。

## 読むときの観点

- テスト用のスタブをどこで注入するか
- テスト後に差し替え状態を確実に戻す方法
- モックオブジェクトほど大がかりにせず、軽量に振る舞いを置き換える場面

## 原文の翻訳

テストを前提にした設計でよく起きる問題のひとつは、テストモードでは Service Stub を作り、本番環境や一部のテストでは本物のサービスを使えるようにすることです。この問題に対して、同僚たちがいくつかの考え方を共有してくれました。

Jeremy Stell-Smith が見せてくれたのは、Abstract Factory に基づく方法です。スタブにできるサービスはすべて、ひとつのファクトリから取り出します。たとえば `Persistence` のようなクラスは、現在の実装をファクトリから取得します。

```java
public abstract class Persistence...
  public static Persistence getInstance() {
    return (Persistence) Factories.get(Persistence.class);
  }

  public abstract void save(Object obj);
```

この方法では、Abstract Factory としての能力に加えて、テスト用ファクトリが実装のスタックを持てると便利です。これにより、テストのセットアップが簡単になります。

```java
public class FooTest...
  public void setUp() {
    TestFactories.pushSingleton(Persistence.class,
                                new MockPersistence());
  }

  public void tearDown() {
    TestFactories.pop(Persistence.class);
  }

  public void testSave() {
    Foo foo = new Foo();
    foo.save();
    ...
  }

public class Foo ...
  public void save() {
    Persistence.getInstance().save(this);
  }
```

このやり方では、テストの間だけ `Persistence` の実装を `MockPersistence` に差し替え、テストが終わったら元に戻します。**差し替えをセットアップとクリーンアップの対として扱う**ことが、テスト同士の干渉を避けるうえで重要です。

別のプロジェクトでは、Kraig Parkinson が少し違う方法を示しました。単一の Abstract Factory を使うのではなく、スタブ化したいサービス自身がプロトタイプを持つというやり方です。

```java
public class MyFacade {
  private static MyFacade prototype;

  public static void setFacade(MyFacade newPrototype) {
    prototype = newPrototype;
  }

  public static MyFacade getInstance() {
    if (prototype != null)
      return prototype;
    else
      return new MyFacade();
  }
}
```

テストでは、このプロトタイプに匿名クラスなどで作ったテスト用実装を設定します。たとえば、入力が期待どおりであることを確認し、固定の出力を返すようにできます。

```java
public void testSpeak() {
  final String expectedInput = "bar";
  final String expectedOutput = "foo";

  MyFacade.setPrototype(new MyFacade() {
    public String echo(String input) {
      assertEquals(expectedInput, input);
      return expectedOutput;
    }
  });

  try {
    final String actualOutput = new Client().speak(expectedInput);
    assertEquals(expectedOutput, actualOutput);
  } finally {
    MyFacade.setPrototype(null);
  }
}
```

この例では、テストメソッドの `finally` ブロックでリソースを片づけています。別の選択肢として、クリーンアップを `tearDown` に置くこともできます。私ならそちらにするでしょう。

`dance` のようなケースでは、モックオブジェクトで期待値を設定する考え方に近いことをしています。つまり、これは **Mock Objects を軽量に実現する方法** と考えることもできます。
