# DIP in the Wild

## 要約

Dependency Inversion Principle、DIPは1990年代初めからある原則ですが、実際の問題を解いている最中には忘れられがちです。この記事では、DIPを「低レベルの詳細ではなく、よりdomainに近い高い抽象へ依存を向けること」と捉え、実プロジェクトでの適用例を示しています。

例として、logging APIを狭いgatewayで包む、databaseやJDBCをdomain向けRepositoryの背後に隠す、外部から与えられた非同期連携方式をsystem全体に漏らさない、そしてtimeをdomain conceptとして制御する、という流れが扱われます。

## 読むときの観点

- DIPをinterfaceやabstract classそのものではなく、依存先の抽象レベルの問題として読む。
- DI、IoC、DIPの違いを整理する。
- 一般的なlibraryや外部制約が、domainから見ると低すぎる抽象になる場面を探す。
- 「柔軟性」は常に価値ではなく、余分な選択肢やmethodが負担になることを見る。
- timeのような当然に見えるものも、必要ならsystem側で制御できる概念として読む。

## 原文の翻訳

Dependency Inversion Principle、DIPは1990年代初めからあります。それでも、問題を解いている最中には忘れやすいものです。いくつか定義を見たあとで、私が実際のプロジェクトで使ったDIPの適用例をいくつか紹介します。そこから、みなさん自身の結論を形作るための例を得られるはずです。

## ここに至るまで

Dependency Inversion Principleを私が最初に知ったのは、1994年ごろ、Robert Martin、いわゆるUncle Bobからでした。DIPは、多くのSOLID principlesと同じく、述べるのは簡単ですが、適用は奥深いものです。以下では、私が実プロジェクトで最近使った適用例を取り上げます。ここで話すものはすべて2012年6月時点でproductionにあり、2013年半ばの時点でもproductionで動いています。中にはもっと前からあるものもありますが、繰り返し現れます。それは、基本が依然として重要だということを私に思い出させてくれます。

### DIPの概要

Dependency Inversion Principleの表し方はいくつもあります。

- 抽象は詳細に依存すべきではない。
- codeは、同じか、より高い抽象レベルにあるものに依存すべきである。
- 高レベルの方針は低レベルの詳細に依存すべきではない。
- 低レベルの依存を、domainに関連する抽象の中に取り込む。

これらに共通しているのは、systemのある部分から別の部分を見たときの見え方です。**依存は、より高いレベルの、domainに近い抽象へ向かう**ように努めます。

## Domain Analysis: プラトン的理想主義の問題

私がdomain analysisを正式に知ったのは1990年代初めでした。私に強い影響を与えた最初の資料は『Object-Oriented Development: The Fusion Method』でした。

当時、私は考慮している問題とは独立にdomain analysisをしていました。その10年の後半になって、問題を考慮した方がdomain analysisはうまくいく、という結論へゆっくり近づきました。なぜでしょうか。結局、すべてのものは複数の形で他のすべてと関係しているからです。domain analysisはModelingの一種です。少なくとも私にとって、modelingで重要なのは、重要なdetailsだけを考えることです。

何が重要かはどう決めるのでしょうか。達成したいことに関係するdomainの部分だけを考えます。

ここには鶏と卵の問題があります。domainはproblemから影響を受け、problemもdomainから影響を受けます。system boundaryも関係します。こうした相互依存すべてに対処するには、三角測量をします。problem、domain、system boundaryについて理解が進むほど、特定の抽象が適切かどうかを考えやすくなります。

この記事でdomainと言うとき、私は、文脈の外側に存在する神話的なdomainではなく、feature setによって限定されたdomainを指しています。ある意味では、これはdomain analysisにYAGNIを適用したものです。

### なぜ依存を気にするのか

依存はriskです。たとえば、私のsystemがJava Runtime Environment、JREのinstallを必要としていて、それがinstallされていなければ、そのsystemは動きません。systemはたいてい何らかのOperating Systemも必要とします。userがweb経由でsystemにaccessするなら、userにはbrowserが必要です。これらの依存の中には、制御したり限定したりできるものもあれば、無視できるものもあります。たとえば、次のようなものです。

- JRE要件の場合、deployment environmentに適切なversionのJREがinstallされていることを確認できます。あるいはenvironmentが固定されているなら、そのJREに合わせてcodeを調整することもできます。Puppetのようなtoolを使って、より単純で既知の開始imageからenvironmentを構築し、environmentを制御することもできます。いずれにしても、結果は深刻ですが、よく理解されており、緩和する選択肢もいくつかあります。私個人の好みは、CD寄りです。
- systemがString classを使うとき、おそらくその依存を反転させることはありません。ただし、Stringをprimitiveのようなもの、厳密には違いますが十分近いもの、と考えるなら、多数のStringを操作することはPrimitive Obsessionに似始めます。単にString methodを露出するのではなく、それらのStringを包むtypeを導入し、そのStringの使い方に合ったmethodを追加するなら、その結果のtypeがStringよりもdomainに近い限り、それは一種のDependency Inversionに見え始めます。
- browserの場合、modernな体験を提供したいなら、すべてのbrowserをsupportするのは難しいでしょう。すべてのbrowserとversionを許容しようとすることも、比較的新しいbrowserだけにsupportを限定することも、feature degradationを導入することもできます。この種の依存は複雑で、解決にはおそらく多面的なapproachが必要です。

依存はriskを表します。そのriskを扱うにはcostがかかります。経験、試行錯誤、あるいはteamの集合知を通じて、そのriskを明示的に緩和するかどうかを選びます。

### 何と比べて反転なのか

反転とは方向を逆にすることです。しかし、何と比べて逆なのでしょうか。Structured Analysis and Designのdesign部分と比べて、です。

structured analysis and designでは、高レベルの問題から始め、それを小さな部分に分割します。その小さな部分のどれかがまだ「大きすぎる」なら、さらに分割を続けます。高レベルのconcept、requirement、problemは、どんどん小さな部分へ分解されます。高レベルのdesignは、その小さく詳細な部分によって記述されるため、より小さく、より詳細な部分に直接依存します。これはtop-down designとしても知られています。次のproblem descriptionを考えてみてください。多少理想化し、きれいにしていますが、実際に現場で見つかったものです。

1. Energy Savingsをreportする
   1. dataを集める
      1. connectionを開く
      2. SQLを実行する
      3. ResultSetを変換する
   2. baselineを計算する
      1. baseline groupを決める
      2. time-sequence dataをprojectする
      3. date range全体で計算する
   3. reportを作る
      1. non-baseline groupを決める
      2. time-sequence dataをprojectする
      3. data range全体で計算する
      4. baselineとの差分を計算する
      5. 結果をformatする

