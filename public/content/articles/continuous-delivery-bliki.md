# Continuous Delivery

## 要約

Continuous Delivery は、ソフトウェアをいつでも本番へリリースできるように作る開発規律です。継続的に統合し、実行可能な成果物を作り、自動テストを通し、より本番に近い環境へ進めて確認します。

Continuous Deployment とは異なり、Continuous Delivery は「頻繁にデプロイできる能力」を持つことを意味します。実際にすべての変更を自動で本番投入するかどうかは、ビジネス上の判断として残せます。

## 読むときの観点

- 常にデプロイ可能であることを、新機能開発より優先する姿勢を見る。
- Deployment Pipeline が、品質確認と環境昇格の中核になる。
- Continuous Delivery と Continuous Deployment の違いを押さえる。
- 小さな変更、信頼できる進捗、早いユーザーフィードバックという利点を見る。

## 原文の翻訳

Continuous Delivery は、ソフトウェアをいつでも本番へリリースできるように構築する software development discipline です。

次の状態なら、continuous delivery を行っていると言えます。

- ソフトウェアが lifecycle 全体を通じて deployable である。
- チームが、新機能に取り組むことより、ソフトウェアを deployable に保つことを優先している。
- 誰かが system に変更を加えたとき、その production readiness について、誰でもすばやい automated feedback を得られる。
- 任意のバージョンのソフトウェアを、任意の environment へ、必要に応じて push-button deployment できる。

Continuous Delivery は、開発チームが行ったソフトウェアを継続的に統合し、実行可能なものを build し、その実行可能なものに automated tests を走らせて問題を検出することで達成します。さらに、その実行可能なものを、より production-like な environment へ進め、本番で動くことを確認します。これを行うために DeploymentPipeline を使います。

重要なテストは、business sponsor が「現在の開発版をすぐ本番に deploy してほしい」と求めたとしても、誰もまばたきひとつせず、まして panic しないことです。

Continuous Delivery を達成するには、次のものが必要です。

- delivery に関わる全員の、密接で協調的な working relationship。これはしばしば DevOpsCulture と呼ばれます。もっとも「devops」という名前にもかかわらず、これは developers と operations に限らず、testers、database teams、その他 software を本番に出すために必要な人すべてを含むべきです。
- delivery process の可能な限りすべての部分に対する広範な automation。通常は DeploymentPipeline を使います。

Continuous Delivery は Continuous Deployment と混同されることがあります。Continuous Deployment は、すべての変更が pipeline を通り、自動的に本番へ投入されることを意味します。その結果、1日に何度も本番デプロイが行われます。Continuous Delivery は、頻繁に deployment できる能力があることを意味するだけです。通常、business がより遅い deployment rate を好むため、実際にはそうしないことを選べます。Continuous Deployment を行うには、Continuous Delivery を行っていなければなりません。

Jez Humble と Dave Farley の本は、この話題の基礎となる本です。

Continuous Integration は通常、development environment 内で code を統合し、build し、test することを指します。Continuous Delivery はその上に築かれ、production deployment に必要な最終段階を扱います。

Continuous Delivery の主な利点は次のとおりです。

- Reduced Deployment Risk: より小さな変更を deploy するため、失敗する要素が少なく、問題が現れた場合にも修正しやすくなります。
- Believable Progress: 多くの人は、完了した作業を追跡して progress を見ます。しかし「done」が「開発者が done と宣言した」ことを意味するなら、本番、または production-like environment に deploy されている場合より信頼性はずっと低くなります。
- User Feedback: ソフトウェア活動の最大のリスクは、役に立たないものを作ってしまうことです。実際のユーザーの前に working software を早く、頻繁に出すほど、その価値を知る feedback を早く得られます。ObservedRequirements を使う場合は特にそうです。

User feedback を得るには continuous deployment が必要です。それを望みつつ、すべての user base に新しい software を出したくないなら、subset of users に deploy できます。私たちの最近のプロジェクトでは、ある小売業者が新しい online system をまず従業員へ、次に招待された premium customers へ、最後に全 customers へ deploy しました。
