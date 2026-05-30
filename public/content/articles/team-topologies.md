# Team Topologies

## 要約

大規模なソフトウェア活動では、多くの人を効果的なチームへ分ける必要があります。Team Topologies は、Matthew Skelton 氏と Manuel Pais 氏が開発した、ソフトウェア開発チームの組織を説明するためのモデルです。四つのチーム形態と三つの相互作用モードを定義し、business capability centric なチームが価値あるソフトウェアを継続的に提供できるようにします。

この記事の中心的な洞察は、stream-aligned team が full-stack かつ full-lifecycle の責任を持つと、認知負荷が高くなりがちだという点です。Platform team、enabling team、complicated-subsystem team は、その認知負荷を下げ、stream-aligned team が流れを最大化できるようにするための組織上の道具として説明されています。

## 対応範囲

本文と本文中の関連記事紹介を翻訳しています。謝辞、参考情報、注、画像そのものは省略しています。

## 読むときの観点

- チームの種類を肩書きではなく、認知負荷をどう下げるかという観点で見る。
- platform は標準化やコスト削減のためだけではなく、stream-aligned team の負担を減らすためにあると捉える。
- team topology を固定的な組織図ではなく、Conway's Law を意識してソフトウェア構造へ影響を与えるモデルとして読む。
- 四つのチーム形態と三つの相互作用モードは、現実を単純化するための制約だと見る。

## 原文の翻訳

大きな会社のソフトウェア資産のような大規模なソフトウェア活動には、多くの人が必要です。そして多くの人がいるときは、その人たちを効果的なチームへどう分けるかを考えなければなりません。Business Capability Centric なチームを作ることは、ソフトウェア活動を顧客のニーズに反応しやすくします。しかし、必要とされるスキルの幅が、そうしたチームをしばしば圧倒します。

Team Topologies は、Matthew Skelton 氏と Manuel Pais 氏が開発した、ソフトウェア開発チームの組織を説明するためのモデルです。これは四つのチーム形態と三つのチーム間相互作用モードを定義します。このモデルは、business-capability centric なチームが、価値あるソフトウェアを安定して流し続けるという仕事をうまく果たせるよう、健全な相互作用を促します。

この枠組みにおける主な種類のチームは stream-aligned team です。これは、単一のビジネスケイパビリティのためのソフトウェアに責任を持つ Business Capability Centric なチームです。これらは長く続くチームであり、自分たちの取り組みを、そのビジネスケイパビリティを高める software product の提供として考えます。

各 stream-aligned team は full-stack かつ full-lifecycle です。front-end、back-end、database、business analysis、feature prioritization、UX、testing、deployment、monitoring など、ソフトウェア開発全体に責任を持ちます。彼らは Outcome Oriented であり、business analysis、testing、database といった機能に焦点を当てる Activity Oriented なチームではなく、ビジネス成果に焦点を当てます。しかし大きくなりすぎるべきではなく、理想的には Two Pizza Team です。

大規模な組織には、このようなチームが多数あります。それぞれが支援するビジネスケイパビリティは異なりますが、data storage、network communications、observability といった共通のニーズを持ちます。

このような小さなチームには、認知負荷を減らす方法が必要です。たとえば data storage の問題ではなく、ビジネスニーズの支援に集中できるようにするためです。これを実現するうえで重要なのは、焦点ではない関心事を引き受ける platform の上に構築することです。多くのチームにとって、platform は、database-backed web application のための Ruby on Rails のように、広く利用できる third party platform でありえます。

しかし多くの product では、そのまま使える単一の platform は存在しません。チームはいくつかの platform を見つけ、統合しなければなりません。より大きな組織では、さまざまな内部サービスにアクセスし、企業標準に従う必要があります。

### What I Talk About When I Talk About Platforms

今日では誰もが、大規模な digital product の delivery を速めるために「platform」を作っています。しかし、効果的な digital platform とは何でしょうか。一部の組織は、自分たちの組織構造と operating model に先に取り組まないまま、既存の shared services の上に構築しようとしてつまずきます。

この問題は、組織向けの internal platform を構築することで対処できます。そのような platform は、third-party services、ほぼ完成した platform、internal services の統合を担うことができます。Team Topologies は、これを作るチームを、想像力には欠けるが賢明にも、platform team と分類します。

小さな組織では、外部から提供される一連の product の上に薄い層を作る単一の platform team でやっていけます。しかし、より大きな platform には、two-pizzas で養える人数を超える人々が必要になります。そのため著者たちは、多数の platform teams からなる platform grouping という説明へ移りつつあります。

