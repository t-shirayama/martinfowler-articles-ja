# Legacy Seam

## 要約

Legacy Seamは、レガシーシステムの振る舞いを、その場所のソースコードを直接編集せずに変えられる場所です。seamを見つけたり作ったりできると、依存を切ってテストしやすくし、観測用のprobeを入れ、legacy displacementの一部として処理を新しいモジュールへ向けられます。

この記事は、Michael Feathersのseamの定義を紹介し、関数を引数で渡す方法、service locator、モジュール上の置き換え可能な関数などを例に、seamとenabling pointの考え方を説明します。

## 読むときの観点

- seamは「変更できる場所」ではなく「その場所を編集せずに振る舞いを変えられる場所」と読む。
- enabling pointは、どの振る舞いを使うかを決める場所である。
- テスト容易性、observability、legacy displacementの3つの用途を意識する。
- 最適なseamの作り方は、言語、フレームワーク、既存システムのスタイルに依存する。

## 原文の翻訳

レガシーシステムに取り組むとき、seamを特定し作り出すことには価値があります。seamとは、ソースコードをその場所で編集せずに、システムの振る舞いを変えられる場所です。seamを見つけられれば、依存関係を切ってテストを簡単にしたり、observabilityを得るためのprobeを挿入したり、legacy displacementの一部としてプログラムの流れを新しいモジュールへ向けたりできます。

Michael Feathersは『Working Effectively with Legacy Code』の中で、レガシーシステムの文脈におけるseamという用語を作りました。彼の定義では、**seamとは「プログラム内で、その場所を編集せずに振る舞いを変えられる場所」**です。

seamがあると便利な例を考えてみましょう。注文価格を計算するコードがあるとします。

```typescript
export async function calculatePrice(order: Order) {
  const itemPrices = order.items.map(i => calculateItemPrice(i))
  const basePrice = itemPrices.reduce((acc, i) => acc + i.price, 0)
  const discount = calculateDiscount(order)
  const shipping = await calculateShipping(order)
  const adjustedShipping = applyShippingDiscounts(order, shipping)
  return basePrice + discount + adjustedShipping
}
```

`calculateShipping`は外部サービスを呼びます。遅く、費用もかかるため、テスト中には呼びたくありません。代わりにstubを導入し、各テストシナリオに対して決まった応答を返したいとします。テストごとに必要な応答は違うかもしれませんが、テストの中で`calculatePrice`のコードを直接編集することはできません。そこで、`calculateShipping`の呼び出しの周りにseamを導入し、テストが呼び出し先をstubへ向けられるようにします。

ひとつの方法は、`calculateShipping`のための関数を引数として渡すことです。

```typescript
export async function calculatePrice(
  order: Order,
  shippingFn: (o: Order) => Promise<number>
) {
  const itemPrices = order.items.map(i => calculateItemPrice(i))
  const basePrice = itemPrices.reduce((acc, i) => acc + i.price, 0)
  const discount = calculateDiscount(order)
  const shipping = await shippingFn(order)
  const adjustedShipping = applyShippingDiscounts(order, shipping)
  return basePrice + discount + adjustedShipping
}
```

この関数のunit testでは、単純なstubを差し込めます。

```typescript
const shippingFn = async (o: Order) => 113
expect(await calculatePrice(sampleOrder, shippingFn)).toStrictEqual(153)
```

それぞれのseamにはenabling pointがあります。Feathersの言葉では、enabling pointとは「ある振る舞いを使うか別の振る舞いを使うかを決められる場所」です。関数を引数として渡す方法では、`calculateShipping`の呼び出し元にenabling pointが開かれます。

これによりテストはずっと簡単になります。さまざまな送料を入れ、`applyShippingDiscounts`が正しく反応するかを確認できます。seamを導入するために元のソースコードを変更する必要はありましたが、その後その関数の振る舞いを変えるために元コードを変える必要はありません。変更はすべて、テストコードにあるenabling pointで起こります。

関数を引数として渡すことだけがseamを導入する方法ではありません。`calculateShipping`のシグネチャ変更が危険な場合もありますし、本番コードのレガシー呼び出しスタック全体にshipping functionの引数を通したくない場合もあります。そのような場合には、service locatorのようなlookupがより良いアプローチかもしれません。

```typescript
export async function calculatePrice(order: Order) {
  const itemPrices = order.items.map(i => calculateItemPrice(i))
  const basePrice = itemPrices.reduce((acc, i) => acc + i.price, 0)
  const discount = calculateDiscount(order)
  const shipping = await ShippingServices.calculateShipping(order)
  const adjustedShipping = applyShippingDiscounts(order, shipping)
  return basePrice + discount + adjustedShipping
}
```

locatorを使えば、subclassを定義して振る舞いを上書きできます。これは関数lookupを通じてseamを作る古典的なオブジェクト指向の方法です。ただし、TypeScriptやJavaScriptなら、私はこの方法は使わず、モジュールに置き換え可能な関数を置くでしょう。

```typescript
export let calculateShipping = legacy_calculateShipping

export function reset_calculateShipping(fn?: typeof legacy_calculateShipping) {
  calculateShipping = fn || legacy_calculateShipping
}
```

テストでは次のように使えます。

```typescript
const shippingFn = async (o: Order) => 113
reset_calculateShipping(shippingFn)
expect(await calculatePrice(sampleOrder)).toStrictEqual(153)
```

最後の例が示すように、seamに使う最良の仕組みは、言語、利用可能なフレームワーク、そしてレガシーシステムのスタイルに強く依存します。レガシーシステムを制御下に置くとは、レガシーソフトウェアへの攪乱を最小限にしながら、適切なenabling pointを提供するさまざまなseamをコードへ導入する方法を学ぶことです。

関数呼び出しはseam導入の単純な例ですが、実践でははるかに複雑になることがあります。使い込まれたレガシーシステムへseamを導入する方法を見つけるだけで、チームが数か月を費やすこともあります。レガシーシステムにseamを追加する最良の仕組みは、green fieldで同じ柔軟性を得るために行う設計とは違うかもしれません。

Feathersの本は主に、レガシーシステムをテスト可能にすることへ焦点を当てています。それが、正気を保ってそのシステムに取り組むための鍵になることが多いからです。しかし、seamの用途はそれだけではありません。seamがあれば、レガシーシステムへprobeを置き、observabilityを高められます。`calculateShipping`への呼び出しを監視し、どれくらい使われているかを調べ、その結果を別途分析するために捕捉できます。

おそらくseamの最も価値ある用途は、レガシーから振る舞いを移行できることです。seamは、価値の高い顧客を別の送料計算器へ向けるかもしれません。効果的なlegacy displacementは、レガシーシステムへseamを導入し、それを使って振る舞いをより現代的な環境へ少しずつ移すことに基づいています。

seamは、新しいソフトウェアを書くときにも考えるべきものです。どんな新しいシステムも、遅かれ早かれレガシーになるからです。私の設計助言の多くは、適切な場所にseamを持つソフトウェアを作り、簡単にテスト、観測、拡張できるようにすることに関わっています。テストを念頭に置いてソフトウェアを書くと、良いseamの集合を得やすくなります。これが、Test Driven Developmentが有用な技法である理由のひとつです。

この日本語文書は非公式の翻訳です。原文は [Legacy Seam](https://www.martinfowler.com/bliki/LegacySeam.html) です。