energy savingsをreportするというbusiness requirementはdata gatheringに依存し、data gatheringはSQLの実行に依存します。依存が、problemの分解の仕方に沿っていることに注目してください。詳細であればあるほど、変わる可能性は高くなります。高レベルのideaが、変わりやすいものに依存しているのです。さらに、各stepは高いlevelの変更に非常に敏感です。requirementsは変わりがちなので、これは問題です。

私たちは、そのような分解に対して依存を反転させたいのです。

これとbottom-up compositionを対比してみましょう。domainに存在する論理的conceptを見つけ、それらを組み合わせて高レベルのgoalを達成できます。たとえば、powerを使うものがいくつかあり、それらをConsumersと呼ぶことにします。それらについて多くは知らないので、Consumer Repositoryを通して扱います。domainにはBaselineと呼ばれるものがあり、何かがそれを決定する必要があります。

Consumersは自分たちのEnergy usageを計算でき、それからBaselineで使われたenergyとすべてのConsumersで使われたenergyを比較して、Energy Savingsを決定できます。

図1: Bottoms Up

最初に行う作業は同じかもしれませんが、この再構想では、少し余分に作業することで、詳細を実現するさまざまな方法を導入する機会があります。

- repositoryを別のstorage mechanismに差し替えられます。そのinterfaceにはSQLへの言及がないので、in-memory solution、NoSQL solution、RESTful serviceを使えます。
- baselineを構築する代わりにAbstract Factoryを使えます。これにより、複数種類のbaseline calculationをsupportできます。これは、特定domainの現実を実際に反映しています。

これを読むと、ここにはOpen Closed Principleの考え方もあると気づくかもしれません。確かに関係しています。最初は、domainが示唆するlogical blockへproblemを分けます。systemが成長したら、追加scenarioに対応するために、それらのblockを使うか、何らかの形で拡張します。

### それは何を意味するのか

## Principlesについての実践的な見方

例に入る前に、design principlesについての私の現在、2013年半ばごろの見方を示しておきます。これらはしばしば「best practice」とみなされます。

- 私は「best practices」のfanではありませんが、あるcontextにおける良いideaは好きです。
- design principlesについては、次のように考えています。
  - ときには「破られる」べきである。
  - 互いに衝突することがよくある。
  - 単独で使うより、混ざり合うことでさらに良いものになることがよくある。
  - 他のprincipleと重なり合うことがよくある。
- free lunchはありません。すべての抽象にはcostがあります。

実のところ、「best practices」という言葉と同じように、「design principles」という呼び名に意味があるのかも疑問に思っています。SOLID principlesの場合、私はそれらを、馴染みがあるために何度も立ち返るfront-up ideaのように考えています。cohesionやcoupling、indirectionをもう1段増やすこと、といった基本に私はよく戻ります。何かをprincipleと呼ぶと、私がpragmaticであるとき、おそらくそのprincipleを破ることになります。

ある同僚は、「principle」をguidelineに置き換える方を好みます。私にもその方がしっくりきます。

principleと呼ぶにせよguidelineと呼ぶにせよ、design principleを無視するという情報に基づいた判断ができること、いわゆる『The Seven Stages of Expertise in Software』でいうJourneyman behaviorは、目指す価値のある場所です。

DIPが抽象に言及するとき、多くの人が抽象を次のものと混同していることに気づきました。

- interface
- abstract base class
- constraintとして与えられたもの、たとえばexternal system architecture
- solutionとして記述されたrequirementと呼ばれるもの

実際、これらはいずれも誤解を招くことがあります。

- interface: `java.sql.Connection`を見てください。`getAutoCommit()`、`createStatement()`、`getHoldability()`のようなmethodを、あなたのbusiness domainと比べてみます。database connectionにとっては妥当でも、あなたのsystemのuserがやりたいこととどう関係しているのでしょうか。そのつながりは、せいぜい薄いものです。
- abstract base class: abstract base classにもinterfaceと同じ問題があります。methodがdomainにとって意味を持つならよいかもしれません。software libraryにとって意味を持つだけなら、そうではないかもしれません。たとえば`java.util.AbstractList`を考えてみてください。歴史的出来事を増え続ける順序付きlistとして扱うdomainを想像します。この仮想domainでは、歴史記録からitemを`remove()`することに意味はありません。

List abstractionは、あなたの問題ではなく一般的な問題を解くためのものなので、少なくともこの1つのfeatureは、あなたのdomainでは意味を持ちません。`AbstractList`、あるいは別のList classをsubclass化することはできますが、そうしても、そのclassのあなたの用途には意味を持たないmethod、おそらく複数のmethodを露出してしまいます。clientに不要なmethodを見せることを受け入れた時点で、おそらくDIPとLiskov Substitution Principleの両方に違反しています。

- constraint/requirement: 私たちが作業を与えられたとき、その作業はmotivationとgoalを提供しているのでしょうか。それともproblemの解き方を語っているのでしょうか。そのrequirementはintegrationにmessage oriented middlewareを使わなければならないと語っていないでしょうか。あるいは、作業を終えるためにどのdatabase fieldを更新するかを語っていないでしょうか。actorのgoalが記述されている場合でさえ、そのgoalは現在のas-is processを言い換えているだけで、本来ならそのprocess自体を不要にするsystemを作れるのではないでしょうか。

### Dependency Inversionのことですよね

## Refactoringとfactoring

Martinがrefactoringについて話すとき、それは後から行うpracticeのことです。YAGNIは、必要だと分かるまではできるだけ少なく行うことを求めます。必要だと分かったとき、たとえばconstraintとして与えられたとき、refactoringの代わりに、これらのdesign principlesを使ってfactoringできます。

refactoringに加えてfactoringの余地はあるのでしょうか。YAGNIは「ない」と示唆するのでしょうか。私は、refactoringを避けるためのfactoringには多少の余地があると思います。problemを調べ始めるとき、私は古典的なanalysisをしています。SRPやDIPのようなdesign principlesに導かれながら、複雑なdomainを自分が飲み込めるものへ分解することはfactoringです。domainがよく理解されていない場合は、YAGNIに従うのがよいでしょう。

YAGNIはspeculative designを避けるためのものです。不要なfactoringは不要な作業につながります。design principlesを早い段階で適用するときは、YAGNI違反を避けるため、そのproblemのdomainというcontextの中で行うよう努めます。

