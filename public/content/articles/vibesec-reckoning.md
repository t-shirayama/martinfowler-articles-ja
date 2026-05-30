# The VibeSec Reckoning

## 要約

Vibe codingは、非技術者でも生成AIを使って短時間でアプリケーションを試作できるようにしました。しかし、AIエージェントはしばしば「いちばん通りやすい道」を選び、公開ストレージや過剰な権限のような危険な構成を提案します。プロンプトで「安全にして」と伝えるだけでは、企業のセキュリティ要件を満たす制御にはなりません。

この記事は、AIに読ませるセキュリティコンテキストファイル、AIが提案する権限への疑い、日次のセキュリティ情報フィード、secure-by-defaultなテンプレートやharnessを組み合わせる必要を述べています。人間の注意だけに頼るのではなく、技術的なルール、決定的なチェック、レビュー責任をワークフローに組み込むことが中心です。

## 読むときの観点

- Vibe codingの速さと、企業環境で求められるセキュリティ統制の差を見る。
- 「AIに頼む」ことと「パイプラインで強制する」ことの違いに注目する。
- business functionが作る内部プロトタイプにも、顧客・従業員データを守る責任がある。
- セキュリティコンテキストファイルは、単なるプロンプトではなく、レビューと自動チェックに接続される運用物として読む。

## 原文の翻訳

AIに「安全にして」とpromptするだけではなぜ足りないのか。そして、実際には何が必要なのか。

「Vibe coding」、つまり非技術者のcitizen builderがgenerative AI toolを使ってapplicationを高速に開発する実践は、software prototypingを大きく加速しました。しかし、AI agentは自然に最小抵抗の道を優先するため、安全でないconfigurationを頻繁に勧め、業界をまたいだsystemicなsecurity exposureを作り出します。

これに対抗するには、AIを導くsecurity context fileを書き、AIのpermission requestに慎重になり、日次のsecurity intelligence feedを作り、builderにsecure-by-defaultなharnessとtemplateを提供する必要があります。

