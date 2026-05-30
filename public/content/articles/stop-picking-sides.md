# Stop Picking Sides

## 要約

このページは、Jim Highsmith 氏による「Stop Picking Sides」の日本語訳・要約です。
アジャイルか伝統的手法か、適応か最適化か、という対立に陥るのではなく、状況に応じて両者の緊張を設計し、運用する必要があると論じています。

Highsmith 氏は、探索を重視する Explore、証拠を広げ制約を強める Expand、信頼性と再現性を重視する Exploit という状態を使って、チームの運用モデルを調整する考え方を示します。
大事なのは、どちらかを恒久的に選ぶことではなく、不確実性、リスク、変更コスト、証拠のしきい値を見ながら、いま何を優先すべきかを決めることです。

## 対応範囲

このページは全文翻訳ではなく、原文の主要な論点を日本語で読むための要約と部分的な翻訳です。
原文は martinfowler.com の [Stop Picking Sides](https://www.martinfowler.com/articles/stop-picking-sides.html) です。
この日本語文書は非公式のものであり、Jim Highsmith 氏、Martin Fowler 氏、martinfowler.com、Thoughtworks の公式翻訳ではありません。

## 読むときの観点

- adaptation と optimization を、敵対する思想ではなく同時に必要な能力として読む。
- Explore、Expand、Exploit は組織のラベルではなく、仕事の状態に合わせる運用パターンとして捉える。
- handoff tax を、単なる引き継ぎの手間ではなく、証拠、責任、意味づけがずれることで生まれる隠れたコストとして見る。
- tailoring は手法を削る作業ではなく、学習速度と信頼性を両立させる operating design だと考える。

## 原文の翻訳

Highsmith 氏は、Agile も discipline も、学び続けるシステムも出荷できるシステムも大事だと述べます。
しかし、問題は人々が陣営に分かれてしまうことです。
伝統的な組織は optimization を美徳とし、adaptation をリスクと見なしがちでした。
一方で、アジャイルな組織は adaptation を美徳とし、optimization を裏切りのように扱うことがありました。
どちらも要点を外しています。
重要なのは、**いま何が支配的であるべきか**を問うことです。

adaptation とは、不確実性の下で素早く学び、進路を修正する力です。
optimization とは、制約の下で信頼性と再現性を高める力です。
どちらか一方を永続的な運用モードとして選ぶと、問題を見誤ります。
これは選ぶべき陣営ではなく、管理すべき緊張関係です。

この緊張は、ソフトウェアに限らず多くの産業で強まっています。
生命科学では、CRISPR、AlphaFold、AI による探索支援などによって、初期の学習サイクルが圧縮されています。
より多くの選択肢を速く試せるようになる一方で、下流の作業は高価で、制約が強く、失敗に寛容ではありません。
速い学習は制約を消すのではなく、雑な判断のコストを高めます。

Explore mode は、uncertainty を早く減らすための働き方です。
仕事を仮説の連なりとして扱い、短いサイクルで仮説、検証、シグナル、判断を回します。
方向転換できるようにコストを低く保ち、判断に使える程度には証拠の品質も守ります。
Explore は混沌ではありません。
**最適化する対象が学習ループである**ということです。

Exploit mode は、制約の下でばらつきを減らすための働き方です。
プロセスを締め、必要な証拠のしきい値を上げ、安全性、品質、セキュリティ、traceability を守ります。
ここでも adaptation は残りますが、明確な guardrails の内側で行われます。
Exploit は官僚制ではありません。
最適化する対象が信頼性であるということです。

ただし、Explore と Exploit は純粋に分かれるものではありません。
Explore の中にも cycle time、証拠の扱い、止める基準といった optimization が必要です。
Exploit の中にも、統制された実験やリスクに基づく例外といった adaptation が必要です。
重要なのは purity ではなく dominance です。
何が支配的かを明らかにすることで、議論を信仰の争いにしないで済みます。

Explore と Exploit のあいだには、Expand という橋渡しの状態があります。
有望なシグナルを、安価な学習から、より大きな証拠へ移す状態です。
Expand では、証拠を広げ、品質や安全性や governance などの制約を強め、次のコミットメントに進むための基準を明確にします。
多くの組織では、仕事が exploit の discipline を必要としているのに、ふるまいが explore のまま残るため、この場所で大きなコストを払います。

Highsmith 氏は、この隠れたコストを handoff tax と呼びます。
それは、同じ言葉を使っているのに意味が違うこと、十分な証拠の基準がずれること、責任が曖昧になること、後から判断の理由を再構成できないことから生まれます。
多くのプログラムは、ひとつの段階の中で失敗するのではなく、段階の境目で失敗します。
速さがほしいなら、単に Agile をさらに強く押し込むのではなく、**handoff tax を減らす設計**が必要です。

bimodal IT は、この緊張を二つの組織レーンに分けようとした試みでした。
探索的な仕事と安定運用を別組織に置くと、紙の上では整理されて見えます。
しかし実際には、一方が innovation の英雄、もう一方が stability の警察のようになり、判断が往復し、handoff tax が膨らみます。
教訓は、緊張関係を組織図に外注できないということです。
この能力は、チームメンバーから経営層まで、判断に関わる全員の中に必要です。

Sciex の事例では、ISO 認証を受けた質量分析装置の開発で、hardware、firmware、software の統合が遅れることが大きな integration debt になっていました。
そこで governance は時間、費用、traceability を守りつつ、実行面では短い feedback loop と早期統合で不確実性に適応しました。
firmware は hardware のテストスケジュールに合わせて反復的に渡され、hardware が十分な機能を持った段階で software も段階的に加わりました。
完全な基板がそろうまで統合テストを待たなかったため、問題は早く見つかり、終盤の大きな負荷も避けやすくなりました。

dominance を運用可能にするには、四つの dial を使います。
まだ分からないことを示す uncertainty、間違えたときに何が壊れるかを示す risk、方向転換にかかる time、money、credibility の cost of change、そしてコミット前にどれだけの proof を求めるかという evidence threshold です。
これらを調整して dominance を決め、その dominance に合う workflow を設計します。

Explore-dominant では、仮説から判断までの cycle time、弱い賭けを早く止める stop rules、再現できる記録や前提の管理が重要になります。
Expand では、より大きな sample、広い environment、多くの integration point、強まる governance、次の commitment への明確なしきい値が必要です。
Exploit-dominant では、変更の trigger と rationale をきれいに残し、偶然のばらつきではなく controlled experiments として adaptation を行い、監査に耐える traceability を保ちます。

判断権限について、Highsmith 氏は RACI より DARE を勧めます。
RACI は、Responsible、Accountable、Consulted、Informed を整理する道具ですが、実務では会議の停滞や丁寧な拒否権を生みやすいとされます。
DARE は、Deciders、Advisors、Recommenders、Execution stakeholders を分けます。
多くの人に声を与えても、全員に vote を与える必要はありません。
**自律性を合意疲れに変えない**ために、誰が決め、誰が助言し、誰が選択肢を作り、誰が実行上の制約を早く知らせるのかを明確にします。

tailoring は、大きな手法から手順を削って速くなることを期待する作業ではありません。
それは disassembly であって、本当の tailoring ではありません。
本当の tailoring は、fit のための design です。
安全性、品質、traceability を守る制約を残し、学習速度と選択肢を守る practice を残し、mode 同士がぶつからないように境目を設計します。

結論として、Agile 対 Traditional という物語を売ることは、問題そのものを売ることになります。
必要なのは、Explore、Expand、Exploit を dominance pattern として扱い、四つの dial を意図的に回し、境目の handoff tax を減らし、tailoring を operating design として扱うことです。
問うべきなのは、どちらの側に立つかではありません。
いま最も高い handoff tax をどこで払っているのか、そして最初にどの dial を回すのかです。
