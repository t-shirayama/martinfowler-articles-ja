# Humane Interface

## 要約

Humane Interface は、人がよくやりたいことを調べ、よくある操作を本当に簡単にできるように API を設計する考え方です。
Minimal Interface よりもメソッド数は多くなりがちですが、利用者が同じ処理を何度も書かずに済むようにします。

この記事は、Ruby の `Array` と Java の `List` を対比しながら、API の大きさ、便利メソッド、命名、エイリアスの意味を論じます。
焦点は単なる好みではなく、API の読み書きのしやすさと、利用者の共通作業をどこまでライブラリ側が引き受けるかにあります。

## 読むときの観点

- Minimal Interface との対比で、何を「余分」と見るかを考える。
- `last` や `flatten` のような便利メソッドが、読みやすさと重複削減にどう効くかを見る。
- よく使うメソッドほど短い名前にする考え方に注目する。
- API を小さく保つコストと、利用者に繰り返し作業を負わせるコストを比べる。

## 原文の翻訳

Ruby の人たちとしばらく過ごしていると、「Humane Interface」という言葉によく出会いました。これは、クラスの interface を書くときの Rubyist 的な態度の一部を表しています。また、API 設計における2つの流派の対比を示すものでもあると思います。もう一方は Minimal Interface です。

Humane Interface の本質は、人々が何をしたいのかを見つけ、そのよくある場合を本当に簡単にできるように interface を設計することです。

Minimal Interface との明らかな対比は、Humane Interface はかなり大きくなりがちであり、実際 Humane Interface の設計者は interface が大きいことをあまり気にしない、という点です。とはいえ、Humane Interface を持つクラスの実装まで大きくなければならない、という意味ではありません。両者の基本的な機能は、よく似ていることが多いのです。

Humane Interface と Minimal Interface の違いを見るよい方法は、Java と Ruby のリスト部品を比べることです。Java には `java.util.List` という interface があり、25個のインスタンスメソッドを宣言しています。Ruby には `Array` クラスがあります。これは名前は配列ですがリストでもあり、78個のメソッドを持っています。この大きさの違いは、ここに異なるスタイルがあることを示す手がかりです。もっとも、この違いには他の理由もあります。どちらの部品も基本的には同じサービスを提供しますが、Ruby の array には多くの追加機能が含まれています。これらの機能はすべて、Java の Minimal Interface の上に組み立てられる比較的小さなものです。

違いを示すために、小さな例を取り上げましょう。リストの最後の項目を取得する場合です。Java では次のようにします。

```java
aList.get(aList.size -1)
```

Ruby では次のようにします。

```ruby
anArray.last
```

実のところ、これはさらに印象的です。Ruby の `Array` には `first` メソッドもあります。そのため、`anArray[0]` と書く代わりに、`anArray.first` と書けます。

より大きな機能要素もあります。Ruby の `Array` には、入れ子になった配列を取り、単一レベルへ変換する `flatten` メソッドがあります。

```text
irb> [1,2,[3,4,[5,6],7],8].flatten
=> [1, 2, 3, 4, 5, 6, 7, 8]
```

ここでのポイントは、`last` のように単純なものでも、`flatten` のように複雑なものでも、これらの機能はすべて、リストクラスのサイズを増やさずにクライアント自身が書けるということです。Minimalist は、こうした振る舞いを支えるのに必要な最小限のメソッド集合に注目する傾向があります。一方で Humane Interface の設計者は、必要とされるメソッドを追加しようとします。こうした追加メソッドは、しばしば convenience method と呼ばれます。Minimalist はこの言葉を褒め言葉とは受け取りません。

ここで疑問が生まれます。「Humane Interface に何を追加すべきかは、何を基準に決めるのか」。誰かが欲しがるかもしれないものをすべて入れれば、非常に複雑なクラスになります。Humane Interface の設計者は、クラスの最も一般的な使われ方を見極め、**その使い方を簡単にするように interface を設計**しようとします。

