# Given When Then

## 要約

Given-When-Then は、テストやシナリオを「前提」「操作」「期待される結果」に分けて表すスタイルです。BDD や Specification by Example でよく使われますが、単体テストや仕様の文章にも応用できる、テストを読みやすくするための構造です。

## 読むときの観点

- Given、When、Then がそれぞれ何を表すのかを明確に分ける。
- テストフレームワークにとっての実行手順と、人間にとっての仕様表現の両方の意味を意識する。
- Four-Phase Test や Arrange-Act-Assert と同じ発想の別表現として捉える。

## 原文の翻訳

Given-When-Then は、テストを表現するためのスタイルである。あるいは、この手法を支持する人たちの言い方を借りれば、Specification by Example を使ってシステムの振る舞いを指定するためのスタイルである。これは Daniel Terhorst-North と Chris Matts が Behavior-Driven Development、すなわち BDD の一部として発展させたアプローチだ。Cucumber のような多くのテストフレームワークで、シナリオを構造化する方法として現れる。Four-Phase Test パターンを言い換えたものとして見ることもできる。

中心となる考え方は、シナリオ、あるいはテストを書く作業を三つの部分に分けることにある。

- Given は、このシナリオで指定しようとしている振る舞いを始める前の世界の状態を表す。テストの事前条件と考えることができる。
- When は、指定しようとしているその振る舞いを表す。
- Then は、その振る舞いによって期待される変化を表す。

例を仕様として使う話をしているのだから、例を見るのがわかりやすい。

```gherkin
Feature: User trades stocks
  Scenario: User requests a sell before close of trading
    Given I have 100 shares of MSFT stock
      And I have 150 shares of APPL stock
      And the time is before close of trading

    When I ask to sell 20 shares of MSFT stock

    Then I should have 80 shares of MSFT stock
      And I should have 150 shares of APPL stock
      And a sell order for 20 shares of MSFT stock should have been executed
```

この例は Cucumber、厳密には Cucumber の DSL である Gherkin を使っている。Cucumber は Business-Facing Test を書くための一般的な方法だが、Given-When-Then のスタイルはどのような種類のテストにも使える。単体テストの中で、非公式なブロックを示すコメントとして Given、When、Then を置く人もいる。この慣習が、形式ばらない説明文を構造化するために使われているのも見たことがある。

このアプローチでは、それぞれの節の中で複数の表現をつなぐために And を使うのが普通である。

私は Given を事前条件の状態の記述として特徴づけた。私自身はそのように考えるのが好みだからだ。しかし、テストフレームワークの側から見ると、Given はテスト対象システムを正しい状態に持っていくための一連のコマンドとして解釈される。その後で When のコマンドが実行される。このため、他の命名規則ではこの部分を setup と呼ぶことが多い。テストフレームワークは Then のコマンドのためにさまざまな問い合わせメソッドを提供するが、**Then は副作用を持たないべき**である。

Given-When-Then のスタイルは BDD の特徴としてよく見られるが、基本的な考え方は、テストを書くときや例によって仕様を書くときに広く使われている。Meszaros はこのパターンを Four-Phase Test として説明している。そこでは Setup が Given、Exercise が When、Verify が Then に対応する。さらに Teardown という段階もある。Bill Wake は同じ発想を Arrange、Act、Assert という形で表した。

Teardown は、テストを実装するときに常に必要なわけではない。特に自動的な後始末を使っている場合はそうである。また、例による仕様のコミュニケーション面においても、Teardown はそれほど多くを加えない。そのため、BDD のスタイルでこれが省かれているのは自然なことである。

Given-When-Then の価値は、単にキーワードを並べることではない。**前提、刺激、期待結果を分けて読めるようにする**ことで、テストを仕様として理解しやすくする点にある。