2004年、Martin FowlerはDependency Injection、DIとInversion of Control、IoCについての記事を発表しました。DIPはDIやIoCと同じものでしょうか。違います。ただし、相性は良いものです。Robert Martinが最初にDIPを論じたとき、彼はそれをOpen Closed PrincipleとLiskov Substitution Principleの第一級の組み合わせであり、独自の名前を付けるに値するほど重要なものだと位置づけました。いくつかの例を使って、3つの用語を概観します。

- Dependency Injection

Dependency Injectionは、あるobjectが別の依存objectをどう知るかに関するものです。たとえばMonopolyでは、playerが2つのdiceをrollします。software playerがsoftware pair of diceに`roll()` messageを送る必要があると想像してください。player objectはdice objectへのreferenceをどう得るのでしょうか。gameがplayerに`takeATurn(:Dice)`と伝え、diceを渡すと想像します。gameがplayerにturnを取るよう伝え、diceを渡すことは、method level dependency injectionの例です。

代わりに、Player classがDiceを必要としていることを表明し、SpringのようないわゆるIoC containerによってauto-wireされるsystemを想像してください。私が2013年第1四半期時点で取り組んでいるsystemの最近の例では、Spring profilesを使っています。named profileはdemo、test、qa、prodの4つです。default profileはdemoで、10個のsimulated deviceと特定のtest pointを有効にしてsystemを起動します。test profileはsimulated deviceなし、test point有効で起動します。qaとprodはどちらも、cellular network越しにreal deviceへ接続し、test pointはloadされません。つまりproduction componentがtest pointを使おうとすると、systemは起動に失敗します。もう1つの例は、JavaとC++を混在させるapplicationです。systemがJVM経由で起動されるなら、C++ layerをsimulateするように構成されます。一方、C++経由で起動され、そのC++がJVMを起動するなら、C++ layerを叩くように構成されます。これらはすべてdependency injectionの一種です。

- Inversion of Control

Inversion of Controlは、誰がmessageを開始するかに関するものです。あなたのcodeがframeworkを呼ぶのでしょうか。それとも何かをframeworkへplug inし、そのframeworkがcallbackしてくるのでしょうか。これはHollywood's Law、つまり「こちらから電話しない。こちらから電話する」とも呼ばれます。たとえばSwingで`ButtonListener`を作るとき、interfaceのimplementationを提供します。buttonが押されると、Swingがそれに気づき、あなたが提供したcodeをcallbackします。

複数のplayerを持つMonopoly systemを想像します。gameはplayer間のinteractionをorchestrateします。playerがturnを取る時点になると、gameは、houseやhotelを売るといった移動前のactionがあるかをplayerに尋ね、その後dice rollに基づいてplayerを動かすかもしれません。現実世界では物理的なplayerがdiceを振ってtokenを動かしますが、それはboard gameがcomputerではないことによるartifactです。つまり、起きていることのphenomenological descriptionであって、ontological descriptionではありません。

playerが判断を下すのではなく、gameがplayerが判断できる時点を知り、それに応じてplayerに促していることに注目してください。最後の例として、Spring Message beanやJEE Message Beanは、containerに登録されたinterfaceのimplementationです。Queueにmessageが届くと、containerがbeanを呼び出してmessageを処理させます。containerはbeanのresponseに基づいてmessageを削除するかどうかまで行います。

- Dependency Inversion Principle

Dependency Inversionは、codeが依存するobjectの形に関するものです。DIPはIoCやDIとどう関係するのでしょうか。低い抽象のdependencyをDIでinjectすると何が起きるか考えてみてください。たとえば、Monopoly gameへJDBC connectionをinjectし、SQL statementを使ってDB2からMonopoly boardを読み込ませることはできます。

これはDIの例ではありますが、私のproblemのdomainよりもかなり低い抽象levelにある、おそらく問題のあるdependencyをinjectしている例です。MonopolyはSQL databaseが存在する何十年も前に作られたものですから、それをSQL databaseへcoupleすることは、不必要でincidentalなdependencyを導入することになります。Monopolyへinjectするなら、Board Repositoryの方がよいでしょう。

そのようなrepositoryのinterfaceは、SQL connectionで記述されるのではなく、Monopolyのdomainに適したものになります。IoCがcalling sequenceを誰が開始するかに関するものだとすると、設計の悪いcallback interfaceは、frameworkの低レベルなdetailsを、frameworkへplug inするために書くcodeへ押し込むかもしれません。そうなっているなら、business stuffの大半はcallback methodの外に出し、代わりにPOJOの中へ置くようにします。

DIは、あるobjectがdependencyをどう取得するかに関するものです。dependencyが外部から提供されるなら、そのsystemはDIを使っています。IoCは、誰がcallを開始するかに関するものです。あなたのcodeがcallを開始するなら、それはIoCではありません。container、system、libraryが、あなたが提供したcodeへcallbackしてくるなら、それはIoCです。

一方DIPは、あなたのcodeから呼び出し先へ送られるmessageにおける抽象levelに関するものです。確かに、DIやIoCをDIPと一緒に使うと、より表現力があり、強力で、domainに沿ったものになりがちです。しかしそれらは、全体問題の中の異なるdimension、あるいはforceに関するものです。**DIはwiring、IoCはdirection、DIPはshape**に関するものです。

### 次に扱うこと

Dependency Inversion Principleの定義を手にしたので、実地のDIPの例へ進みましょう。以下の例には共通する筋があります。systemの必要性に限定されつつ、dependencyの抽象levelをdomainへ近づけることです。

## 柔軟性にはcostがある

私がよくやってきたこと、また見てきたことの1つに、現在の問題を解くために必要な数を超えてmethodを追加し、classを「使いやすく」することがあります。それは「念のため」の考えから来るかもしれませんし、変更しにくいcode baseにつながったpracticeの歴史から来るかもしれません。つまり、後で必要になったときに追加するより、今入れておく方が楽だと見なされているのです。

残念ながら、methodが増えると、誤ったcodeを書く方法が増え、verifyすべきexecution pathが増え、「使いやすい」interfaceを使う際にdisciplineがより必要になります。classのsurface areaが大きいほど、そのclassを正しく使うのは難しくなりがちです。実際、surface areaが大きいほど、そのclassを正しく使うより、誤って使う方が簡単になりがちです。

### どのhammerを使うべきか

