# SE Radio Podcast on Agile Database Development

## 要約

このエピソードでは、Pramod Sadalage 氏と Martin Fowler 氏が、database evolution と agile database development について語ります。
短い開発サイクルの中で、データベース設計と、とくにデータベースの進化をどう組み込むかが中心テーマです。

扱われる話題は、schema 変更を script として扱うこと、database 関連変更を continuous integration に組み込むこと、複数 schema を使って中央集権的な開発配置を避けること、data migration を小さな段階に分けること、database refactoring を小さく増分的に進めることです。

## 対応範囲

このページでは、公開されている番組紹介文と show notes をもとにした日本語訳・要約を掲載します。
音声全編の公式トランスクリプトは確認していないため、発話内容の逐語訳ではありません。

## 読むときの観点

- データベースを、アプリケーションとは別の固定資産ではなく、進化する成果物として見る。
- schema 変更を手作業のイベントではなく、script 化され version control される変更として考える。
- migration を一度の大きな移行ではなく、小さな安全な段階に分ける。
- database refactoring を agile な開発フローへどう組み込むかを見る。

## 原文の翻訳

このエピソードでは、Pramod Sadalage 氏と Martin Fowler 氏に、database evolution と agile database development について話を聞きます。
Agile な開発文化の中で database を扱う際の基本的な課題、そして現代的なソフトウェア開発手法に多い短い開発サイクルの中に、database design と、何より database evolution をどう含めるかを議論します。

Database 関連の code change を continuous integration に組み込む方法として、script 化された database schema change が取り上げられます。
また、開発チームが中央集権的な deployment に縛られないようにするため、複数の database schema を使う方法も話題になります。

Data migration を incremental step に分ける方法、そして agile な環境で助けになる tool についても扱われます。
中心にあるのは、database refactoring を小さく incremental な step に分解することです。
これは、database change を agile development flow に統合するうえで **もっとも重要な部分のひとつ** とされています。

### Show notes の項目

- Database Refactorings
- Evolutionary Database Design
- Martin Fowler
- Refactoring Databases: Evolutionary Database Design
- Recipes for Continuous Database Integration

この紹介文全体からは、database を agile から切り離された別領域として扱うのではなく、application code と同じように変更可能で検証可能なものとして扱う姿勢が読み取れます。
そのためには、変更を script にし、version control と CI に載せ、migration と refactoring を小さく進めることが要になります。
