# User Defined Field

## 要約

User Defined Fieldは、ユーザーがデータ構造へ独自フィールドを追加できるようにする設計を扱う記事です。メモリ上では、通常フィールドとは別にhashmapを持たせる方法が有力で、Kent BeckはこのパターンをVariable Stateと呼んでいます。

難所は永続化です。schemaless databaseなら比較的単純ですが、リレーショナルデータベースのように保存スキーマがある場合は、Serialized LOB、属性テーブル、事前定義されたcustom field、dynamic schemaなどから、検索やインデックス、ORMの対応を考えて選ぶ必要があります。

## 読むときの観点

- ユーザー定義フィールドは、アプリケーション開発者が知らないフィールドをユーザーが作れる点に特徴がある。
- メモリ上の表現と、永続化スキームは別々に考える。
- Serialized LOB、属性テーブル、事前定義フィールド、dynamic schemaの検索性と運用上の違いを見る。
- schemalessでもスキーマが不要になるわけではない、という注意を押さえる。

## 原文の翻訳

ソフトウェアシステムでは、ユーザーがデータ構造の中に自分自身のフィールドを定義できるようにする機能がよくあります。アドレス帳を考えてみてください。そこには追加したくなるものが山ほどあります。新しいソーシャルネットワークが毎日のように現れるなら、ユーザーは連絡先にBunglr idのための新しいフィールドを追加したくなるかもしれません。

メモリ上の用途では、これを行う最善の方法は、ユーザー定義フィールドのためのhashmapフィールドをクラスに含められるようにすることです。Kent BeckはこのパターンをVariable Stateと呼んでいます。

```ruby
# ruby
class Contact
  attr_accessor :firstname, :lastname

  def initialize
    @data = {}
  end

  def [] arg
    return @data[arg]
  end
  def []= key, value
    @data[key] = value
  end
end

aCustomer = Contact.new
aCustomer.firstname = "Martin"
aCustomer[:bunglrId] = 'fowl'
```

このような準備があれば、ユーザーがオブジェクトに新しいフィールドを付けられるようなUI上のaffordanceを追加できます。共通のユーザー定義フィールドが必要なら、クラス変数を使ってhashmapの共通キー一覧を保持できます。通常のフィールドとユーザー定義フィールドでアクセス方法が違うというぎこちなさはありますが、言語によってはこれさえ乗り越えられます。言語がDynamic Receptionをサポートしているなら、それを使って通常のフィールドアクセスでhashmapにアクセスできます。

```ruby
class Contact...

  def method_missing(meth, *args)
    if @data.has_key? meth
      return @data[meth]
    else
      super
    end
  end
```

この話で最も厄介になりがちなのは、永続化の方法を考えることです。schemaless databaseを使っているなら、たいていは簡単です。アプリケーション定義のキーに、ユーザー定義のキーを追加するだけです。厄介なのは、保存スキーマを持つデータベース、とくにリレーショナルデータベースです。

通常の最善策はSerialized LOBを使うことです。これは基本的に、ユーザー定義フィールドをJSONまたはXMLドキュメントとして保存する大きなtextカラムを作る、という方法です。最近の多くのデータベースは、このアプローチをかなりよく支援しており、LOB内部のデータ構造に基づくインデックスやqueryもサポートしています。しかし、そのようなサポートが利用できる場合でも、通常のフィールドを使うよりは**扱いにくくなりがち**です。

別の道は、何らかの属性テーブルを使うことです。テーブルは次のような形になるかもしれません。

```sql
CREATE TABLE ContactAttributes (
  contactId   INTEGER,
  attribute   TEXT,
  value       TEXT,
  PRIMARY KEY (contactId, attribute))
```

ここでも、queryとインデックスは扱いにくくなります。queryには余分なjoinがかなり含まれ、かなり散らかったものになることがあります。

事前定義されたcustom fieldという別の方式もあります。ここでは、`custom_field_1`のようなフィールド、おそらく`custom_field_1_name`のようなフィールドも含めて、あらかじめスキーマを用意します。各インスタンスで使えるcustom fieldの数は、事前に定義した数に制限されます。いつものように、インデックスとqueryは扱いにくくなります。

属性テーブルや事前定義されたcustom fieldを使うときには、SQLのデータ型ごとに異なるカラムを持たせることもできます。したがって事前定義フィールドなら`integer_1, integer_2, text_1...`のようになるかもしれませんし、属性テーブルなら複数のvalueフィールド、たとえば`text_value, integer_value`を持つかもしれません。

dynamic schemaは、しばしば見落とされるアプローチです。これを行うには、誰かがフィールドを追加したとき、そのフィールドをテーブルに追加するために`alter table`文を使うよう設定します。私たちのMingleチームはこれを行っており、その働きに満足しています。新しいフィールドは、アプリケーション定義のフィールドとまったく同じようにインデックス付けやqueryができます。これは、すべてのインスタンスがすべてのフィールドを持つことを意味するため、インスタンス間のばらつきが大きい場合には**あまり便利ではありません**。

永続化スキームの選択は、relational mappingに何を使うかによって影響を受けます。ユーザー定義フィールドは、リレーショナルマッピング問題の中で最も踏み固められた領域ではないため、relational mappingライブラリごとのサポートにはかなりのばらつきがあります。

ユーザー定義フィールドは、non-uniform typesと似た問題です。どちらの問題も、より柔軟なスキーマ、あるいは本当にschemalessなアプローチの必要性につながります。ただし、schemalessはスキーマがないという意味ではないことを忘れないでください。ユーザーの求めに応じて変化するわけではないnon-uniform typesがあるなら、継承寄りのパターンのいずれかが意味を持つかもしれません。Single Table Inheritance、Class Table Inheritance、Concrete Table Inheritanceなどです。

### 注

Bret Taylorは、このような方式でフィールドにインデックスを付ける仕組みとして、インデックス可能な各フィールドに対して個別のインデックステーブルを作る方法を説明しています。

Mingleのアプローチは、実際には既存テーブルにフィールドを追加するだけよりも少し複雑です。Mingleの中心的なレコード型はcardで、storyやtaskなどを表します。card上のフィールドはprojectごとに異なり、同じデータベース内に多くのprojectを持つことができます。そのためMingleは、単一のcardテーブルを使うのではなく、各projectのcardごとに新しいテーブルを作ります。そのうえで、ユーザーが望むとおりに、このテーブルへ動的にフィールドを追加します。

Non-uniform typesとは、インスタンスが少数で、しかも互いにかなり異なるフィールドの組み合わせを使う型です。テーブル全体を見ると、それぞれの行が大量のカラム一覧のうち少数しか使わないため、sparse tablesと呼ばれることもあります。non-uniform typesとユーザー定義フィールドの違いは、non-uniform typesでは潜在的なフィールドをすべて開発者が知っている一方で、ユーザー定義フィールドでは、**開発者が決して知ることのないフィールド**を作れる点にあります。