loggingを考えてみましょう。loggingはDevOpsを進める最善の方法とは限りませんが、広く実践されている方法のように見えます。私が最近関わったいくつかのprojectでは、loggingは最終的に問題になりました。問題はさまざまでした。

- 多すぎる。
- 足りない。
- 何をどのlevelでlogすべきかについて意見が合わない。
- どのlogging methodを使うかについて意見が合わない。
- どのlogging frameworkを使うかについて意見が合わない。
- Logger classの使い方が一貫しない。
- projectで使っているopen source project全体にまたがる、さまざまなopen source logging libraryのconfigurationが誤っている、または一貫しない。
- 利用中のopen source projectごとに異なるlogging frameworkが使われている。
- logging messageが一貫せず、logを使いにくくしている。
- あなた自身の経験をここに入れてください。

これは網羅的なlistではありませんが、中規模のprojectにいたことがあり、これらの話題のいくつかについて議論しなかったとしたら、私は驚きます。

### methodが多すぎる

図2を見てください。ここにはJDKに組み込まれたLoggerと、いくつかのopen source projectで使われている一般的な2つのopen-source logging frameworkが含まれています。見るべき重要な点は、各classにあるmethodの数です。

図2: 既存Loggerの複雑さ

JDKの`Logger` classだけを考えてみましょう。あなたはteamで働く新しいdeveloperです。できれば1人で働いていないことを願いますが、もし1人なら、おそらく「code baseを見て」と言われ、その後は自力で進めることになります。loggingが必要になったとき、どの`log` methodを使いますか。

図3: どのLog Methodか

そもそも`log`が正しいmethodなのでしょうか。code baseを検索してexampleを探すことはできます。最初に見つけたexampleを採用しますか。それとも複数の方法があるか確認しますか。

これは些細な例です。何でもないように見えます。私が大事にしている経験則があります。

> Nothing + Nothing + Nothing ... eventually equals something.
>
> -- Jerry Weinbergの言葉の意訳

この1つだけなら、本当に大した問題ではありません。しかしprojectでは、これだけで終わることはありません。どのmethodを使うべきかを知っておくことは、各developerの負担を少しだけ増やします。また、進行中のprojectやteamに人を加える難しさも増します。

このようなdetailは、些細で重要でないように見えるものですが、最終的にはtribal knowledgeのbucketに落ちていきます。健全な量のtribal knowledgeがteam identityに利点をもたらすことはあるかもしれませんが、不要な不一致につながるものは、おそらくcostに見合いません。

### performance上の考慮

この主張を支える別の論点があります。時が経つほど弱くなっている論点ですが、最初は少し分かりにくいかもしれません。次のcode exampleを考えてください。

```java
Logger logger = Logger.getLogger(getClass().getName());
String message = String.format("%s-%s-%s", "part1", "part2", "part3");
logger.log(Level.INFO, message);
```

このloggerの使い方は素直に見えますが、問題があります。loggerが最終的にINFO levelのmessageをrecordするかどうかに関わらず、String concatenationを実行してしまうのです。そのため不要な作業と追加のgarbage collectionが発生します。これを「正しく」書くなら、次のようになるはずです。

```java
Logger logger = Logger.getLogger(getClass().getName());
if (logger.isLoggable(Level.INFO)) {
  String message = String.format("%s-%s-%s", "part1", "part2", "part3");
  logger.log(Level.INFO, message);
}
```

これを覚えておく負担は書き手にあります。logging statementがいくつもあるsystem entry pointを想像してください。

- このcodeは複製されるでしょう。少なくとも、そう望みます。
- この種のdetailはessentialではなくincidentalです。
- codeを読むmental burdenを増やします。
- それに、DRY principleにも違反します。

Slf4jのようなmodern APIを使えば、この一部は対処されています。可変数のparameterを受け取り、連結前にcheckを行うmethodがあるからです。それは素晴らしいことですが、そうするとまた50個以上のmethodから選ぶ状態に戻ります。3人を超えるprojectで、loggerの一貫した使い方について議論が出なかった記憶はありません。したがって、methodの数は明らかに不要な、incidentalな複雑さの源になります。

これに対処するため、私はduplicationとcomplexityの必要性を減らすものが欲しいと思います。いくつかのprojectで私が行ってきたことの1つは、次のようなものです。

図4: APIを狭める

この新しいloggerを使うと、問題を起こしにくくなります。

```java
SystemLogger logger = SystemLoggerFactory.get(getClass());
logger.info("%s-%s-%s", "part1", "part2", "part3");
```

この特定のimplementationは、「modern」なJava 1.5 featuresを使っています。

```java
public void info(String message, Object... args) {
  if (logger.isInfoEnabled()) {
    logger.info(String.format(message, args));
  }
}
```

Martin Fowlerはこれをgatewayと呼んでいます。私はその名前が好きです。通り抜けるというideaと、あるものを別のものから分けるというideaの両方を想起させるからです。flexibilityを減らすことで、少し負担の少ないものになります。その分、次にtest-firstで書くcodeについて考える時間を使えます。

このsolutionは追加のmethod invocationを導入します。しかし、誤ったことをする可能性を取り除くことに比べれば、method invocationのcostは十分に見合うように思えます。modern runtimeでは、このmethodはdynamicにはinvokeされず、virtual dispatchなしで呼ばれるようにoptimizeされます。前回method invocationを測定したとき、2008年ですが、1秒あたり約2,000,000,000回実行できました。したがって、このわずかなoverheadは、loggerを使う可能性が高いsystemでは無視できます。

おまけとして、loggingのconfigurationがある場合、それを1か所で管理できます。よりDRYなcodeになります。

### 結論

logging libraryにおけるflexibilityは、一貫しない使い方、長いcode、あるいはsystem内のlogging状態に基づいて不要な作業を行うcodeへ簡単につながります。framework作者の観点からは、これは理にかなっています。loggingは概念的にはapplication levelに存在するかもしれませんが、frameworkのlogging implementationは、複数のJVM version、多様な使い方、そして万人向けであることをsupportできるだけ柔軟でなければなりません。

特定systemにおけるloggingの使い方は、よりfocusedでconsistentなものにできます。logging interfaceは通常、そのsystemがloggerに求めるものより低い抽象levelにあります。

## Solutionは抽象化されているが、それは私の問題ではない

SQL databaseを使うことは、あなたのsystemのessentialな部分なのでしょうか。本当のrequirementは、systemへ入力されたinformationがdurableであることなのでしょうか。どれくらい早く、どのuserに対してでしょうか。実のところ、こうした問いは以前の方が簡単でした。一般には問われなかったからです。

