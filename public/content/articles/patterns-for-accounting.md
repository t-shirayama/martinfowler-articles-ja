# Patterns for Accounting

## 要約

多くの情報システムはお金を追跡します。
この記事は、複式簿記の基本に基づいて、`Account`、`Accounting Entry`、`Accounting Transaction` をどうモデル化するかを説明します。

後半では、`Domain Event` から会計上の取引を生成する設計と、誤ったイベントを後から修正するときの adjustment の方法を整理します。
置き換え、反対仕訳、差分調整にはそれぞれ履歴保持と複雑さのトレードオフがあります。

## 読むときの観点

- Account の balance は保存値ではなく、entries の合計として導けることを見る。
- Accounting Transaction が複数の Accounting Entry を結びつけ、移動を明示する役割を押さえる。
- Domain Event と Event Sourcing によって、会計取引を自動生成できる関係を見る。
- Replacement、Reversal、Difference の各 adjustment の違いを比べる。

## 原文の翻訳

それを明らかにした調査を私は知りませんが、世界のコンピュータシステムの非常に大きな割合は、お金を追跡しているのではないかと思います。
少なくとも、それはお金に価値があるということを意味するのでしょう。
実際、お金は非常に価値があるため、人間は何百年ものあいだ、お金を追跡することに夢中になってきました。
それに専念するかなり大きな専門職、会計もあります。
ある組織が何かをお金より重視しているかを試すには、その何かを追跡する人の数と、会計担当者の数を比べれば分かります。

会計における最も基本的な概念のひとつは複式簿記です。
これは中世に発展し、1494年にイタリアの修道士 Luca Pacioli によって初めて文書化されました。
この考え方の根本にあるのは、お金のさまざまな入れ物を、お金のあらゆる移動を注意深く追跡することで管理することです。

お金の入れ物が `Account` です。
各 `Account` は balance、つまり現在の値を持ち、さらにその `Account` へのすべての変更を表す `Accounting Entry` のリストを持ちます。
`Account` の値、つまり balance は、すべての `Accounting Entry` の合計として導かれます。
balance は現在時点について計算できます。
しかし一般には balance はある期間に対するものであり、その場合、その期間内に記帳された entries の値を合計します。

図1: accounts、entries、transactions の基本モデル。

`Accounting Transaction` は、移動に関わる `Accounting Entry` を結びつけることで、`Account` 間の移動をより明示的に捕捉します。

ここでは共通のオブジェクト群として並べましたが、これらの多くは任意です。
私は、`Account` や `Accounting Transaction` なしで `Accounting Entry` を使うシステムを見たことがあります。
本質的に、`Account` は `Accounting Transaction` を分類するための記述子として働きます。
そのため、別のオブジェクトを記述子として使うことも可能です。
同様に、移動を `Accounting Entry` として慎重に追跡することにそれほど関心がないなら、`Accounting Transaction` を落とすこともできます。

## 調整を行う

accounts はイベントの金銭的な帰結を追跡します。
つまり、`Event Sourcing` と非常に相性がよいということです。
`Domain Event` が処理されると、`Accounting Transaction` の集合を生成できます。
すべての `Accounting Transaction` が `Domain Event` の処理から生成されるなら、アプリケーションのほかの部分がイベントソース化されていなくても、その `Accounting Transaction` は `Event Sourcing` を使っていることになります。

この種の状況では、`Accounting Transaction` は `Retroactive Event` を使ったエラーの自動修正に自然に向いています。
これを行うには、誤ったイベントから生成された `Accounting Transaction` を見つけ、どの `Accounting Transaction` が生成されるべきだったかを判断し、誤った集合を正しい集合へ変える adjustment を実行する必要があります。

この adjustment には三つの方法があります。

`Replacement Adjustment` は、誤った `Accounting Transaction` を削除し、正しい集合を作ります。
これは単純な方法ですが、会計フレームワーク内の `Accounting Transaction` の履歴を失うことを意味します。
`Parallel Model` を使えば再構成はできますが、それほど直接的ではありません。

`Reversal Adjustment` では、誤った `Accounting Transaction` をそのまま残します。
ただし、それぞれについて反対の `Accounting Entry` を記帳し、打ち消します。
そのうえで、正しい値に合わせるための `Accounting Transaction` を記帳します。
これはかなり分かりやすく、履歴を保持できます。
しかし、互いに打ち消し合うだけの entries が大量に生じます。

`Difference Adjustment` も誤った entries をそのまま残します。
ただし、誤った entries と正しい entries の差分を表す新しい entries を記帳します。
これは、ほかの adjustment のひとつを `Parallel Model` で実行し、account balances の差分を表す entries を記帳することで行えます。
この方法は履歴を保持し、`Accounting Transaction` の量を最小化しますが、実行はより複雑です。

ここでは `Retroactive Event` を使った自動修正に集中してきました。
しかしもちろん、手動変更の結果を記録するためにも、これらと同じ adjustment の方法を使えます。