[Vibe coding](https://www.martinfowler.com/bliki/VibeCoding.html)は、技術者ではないユーザー、私たちの言葉ではcitizen builderが、以前なら作れなかったアプリケーションをAIで作れるようにしています。ThoughtworksのGlobal MarketingにあるAI applicationsチームが、global marketingのcitizen builderによってvibe codingで作られたプロトタイプを拡張するよう依頼されたとき、vibe codingされたアプリケーションを安全に本番へ進めるうえで妨げになる、深刻なひび割れを見つけました。

ガードレールのない速さは、どのチームも無視できないリスクです。以下では、私たちが見つけたもの、それがAIで構築するチームに何を意味するのか、そして出荷するすべてのworkflow、prototype、appに自信を持てるようにするために私たちが取っている手順を説明します。

### 苦い経験から学んだこと

Global Marketing内のAI applicationsチームは、Gemini、Replit AI、Claude AIで作られた動画組み立てプロトタイプを拡張し、1万人の従業員が使うon-brandな動画を作れるようにする依頼を受けました。チームは、作業を止めざるをえない2つの瞬間に遭遇しました。どちらの場合も、AIは重大なセキュリティ上の含意を持つ道を提案しました。どちらの場合も、それに気づけたのは、人間が正しい問いを投げかけたからでした。

セキュリティリスクその1

#### 公開ストレージアクセス

AIは、storage bucketをpublicにすること、またはcloud file storageを「リンクを知っている全員」に設定することを勧めました。問いただすと、どの会社もそうしていると言って正当化しました。明確に拒否して初めて、安全な代替案が出てきました。

これにより、未公開のbrand assetやaudience dataがpublic internetへ漏れる可能性がありました。

セキュリティリスクその2

#### 過剰なtoken権限

service accountにAccess Token Creatorロールが割り当てられていました。このロールにより、短命tokenを作成し、taskに必要な範囲をはるかに超えてdatabaseや他のresourceへアクセスできるようになります。チームはコードを実行する前にこれを発見しました。

これがあると、侵害されたservice accountがcloud workspace全体を横方向に移動できてしまいます。

ここでの重要な洞察は、AI toolはしばしば最小抵抗の道を提案するということです。その道が常に安全とは限りません。人間の判断は不可欠ですが、それを唯一のcontrolにしてはいけません。目標は、最初のpromptからagentに技術的なセキュリティルールをcontextとして与え、その後、development workflow内の決定的なcheckで出力を検証し、**安全でないcode、permission、secret、infrastructureを見逃さない**ようにすることです。

### リスクを示す数字

44%

アプリケーション脆弱性を悪用する攻撃の前年比増加率

5件に1件

企業侵害のうち、AI生成codeが原因になっている割合

50%

AIに関するsensitive data policyを持たない組織の割合

25%

確認済み脆弱性を含むAI生成codeの割合

これらのincidentは孤立したものではありません。2026年に公開されたresearchは、AI-assisted codingを高速に行うことがsystemicなセキュリティ露出を生むことを確認しています。私たちが遭遇したのと同じリスクが、いま業界全体で起きています。

| Finding | Stat | Source |
| --- | --- | --- |
| AI生成codeに確認済み脆弱性が含まれる | 25% | AppSec Santa, 2026 |
| アプリケーション脆弱性を悪用する攻撃の前年比増加 | 44% | SQ Magazine AI Coding Security Statistics, 2026 |
| highまたはcritical severityの脆弱性を含むcodebase | 78% | Black Duck OSSRA 2026 |
| AIに関するsensitive data policyを持たない組織 | 50% | AppSec Santa, 2026 |
| codebaseあたりの平均脆弱性数の前年比増加 | +107% | Black Duck OSSRA 2026 |
| AI生成codeが原因になっている企業侵害 | 5件に1件 | Aikido Security, 2026 |
| 2026年3月だけでAI生成codeから生まれた新規CVE | 35 | Georgia Tech Vibe Security Radar, SSLab, March 2026 |
| 2026年のauditでprompt injection exposureがあったAI system | 73% | SQ Magazine AI Coding Security Statistics, 2026 |
| 新しいenterprise software全体のうちAI生成のもの | 42% | Sonar developer survey, 2026 |
| AI生成code量への追随が難しくなっていると答えたsecurity team | 62% | ProjectDiscovery AI Coding Impact Report, April 2026 |

### 本当の問題: promptだけでは足りない

これらのincidentをengineeringとsecurityの同僚に共有した後、明確なmessageが返ってきました。AI agentに安全であるよう伝えることは、安全であることを強制することと同じではありません。promptは上書きされ、誤解され、無視されることがあります。userが制約に押し返したり、requestを違う言い方にしたりした瞬間、その制約は消えます。

「LLMに、出力artifactに期待する振る舞いをただ伝えるだけでは十分ではありません。絶対にそうなってほしくないことがあるなら、development lifecycleのどこかで、交渉不能なruleとしてcode化されていなければなりません。」 - Engineering leadership

こう考えてみてください。test-driven developmentを促すpromptは、build toolでcode coverage thresholdを強制することと同じではありません。一方は提案です。もう一方はgateです。[Birgitta Böckelerのharness engineeringに関する仕事](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html)は、coding agentへの信頼を築くためのmental modelを示すことで、この点を具体化しています。promptだけに頼るのではなく、developerはagentを外側の「harness」で包み、そのharnessを2つの軸に沿って構成します。

- Guide、つまりfeedforward controlは、望ましくない振る舞いを予期し、modelが行動する前に導きます。一方、Sensor、つまりfeedback controlは、agentが行動した後のcodeを観察してerrorを検出します。
- Computational controlは、linterやtest suiteのように決定的で、高速で、CPUで実行されます。Inferential controlは、特定のsystem prompt制約のように、semantic analysisとAIによる判断に依存します。

### business functionが注意を払うべき理由

私たちのmarketing teamのようにAIで構築しているbusiness functionも、applicationを構築するengineerに適用されるsecurity obligationを免除されるわけではありません。softwareにsecurityを組み込むことは、customer dataとemployee dataを守るための基本要件です。軽量な内部prototypeであっても、enterprise security standardに従わなければなりません。適切なguardrailがなければ、AI-assisted developmentは、applicationがproductionに到達するずっと前にsensitive dataを露出させる可能性があります。

Client trust

#### complianceは契約上の義務である

ISO 27001のようなstandardに従うことは、sensitive dataの保護を確実にします。どれほど速く作られたapplicationでも、customerとemployeeの信頼を維持するには、こうしたsecurity benchmarkを満たさなければなりません。

Brand integrity

#### brand assetには保護が必要である

中核的な仕事では、未公開のcampaign asset、financial data、audience insightなど、sensitiveなfunctional dataを扱います。権限を与えすぎたservice accountは、code以上のものを危険にさらします。

Reputation

#### business functionは基準を示せる

marketingのようなbusiness functionがsecurity disciplineをもって先導すると、責任あるAI adoptionの姿勢を、より広い組織とclientに示せます。

### 短期的な習慣

責任を持って構築し始めるために、security expertである必要はありません。次の3つの習慣から始められます。

#### 技術的なセキュリティルールを毎回のsessionに入れる

まずは組織のsecurity guidelineをClaude、Cursor、Replitの「Rules」として追加します。後で、すべてのtoolにまたがる共有のsensible default layerへ投資してください。AI agentはそれをguidanceとして使うため、最初からsecure patternが出やすくなります。ただし、それでも、unsafe code、露出したsecret、広すぎるpermission、脆弱なdependency、安全でないinfrastructureをdeployment前に失敗させる決定的なcheckで支える必要があります。

#### AIが提案するpermissionをすべて疑う

toolが何かをpublicにすることや、広いservice account roleの割り当てを勧めたら、立ち止まって理由を尋ねてください。最小抵抗の道と安全な道が同じであることは、ほとんどありません。

#### red team promptを試す

AIにbad actorとしてroleplayさせ、いま作ったものをpen testさせます。この技法は、特にpermissionやdata exposureの周辺で、前向きなpromptでは見落とす脆弱性を一貫して浮かび上がらせます。

### 中期的な解決策

riskについて読むことと、それに対して何かをすることは別です。これらのincidentをきっかけに、私たちは2つの実践的なinitiativeを始めました。その背後にある原則は、技術的背景の有無にかかわらず、AIで構築するどのチームでも再現できます。

#### セキュリティコンテキストファイル

私たちは技術的なセキュリティルールを構造化されたcontext fileにまとめ、codeが書かれる前にすべてのAI coding sessionへ読み込むようにしました。そこにはzero trust enforcement、secrets management、harness engineering、supply chain integrityが含まれます。casualなpromptとの重要な違いは、operational disciplineです。fileはversion管理され、defaultで読み込まれ、reviewされ、自動checkと組み合わされます。

これは、何がよい状態かをagentに伝える包括的なinferential guideとして働きます。しかし、出力が許容できるかどうかを検証するpipeline内のcomputational sensorと組み合わせなければなりません。

#### 日次のセキュリティ情報フィード

現在、この自動的な集約により、supply chain alertが公開されたその日に確認できます。将来、agentic enterpriseへ向かうにつれて、agentがstory cardを能動的に作成し、既知の脆弱性を特定して、人間のreviewに回すために背後でpatchすることを想定しています。これによりSoftware Development Lifecycle（SDLC）のcycle timeを大幅に短縮できます。

### セキュリティコンテキストファイルの実践

このapproachの背後にある考えは単純です。AI toolはsessionの最初にcontextを読むのだから、そのcontextを技術的なセキュリティルールにする、ということです。このfileは、組織のsecurity requirementを検討し、AIがただ認識するだけでなく実行できる形に構造化した結果です。

以下は、そのようなfileに含めるべきcoverageの種類です。詳細は組織ごとに異なりますが、categoryは共通しています。

| 対象領域 | よい状態 | 重要な理由 |
| --- | --- | --- |
| Zero trustとleast privilege | すべてのservice accountとstorage resourceで、厳格なidentity verificationと最小限のaccess rightを使う | token permission riskを直接防ぐinferential guide parameterを設定する |
| Secrets management | AIはAPI key、password、tokenをcode内に生成・保存することを拒否し、必ずenvironment variableまたはsecrets managerへ経路を変える | credential leakageがrepositoryへ到達する前に止める |
| Harness engineering gate | SAST scanning、credential scanning、infrastructure validationがdeployment前に通る必要があり、prompt instructionだけに頼らない | inferential instructionを、決定的なcomputational sensorで支える |
| Supply chain integrity | よく確立されたlibraryだけを使い、すべてのdependencyを既知の脆弱性について定期的にauditする | AIが無名または未検証のpackageを提案するriskを減らす |
| AI accountability | AI生成codeはdeployment前にpeer reviewと自動security scanningの対象としてflagされ、認可されていないAI利用を許さない | compliance auditabilityに必要である |

promptとの重要な違いは、このfileに、AI agentがpolicy違反のrequestを拒否せざるをえない交渉不能なruleが含まれることです。AI agentがcheckの回避、loggingの無効化、何かのpublic access設定を求められた場合、ruleはそれを断り、その理由を説明するよう導くべきです。しかし重要なcontrolは、agentがそのguidanceに従い損ねたとしても、決定的なcheckとdeployment gateが問題を捕まえるようにすることです。

まさにこの拒否が、私たちの2つのnear miss incidentで欠けていたものでした。

### セキュリティ情報フィードの実践

情報を得続けること自体がdefenceの一形態です。このworkflowは、teamが実際に使っているtoolと言語をmonitorし、新しいCVE、platform advisory、security bulletinの日次digestを届けます。組織をまたいで重要になるcoverage areaは一貫しています。書いている言語、deploy先のcloud platform、AI coding toolそのもの、そしてCVE database全体です。

目標は単純です。脆弱性が公開されたその日に知ることであり、数週間後ではありません。新しいenterprise softwareの42%がAI-generatedまたはAI-assistedになっている現在、developmentを加速するtoolは、新しいCVE disclosureに登場する可能性が最も高いtoolでもあります。それらを能動的にmonitorすることは、securityを自分たちの責任として引き受ける一部です。

#### より広い論点

これら2つのapproachは、どちらもengineering backgroundがなくても採用できます。一方はAIが消費できるよう構造化されたpolicy documentです。もう一方は自動検索です。両者に共通するのは、AIが高速にcodeを生成するとき、受け身のsecurity awarenessだけでは足りないという認識です。

### 長期的な組織変更

#### promptからpipelineへ

標準のprototyping templateにharness engineeringを組み込みます。確率的なpromptから、明示的なfeedback loopへ移行します。自動security scannerのようなcomputational sensorが発火した場合、agentic loopは、通過するまでmodelにself-correctを構造的に強制しなければなりません。

#### application builder（Cursor、Claudeなど）へsecurity ruleを入れる

組織の技術的なセキュリティルールを構造化されたcontext markdown fileへまとめ、modelが従わなければならない「Rules」として読み込みます。codeがcommitされる前、修正が最も安い時点で、よくあるmisstepを捕まえます。

#### 安全な道を簡単な道にする

builderにsecure-by-defaultな出発点を与えます。authentication pattern、private storage default、secrets handling、dependency scanningを事前設定したtemplateは、締切のpressureのもとで誰かがshortcutを取る可能性を減らします。

#### functionをまたいだstarter harnessを定義する

business function、engineering、securityが一緒に作った共有starter harnessは、それぞれのteamが同じ失敗を独自に再発見するのではなく、すべてのbuilderに初日から安全な土台を与えます。

### 結論: prototypeを越えてscaleする

この旅は、Global Marketing hackathon向けにvideo assembly platformを作っていた別teamを支援するために、私たちが参加したところから始まりました。solutionのscaleを手助けする中で、enterprise-gradeのguardrailを持たない「vibe coding」は、組織が見過ごせないriskを持ち込むことが明らかになりました。

技術的なセキュリティルールをagent workflowへ直接組み込むことで、私たちは初期のnear missを、安全でproduction-readyなplatformへ変えることができました。そのplatformはhackathon中に150人のuserへ無事にroll outされました。

人間がissueを見つけることに依存する状態から、technical security rule、自動check、人間のaccountabilityをworkflowに組み込む状態へのこの移行は、agentic eraにおいてengineering rigorを保ちながら速く進むための私たちのblueprintになりました。

### Thoughtworksからの参考文献

これらのchallengeは、私たちのteamだけのものではありません。Thoughtworksの同僚たちは、この問題に深く取り組み、その知見を公開しています。以下は、ここで説明した内容に最も直接関係する記事です。

Thoughtworks CTOのRachel Laycockは、AIがcodeを生成するとき、engineering rigourは消えず、場所を移すのだと述べています。coding agentにleashを付けること、zero trust architecture、security guardrailが今や交渉不能である理由を扱っています。

Thoughtworksが主催したpractitionerとenterprise leaderの集まりでは、AI adoptionにおいてsecurityが一貫して後回しにされていることがわかりました。agentに広いtool access、とくにemailへのaccessを与えることは、即時かつ具体的なriskとして指摘されました。

Thoughtworks Distinguished EngineerのBirgitta Boeckelerは、agentic loopの内部に決定的なcontrolを置くことについて述べています。modelを麻痺させずにsecurity ruleを強制するharnessを構築するための決定版guideです。

AI-assisted development workflowでは、security guardrailとnever-allow ruleを必須のpre-commit hookとして組み込む方法も重要です。

Thoughtworksのannual technology outlookは、厳密なengineering oversightがなければ、generative toolがtechnical debtを増幅し、security vulnerabilityを持ち込む危険があると警告しています。成功には、人間がAI-generated codeのarchitectural integrityを保証するco-construction modelが必要です。