### 背景

前世紀、私たちはACID transactionを気にしていました。当時でさえ、私たちはたいてい、pessimisticなACIDと、last one winsやobject versioningのような、そこまで強くないoptimisticなものをtrade offしていました。今ではsystemは大きくなり、cloudやeventual consistencyを持つNoSQL solutionへ移ってきたため、状況はさらに多様です。

これはJavaとどう関係するのでしょうか。私はJDK 1.0.2で最初のapplicationに取り組み、deployしました。当時、databaseを扱いたいなら、だいたい次のような形でした。

図5: 最初にDatabaseがあった

Javaはこの問題を避け、vendor lock-inがありました。さらに悪ければ、SQLでもObject-Orientedでも「どんな」databaseでも扱えるようにcodeを書いていました。

Java 1.1でJDBCが登場しました。JDBC driverを見つけられる限り、databaseの使い方は改善しました。

図6: JDBCはある種のinterfaceを与えてくれた

しかし、これによりvendor lock-inを減らしてdatabaseを使いやすくなった一方、この抽象はtransactionやprepared statementなどをdomainへ漏れ出させました。JDBCは抽象levelを上げましたが、そのlevelはまだ低すぎました。

JDBCにはいくつもの改善があり、その後JDO、ORM、Hibernateや他のORM、そしてやや最近ではJPAが登場しました。Spring DataやHadesなどは無視しています。状況を大きく変えるものではないからです。注目すべきなのは、systemからdatabaseへ向かう矢印がまだたくさんあるということです。

図7: JPAは標準ORMを与えてくれた

Logging interfaceの議論と同じく、これらのinterfaceのどれを使っても、おそらくまだDIP違反です。あなたがdatabaseを書いているのでないとすれば、businessがおそらく必要としているのはdatabaseではなく、何らかのdurable informationです。SQL database、NoSQL database、hierarchical database、object-based databaseなどの一般的なものが、あなたのbusinessと同じlevelに存在する可能性は低いでしょう。databaseに直接関係するものを書いている場合を除けば、です。

### DBをdomainに関係するものの背後に隠す

solutionをproblemと混同するのは、よくある間違いです。幸い、これはよく理解された問題であり、すでにsolutionを知っているかもしれません。一般的なものの1つはRepositoryを使うことです。

図8: Domainが見たいものを見せる

repositoryは、conceptualな、場合によっては実際の、永続化されたobjectの大きなcollectionへのgatewayです。そのinterfaceは、databaseではなく、domain内のuserのgoalに意味を持つmethodで構成されるべきです。repositoryの背後にdatabaseがたまたまあるなら、Repositoryはdomainに意味を持つrequestを、databaseに意味を持つものへmappingすることを扱います。

低レベル抽象のconsumer全員が作業を重複させるのではなく、抽象のimplementationに一度だけその作業をさせます。

典型的なinterfaceには、domainが必要とするなら基本的なCRUD operationsが含まれるかもしれません。しかしその後、systemのneedsに意味を持つmethodを追加します。つまり、新しいuse case、scenario、user story、backlog itemを追加してsystemを成長させるにつれて、その時点のsystemのneedsをsupportするようにinterfaceを拡張します。それ以上でも、それ以下でもありません。

trainのtravel scheduleを扱うsystemを考えてみます。station間にはscheduled journeyがいくつもあります。時間とともに新しいstationが作られ、他のstationはmaintenanceのためにclosedになり、station間のtrain scheduleはcapacityの変化、seasonal demandへの対応、新規businessを惹きつけるspecialの導入などによって変化します。train scheduleはかなり前から計画され、将来activateするためにsystemへ追加されます。

systemは定期的に、もはやrelevantでないschedule、まもなくactiveになるschedule、そしてoverlapping scheduleやschedule gapのような潜在的conflictを見つける必要があります。

図9: domainが必要とするoperationに合わせる

これは、あるsystemでdomain conceptごとにRepositoryは1つだけになるという意味でしょうか。そうかもしれません。Bounded Contextsの利用のような考慮に基づいて複数持つかもしれませんし、Interface Segregation Principleに基づいて1つのRepository interfaceを分割するかもしれません。DIPの観点から重要なのは、interfaceがsystemの現在のneedsにとって適切な抽象levelに存在することです。

systemの現在のneedsを駆動するものは何でしょうか。use cases、user stories、scenarios、backlog itemsです。つまり、actorは誰で、何をする必要があるのか、ということです。

### 結論

JDBCを使うとき、私たちは多くのinterfaceを使います。interfaceは抽象です。しかし、何らかの抽象を使うことはまともなcodeを書く助けにはなるものの、それだけでは十分ではありません。抽象は、domainに適したlevelになければなりません。JDBCのような一般的solutionは、あなたのproblemを解こうとはしていません。一般的なproblemを解こうとしています。これはmethodが多すぎたLoggingの例と似ています。

JDBCのfeaturesは、databaseを使うときに扱う可能性があるあらゆることを全規模でaddressします。典型的なdomainはそれらすべてのproblemを気にしないので、特定domainでのconsumptionは、そのneedsに合うように単純化できます。

## 与えられたものをそのまま受け取らない

ここまでの例は、systemの一部を解くために使う抽象layerのlevelに関するものでした。次の例も同じですが、実際には違うものとして見られがちです。requirementとして隠されたsolutionを渡されたら、何が起きるでしょうか。

### 提供されたsolution

この次の部分は、私がいたteamに与えられたものから始めます。

図10: 与えられたもの

もう少しdetailを示します。

- あるexternal systemが、scheduleが更新されたという事実をasynchronous publish/subscribe queueでbroadcastします。
- しばらくして、私たちのsystemはそのnotificationを拾い、actionするかどうかを決める必要があります。たとえば、同じscheduleが複数回送られることがあるため、すでにその特定scheduleを持っているかもしれません。この例では、systemはそのscheduleを気にしているので、それを要求します。
- systemはtemporary queueを作ります。そこは、full scheduleを送るようpublisherに依頼する場所です。systemはoriginal publisherへasynchronous messageを送ります。実際には別のqueueへ送り、それは同じprocess spaceでhandledされます。
- systemはtemporary queue上でscheduleが届けられるのを待ちます。永久にblockするわけではありません。この全体processの途中でsystemがshutdownしようとしている場合に備えて、時々目を覚まします。また、propertyで決まる何分かの後には諦めます。
- 最終的にhappy pathではscheduleが届き、systemはscheduleを受け取ります。何らかのprocessingを行い、その後systemはscheduleをpersistします。

