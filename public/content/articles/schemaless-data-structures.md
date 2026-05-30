# Schemaless Data Structures

## 要約

Schemaless なデータ構造は柔軟に見えますが、多くの場合、実際には暗黙の schema を持っています。
その schema がコード中に隠れると、データの使い方を理解しにくくなり、変更も難しくなります。

ただし、schemaless な手法が常に悪いわけではありません。
Custom fields や non-uniform types のように、項目が利用者や種類ごとに大きく変わる場面では、有効な選択肢になります。

## 対応範囲

このページでは、infodeck の fallback ページに掲載されている公開テキストをもとに、主要な内容を日本語訳・要約として掲載します。
スライド全体の逐語訳ではありません。

## 読むときの観点

- 「schema がない」と「明示的な schema がない」を区別する。
- 暗黙の schema が、コードのどこに散らばるかを見る。
- Storage Schema と Predicate Schema の違いを押さえる。
- Custom fields や non-uniform types が、なぜ例外的に schemaless と相性がよいのかを考える。

## 原文の翻訳

近年、schemaless data の利点について語られることが増えています。
Schemaless であることは、NoSQL データベースへの関心を生んだ大きな理由のひとつです。
しかし schemalessness には、データベースに関してもメモリ上のデータ構造に関しても、多くの微妙な点があります。
それは「schemaless」とは何を意味するのか、そして schemaless な方法の長所と短所の両方に関わります。

この deck の中心的な警告は、schemaless なデータ構造には注意すべきだということです。
それらは多くの場合、なお **暗黙の schema** を持っており、いくつかの例外を除けば、明示的な schema のほうが望ましいからです。

### Schema とは何か

Schemaless を理解するには、まずリレーショナル schema から考えると分かりやすくなります。
リレーショナル schema は、テーブルにどの列があり、それぞれの名前とデータ型が何かを定義します。
その schema に合わないデータを挿入しようとすると、エラーになります。

一方、schemaless database は、個別の field や構造を持つ任意のデータを保存できます。
事前に schema を定義する手間が減り、さまざまな形のデータを保存できるため、柔軟性が増します。

しかし、データを操作するどんなコードも、その構造について何らかの仮定を置きます。
たとえば field 名が何であるかを知っていなければ、データを正しく扱えません。
この仮定に合わないデータは正しく操作されず、エラーにつながります。
つまり、schemaless な構造にも **操作する側が期待する形** は存在します。

### メモリ上の schema

Schema という考え方は、メモリ上にも当てはまります。
class 定義は、そのオブジェクトを操作するために使える論理的な field を定義しており、実質的には schema です。
型付きかどうかを問わず、record 構造にも同じことが言えます。

Dictionary、Hash、Associative Array、Map は、メモリ上で schemaless なデータ構造を作る一般的な方法です。
しかし implied schema の考え方はここでも残ります。
`aCustomer.firstname` と `aCustomer['firstname']` の違いは、見た目ほど大きくありません。

Kent Beck 氏のオブジェクト指向に関する本では、この違いを Common State と Variable State の違いとして説明しています。
定義済みの field が適している場所には Common State を使い、より柔軟な option を許したい場所には Variable State を使う、という整理です。

### リレーショナルシステムでの拡張

Schemaless な拡張は、リレーショナルシステムでもよく見られます。
Custom column を増やす方法は sparse table を生み、custom field の数に固定的な上限を作ります。
JSON のような構造化データを text field に埋め込む方法は、index を張りにくく、取り出しにプログラミング言語が必要になります。
Attribute table を使う方法は、custom data にアクセスするたびに追加の join を必要とします。

これらの手法は、どれも SQL ときれいには噛み合いません。
リレーショナル schema の上で、その schema を曲げながら ad-hoc な schemaless data を支える方法だからです。

### Storage Schema と Predicate Schema

ここまでの例は Storage Schema の話です。
Storage Schema は、保存機構がデータをどのように保存するかを定義します。
その schema に違反するデータは保存できません。

もうひとつの schema は Predicate Schema です。
Predicate Schema では、好きなデータを保存できます。
そのうえで、保存されたデータに schema を適用し、そのデータが predicate に合うかどうかを判定します。

XML schema は、この familiar な例です。
XML file は text なので、well-formed でありさえすればさまざまな要素の組み合わせを持てます。
そこに schema を適用することで、特定の定義に合っているかを検証できます。
同じデータ構造に複数の predicate schema を使い、文脈ごとに違う validation を行うこともできます。

### 暗黙の schema の問題

Schema は contract を文書化する仕組みでもあります。
Bertrand Meyer 氏の Design by Contract の考え方と同じく、schema は提供者が何を提供し、利用者が何を期待するかを表します。
この contract は、提供者だけで決めるより、利用者との協調で決めるほうが有用です。
これは internet API のように広く公開される component では特に重要です。

暗黙の schema の問題は、隠れていることです。
データを正しく操作するには、`customer.lastname` を使うのか `customer.last_name` を使うのかを知っていなければなりません。
明示的な schema なら、それは見つけやすいものです。
しかし暗黙の schema は、データへアクセスするコード全体に散らばりやすく、見つけにくくなります。
そのため、データ構造の上に新しい開発を重ねる速度が落ちます。

この問題を減らすには、明確な data access layer や predicate schema が役立ちます。
隠れた schema の問題があるため、基本的な好みとしては明示的な schema を使うべきです。
ただし、schemalessness が価値を持つ場面もあります。

### Schemaless が向く場面

Custom fields は、schemaless な方法とうまく合います。
多くの状況では、製品が定義した field に加えて、利用者が自分の field を追加したくなります。
それらの field は UI に表示されるだけの場合もありますが、利用者の ad-hoc script で使われることもあります。
base software がそれらの field を使わないなら、base software に暗黙の schema を課しません。
そのため、schemalessness の主要な問題が起きにくくなります。

Non-uniform types も schema にとって扱いにくいものです。
たとえば event は、event の種類によって属性が大きく変わります。
単一の record type を使うと optional field だらけになります。
種類ごとに record type を分けると、多数の型が生まれ、すべての event をまとめて扱いにくくなります。
こうした場面では、schemaless store が **実用的な代替案** になります。

Schema migration は、schemaless の理由としてはそれほど強くありません。
たとえば顧客名を単一の name field から firstname と lastname に分ける場合、storage schema を更新しなくてよいとしても、暗黙の schema とそれに依存する access code の変更は必要です。
Schemaless store では、古い形と新しい形の両方を読める access code を用意し、保存時には新しい形だけにすることで、徐々にデータを移行できます。
ただし、その分 access code は複雑になります。
通常は、古い構造を支える code を後で取り除くべきです。

結論として、custom fields と non-uniform types は schemaless approach を使う十分な理由になります。
Schema migration はそれほど強い理由ではありません。
Schemaless approach を使う場合でも、隠れた暗黙の schema の問題を減らすため、明確な data access layer や predicate schema を検討すべきです。
