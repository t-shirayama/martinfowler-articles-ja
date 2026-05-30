# Observable State

## 要約

Observable Stateは、外部から観測できる状態を指します。メソッドがオブジェクトの状態を変えないと言うとき、本当に重要なのは、内部のあらゆる状態が一切変わらないことではなく、query methodから見える状態が変わらないことです。

キャッシュやlazy initializationは、実際の内部状態を変えます。しかし、その変化が外部からのメソッド呼び出し結果に現れないなら、observable stateは変わっていません。

## 読むときの観点

- 状態を変えるメソッドと変えないメソッドを分ける理由を押さえる。
- 「実際の状態」と「観測可能な状態」を区別して読む。
- キャッシュの更新は内部状態の変更だが、外部から見える結果を変えてはいけない。
- lazy initializationを使うときは、観測可能な振る舞いが変わらないことを確認する。

## 原文の翻訳

あるメソッドがオブジェクトのobservable stateを変えない、と人々が言うとき、それは何を意味しているのでしょうか。

メソッドを、状態を変えるものと変えないものに分けることは、とても有用です。状態を変えないメソッド、私がqueryと呼ぶものは、他のメソッドとの順序関係を気にせず、どの文脈でも使えます。

ここでの重要な点は、それらがどんな状態も変えないということではありません。そうではなく、observable stateを変えないということです。オブジェクトのobservable stateとは、そのquery methodから検出できるものです。短い例をいくつか使って説明します。

最も単純な例はcacheです。次のようなrangeクラスを想像してください。

```ruby
# ruby
class MyRange
  attr_reader :start, :finish

  def initialize start, finish
    @start, @finish = start, finish
    @lengthCache = nil
  end

  def length
    @lengthCache = (@finish - @start) unless @lengthCache
    return @lengthCache
  end
end
```

ここには`lengthCache`変数があり、LazyInitializationを使って最初のアクセス時に埋められます。lengthCacheに値を入れることは、明らかにオブジェクトの実際の状態を変えます。しかしobservable stateは変えません。外側からは、オブジェクトの状態が変わったことを見分けられないからです。

外側から見分けられない、というのは、別のオブジェクトからMyRange上のどのメソッドを呼び出しても、その結果が、lengthCacheの値が埋まっているかどうかにかかわらず同じになる、という意味です。

通常、この効果を得るには、`MyRange`上のどのメソッドも、フィールドを直接使うのではなく、rangeを得るためにlengthメソッドを使うようにします。cacheは、変更が決して観測可能であってはならない状態のわかりやすい例です。どのようなlazy initializationであっても、**observable stateを変えてはならない**ということも同じです。