### どう取り組んだか

当時、teamはshared pairing stationとopen environmentで働いていました。私はそのproblemに取り組んでいるpairの声を聞き、JMXに直接依存しているのか、それともDIPに従っているのかを尋ねました。言い換えていますが、本当の話です。彼らはproblem解決へ真っ直ぐ突っ込み、与えられたものすべてをessentialだと受け取り、次のようなことをしていました。

図11: 多数のinterfaceを直接使う

これは簡単で、典型的で、馴染みのある反応です。detailが非常に多いので、本当にそこにあるものを見抜くのは難しいことがあります。このproblemで、asynchronous interactionはessentialでしょうか、それともincidentalでしょうか。この特定のcaseでは、mechanism全体が私たちに課されたdesign decisionでした。それに従う必要はありましたが、妥当なapproachではあったものの、そのdesignを私たちのdesignに消えない形で刻み込む必要はありませんでした。

ほとんどの場合もそうだと私は提案します。少し弱いguidelineとしては、そうでないと示されるまではincidentalだと仮定することです。

asynchronicityのようなものがessentialになるcaseはあるのでしょうか。あります。1つ以上のhandoffを持つworkflowを想像してください。つまり、私がそれを終えたら、あなたが引き継ぐ、というものです。私は自分の作業を行い、それを終えます。私が責任を持つ最後のstepは完了していますが、そのitemに対するworkflow全体はまだ完了していません。概念的には、この種のflow向けに設計するinterfaceは、1人が1回の作業で全作業を終える場合のものとは同じ形にならないでしょう。

しかし、designのdriving forceはdomainから強く影響を受けるべきです。

この特定の状況では、私たちがやるべき主要なことは3つありました。raw formでscheduleをacquireすること、XMLからscheduleへtranslateすること、そしてそれをpersistすることです。2番目と3番目のstepはしばらく前にすでに書かれていたので、この作業が始まった時点で扱う必要があったのはacquisitionでした。私たちのsystemがoriginal raw representationを実際に必要とするcaseは一度もありませんでした。したがって、system内の他の場所でXML representationを見るより、acquisitionの結果がScheduleになる方がよかったのです。

これをざっと描くと、次のようになりました。

図12: Asynchronousは与えられたがincidentalだった

さまざまなJMS interfaceへの依存が消えたわけではないことに注目してください。ただ、それがもう1段のindirectionの背後へ移っただけです。system-level viewでは、私たちにはscheduleを取得できる何かがありました。正確にどう取得するかは、特定implementationに任されます。実際、最初のexplorationではActiveMQを使って単純なfakeを書きました。後には、testごとのstubを書くためにMockitoも使いました。

その結果、高レベルのinteractionは少し追いやすくなりました。

図13: flowが私たちのconsumptionに従うようになった

これらすべては、いくつかの理由で重要になりました。

- Tibco accessを得るまで時間がかかりましたが、早い段階でconcrete exampleを持てました。
- raw formatからscheduleへのtranslationには追加作業が必要でしたが、それは待たずに進められました。
- Spring 3.xの内部動作をいくらか学ぶ必要がありました。Tibco accessを待っている間にActiveMQで進めたことで、おそらく90%くらいまでは到達できました。
- Tibcoを制御できませんでした。それは別groupの責任であり、政治的にも変わりそうにありませんでした。これは、DIPが味方になる大きなsignです。
- 私たちはcontinuous integrationを実践していました。つまり、testを頻繁に、簡単に1日60回以上runしていました。最大5 pair、複数check-in、check-in前の複数developer run、各check-inごとのbuild box上でのrun、performance testなどです。
- test queueはsharedでした。
  - test queueは、他のtestingがbufferを埋めてしまったために使えないことがよくありました。
  - test queueにはすべてのmessageを飲み込んでしまうconsumerがいることがあり、私たちのtestは自分たちの制御外の理由でfailする可能性がありました。

### どれほど悪かったのか

これらすべてのriskにより、Tibco固有のissueに直接関係しないlogicの大半をverifyできることがessentialになりました。実際、JMSを扱うlogicにより、TibcoとActiveMQの違いはcode issueではなく、厳密にconfiguration issueになりました。ActiveMQを使うときは、in-process queueを指しました。Tibcoを使うときは、QA queueを使うのかproduction queueを使うのかに応じて、いくつかのqueueの1つを指しました。

いくつか違いはありました。ActiveMQの方が少し寛容でした。それでも私たちは、両方のlibraryを扱う1つのpathを書くことができました。

これがheavy-weightに聞こえるなら、実際にはそうではありませんでした。実際のdesignはstraightforwardです。designを考えるのに何日もかかったわけではなく、数分でした。designのimplementationにはかなりの時間がかかりましたが、その大半はdiscoveryでした。私たちの多くはJMSに不慣れになっていたからです。私はいつも不慣れで、Googleに生かされています。

本当の勝利は、QAとproduction replicationの両方でこれが動いてから数か月後に来ました。ある時点で、私たちのsystemはQAで動かなくなりましたが、replicated production environmentを含む他のすべてのenvironmentでは動いていました。すぐに、queue configurationが違うのだろうと推測しました。尋ねると、queue configurationは同じだと断言されました。testがあったので、誰かと一緒にtestをstep throughしながら、別の誰かにqueueを見てもらうことができました。

私たちはdue diligenceを行い、最終的には、自分たちが原因ではないと確信しているわけではないが、識別できる唯一のvariableがTibcoの1 instanceと別instanceの利用に関係しているという条件のもとでは、できる限り確信している、と伝えました。約1週間半後、彼らはQA queueが異なる設定になっていることを突き止めました。この間、私たちのteamは、この全体problemの他の部分に取り組むことを止められませんでした。

### 結論

実装すべきsolutionを与えられたり、既存の外部environment上の考慮によってsolutionが制約されたりすることはよくあります。与えられたconstraintの具体に対処するcodeは書くでしょう。しかし、それらのdetailsがsystemの残り全体へ広がってよいという意味ではありません。implementationを1か所に隠し、domainのgoalの視点から書かれたinterfaceを与えます。detailは敷物の下に掃き込みます。

## 昏睡から目覚めたら、今はいつか

dateやtimeを気にするsystemで働いたことはありますか。current dateにはどうaccessしましたか。timeの経過をどう扱いましたか。ほとんどのsystemはtimeを気にします。Javaにはcurrent dateやtimeを取得する方法がいくつもありますが、どれも実行されているsystem上のtimeを使いがちです。

