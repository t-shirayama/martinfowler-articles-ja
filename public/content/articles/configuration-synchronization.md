# Configuration Synchronization

## 要約

Configuration Synchronization は、CFEngine、Puppet、Chef などの自動構成ツールで定義したサーバー構成を、サーバーの生存期間中に繰り返し適用する方法です。手作業で変更された内容は、次の同期で中央の定義に戻されます。

ただし、現在の構成管理ツールでサーバー全体を完全に一貫させ続けるのは現実的ではありません。管理対象外の領域やパッケージ依存、長寿命サーバーによる drift が残るため、Phoenix Servers や Immutable Servers という考え方につながります。

## 読むときの観点

- 構成定義を繰り返し適用して Snowflake Servers を避ける狙いを見る。
- すべての構成要素を自動管理するコストの高さに注目する。
- パッケージ依存や「存在してほしくないもの」の管理が難所になる。
- サーバー寿命を短くする設計が configuration drift を抑える理由を読む。

## 原文の翻訳

CFEngine、Puppet、Chef のような automated configuration tools は、サーバーの要素の構成を記述する recipes を提供することで、SnowflakeServers を避けられるようにします。Configuration synchronization は、これらの仕様を、定期的に、または変更があったときに、サーバーインスタンスの生存期間を通じて継続的に適用します。

誰かが tool の外で server に変更を加えた場合、次に server が synchronized されると、中央で指定された configuration に戻されます。何らかの configuration change が必要なら、それは configuration specification、つまり recipes、manifests、あるいはその configuration tool がそう呼ぶものに対して行われ、その後、infrastructure 全体の関連するすべての server に適用されます。

理論上は、server が一度作られれば、configuration synchronization がそれを最新に保ち、upgrade や patch を適用し、長い生存期間にわたって configuration drift を防ぐことになります。

しかし実際には、現在の automated configuration management tools を使って server を完全に一貫した状態に保つことは現実的ではありません。そのため、時間がたつにつれて configuration synchronization は不一致を生みます。

automated tool で管理される server configuration の各要素には、recipe や manifest を書き、テストし、保守する作業が必要です。典型的な server のあらゆる要素を、これらの tool ですべて管理しようとするのは単純に現実的ではありません。要素の数が多すぎるからです。さらに、指定する要素がひとつ増えるたびに、それらの間に起こりうる相互作用、統合、依存関係のために、必要な作業は非線形に増えていきます。

software packages は特に難しい課題です。さらに多くの packages への依存を持つことがあるからです。yum、apt-get、gems などの tool は、依存関係を自動で解決し、repositories から install します。そのため、system 上の多数の packages は暗黙的にしか管理されず、予告なく変わることがあります。install された software packages の versions や dependencies を細かく管理することもできますが、関わる packages の数を考えると扱いきれない仕事です。

server に置きたいものを管理するだけでも難しいのに、置きたくないものを管理するのはさらに厄介です。そうしたものは事実上無限にあるからです。現在の configuration management tools では、見つかったら削除したい file、package、その他の要素を明示的に列挙する必要があります。つまり、追加のものが一部の server に手作業で入れられ、一貫性のない予期しない振る舞いを生む可能性があります。

現実には、automated configuration tools を使う人たちは、server の configurable surface area の100%を指定しなくても、十分うまくやっています。チームは automated configuration に 80/20 rule を適用し、自分たちの特定のニーズに最も関係する system の20%、あるいは5%に、注意の80%、あるいは95%を集中させます。残りは base OS が install する defaults に任せます。したがって system の大部分は automated configuration の管理下にはありませんが、一般にはそれで機能します。

残念ながら、それでうまくいかないとき、つまり automation tools が管理していない system の一部が問題を起こしたとき、その影響は予想外で、追跡が難しくなることがあります。

この問題は、server の寿命が長くなるほど、また変更頻度が高くなるほど悪化します。server が長く稼働し続けるほど、特に新しい server と比べて、他の server からずれていく可能性が高まります。

この問題から、PhoenixServers を使う人もいます。server の寿命を短く保ち、base image から新しい server を頻繁に作り直すことで、management tool に本当に必要な以上の server configuration を指定する負担なしに、configuration drift の可能性を小さくできます。phoenix server を論理的な結論まで進めると ImmutableServers になります。これは、server の生存期間中に変更を加えないことで drift を避けます。
