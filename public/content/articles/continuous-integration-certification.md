# Continuous Integration Certification

## 要約

この記事は、Jez Humble が講演で使う3つの質問を「Continuous Integration の認定試験」として紹介する、少し冗談めいた文章です。しかし中核には、CI の本質はツールではなく、共有 mainline へ頻繁に統合し、ビルドをすばやく緑に戻すチームの働き方だという重要な主張があります。

多くの人は CI server を feature branch に走らせているだけで CI をしていると思いがちです。この記事は、それを CI theater と呼び、Continuous Integration の名前が持つ意味を薄めてしまうと警告しています。

## 読むときの観点

- CI を「サーバーやツール」ではなく「人間の workflow」として読む。
- 共有 mainline へ少なくとも毎日 push しているかを見る。
- 各 commit が自動 build と test を引き起こすか確認する。
- build failure を10分以内に green へ戻せるかが大きな分かれ目になる。

## 原文の翻訳

Continuous Integration は、software development で人気のある技法です。カンファレンスでは多くの開発者がそれを使っていると話し、Continuous Integration tools はほとんどの開発組織で一般的です。しかし、まともな技法には certification program が必要だということは、誰もが知っています。幸いなことに、そのようなものは存在します。

それは continuous delivery と devops の第一人者のひとりによって開発され、驚くほど短時間で実施できる一方、結果については非常に洞察に富むことで知られています。かなり成熟しているにもかかわらず、知られるべきほどには知られていません。そこで、この技法のファンとして、この certification program を読者に共有することが重要だと思いました。Continuous Integration の認定を受ける準備はできていますか。そして、その test が明らかにする衝撃の真実にどう向き合うのでしょうか。

ここまで読んだ常連読者は、parody post に出くわしたのかと思っているかもしれません。はい、私は冒頭の teaser で少し遊んでいます。しかし良い冗談と同じく、その中には重要な真実の核があります。適切な Continuous Integration のための非常に優れた test が、Jez Humble によって作られています。彼は確かに ContinuousDelivery の第一人者です。その test は短時間ででき、彼は講演中に audience へよく実施しています。

唯一の問題は、彼がそれを certification test と呼ぶのを私が聞いたことがないことです。これは、金儲けの企みに対する彼の vision の欠如を示しています。

彼は通常、certification process を、Continuous Integration をしている人は手を挙げてください、と audience に尋ねることから始めます。たいていは audience の大半が手を挙げます。

次に、チームの全員が、少なくとも毎日、共有 mainline、git では通常 shared master、へ commit して push しているなら手を挙げたままにしてください、と尋ねます。

半分以上の手が下がります。

続いて、そのような commit のたびに automated build and test が走るなら手を挙げたままにしてください、と尋ねます。残った手の半分が下がります。

最後に、build が失敗したとき、通常10分以内に green に戻るかを尋ねます。この段階での green は commit build、典型的には compilation と unit tests が通ることを意味します。production release のためには full DeploymentPipeline を走らせることを通常期待しますが、repository は commit build が green になれば developers が作業するには問題ない状態であるべきです。commit build は10分以内で終わるべきなので、簡単な修正ならすばやく直して commit build を再実行できます。10分以内に修正して green commit build を得られないなら、最後の green build へ revert すべきです。

この最後の質問まで残る手は、ほんのわずかです。その人たちが、この certification test に合格した人です。

これは単純な一連の質問ですが、Continuous Integration の中核を突いています。全体の考え方は、誰も他の人から大きくずれた code base 上で作業していない、ということです。Continuous Integration とは、チームが code の現在状態を本当に把握し、大きく危険な merge を避け、必要なだけ refactor できるということです。

最初に多くの人が手を挙げる理由は、Continuous Integration は feature branches に対して「Continuous Integration Server」を走らせることだ、という一般的な見方にあります。しかし Continuous Integration は、Kent Beck が ExtremeProgramming の一部として最初に説明し、名付けたとおり、tool とは関係ありません。初めは human workflow であり、Jim Shore はそれがそうあるべきだと見事に論じました。

source code repository に対して daemon process を走らせるという考え方は後から来たもので、役には立ちます。しかしそれが Continuous Integration であるのは、**人々が毎日 commit する共有 mainline に対して実行される場合だけ**です。それ以外、たとえばすべての FeatureBranch に対してそのような process を走らせることは、名前を貶める CI theater であり、この手法を行う価値を生む benefits をもたらさない workflow になります。

CI theater の問題から、Trunk-Based Development という名前を使う人もいます。SemanticDiffusion によって「Continuous Integration」という用語が役に立たなくなったと主張するのです。その見方は理解できますが、私は semantic diffusion に屈するべきではないと思います。むしろ「agile」や「refactoring」のように同じ攻撃を受けている他の用語と同じく、Continuous Integration の正しい意味を説明し直し続ける必要があります。結局のところ、Kent はこの用語の定義を非常に明確にしていました。別の名前を使うことは、Extreme Programming community を通じてこの技法を広めた彼の重要な役割を小さくしてしまいます。