platform の重要な特徴は、ほとんど self-service で使えるように設計されていることです。stream-aligned teams は引き続き自分たちの product の運用に責任を持ち、platform team との手の込んだ collaboration を期待せずに、platform の利用を自分たちで方向づけます。Team Topologies の枠組みでは、この相互作用モードは X-as-a-Service mode と呼ばれ、platform が stream-aligned teams に対する service として機能します。

ただし platform teams も、自分たちの services を product として構築する必要があります。そのためには、顧客のニーズを深く理解しなければなりません。これには多くの場合、その service を構築している間、別の相互作用モードである collaboration mode を使う必要があります。Collaboration mode は、より濃密な partnership 型の相互作用であり、platform が成熟して x-as-a service mode に移れるようになるまでの一時的なアプローチとして見るべきです。

ここまでのところ、このモデルは特に独創的なものを表しているわけではありません。組織を、business-aligned なチームと technology support のチームに分けることは、enterprise software と同じくらい古いアプローチです。近年、多くの書き手が、こうした business capability teams が full-stack と full-lifecycle に責任を持つことの重要性を表明してきました。

私にとって Team Topologies の明るい洞察は、business-aligned なチームを full-stack かつ full-lifecycle にすると、しばしば過剰な認知負荷に直面し、小さく反応のよいチームにしたいという望みに反する、という問題に焦点を当てたことです。platform の主要な利点は、この認知負荷を減らすことにあります。

Team Topologies の重要な洞察は、platform の主な利点が、**stream-aligned teams の認知負荷を減らすこと**にあるという点です。

この洞察には深い含意があります。まず、platform teams が platform についてどう考えるべきかを変えます。client teams の認知負荷を減らすことは、標準化やコスト削減を主目的とする platform とは異なる設計判断や product roadmap につながります。platform の外側でも、この洞察は Team Topologies のモデルをさらに発展させ、あと二つのチーム種類を特定することにつながります。

一部の capability には、多くの stream-aligned teams にとって重要なテーマを習得するために、かなりの時間とエネルギーを費やせる専門家が必要です。security specialist は、stream-aligned team の一員でいる場合よりも多くの時間を、security issues の研究や、より広い security community とのやり取りに使えるかもしれません。そのような人々は enabling teams に集まります。enabling teams の役割は、他のチームの中に関連スキルを育て、それらのチームが独立性を保ち、自分たちの services をよりよく所有し進化させられるようにすることです。

これを達成するため、enabling teams は主に Team Topologies の三つ目で最後の相互作用モードを使います。Facilitating mode は coaching の役割を伴います。enabling team は standards を書いたり遵守を保証したりするために存在するのではなく、同僚を教育し coaching することで、stream-aligned teams がより autonomous になるようにするために存在します。

stream-aligned teams は、顧客にとっての価値の流れ全体に責任を持ちます。しかし、stream-aligned team の仕事の一部が十分に難しく、それに集中する専任グループが必要になる場合があります。これが四つ目で最後のチーム種類、complicated-subsystem team につながります。complicated-subsystem team の目的は、その複雑な subsystem を使う stream-aligned teams の認知負荷を減らすことです。

その subsystem の client team が一つしかなくても、これは価値のある分割です。多くの場合、complicated-subsystem teams は client と x-as-a service mode でやり取りしようとしますが、短い期間には collaboration mode を使う必要があります。

Team Topologies には、チームとその関係を示すための図記号のセットがあります。現在の標準で使われている記号は、書籍で使われているものとは異なります。最近の記事では、これらの図をどう使うかが詳しく説明されています。

Team Topologies は、Conway's Law の影響を明示的に認識して設計されています。Team Topologies が促すチーム組織は、人間の組織とソフトウェアの組織の相互作用を考慮します。Team Topologies の支持者たちは、そのチーム構造が、将来のソフトウェアアーキテクチャの発展を、ビジネスニーズに沿った、反応しやすく分離された components へ形づくることを意図しています。

George Box は「すべてのモデルは間違っているが、役に立つものもある」と見事に言いました。したがって Team Topologies も間違っています。複雑な組織を、たった四種類のチームと三種類の相互作用に単純に分解することはできません。しかし、このような制約こそがモデルを有用にします。Team Topologies は、人々に、より効果的な運営方法へ組織を進化させるよう促す道具です。それは stream-aligned teams が、認知負荷を軽くすることで flow を最大化できるようにするものです。