この原則は、追加するメソッドだけでなく、名前の付け方にも影響します。RubyConf で Tanaka Akira は、よく使うメソッドには短い名前を好む価値を指摘しました。そうしたメソッドは頻繁に使われるため、短い名前でも覚えやすくなります。また、入力や読む量を減らせるので、より有用でもあります。例として、`DateTime` の `parse` メソッドがあります。これは一般的な日付形式を標準的に parse します。一方で、より柔軟な `strptime` は任意の形式を扱えますが、使う頻度は低くなります。

この命名原則は、Minimalist のアプローチと衝突するものではありません。実際、Java の `List` interface が登場したとき、従来の `Vector` の `elementAt` メソッドは `get` に変わりました。

Ruby の Humane Interface 哲学から生まれる、もうひとつ興味深い帰結は、メソッド名の aliasing です。リストの長さを知りたいとき、`length` を使うべきでしょうか、それとも `size` でしょうか。あるライブラリは一方を使い、別のライブラリはもう一方を使います。Ruby の `Array` には両方があり、alias として示されているため、どちらの名前でも同じコードが呼ばれます。Rubyist の見方では、利用者にどちらだったか覚えさせるよりも、ライブラリが両方を持つほうが簡単なのです。

どちらの interface 設計スタイルが最善かについては、長く退屈な議論がいくらでもできます。ここでは Humane Interface を支持する議論を要約してみます。反対側の議論については Minimal Interface を見てください。

オブジェクトの強みの多くは、データではなく振る舞いにあります。最小限だけを提供しようとすると、複数のクライアントが共通の場合のコードを重複して書くことになります。`flatten` のような場合、たくさんの人が自分で再帰関数を書くことになります。難しくはありません。しかし、それほど珍しくない場合に、なぜわざわざ利用者が書かなければならないのでしょうか。

`last` のような単純な場合でさえ、読む人はイディオムを覚えなければなりません。直接読める単純なメソッドがあるのに、なぜ間接的なものを見なければならないのでしょうか。よいソフトウェアは利用者を第一に考え、利用者の生活を楽にします。**Humane Interface はその原則に従います**。

Humane Interface は、クライアントが作業しなくてよいように、より多くの仕事をします。特に、API の人間の利用者には、よくある作業を読み書きの両方で簡単にするものが必要です。

どちらの側にもよい議論があります。個人的には Humane Interface のアプローチに傾いています。ただし、それがより難しいとも思っています。

### Follow Ups

この記事はいくらか議論を呼び、それによって興味深く有用な議論が生まれました。いずれ、そのリンクを読む助けになるような説明を書ければと思っていますが、それまでは一覧にしておきます。議論の多くは、Elliotte Harold による短いながらも力強い Humane approach 批判と、James Robertson の返答から始まりました。Robertson の投稿についたコメントも必ず確認してください。その後、Cees de Groot、Antonio Vieiro、David Hoefler、James Higgs、Peter Williams、Cedric Beust、John D. Mitchell、Stuart Roebuck、Elliotte Harold (2)、Jon Tirsen、Hitesh Jasani、Blaine Buxton、Ramnivas Laddad、Anders Noras、James Robertson (2)、Kieth Ray、James Robertson (3)、Elliotte Harold (3)、Charles Miller、Rob Lally、Bernard Notarianni、David Crow、Jim Weirich、Jim Weirich (2)、Ian Bicking、Brian Foote、Justin Gehtland、Tom Moertel、Antonio Vieiro (2)、Kris Wehner、The Server Side、Ravi Mohan、Danny Lagrouw、Piers Cawley、Peter Williams、Florian Frank、Chris Siebenmann などによる多くの投稿が続きました。

ほかにもあります。すべてを見つけたわけではありませんし、ここでは議論に何か興味深いものを加え、罵倒を避けていると思うものだけを選んでいます。Ruby Array 対 Java List の例に注目しすぎて、背後にある原則から離れがちな傾向がありましたが、それは自然なことです。議論はいくつかのよい方向へ進んでいます。機会があれば、そのうちの1つか2つを掘り下げてみたいと思います。

あるいは、上に挙げた多くの抜粋を含んでいる Joey deVilla を読むだけでもよいでしょう。