## Joda Time

まだJoda Timeを使っていないなら、私は勧められます。そしてJSR 310が追加されると、Joda Timeに非常に近いものがJDKの一部になります。

### scheduleならここにある

それぞれが何らかのresourceを使うwork itemを多数持つsystemを想像してください。各itemは、scheduled to happen、happening、finished happeningのいずれかです。2つのwork itemが同じresourceを使おうとするとconflictが起き、systemがconflictを正しく処理することを確認しなければなりません。systemがconflictsをうまくmanageしていることを、どうverifyしますか。

図14: Work items need to get worked

### domainの分解

このdescriptionにはいくつかのkey conceptがあります。work items、conflict、timeです。

- work itemは比較的単純です。name、description、start date/time、duration、1つ以上のresourceを持ちます。
- conflict handlingは興味深いproblemに見えます。conflictの扱い方にはいくつもの方法があるかもしれません。最初はfirst-in, first-outかもしれませんし、後にはmost valuable firstのようなものがあるかもしれません。いずれにしても、conflict resolutionというideaをsystem内のfirst-classなものへ引き上げる必要があります。
- ここまでは順調です。ではtimeはどうでしょうか。

timeは興味深いideaです。ほとんどの場合、私たちはtimeを当然のものとして扱います。考えるとしても、です。何もしなければ、systemにはおそらくtimeがあり、そのtimeは壁の時計と同じように進みます。常にそこにあり、変化のrateはあまり変わらないように見えます。しかし、もし現実とは違うpaceで動かしたいならどうでしょう。dateがactual dateとは違うように見せたいならどうでしょう。

timeの一部分を丸ごとskipするのはどうでしょうか。timeについて重要なのは、user interventionなしに変化することです。しかし、もしtimeを自分たちのものにしたいならどうでしょう。それは何を意味するのでしょうか。

違うpaceで進める

- 秒、分、日といったtime-frameで起きることを持つtime sensitive systemがあります。systemを時間経過とともに観察したいけれど、毎時ちょうどに起きる何かを待つために1時間ずつ待ちたくはありません。

current dateとは異なるdate

- date-specificなreal production dataを使うtest-bed上でsystemを動かしています。今のところ、そのdateは未来ですが、明日、昨日の1週間前、あるいは来年だったら何が起きるか見たいとします。production dataのcopyを変更することもできますし、systemにreal dateとは違うdateだと思わせることもできます。

timeの一部分を丸ごとskipする

- systemでは、thingsがdiscrete timeに起きます。正しいことが正しい時刻に起きることを確認したいとします。systemをrunすると決めた時刻に基づいてそれらをsetupすることもできますし、単にtimeを設定して何が起きるかを見ることもできます。

### Time Lordの育て方

timeは他のbusiness conceptのようなものでしょうか。少し敬意を払うべきfirst class citizenとして扱うべきでしょうか。それはどんな姿になるのでしょうか。何をもたらすのでしょうか。Scheduling Exampleを見てください。

### scheduling example

```gherkin
Feature: Handling Scheduling Conflicts

As an operator I want to make sure feature conflicts are managed by an appropriate policy.

Background:
  * Given an empty schedule
  * And a work item named Megatron_Torso scheduled to start at 10:00, last for 15 minutes, and use 3d_printer_1
  * And a work item named Megatron_Head scheduled to start at 10:10, last for 5 minutes, and use 3d_printer_1
  * And a first one wins conflict resolution approach
  * And the business time is 9:59

Scenario: Nothing going on
  * Then there should be no active items at 9:59

Scenario: One item active
  * Then Megatron_Torso should be active at 10:01

Scenario: Conflict Handled
  * Then Megatron_Torso should be active at 10:10
  * And Megatron_Head should be blocked

Scenario: Delayed Start
  * Then Megatron_Torso should be completed at 10:16
  * And Megatron_Head should be active

Scenario: Delayed work item finishes late
  * Then Megatron_Head should be completed at 10:21
```

Scheduling Exampleは、この記事のために書き直した仮想systemのdescriptionであり、私が取り組んだいくつものreal systemに基づいています。これらのexampleは、Cucumberというtoolで使われるGherkinというlanguageで書かれています。この特定のDomain Specific Language、DDDとBDDのcommunityがUbiquitous Languageと呼ぶものを使って、scheduling systemがどう振る舞うべきかについてのexpectation、fact、exampleを表現しています。

この一連のexampleは、明確に定義されたstarting pointといくつかのfollow-up activityが与えられたとき、systemで何が起きるべきかをdescribeしようとしています。たとえば「Nothing Going On」のexampleによれば、9:59には何もactiveであるべきではありません。その後10:01には、WorkItemの1つがactiveであるべきです。最初のconflictは10:10です。この時点ではWorkItem `Megatron_Torso`がまだrunningで、`Megatron_Head`はshared resource `3d_printer_1`が空くのを待たなければなりません。

この種のsystem validationは一般的ですが、このapproachはそれほど一般的ではありません。このdomainではtimeが重要です。ほとんどの時刻はこのsystemにとって重要ではなく、work scheduleに基づく特定の時刻だけが重要です。

どのtimeが重要なのでしょうか。このexampleは、10:00に始まり15分続くwork itemが1つ、10:10に始まり5分続く別のwork itemが1つあると明示して、それをdescribeしています。testをverifyするために、Boundary Testingのようなものを使って、重要な時刻の周辺の時刻を選びます。

私がより典型的だと見てきたのは、より近い時刻を選び、thingsが起きるのを待つことです。たとえば15分の代わりに15秒を使います。この種のtest setupは一般的ですが、systemがkey domain conceptであるtimeを所有していないことを示しています。

### それを実現する例

Joda Timeを使うなら、この種のことは簡単です。Joda Timeが生成するtimeを変更する単純なJava classを示します。

```java
@Component
public class BusinessDateTimeAdjuster {
  public void resetToSystemTime() {
    DateTimeUtils.setCurrentMillisSystem();
  }

  public void setTimeTo(int hour, int minute) {
    DateTimeUtils.setCurrentMillisFixed(todayAt(hour, minute).getMillis());
  }

  DateTime todayAt(int hour, int minute) {
    MutableDateTime dateTime = new MutableDateTime();
    dateTime.setTime(hour, minute, 0, 0);
    DateTime result = dateTime.toDateTime();
    return result;
  }
}
```

さて、`And the business time is 9:59`のようなexpressionは、このexampleではCucumber-jvmを使って実行しており、次のmethodを実行します。

