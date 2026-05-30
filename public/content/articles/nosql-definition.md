# Nosql Definition

## 要約

Nosql Definitionは、NoSQL databaseとは何かを明確に定義する難しさを扱う記事です。NoSQLには商標も標準化団体もmanifestoもなく、2009年6月11日にSan Franciscoで開かれた非公式meetupをきっかけに広まった用語だと説明しています。

この記事では、個別のdatabaseを指す場合のNoSQLは「SQLではないdatabase」と考えるのがよく、将来像としての「Not Only SQL」はPolyglotPersistenceと呼ぶほうがよいとしています。NoSQLには共通の特徴はあるものの、決定的な定義ではなく、曖昧さよりも新しいdatabase群がもたらす価値のほうが重要だと述べています。

## 読むときの観点

- NoSQLは厳密な分類語ではなく、歴史的に広まった曖昧な用語である。
- 「No SQL」と「Not Only SQL」を、個別製品とecosystemの文脈で分けて読む。
- 共通特徴は列挙できるが、それだけで定義にはならない。
- 曖昧な言葉でも、実務上の変化を捉えるためには有用なことがある。

## 原文の翻訳

Nosql Distilledに取りかかるとすぐに、私たちは厄介な難問に直面しました。私たちは何について書いているのか。NoSQL databaseとは正確には何なのか。この概念には強い定義がありません。trademarkもなく、standard groupもなく、manifestoすらありません。

この用語は、Johan Oskarssonが2009年6月11日にSan Franciscoで開催した非公式meetupで最初に表に出ました。そのsessionでは、Voldemort、Cassandra、Dynomite、HBase、Hypertable、CouchDB、MongoDBの発表がありました。この用語は急速に広まり、そのmeetingで言及されたdatabaseだけをNoSQLと呼ぶべきだと主張する人はほとんどいないでしょう。

ただし、現在使われている意味での「NoSQL」の起源はここにありますが、「NoSQL」という語が使われた最初の例ではありません。この語は90年代後半に、Carlo Strozziが主導したopen-source relational databaseの名前として初めて使われました。その名前は大きな注目を集めず、用語上の偶然を除けば、現在の「NoSQL」の用法とは関係がありません。

実際、名前そのものにもひねりがあることがよくあります。NoSQLの支持者の多くは、SQLへの「no」を意味するのではなく、Not Only SQLを意味するのだと言います。この点については、個別のdatabaseと、NoSQL支持者が未来として見ているecosystemの種類とを分けるのが有用だと思います。「xはNoSQL databaseである」と言うとき、NoSQLを「Not Only」と解釈するのはばかげていると思います。そうすると用語が無意味になってしまうからです。たとえばSQL ServerもNoSQL databaseだと主張できてしまいます。

したがって、「NoSQL database」は「no-sql database」と言うのが最善だと思います。一方で、NoSQL ecosystemは「not only」として別に解釈すべきです。ただし、この用法については私はPolyglotPersistenceという言葉のほうを好みます。なお、「not-only」と解釈するなら、本来は「NoSQL」ではなく「NOSQL」と書くべきでしょう。しかし私はほとんどの場合「NoSQL」と書かれているのを見ます。

この問題を片づけても、NoSQL databaseを定義するのはまだ簡単ではありません。SQLを使わないdatabaseなら何でも該当するのでしょうか。IMSやMUMPSのような古いdatabase technologyはどうでしょうか。SQLを持たなかったrelational system、たとえば初期のIngresはどうでしょうか。元の7つのdatabaseのどれかに、誰かがSQL interfaceを後付けできたらどうなるのでしょうか。

そこで私たちの本では、NoSQLは最近登場した特定のdatabase群の急速な動きを指す、という見方を採りました。これらのdatabaseには共通する特徴がいくつかありますが、どれも定義そのものではありません。

- relational modelもSQL languageも使わない
- open sourceである
- 大規模cluster上で動くよう設計されている
- 21世紀のweb propertyのニーズに基づいている
- schemaを持たず、制御なしに任意のrecordへfieldを追加できる

software業界における定義の曖昧な境界には慣れていますが、また1つ増えたのかと思うと正直うんざりします。しかし重要なのは、これらのdatabaseが、今後数十年にわたってapplicationを構築する方法に重要な追加手段を与えることです。明確な定義がないことは、将来の成功にとって、**小さな虫刺され程度の問題**にすぎないでしょう。
