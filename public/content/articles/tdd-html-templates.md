# Test-Driving HTML Templates

## 要約

サーバーサイドレンダリングのWebアプリケーションでは、templateが生成するHTMLを自動テストする価値がある。ブラウザでのE2Eテストだけに頼ると遅く、保守も重くなりやすい。この記事は、GoとJavaの例を使い、HTML templateをunit testに近い粒度でtest-driveする方法を説明する。

段階は3つある。まず生成HTMLが壊れていないことを確認する。次にCSS selectorで構造や内容を検証する。最後にPlaywrightを使って、HTML、CSS、JavaScriptを含む振る舞いを、他のアプリケーション層から分離してテストする。

## 読むときの観点

- templateに含まれる条件分岐や繰り返しを、通常のロジックとしてテストする。
- 文字列全体比較ではなく、CSS selectorで重要な構造だけを検証する。
- ARIA roleで要素を探すと、アクセシビリティ上の欠陥も見つけやすい。
- headless browserのテストは遅いが、対象をHTMLページに絞れば安定しやすい。

## 原文の翻訳

以下は、原文の構成に沿って主要な主張を日本語でたどる抄訳です。

Single-Page Applicationが長く主流だった一方で、HTMXやTurboのようなライブラリにより、サーバーサイドレンダリングHTMLの魅力が再び増している。GoやJavaのようなサーバーサイド言語で豊かなWeb UIを書くとき、問題になるのはtemplateが生成するHTMLをどう自動テストするかである。

もちろん、ブラウザで実際に表示して確認することは必要だ。しかし手動確認だけでは危険である。templateには`if`やlist iterationのような小さなロジックが入り、空配列、完了済み項目、現在のURLによる表示切り替えなど、多くのケースが生まれる。ブラウザは壊れたHTMLにも寛容なので、目視では見えない不整合もある。

最初の段階では、生成HTMLが基本的に壊れていないことを確認する。W3C完全準拠を目指すより先に、`<div>foo</p>`のような明らかな破損を検出する。Goでは`html/template`でtemplateをparseし、Javaではjmustacheを使う。さらにtemplateをmodelでrenderし、Goではgoquery、JavaではJsoupでparseしてエラーを検出する。

次に、HTMLの構造と内容をテストする。生成HTML全体を文字列で比較すると、空白や属性順、関係ない細部に引きずられて読みにくい。代わりにCSS selectorで重要な要素だけを選び、個数やテキストを検証する。TodoMVCの例では、`ul.todo-list li`でtodo itemを取り出し、件数とラベルを確認する。

テストが増えると、render、parse、soundness checkが繰り返しになる。そこでhelperを作り、HTMLをparseするときに常にsoundnessも確認するようにする。これにより、個々のテストは「どのselectorが何に一致するべきか」に集中できる。

さらにテストケースを表形式にすると、同じ構造で多くの条件を検証しやすい。todo itemが表示されること、完了済みitemにclassが付くこと、残り件数が表示されること、`/active`や`/completed`に応じてnavigation linkがhighlightされることなどを、model、path、selector、期待値の組で表せる。

第3段階では、HTMLの振る舞いをtest-driveする。たとえばtodo itemのcheckboxをクリックしたとき、サーバーへ`POST`が送られ、返ってきたHTMLで`section.todoapp`が置き換わることを確認したい。ここではPlaywrightでheadless browserを開き、初期HTML、HTMXライブラリ、サーバー応答をstubする。

要素を探すときは、CSS selectorよりもユーザーに近い方法を使う。checkboxであれば、ARIA roleとラベルで探す。これにより、labelとinputが正しく関連づいていない問題が見つかる。テストに失敗したことで、`label for`と`input id`を追加し、よりaccessibilityの高いHTMLに直す流れが示される。

HTMXによるround-tripのテストでは、最初に`data-hx-post`と`data-hx-target`を追加しても、返ってきた`section.todoapp`が既存の`section.todoapp`の内側に入ってしまう。テストの失敗メッセージを見ることで、`data-hx-swap="outerHTML"`が必要だと分かる。**振る舞いのテストは、目では見落としやすいHTML構造の誤りを具体的に示してくれる**。

最後に、CSS selectorとは別の方法として、生成HTMLを人間が読みやすいcanonical stringへ変換して比較する「Stringly asserted」も紹介される。HTMLタグを除き、`data-test-icon`などで視覚的意味を補い、複雑な構造を短い文字列として検証する方法である。

結論として、templateのテストでは、条件分岐の両側、空と非空のlist、`nil`や`null`、生成HTMLのsoundness、重要な構造、そして非自明なJavaScriptやCSSの振る舞いを確認する。すべての不具合を防げるわけではないが、壊れたHTMLや誤った表示をユーザーに届ける可能性を大きく減らせる。
