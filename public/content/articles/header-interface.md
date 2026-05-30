# Header Interface

## 要約

Header Interface は、クラスの public な暗黙インターフェースを、そのまま明示的な interface として写し取る考え方です。
すべての public メソッドを interface に宣言することで、別実装を差し替えられるようにします。

この記事は、Header Interface を Role Interface と対比するための短い定義です。
利用者の役割ごとに必要な操作を設計するのではなく、実装クラスの公開面をそのまま複製する点が特徴です。

## 読むときの観点

- interface が利用者の要求から生まれているのか、実装クラスの写しなのかを見る。
- Header Interface と Role Interface の違いを押さえる。
- 代替実装を可能にする一方で、実装の public メソッドに引きずられる点に注意する。

## 原文の翻訳

Header Interface とは、クラスの **暗黙の public interface をまねる明示的な interface** のことです。基本的には、クラスの public メソッドをすべて取り出し、それらを interface に宣言します。そうすれば、そのクラスに対する代替実装を提供できます。これは Role Interface の反対にあたります。詳細や長所短所については、そちらでさらに述べています。
