# Embedded Document

## 要約

Embedded Documentは、JSONのような文書構造をそのまま保持しつつ、操作を調整するためにオブジェクトで包む設計です。JSONをいったん細かなオブジェクトグラフに変換してから再びJSONへ戻すのが無駄に見える場面でも、オブジェクト指向そのものが邪魔なのではなく、カプセル化の使い方を誤解している可能性があります。

この記事は、汎用的なリストや辞書としてdeserializeした文書をオブジェクトの内部データとして持ち、その上に必要なメソッドを定義する方法を示します。データストアから得た文書とほぼ同じ形で返しつつ、少しだけサーバ側で加工したいときに向いた手法です。

## 読むときの観点

- JSON文書を細かなドメインオブジェクトへ必ず変換する必要はない。
- オブジェクトの役割は、内部データ構造を隠し、操作の置き場を与えることにある。
- 汎用データ構造を包むオブジェクトは、通常のオブジェクトと同じ等価性を持つとは限らない。
- サーバ側ロジックや表現変換が増えるほど、通常のオブジェクトグラフへ変換する価値が高まる。

## 原文の翻訳

最近、サーバの中をJSONデータ構造が流れていく様子をよく見るようになりました。JSON documentは、AggregateOrientedDatabaseを使うか、リレーショナルデータベース内のserialized LOBを使うことで、そのまま永続化できます。JSON documentは、Webブラウザへ直接提供することも、サーバ側のページレンダラへデータを転送するために使うこともできます。

JSONがこのように使われているとき、オブジェクト指向言語を使うと邪魔になる、という話を聞くことがあります。JSONは、最終的にはまた出力されるだけなのに、いったんオブジェクトへ変換しなければならず、プログラミング作業の無駄だというのです。無駄だという点には同意します。しかし私は、それはオブジェクトの問題ではなく、**カプセル化を理解しそこねている問題**だと考えています。

ここで、orderをJSON documentとして保存し、軽いサーバ側処理をしたうえで、再びJSONとして提供すると想像してみましょう。documentの例は次のようになります。

```json
{ "id": 1234,
  "customer": "martin",
  "items": [
    {"product": "talisker", "quantity": 500},
    {"product": "macallan", "quantity": 800},
    {"product": "ledaig",   "quantity": 1100}
  ],
  "deliveries": [
    { "id": 7722,
      "shipDate": "2013-04-19",
      "items": [
        {"product": "talisker", "quantity": 300},
        {"product": "ledaig",   "quantity": 500}
      ]
    },
    { "id": 6533,
      "shipDate": "2013-04-18",
      "items": [
        {"product": "talisker", "quantity": 200},
        {"product": "ledaig",   "quantity": 300},
        {"product": "macallan", "quantity": 300}
      ]
    }
  ]
}
```

サーバ側で行う処理は多くないが、いくらかはあると仮定します。また、OO言語を使っているとしましょう。素朴なアプローチでは、JSON documentを読み込み、そのデータを適切なオブジェクトグラフ、つまりorder、line-item、deliveryを持つ構造へ変換し、何らかの処理を適用してから、クライアント向けにオブジェクトグラフをJSONへserializeすることになるかもしれません。

こうした状況の多くでは、よりよい進め方があります。データはJSONらしい形のまま保ちながら、それでも操作を調整するためにオブジェクトで包むのです。多くのプログラミング環境には、documentを受け取り、汎用データ構造へdeserializeする汎用ライブラリがあります。つまりJSON documentならリストと辞書の構造へdeserializeされ、XML documentならXML nodeの木へdeserializeされます。

そのうえで、この汎用データ構造をorderオブジェクトのフィールドに入れられます。RubyとJSONを使った例を示します。

```ruby
class Order...

  def initialize jsonDocument
    @data = JSON.parse(jsonDocument)
  end
```

データを操作したいときは、通常どおりオブジェクトにメソッドを定義し、このデータ構造にアクセスして実装できます。

```ruby
class Order...

  def customer
    @data['customer']
  end

  def quantity_for aProduct
    item = @data['items'].detect{|i| aProduct == i['product']}
    return item ? item['quantity'] : 0
  end
```

より複雑なロジックの場合も同じです。

```ruby
class Order...

  def outstanding_delivery_for aProduct
    delivered_amount = @data['deliveries'].
      map{|d| d['items']}.
      flatten.
      select{|d| aProduct == d['product']}.
      inject(0){|res, d| res += d['quantity']}
    return quantity_for(aProduct) - delivered_amount
  end
```

クライアントへ送る前に、embedded documentを豊かにすることもできます。

```ruby
class Order...

  def enrich
    @data['earliestShipDate'] =
      @data['deliveries'].
      map{|d| Date.parse(d['shipDate'])}.
      min.
      to_s
  end
```

必要なら、embedded documentのsub-treeに対して、似たようなオブジェクトを作ることもできます。

```ruby
class Order...

  def deliveries
    @data['deliveries'].map{|d| Delivery.new(d)}
  end
```

```ruby
class Delivery

  def initialize hash
    @data = hash
  end

  def ship_date
    Date.parse(@data['shipDate'])
  end
```

ここで注意すべきことのひとつは、このようなobject wrapperは通常のオブジェクトとまったく同じではないという点です。上のコード片で返されるdeliveryオブジェクトは、より普通の構造に配置されたオブジェクトに期待するような等価性の意味を持ちません。

比較的まれであるにもかかわらず、embedded documentはオブジェクト指向によく合います。カプセル化されたデータの要点は、データ構造を隠すことです。そのため、オブジェクトの利用者はorderの内部構造を**知る必要も気にする必要もありません**。

関数型プログラミングに詳しい人は、汎用データ構造を一連の関数へ流していくスタイルに気づくでしょう。このオブジェクトは、汎用データ構造を操作するためのnamespaceを提供している、と考えることができます。

embedded documentが最もよくはまるのは、データストアから得たdocumentと同じ形でそれを提供しつつ、それでもそのデータに何らかの操作を加えたい場合です。JSON documentの中身にアクセスする必要がまったくないなら、汎用データ構造へdeserializeする必要すらありません。orderオブジェクトに必要なのは、constructorとJSON表現を返すメソッドだけです。

一方で、データに対してより多くの作業をするようになる、つまりサーバ側ロジックが増える、別の表現へ変換する、といった場合には、データをオブジェクトグラフへ変換する方が簡単かどうかを考える価値があります。

### 注

計算作業の無駄だと論じる人もいるかもしれません。ただし、それが大きな意味を持つなら私は驚きます。どんな性能上の主張でも同じですが、測定を伴わない限り、オブジェクトグラフへ変換することに対する性能上の反論は受け入れません。

このメソッドでcollection pipelineが連鎖していることに注目してください。私のささやかな不満のひとつは、関数型の支持者の中に、このスタイルのコードはオブジェクト指向ではないと言う人がいることです。C++やJavaの背景を持つ人にはなじみが薄く見えるかもしれませんが、このスタイルはSmalltalkerにとってはまったく自然です。