```java
public class ScheduleSteps {
  @Given("^the business time is " + TIME + "$")
  public void the_business_time_is(int hour, int minute) {
    setTimeTo(hour, minute);
  }

  private void setTimeTo(int hour, int minute) {
    BusinessDateTimeFactory.setTimeTo(hour, minute);
    scheduleSystemExample.recalculate();
  }
}

public class BusinessDateTimeFactory {
  public static DateTime now() {
    return new DateTime();
  }

  public static void restoreSystemTime() {
    DateTimeUtils.setCurrentMillisSystem();
  }

  public static DateTime todayAt(int hour, int minute) {
    MutableDateTime dateTime = now().toMutableDateTime();
    dateTime.setTime(hour, minute, 0, 0);
    return dateTime.toDateTime();
  }

  public static void setTimeTo(int hour, int minute) {
    DateTimeUtils.setCurrentMillisFixed(todayAt(hour, minute).getMillis());
  }
}
```

このcodeはtimeをfixed pointに設定します。Cucumber-jvm libraryでは、testの前後でhookを実行できます。このcaseでは、after-test hookがtimeをsystem timeへ戻します。

実際には、Business Timeのようなdomain conceptを導入するideaは大きな作業に聞こえるかもしれませんが、そうではありません。私はこの種のことをprojectの後半で行ったことがありますし、成熟したprojectでさえ、systemをtestできるようになることで節約した時間に比べると、このideaを導入するのにそれほど時間はかかりません。1つのdata pointとして、単純なdate factoryを導入するには数時間かかるかもしれません。dateは扱いが厄介になりがちなので、私はtestします。

`new Date()`やその同等物のようなcodeが出てくる場所をすべて見つけるには、regular expressionとrecursive searchを使います。前回これをやったときは、code内の410か所を直すのにたぶん2時間ほどかかりました。成熟したsystemでも半日です。Joda Timeを使っているなら、`new DateTime()`を呼ぶcodeの場所を直す必要すらありません。Joda Timeを使うと簡単ですが、JavaのCalendarでもこれをやったことがあります。

ideaは大きく聞こえますが、設置して実装する実際の作業よりも、その影響範囲の方が広いのです。

### 結論

私たちは多くのものをfixedなものとして受け取ります。さらに悪いことに、考えないことに慣れすぎているため、key conceptに気づきもしません。このideaにどこで出会ったのかは覚えていません。何年も前のprojectでの観察だったと思います。私たちはlocal databaseでproduction dataのcopyを使っていました。production dataにはdateを持つruleがありました。しばらくすると、そのdateはもはや未来ではなくなります。また、別のdateを持つproduction dataの新しいcutを受け取ることもよくありました。これはまた別の問題です。

timeが過ぎるたびにdateを「直し」続けていたのですが、やがて、このmanualでrepetitiveでerror proneな活動は完全に時間の無駄だと気づきました。私たちはdateを変えていたのです。ならば明らかに、dateをcontrolする必要がありました。初めてこれを試したときは、半日より少し長くかかりました。それ以来、少なくとも5つのproduction projectで5回は行っており、今では早い段階で行うものになったので、ほとんど時間はかかりません。

私と何人かのQA担当者は、この種のfunctionalityを便利で、大きなtime-saverだと感じています。

ただし、この例が示しているのは、私たちのcodeはtimeのようにいかにも現実的に見えるものに依存する必要すらない、ということです。より一般的なideaはこうです。何かが問題を起こしているなら、それをcontrolする。このcaseでは、そのcontrolはlibraryによって簡単にsupportされていました。しかし最後のcode exampleを見ると、私はなおBusinessDateTimeFactoryを導入しています。date and timeというideaを捕まえ、それに依存するための1つの場所を持つためです。

## まとめ

ここまで、実地におけるDIPの例をいくつか見てきました。

- methodが多すぎて扱いにくいAPIを取り、手なずける。
- libraryの抽象levelとdomainの間のmismatchを取り除く。
- 特定のcommunication styleを指示するexternal constraintを拒む。
- timeそのものをcontrolする。

いくつかはDIPの適用としてより明確であり、他のものは別のdesign principleに合うように見えるかもしれません。結局、どのprincipleがある状況により当てはまるかは重要ではありません。Daniel Terhorst-Northは、すべてのsoftwareはliabilityだと主張して、このideaをうまく捉えています。developerとして見ると、私のgoalはcodeを書くことのように見えます。しかしそれは、orthodontistにbraceが必要か尋ねるようなものです。答えは「はい、ありがとうございます。boatの頭金をもう1回払う必要があるので」です。

私はcodeを書くこと、新しいprogramming languageを学ぶこと、そういったことを楽しんでいます。しかしproblemを解こうとしているなら、softwareはたいていendそのものではなく、endへのmeansだということを覚えておくことが重要です。これはdesign principlesにもagile practicesにも当てはまります。意味があるのは、workのpointを覚えたうえで、contextに何が意味を持つかを決めさせることです。特定problemへのsolutionをframeする方法を探しているなら、DIPを知っておくと便利です。

より一般には、特定のbusiness problemをより早く解く助けになるprinciples and practicesは、そのcontextでは良いものです。別のcontextでは機能しないかもしれません。私は、複数のreporting structureによって行われたworkに依存することが多い、長寿命のsystemに関わることが多いです。つまり、problematic dependenciesを特定し、DIPのようなdesign principleでcontrol下に置くことは、私にとって繰り返し現れるthemeになりがちです。これらのideaは、あなたの特定problemにとってはひどいものになる可能性もあります。

もしあなたが短いsoftware half-lifeを持つものに取り組んでいるなら、そのcontextで最善なのは、それらのdependencyへ直接依存することかもしれません。また、Robert Martinが定義するTDDを実践しているなら、単にautomated testを書くことはTDDとはほとんど関係ありませんが、必要に応じて大規模な変更を行える立場にいる可能性があります。このcaseでは、DIPはup-front designではなくrefactoringに情報を与えます。

dependenciesを特定し、それを明示的に扱う価値があるか、価値があるならどこで扱うかを判断するpracticeは、練習する価値のあるskillです。これらの具体例を、試すべきものとして受け取ってもよいですし、作業中に何を見るべきかについてのguidelineとして受け取ってもよいですし、dependencyをcontrol下に置くために実際にできる具体的なこととして受け取ってもよいでしょう。これらの例、あるいはDIPそのものが助けになるか害になるかは、あなたが解こうとしているproblemによって決まります。
