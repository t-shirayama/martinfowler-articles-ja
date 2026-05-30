# Setter Initialization

## 要約

Setter Initializationは、空のオブジェクトを作ってからsetter methodで必要なpropertyを設定していく初期化方法です。ConstructorInitializationの代替であり、用途ごとに必要なcollaboratorだけを渡せるため、オブジェクトの組み立てに柔軟性があります。

Fowlerは、値を一度にすべて設定しなくてよい点、長いconstructor parameter listや多数のconstructorを避けられる点、setter名が引数の意味を説明してくれる点を利点として挙げています。

## 読むときの観点

- constructorで一度に揃える方法との違いを見る。
- 後からしか得られない値やcollaboratorを扱いやすい点に注目する。
- 名前付きsetterが、位置引数だけのconstructorより読みやすい場面を考える。

## 原文の翻訳

setter initializationでは、空のオブジェクトを構築し、その後でsetter methodを使って、進めながらさまざまなpropertyを設定します。これはConstructorInitializationの代替です。

たとえばfirstname、lastname、お気に入りのbarのコレクションを持つpersonを作るなら、次のような形になるでしょう。

```ruby
mf = Person.new
mf.firstname = 'Martin'
mf.lastname = 'Fowler'
mf.add_bar "Turner's Oyster Bar"
mf.add_bar "Square and Compass"
```

このアプローチは、オブジェクトを組み立てるうえで最大限の柔軟性を与えてくれます。特定の用途に必要なcollaboratorだけを提供できるからです。

すべての値を一度に設定しなければならない状態から解放されます。これは、一部のオブジェクトが後の時点でしか利用できない場合に便利です。

各method callはコンパクトなので、constructorの長いparameter listや、選ぶべきさまざまなconstructorが並ぶ問題を避けられます。

Marko Schulzは、setter methodには新しいオブジェクトに対する使い道を説明する名前が付いている、と私に思い出させてくれました。これは、現在の多くの言語では位置引数しか持たないConstructorInitializationに比べて、目に見える利点です。非常に一般的な型、たとえばstringなどのconstructor parameterは、**すぐにとてもわかりにくくなり得ます**。
