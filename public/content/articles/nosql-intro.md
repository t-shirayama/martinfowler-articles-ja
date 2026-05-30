# The Future is not NoSQL but Polyglot Persistence

## 要約

この infodeck は、NoSQL データベースの重要性を技術管理者向けに説明する短い導入です。
リレーショナルデータベースがなぜ長く支配的だったのか、その支配がなぜ揺らいだのか、NoSQL がどのような利点を持つのかを整理します。

ただし結論は、リレーショナルデータベースが不要になるというものではありません。
むしろ、用途に応じて複数のデータ保存技術を選ぶ **Polyglot Persistence** が中心になります。

## 対応範囲

このページでは、公開PDF infodeck と紹介ページに掲載されているテキストをもとに、主要な内容を日本語訳・要約として掲載します。
PDF全体の逐語訳ではありません。

## 読むときの観点

- SQL とリレーショナルモデルが長く支配的だった理由を確認する。
- スケール、クラウド、web services が、その支配を揺らした要因としてどう説明されているかを見る。
- NoSQL の利点と制約を、両方とも読む。
- Polyglot Persistence が、企業全体と単一アプリケーション内の両方で起きる点に注目する。

## 原文の翻訳

### SQL が支配してきた理由

SQL は20年にわたり支配的でした。
リレーショナルモデルは広く使われ、理解されています。
データベースとのやり取りには、ほぼ標準化された言語である SQL が使われます。
この標準化のおかげで、人々は新しいことを学び直さなくても、慣れた形で作業できます。

リレーショナルデータベースは、大量の永続データを disk 上に保存し、application が必要な部分を query で取り出せるようにしてきました。
また、多数の利用者が同じ情報へ同時にアクセスする問題に対して、transaction による concurrency control を提供します。

さらに、企業内の多くの application は情報共有を必要とします。
複数の application が同じ database を使うことで、それらが一貫した最新データを参照できるようになります。
SQL の単純なデータモデルと標準化は、多くの reporting tool の土台にもなりました。

### 支配が揺らいだ理由

しかし、SQL の支配にはひびが入り始めています。
リレーショナルデータベースは基本的に単一の machine 上で動くよう設計されているため、scale させるにはより大きな machine を買う必要があります。
一方、多数の machine を使って水平に scale するほうが、安く効果的な場合があります。

大規模 cluster の個々の machine は信頼できないとしても、cluster 全体は machine が故障しても動き続けられます。
Cloud はまさにこの種の cluster であり、その意味でリレーショナルデータベースとは相性が悪い面があります。

また、web services の台頭は、application integration の手段として shared database に代わる有効な選択肢を提供しました。
これにより、異なる application がそれぞれ自分に合った data storage を選びやすくなります。
Google Bigtable や Amazon Dynamo のような取り組みは、NoSQL community に大きな影響を与えました。

### NoSQL データベース

NoSQL の正式な定義はありません。
この言葉は2009年に開催された workshop から始まりましたが、どの database を NoSQL と呼べるのかについては議論があります。
それでも、よく見られる共通点はいくつかあります。

NoSQL database は、リレーショナルデータモデルを使わず、そのため SQL 言語も使わない傾向があります。
Cluster 上で動くよう設計されることが多く、open source であることも多いです。
また、fixed schema を持たず、任意の record に任意の data を保存できることがあります。

NoSQL によって、application development の負荷を減らせる場合があります。
多くの開発努力は relational database との作業に費やされます。
Object/Relational Mapping framework によって負担は軽くなったものの、database はなお開発時間の大きな源です。
問題領域により適した database を選ぶことで、この負荷を減らせることがあります。

NoSQL database が支える大規模 cluster は、より大きな dataset を保存し、大量の analytic data を処理する助けになります。
代替的な data model によって、リレーショナルデータベースだけではためらっていた問題に取り組める場合もあります。

### リレーショナルは終わらない

それでも、relational model が死んだわけではありません。
Tabular model は多くの種類のデータに向いています。
とくに、データを分解し、異なる目的のために再構成する必要がある場合に適しています。

NoSQL database の多くは cluster 上で効果的に動くため、transaction capability が限定されます。
それで十分な場合も多いですが、常に十分とは限りません。
また、NoSQL system はまだ新しく、人々は使い方に十分慣れていません。
SQL database の長い支配によって、多くの tool は SQL database を前提に作られています。

このため、結論は NoSQL が relational を置き換えるというものではありません。
むしろ、**データの使われ方に応じて storage technology を選ぶ** Polyglot Persistence の世界へ向かう、ということです。

### Polyglot Persistence

Polyglot Persistence とは、個々の application でデータがどう使われるかに基づいて、複数の data storage technology を使うことです。
企業全体では、異なる application が異なる storage technology を使う形で現れます。
単一 application の中でも、データの一部ごとに access characteristic が異なれば、異なる data store を使うことがあり得ます。

仮想的な小売 web application では、user sessions に Redis、product catalog に MongoDB、financial data と reporting に RDBMS、shopping cart に Riak、analytics や user activity logs に Cassandra、recommendations に Neo4J を使う、というような構成が考えられます。
ただし、これはあくまで仮想例であり、実際の技術推奨にはもっと多くの文脈情報が必要です。

Polyglot Persistence は、企業に多くの新しい機会をもたらします。
同時に、それは多くの新しい問題でもあります。
どの storage technology を使うかを決めなければなりません。
NoSQL tool は若く、粗い部分があります。
経験が少ないため、よい pattern や落とし穴もまだ十分に分かっていません。
また、data group が新しい技術にどう反応するかという organizational change もあります。

候補になるのは、strategic で市場投入を急ぐ project、または data intensive な project です。
多くの software project は utility project であり、企業の競争優位の中心ではありません。
そうした project は、Polyglot Persistence がもたらす risk や staffing demand を引き受けるべきではありません。

一方で、市場投入を急ぐ必要があり、適切に使えば開発チームの productivity を高められる場合があります。
Data intensiveness は、データ量の多さ、高可用性、大量の read/write traffic、複雑な data relationship など、さまざまな形で現れます。
これらは non-relational storage を示唆するかもしれませんが、最適な選択は data interaction の具体的な性質によって決まります。
