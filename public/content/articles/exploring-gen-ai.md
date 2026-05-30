# Exploring Generative AI

## 要約

このページは、生成AI、特にLLMがソフトウェア開発に与える影響について、Thoughtworksの技術者たちが学び、考えていることを集めた連載の入口です。

Birgitta Böckeler氏は、生成AIが公の関心を大きく集めるようになった一方で、ソフトウェア開発という職能に長期的に何をもたらすのかはまだ見通しきれない、と述べています。
このページは単独の長い論考ではなく、AIコーディング支援、エージェント、品質、開発者スキル、仕様駆動開発、レガシーコード、ツールチェーンなどに関するメモや記事への索引です。

## 読むときの観点

- 連載全体を、生成AIを「置き換え」ではなく、ソフトウェアデリバリの実践を変えるものとして追う。
- 記事の時期に注意し、インライン補完からエージェント、仕様駆動、ハーネス工学へと関心が移っている流れを見る。
- 個別記事は、それぞれ著者や問題意識が異なる実験記録として読む。
- 索引ページなので、詳細な主張はリンク先の記事で確認する。

## 原文の翻訳

生成AI、とりわけLLM（Large Language Models）は、世の中の大きな関心を一気に集めるようになりました。
多くのソフトウェア開発者と同じように、私もその可能性に興味を持っています。
しかし、それが長い目で見て私たちの職業に正確に何を意味するのかについては、まだ確信を持てていません。
私はThoughtworksで、この技術がソフトウェアデリバリの実践にどのような影響を与えるかについての取り組みを調整する役割を担うようになりました。
ここでは、同僚たちと私が学び、考えていることを説明するために、さまざまなメモを公開しています。

### Humans and Agents in Software Engineering Loops

2026年3月4日、Kief Morris氏による記事です。
人間がソフトウェア開発プロセスから離れて「vibe code」するべきなのか、それとも開発者がループの中に入り、コードの各行を確認するべきなのかを扱います。
中心にあるのは、人間が成果を生むループをどう構築し、管理するかという問いです。

### Harness Engineering - first thoughts

2026年2月17日の記事です。
コーディングエージェントをより信頼して使うために、モデルの外側にあるルール、フィードバック、検査、文脈をどのように設計するかを考える初期メモです。

### Context Engineering for Coding Agents

2026年2月5日の記事です。
コーディングエージェントが適切に動けるようにするため、必要な文脈をどう準備し、与え、更新するかを扱います。

### Assessing internal quality while coding with an agent

2026年1月27日、Erik Doernenburg氏による記事です。
エージェントと一緒にコードを書くとき、外から見える動作だけでなく、内部品質をどう評価するかを考えます。

### Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl

2025年10月15日の記事です。
Kiro、spec-kit、Tesslを通じて、仕様を中心に置いた開発の考え方と、AI支援開発におけるその意味を読み解きます。

### Anchoring AI to a reference application

2025年9月25日の記事です。
サービステンプレートのような参照アプリケーションを使い、AIを既存の構造や標準に結びつける方法を扱います。

### To vibe or not to vibe

2025年9月23日の記事です。
いわゆるvibe codingをめぐり、AIに任せることの魅力と限界、開発者がどこで関与すべきかを考えます。

### Partner with the AI, throw away the code

2025年7月31日、Matteo Vaccari氏による記事です。
AIと協働して難しいプログラミング課題を進め、生成されたコードを最終成果物としてではなく、学習と探索の材料として扱う経験を紹介します。

### I still care about the code

2025年7月9日の記事です。
AIコーディング支援やエージェントが進んでも、私たちは依然としてコードに関心を持つべきだ、という立場を説明します。

### Autonomous coding agents: A Codex example

2025年6月4日の記事です。
自律的なコーディングエージェントの例としてCodexを取り上げ、エージェントにどこまで作業を委ねられるかを検討します。

### Building Custom Tooling with LLMs

2025年5月14日、Unmesh Joshi氏による記事です。
LLMを使って、開発作業を支えるカスタムツールを構築する方法を扱います。

### Coding Assistants Threaten the Software Supply Chain

2025年5月13日、Jim Gumbley氏とLilly Ryan氏による記事です。
コーディングアシスタントがソフトウェアサプライチェーンにもたらすリスクを取り上げます。

### Building TMT Mirror Visualization with LLM: A Step-by-Step Journey

2025年4月30日、Unmesh Joshi氏による記事です。
LLMを使ってTMT Mirror Visualizationを構築する過程を、段階ごとにたどります。

### Guiding an LLM for Robust Java ByteBuffer Code

2025年4月17日、Unmesh Joshi氏による記事です。
堅牢なJava `ByteBuffer` コードを書かせるために、LLMをどう導くかを扱います。

### The role of developer skills in agentic coding

2025年3月25日の記事です。
エージェント的なコーディングにおいて、開発者自身のスキルがどのような役割を持つかを考えます。

### What role does LLM reasoning play for software tasks?

2025年2月18日の記事です。
ソフトウェア開発のタスクにおいて、LLMの推論能力がどのように効くのかを検討します。

### Expanding the solution size with multi-file editing

2024年11月19日の記事です。
複数ファイル編集によって、AI支援で扱える解決策の規模がどのように広がるかを扱います。

### Building an AI agent application to migrate a tech stack

2024年8月20日の記事です。
技術スタック移行を支援するAIエージェントアプリケーションの構築について説明します。

### Onboarding to a 'legacy' codebase with the help of AI

2024年8月15日の記事です。
AIの助けを借りてレガシーコードベースにオンボーディングする方法を扱います。

### How to tackle unreliability of coding assistants

2023年11月29日の記事です。
コーディングアシスタントの信頼性の低さにどう対処するかを考えます。

### How is GenAI different from other code generators?

2023年9月19日の記事です。
従来のコード生成器と生成AIによるコード生成がどのように異なるのかを説明します。

### TDD with GitHub Copilot

2023年8月17日、Paul Sobocinski氏による記事です。
GitHub CopilotとTDDを組み合わせる経験を扱います。

### Coding assistants do not replace pair programming

2023年8月10日の記事です。
コーディングアシスタントはペアプログラミングを置き換えるものではない、という見方を示します。

### In-line assistance - how can it get in the way?

2023年8月3日の記事です。
インライン支援が、どのように開発の妨げになることがあるかを扱います。

### In-line assistance - when is it more useful?

2023年8月1日の記事です。
インライン支援が、どのような場面でより役に立つかを検討します。

### Median - A tale in three functions

2023年7月27日の記事です。
3つの関数を題材に、生成AI支援を使った小さな開発体験を語ります。

### The toolchain

2023年7月26日の記事です。
生成AIを使うソフトウェア開発におけるツールチェーンのあり方を扱います。

この連載画像にロバが使われている理由が気になる場合は、熱心だが信頼しきれないコーディングアシスタントのペルソナを作った経緯を説明した記事を読むとよいでしょう。
