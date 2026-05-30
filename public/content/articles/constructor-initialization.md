# Constructor Initialization

## 要約

Constructor Initializationは、オブジェクトが必要とするcollaboratorを、生成メソッドでまとめて渡す初期化方法です。オブジェクトを最初からある程度妥当で使える状態にできるため、Fowlerは基本的にこの方法を第一候補にしています。

ただし、正当な組み合わせが非常に多い場合や、コンストラクタ引数が多すぎる場合には注意が必要です。多すぎる引数はData ClumpなどのCode Smellを示していることがあります。

## 読むときの観点

- オブジェクトが生成直後から使える状態になる点を見る。
- 必須collaboratorと任意collaboratorを分けて考える。
- immutableな属性と更新可能な属性の違いを表しやすい。
- 長いコンストラクタ引数リストはData Clumpの兆候として読む。

## 原文の翻訳

Constructor Initializationは、オブジェクトが必要とするすべてのcollaboratorを、そのオブジェクトの生成メソッドへ渡す方法です。これはSetter Initializationの代替です。

たとえば、firstname、lastname、そしてお気に入りのバーのコレクションを持つpersonを作るには、次のような形になります。

```ruby
mf = Person.new('martin', 'fowler',
                ['Turners Oyster Bar', 'Square and Compass'])
```

こうすることで、オブジェクトが常に、すぐ使える程度には整った状態にあると確信できます。また、1行でオブジェクトを動かし始められる、かなりコンパクトな方法でもあります。そのオブジェクトでやりたいことが1つだけなら、その1行で代入したりメソッドを呼び出したりもできます。つまり、余計な変数を置いておく必要がありません。

必要なcollaboratorをすべてconstructorで宣言すると、どのcollaboratorが必要なのかが明確になります。そのため、そのクラスを動かし始める方法を見つけやすくなります。有効な必須collaboratorの組み合わせごとに、constructor methodが1つ必要になります。よく必要になる任意collaboratorを含むconstructorも用意しておくと、たいてい便利です。

この方法では、immutableな属性と更新可能な属性の違いも見えやすくなります。immutableな属性には設定用メソッドがなく、単に生成メソッドで初期化されるからです。

Constructor Initializationは私の第一候補です。この方法でセットアップするのが難しい場合もあり、私もときどきsetter initializationを好むことがあります。しかし、ほとんどの場合、**constructor initializationが最もよい選択**です。

### よくある問題

新しいオブジェクトについて、正当な組み合わせがたくさんある場合はどうでしょうか。この方法を使うと、とてつもない数のconstructor methodが必要になるのではないかと心配する人がよくいます。たいていの場合、これは問題になりません。数個しかないからです。ここで本当に必要なのは必須collaboratorだけであり、その組み合わせが一握りを超えることはほとんどありません。

constructorへ渡すcollaboratorがたくさんある場合はどうでしょうか。長い生成パラメータリストは、他の長いパラメータリストと同じくCode Smellです。私がそうしたものを見ると、多くのパラメータはData Clumpであり、それ自体のオブジェクトに置き換えるべきだと分かることがよくあります。とはいえ、constructor methodが他のメソッドより多くのパラメータを持つことは珍しくありません。ただし、constructorはdata clumpを見つけるよい場所です。

これはContextual Validationとどう整合するのでしょうか。ここでのcontextは、オブジェクトの基本的な使用、つまり最小限有用な状態です。それは他のさまざまな活動にとっては妥当ではないかもしれませんが、有用であるには十分妥当であるべきです。
