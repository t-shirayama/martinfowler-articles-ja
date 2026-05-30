# Evolutionary Database Design

## 要約

Evolutionary Database Design は、アプリケーションの発展に合わせてデータベース設計も継続的に進化させるための実践群です。
中心にあるのは、データベース変更を migration として扱い、アプリケーションコードと同じように version control、continuous integration、自動化された deployment pipeline の中で管理することです。

この記事は、DBA と開発者の密な協働、各自のデータベースインスタンス、頻繁な小さな変更、データ移行を含む database refactoring、そして shared database や NoSQL への応用を説明します。
要点は、データベースを固定的な前提ではなく、**テストと自動化に支えられて進化できる設計対象**として扱うことです。

## 読むときの観点

- migration script が、schema だけでなく data と database code も含む変更単位として扱われる点を見る。
- database refactoring では、schema、既存 data、database access code の3つを同時に考える必要がある。
- CI と個人用 database instance が、頻繁で小さな統合を可能にする仕組みに注目する。
- shared database、複数バージョン、NoSQL では、互換性と transition phase が特に重要になる。

## 原文の翻訳

過去10年ほどで、私たちはアプリケーションの開発に合わせて database design を進化させられる数多くの技法を開発し、洗練させてきました。これは agile methodology にとって非常に重要な能力です。これらの技法は、database development に continuous integration と automated refactoring を適用し、DBA と application developer が密に協働することに依存しています。技法は、本番前のシステムにもリリース済みのシステムにも、green field project にも legacy system にも有効です。

過去10年で、agile methodology の台頭を見てきました。それ以前の方法と比べると、agile は database design に対する要求を変えます。その中心にある要求のひとつが evolutionary architecture という考え方です。agile project では、システムの要求を前もって固定することはできないと考えます。その結果、プロジェクトの初期に詳細な design phase を設けることは現実的ではなくなります。システムの architecture は、ソフトウェアのさまざまな iteration を通じて進化しなければなりません。

agile method、とりわけ extreme programming (XP) には、この evolutionary architecture を実用的にする実践がいくつもあります。

私たちと Thoughtworks の同僚が agile project に取り組み始めたとき、architecture の進化を支えるために database をどう進化させるかという問題を解く必要があると気づきました。2000年ごろ、最終的に600ほどの table を持つことになった database の project から始まりました。その project に取り組む中で、schema を変更し、既存 data を無理なく migrate するための技法を開発しました。これにより、database は完全に柔軟で進化可能なものになりました。

私たちはこれらの技法をこの記事の以前の版で説明しました。その説明は、ほかの team や toolset に影響を与えました。それ以来、世界中の何百もの project でこれらの技法を使い、さらに発展させてきました。小さな team から、大規模な多国籍 program までさまざまです。この記事を更新したいと長く考えていましたが、ようやくきちんと刷新する機会を得ました。

### Jen が新しい story を実装する

これらがどう機能するかをつかむために、開発者 Jen が新しい user story を実装するために code を書くとき、何が起こるかを概観しましょう。その story は、user が在庫中の product の location、batch、serial number を見たり、検索したり、更新したりできるべきだと言っています。database schema を見ると、Jen は inventory table に現在それらの field がなく、3つの field を連結した単一の `inventory_code` field だけがあることに気づきます。

彼女はこの単一の code を、`location_code`、`batch_number`、`serial_number` の3つの独立した field に分割しなければなりません。

必要な手順は次のとおりです。

- 既存 schema の `inventory` table に新しい column を追加する。
- 既存の `inventory_code` column から data を分割し、`location_code`、`batch_number`、`serial_number` column を更新する data migration script を書く。
- 新しい column を使うよう application code を変更する。
- view、stored procedure、trigger などの database code を、新しい column を使うよう変更する。
- `inventory_code` column に基づく index を変更する。
- database migration script とすべての application code change を version control system に commit する。

新しい column を追加し data を migrate するために、Jen は現在の schema に対して実行できる SQL migration script を書きます。これにより schema を変更し、inventory 内の既存 data もすべて migrate します。

```sql
ALTER TABLE inventory ADD location_code VARCHAR2(6) NULL;
ALTER TABLE inventory ADD batch_number VARCHAR2(6) NULL;
ALTER TABLE inventory ADD serial_number VARCHAR2(10) NULL;
UPDATE inventory SET location_code = SUBSTR(product_inventory_code,1,6);
UPDATE inventory SET batch_number = SUBSTR(product_inventory_code,7,6);
UPDATE inventory SET serial_number = SUBSTR(product_inventory_code,11,10);

DROP INDEX uidx_inventory_code;

CREATE UNIQUE INDEX uidx_inventory_identifier
  ON inventory (location_code,batch_number,serial_number);

ALTER TABLE product_inventory DROP COLUMN inventory_code;
```

Jen はこの migration script を、自分の machine 上の database の local copy に対して実行します。その後、新しい column を使うよう application code を更新します。作業中は、application の振る舞いの変化を検出するために、既存の test suite をその code に対して実行します。結合 column に依存していた一部の test は更新が必要です。追加すべき test もあるかもしれません。

これらをすべて終え、application のすべての test が自分の machine 上で green になったら、Jen は migration script と application code change を含むすべての変更を、共有の project version control repository、ここでは mainline と呼ぶものへ push します。

この変更にまだあまり慣れていなくても、Jen は幸運です。これは database に対してよく行う変更だからです。database refactoring の本や online summary で調べることができます。

変更が mainline に入ると、Continuous Integration server がそれを拾います。CI server は mainline copy の database に migration script を適用し、その後すべての application test を実行します。すべて green なら、この process は QA や Staging environment を含む Deployment Pipeline 全体で繰り返されます。最終的に同じ code が production に対して実行され、本番 database の schema と data が更新されます。

このような小さな user story では database migration はひとつだけですが、より大きな story は database への各変更ごとにいくつかの別々の migration へ分けられることがよくあります。私たちの通常の規則は、各 database change をできるだけ小さくすることです。小さいほど正しく行いやすく、誤りもすぐに見つけて debug できます。このような migration は簡単に合成できるので、小さなものをたくさん作るのが最善です。

### 変化を扱う

2000年代初頭に agile method が広まるにつれ、その最も明らかな特徴のひとつは change に対する姿勢でした。それ以前の software process に関する考え方の多くは、要求を早期に理解し、その要求に sign-off し、それを design の基礎にして、さらにそれに sign-off し、それから構築へ進むというものでした。これは plan-driven cycle であり、しばしば waterfall approach と呼ばれます。

そうした approach は、事前に広範な作業を行うことで変更を最小化しようとします。初期作業が終わった後の変更は、大きな問題を引き起こします。その結果、要求が変化する場合、こうした approach は困難に直面します。requirements churn は、この種の process にとって大きな問題です。

agile process は change に対して別の姿勢を取ります。change を受け入れ、development project の後半であっても変更が起きることを許します。変更は制御されますが、process の姿勢はできる限り change を可能にすることにあります。これは多くの project における要求の本質的な不安定さへの反応でもあり、競争圧力に合わせて変化できるようにすることで、動的な business environment をよりよく支えるためでもあります。

これを機能させるには、design に対する別の態度が必要です。design を construction を始める前にほぼ完了する phase と考えるのではなく、construction、testing、さらには delivery と絡み合う ongoing process として見ます。これは planned design と evolutionary design の対比です。

agile method の重要な貢献のひとつは、evolutionary design を制御された形で機能させる実践を生み出したことです。設計が事前に計画されていないときに起きがちな混乱ではなく、これらの method は evolutionary design を制御し、実用的にする技法を提供します。

この approach の重要な部分が iterative development です。そこでは project の期間中に software life-cycle 全体を何度も回します。agile process は各 iteration で完全な life cycle を実行し、最終 product の要求の小さな subset に対して、動作し、テストされ、統合された code で iteration を終えます。iteration は短く、数時間から数週間までさまざまです。より熟練した team はより短い iteration を使います。

こうした技法の利用と関心が高まる一方で、最大の問いのひとつは、database に対して evolutionary design をどう機能させるかです。長い間、database community の人々は database design は必ず事前計画が必要なものだと考えてきました。development の後半で database schema を変更すると、application software に広範な破損を起こしがちでした。さらに、deployment 後に schema を変更すると、痛みを伴う data migration problem が生じます。

過去15年ほどの間、私たちは evolutionary database design を用いて、それを機能させた多くの大規模 project に関わってきました。複数拠点にまたがる100人以上の project もありました。50万行以上の code、500以上の table を持つ project もありました。application の複数 version が production にあり、24時間365日の uptime を必要とする application もありました。これらの project で、1か月の iteration と1週間の iteration を見てきましたが、より短い iteration のほうがうまく機能しました。

以下で説明する技法は、それを機能させるために私たちが使ってきたものです。

初期のころから、私たちはこれらの技法をより多くの project に広げ、より多くの case から経験を得ようとしてきました。現在では、私たちのすべての project がこの approach を使っています。また、ほかの agile practitioner から inspiration、idea、experience も得てきました。

### 制約

技法に入る前に、私たちが evolutionary database design のすべての問題を解いたわけではない、と述べておくことが重要です。

私たちは、数百の小売店がそれぞれ自分の database を持ち、それらすべてを一緒に upgrade しなければならない project を経験しました。しかし、そのような多数の site に多くの customization がある状況は、まだ探求していません。例としては、schema の customization を許す小規模 business application が、数千の小企業へ展開されるような場合です。

また、単一の database environment の一部として multiple schema を使う人々を、ますます目にするようになっています。私たちは、このような handful の schema を使う project には取り組んできましたが、それを数十、数百の schema まで拡大した経験はまだありません。これは今後数年で扱う必要が出てくると予想している状況です。

私たちは、これらの問題が本質的に解決不能だとは考えていません。この記事の最初の版を書いたときには、24時間365日稼働や integration database の問題をまだ解いていませんでした。私たちはそれらに対処する方法を見つけましたし、evolutionary database design の限界もさらに押し広げることになると考えています。しかし、実際にそうするまでは、そのような問題を解けるとは主張しません。

### 実践

私たちの evolutionary database design への approach は、いくつかの重要な実践に依存しています。

### DBA は開発者と密に協働する

agile method の信条のひとつは、異なる skill や background を持つ人々が非常に密に協働しなければならないということです。主に formal meeting や document を通じて communicate するわけにはいきません。代わりに、常に互いに話し、互いに一緒に作業する必要があります。これは analyst、PM、domain expert、developer、そして DBA の全員に影響します。

developer が取り組むあらゆる task は、潜在的に DBA の助けを必要とします。developer と DBA の双方が、その development task が database schema に significant change を加えるかどうかを考える必要があります。そうであれば、developer は変更方法を決めるために DBA に相談する必要があります。developer は必要とされる新機能を知っており、DBA は application と周辺 application の data に対する global view を持っています。

多くの場合、developer は自分が作業している application については見通せても、schema に対する upstream や downstream の依存関係すべてを見通せるとは限りません。単一 database application であっても、developer が気づいていない database 内の依存関係があるかもしれません。

developer はいつでも DBA を呼び、database change を整理するために pair できます。pairing によって、developer は database がどう機能するかを学び、DBA は database にかかる要求の文脈を学びます。多くの変更では、変更の database impact が気になる場合に DBA を呼ぶのは developer 側の責任です。しかし DBA も主体的に動きます。

DBA は、significant data impact がありそうだと考える story を見たら、関わる developer を探し、database impact について話し合うことができます。DBA は migration が version control に commit されるときに review することもできます。migration を戻すのは面倒ですが、各 migration が小さいことから、戻しやすいという利点も得られます。

これを実現するには、DBA は近づきやすく、利用可能でなければなりません。developer が数分だけ立ち寄って質問できるようにする必要があります。Slack channel や HipChat room など、developer が使っている communication medium でもよいでしょう。project space を設定するときは、DBA と developer が互いに近くに座り、すぐ集まれるようにします。DBA が簡単に参加できるよう、application design session についても知らせます。

多くの environment では、DBA と application development function の間に壁が築かれているのを見ます。evolutionary database design process を機能させるには、**こうした壁を取り払わなければなりません**。

### すべての database artifact を application code と一緒に version control する

developer は、application code、unit test や functional test、build script、environment を作るための Puppet や Chef script など、すべての artifact に version control を使うことで大きな利益を得ます。

同様に、すべての database artifact も、他の全員が使っているのと同じ repository で version control されるべきです。その利点は次のとおりです。

- 探す場所がひとつだけなので、project の誰にとっても見つけやすい。
- database へのすべての変更が保存されるため、問題が起きたときに audit しやすい。database の各 deployment を、schema と supporting data の正確な状態へ trace できる。
- database が application と同期していない deployment を防ぎ、data の取得や更新で error が起きるのを避けられる。
- development、testing、さらには production のための新しい environment を簡単に作れる。software の実行版を作るために必要なものはすべて単一 repository にあるべきで、すぐ checkout して build できる。

### すべての database change は migration である

多くの組織では、developer が schema editing tool や standing data 用の ad-hoc SQL を使って development database を変更する process を見ます。development task が終わると、DBA が development database と production database を比較し、software を live に promote するときに対応する変更を production database に加えます。しかし、production 時点でこれを行うのは難しいものです。development における変更の文脈が失われているからです。

変更の目的は、別の人々の group によって、再び理解されなければなりません。

これを避けるため、私たちは development 中に変更を capture し、application code の変更と同じ process と control で test され production へ deploy できる first-class artifact として保つことを好みます。これを行うために、database へのすべての変更を database migration script として表現し、application code change と一緒に version control します。

これらの migration script には、schema change、database code change、reference data update、transaction data update、bug によって生じた production data problem の修正が含まれます。

次は、`equipment_type` table に `min_insurance_value` と `max_insurance_value` を追加し、default value を設定する変更です。

```sql
ALTER TABLE equipment_type ADD(
  min_insurance_value NUMBER(10,2),
  max_insurance_value NUMBER(10,2)
);

UPDATE equipment_type SET
          min_insurance_value  =  3000,
          max_insurance_value = 10000000;
```

次の変更は、`location` table と `equipment_type` table に standing data を追加します。

```sql
-- Create new warehouse locations #Request 497
INSERT INTO location (location_code, name , location_address_id,
  created_by, created_dt)
VALUES ('PA-PIT-01', 'Pittsburgh Warehouse', 4567,
  'APP_ADMIN' , SYSDATE);
INSERT INTO location (location_code, name , location_address_id,
  created_by, created_dt)
VALUES ('LA-MSY-01', 'New Orleans Warehouse', 7134,
  'APP_ADMIN' , SYSDATE);
-- Create new equipment_type #Request 562
INSERT INTO equipment_type (equipment_type_id, name,
  min_insurance_value, max_insurance_value, created_by, created_dt)
VALUES (seq_equipment_type.nextval, 'Lift Truck',
  40000, 4000000, 'APP_ADMIN', SYSDATE);
```

この働き方では、Navicat、DBArtisan、SQL Developer のような schema editing tool を使って schema を変更することはありません。また、standing data の追加や問題修正のために ad hoc な DDL や DML を実行することもありません。application software によって発生する database update を除けば、**すべての変更は migration によって行われます**。

migration を SQL command の集合として定義することは話の一部にすぎません。それらを適切に適用するには、管理のための追加要素が必要です。

- 各 migration には一意な識別子が必要です。
- database にどの migration が適用済みかを追跡する必要があります。
- migration 間の順序制約を管理する必要があります。上の例では、`ALTER TABLE` migration を先に適用しなければ、2番目の migration は equipment type を insert できず失敗します。

私たちは、各 migration に sequence number を与えることで、これらの要求に対応します。これは一意な識別子として働き、database に適用される順序を維持できるようにします。developer が migration を作るときは、project の version control repository 内の migrations folder に SQL を text file として置きます。migrations folder で現在使われている最大の number を調べ、その number と description を組み合わせて file name にします。

したがって、先ほどの2つの migration は、`0007_add_insurance_value_to_equipment_type.sql` と `0008_data_location_equipment_type` のような名前になるでしょう。先頭の `000` は file system 上で file name を正しく sort するためのものです。number は database 内では integer type として存在します。

migration が database に適用されたことを追跡するために、私たちは changelog table を使います。database migration framework は通常、この table を作り、migration が適用されるたびに自動更新します。これにより、database は自分がどの migration と同期しているかを常に報告できます。そのような framework を使わない場合、私たちは script で自動化します。

この numbering scheme を置くことで、管理している多くの database に変更が適用される様子を追跡できます。

data migration の中には、新機能に関連する migration より頻繁に release しなければならないものもあります。そのような scenario では、data related bug fix のために別の migration repository や folder を持つと有用だと分かりました。

これらの folder は、Flyway、dbdeploy、MyBatis などの database migration tool によって別々に追跡できます。migration number を保存する table も別にできます。Flyway の `flyway.table` property は、migration metadata を保存する table name を変えるために使います。

### 全員が自分の database instance を持つ

多くの development organization は、組織の全員が使う単一の development database を共有しています。QA や staging 用に別 database を使うことはあるかもしれませんが、live に動く database の数を抑えるという発想です。このような database の共有は、database instance の設定や管理が難しいため、組織がその数を最小化しようとする結果です。

そのような状況で誰が schema を変更できるかの control はさまざまです。すべての変更を DBA team 経由にする場所もあれば、developer が development database の schema を変更でき、変更が downstream に promote されるときに DBA が関わる場所もあります。

agile database project に取り組み始めたとき、application developer は通常、code の private working copy で作業する pattern に従うことに気づきました。人は試すことで学ぶので、programming の観点では、developer はある feature をどう実装するかを実験し、ひとつを選ぶ前にいくつかの試行を行うことがあります。private workspace で実験し、より安定したら shared area へ push できることが重要です。

全員が shared area で作業していると、未完成の変更で互いを絶えず妨げることになります。私たちは、数時間以内に integration が起こる Continuous Integration を好みますが、それでも private working copy は重要です。version control system は、developer が独立して作業しつつ、mainline copy に統合できるよう支えます。

この別々の作業は file で機能しますが、database でも機能します。各 developer は自分専用の database instance を持ち、他人の作業に触れず自由に変更できます。準備ができたら、次の section で見るように、変更を push して共有できます。

これらの別々の database は、shared server 上の別 schema でもよいですし、最近ではより一般的に、developer の laptop や workstation 上で動く別 database でも構いません。10年前は database の licensing cost のために、個別 database instance は法外に高くつくことがありました。しかし現在では、特に open-source database の人気が高まったこともあり、めったにそうではありません。developer の machine 上で動く virtual machine に database を置くのは便利だと分かりました。

私たちは、Vagrant と Infrastructure As Code を使って database VM の build を定義します。これにより developer は database VM の設定の詳細を知る必要がなく、手作業で行う必要もありません。

多くの DBA は、いまだに multiple database を忌避し、実際に扱うには難しすぎると見ています。しかし私たちは、100程度の application database instance なら簡単に管理できることを発見しました。重要なのは、file を操作するのと同じように database を操作できる tool を持つことです。

```xml
<target name="create_schema"
        description="create a schema as defined in the user properties">
    <echo message="Admin UserName: ${admin.username}"/>
    <echo message="Creating Schema: ${db.username}"/>
    <sql password="${admin.password}" userid="${admin.username}"
         url="${db.url}" driver="${db.driver}" classpath="${jdbc.classpath}">
        CREATE USER ${db.username} IDENTIFIED BY ${db.password} DEFAULT TABLESPACE ${db.tablespace};
        GRANT CONNECT,RESOURCE, UNLIMITED TABLESPACE TO ${db.username};
        GRANT CREATE VIEW TO ${db.username};
        ALTER USER ${db.username} DEFAULT ROLE ALL;
    </sql>
</target>
```

developer schema の作成は、build script を使って自動化でき、DBA の workload を減らせます。この自動化を development environment に限定することもできます。

```xml
<target name="drop_schema">
    <echo message="Admin UserName: ${admin.username}"/>
    <echo message="Working UserName: ${db.username}"/>
    <sql password="${admin.password}" userid="${admin.username}"
         url="${db.url}" driver="${db.driver}" classpath="${jdbc.classpath}">
        DROP USER ${db.username} CASCADE;
    </sql>
</target>
```

たとえば、developer が project に参加し、code base を checkout して local development environment の設定を始めたとします。彼女は template の `build.properties` file を使い、`db.username` を `Jen` に設定するなど、残りの設定を変更します。設定が終われば、`ant create_schema` を実行するだけで、team development database server、または自分の laptop 上の database server に、自分専用の schema を得られます。

schema が作られたら、database migration script を実行し、database instance に table、index、view、sequence、stored procedure、trigger、synonym、その他 database 固有の object を含むすべての database content を構築できます。

同様に、schema を削除する script もあります。不要になった場合にも、developer が単に clean up して新しい schema から始めたい場合にも使えます。database environment は、定期的に焼き払い、望むときに再構築できるものであるべきです。そうすれば、再現も audit もできない性質が environment に蓄積する危険が減ります。

private workspace の必要性は developer だけでなく、team の他の全員にも当てはまります。QA staff も自分の database を作るべきです。そうすれば、自分の知識の外にある変更に混乱させられる危険なく作業できます。DBA も modeling option や performance tuning を探るとき、自分の database copy で実験できるべきです。

### 開発者は database change を継続的に統合する

developer は自分の sandbox で頻繁に実験できますが、異なる変更を Continuous Integration (CI) を使って頻繁に統合し直すことが不可欠です。CI では、mainline software を自動的に build し test する integration server を設定します。私たちの経験則では、各 developer は少なくとも1日に1回 mainline に統合するべきです。

CI を支援する tool は多くあり、GoCD、Snap CI、Jenkins、Bamboo、Travis CI などがあります。

database migration が開発され、local で test され、source control に check in され、CI server に拾われ、integration database に適用され、再び test され、downstream 用に package される流れは、application code と同じです。

例を見てみましょう。

1. Jen が database schema change を含む development を始めます。column を追加するような簡単な変更なら、Jen は直接変更方法を決めます。複雑なら DBA をつかまえて話し合います。

変更を整理したら、migration を書きます。

```sql
ALTER TABLE project ADD projecttypeid NUMBER(10) NULL;

ALTER TABLE project ADD (CONSTRAINT fk_project_projecttype
  FOREIGN KEY (projecttypeid)
  REFERENCES projecttype DEFERRABLE INITIALLY DEFERRED);
UPDATE project
      SET projecttypeid = (SELECT projecttypeid
                  FROM projecttype
                  WHERE name='Integration');
```

nullable column の追加は backward compatible な変更なので、application code を変更しなくても統合できます。しかし、table の分割のように backward compatible でない変更であれば、Jen は application code も変更する必要があります。

2. Jen が変更を終えると、統合の準備ができます。integration の最初の step は、mainline から local copy を update することです。これは、彼女が task に取り組んでいる間に team の他の member が行った変更です。次に、database を再構築し、すべての test を実行して、これらの update と一緒に自分の変更が動くことを確認します。

他の developer の変更が自分の変更と干渉して問題が起きた場合、彼女は自分の copy 上でそれを直す必要があります。通常、このような衝突は簡単に整理できますが、ときには込み入ったものになります。そうした複雑な conflict は、重なった変更をどう解決するかを整理するために、Jen と teammate の会話を引き起こすことがよくあります。

local copy が再び動くようになったら、作業中に master へさらに変更が push されていないかを確認します。もしあれば、新しい変更との integration を繰り返す必要があります。通常は、1回か2回の cycle を超えることなく、彼女の code は mainline と完全に統合されます。

3. Jen は変更を mainline に push します。この変更は既存 application code と backward compatible なので、database change を application code の更新より先に統合できます。これは Parallel Change のよくある例です。

4. CI server は mainline の変更を検知し、database migration を含む新しい build を開始します。

5. CI server は build 用に自分の database copy を持っているので、この database に migration script を適用します。さらに compile、unit test、functional test など、残りの build step を実行します。

6. build が成功すると、CI server は build artifact を package して publish します。これらの build artifact には database migration script が含まれているため、Deployment Pipeline のような downstream environment の database に適用できます。build artifact には jar、war、dll などに package された application code も含まれます。

これは application source code management で一般に使われる Continuous Integration そのものです。上の step は、database code を source code の一部として扱うだけのことです。したがって、database code、つまり DDL、DML、data、view、trigger、stored procedure は、source code と同じように configuration management の下に置かれます。

build が成功するたびに、database artifact を application artifact と一緒に package することで、application と database の両方について、完全で同期された version history を得られます。

application source code では、変更との integration に伴う痛みの多くは、source code control system と local environment のさまざまな test によって扱えます。database では、database 内に business meaning を保たなければならない data、つまり state があるため、少し余分な effort が必要です。

さらに DBA は、database change が全体の database schema と data architecture の枠組みに合っていることを確認する必要があります。これらすべてを円滑に機能させるには、大きな変更が integration 時点で surprise になってはいけません。だからこそ DBA が developer と密に協働する必要があります。

私たちが頻繁な integration を強調するのは、頻繁で小さな integration のほうが、まれで大きな integration よりずっと簡単だと分かったからです。integration の痛みは integration の大きさに対して指数関数的に増えます。したがって、小さな変更をたくさん行うほうが、多くの人には直感に反するように見えても、実際にはずっと簡単です。

### database は schema と data から成る

ここで database と言うとき、私たちは database の schema や database code だけでなく、かなりの量の data も含めて考えています。この data には、すべての state、country、currency、address type といった避けがたい共通 standing data や、application 固有の data が含まれます。さらに、数件の sample customer や order など、sample test data を含めることもあります。

この sample data は、sanity testing や semantic monitoring に明示的に必要な場合を除き、production には入りません。

この data がある理由はいくつかあります。主な理由は testing を可能にすることです。私たちは、application development を安定させるために、大量の automated test を使うことを強く信じています。このような test 群は agile method では一般的な approach です。これらの test を効率よく動かすには、各 test が実行前に存在すると仮定できる sample test data で seed された database 上で作業するのが理にかなっています。

この sample data も version control される必要があります。新しい database を populate する必要があるときにどこを見ればよいか分かりますし、test や application code と同期した変更記録を持てるからです。

sample test data は code の test を助けるだけでなく、database schema を変更するときに migration の test も可能にします。sample data があることで、schema change が sample data も扱うことを確認せざるを得なくなります。

私たちが見てきた多くの project では、この sample data は架空のものでした。しかし一部の project では、sample に real data を使う人たちも見ました。この場合、その data は automated data conversion script によって以前の legacy system から抽出されます。初期 iteration では新しい database の小さな部分しか実際には構築されていないため、すべての data をすぐに convert することは当然できません。しかし Incremental Migration を使えば、必要な data を just in time に提供する conversion script を開発できます。

これは data conversion problem を早期にあぶり出す助けになるだけではありません。domain expert は見慣れた data を見ながら成長する system に取り組めるため、問題を起こしそうな case を database design や application design の観点から特定する助けになることがよくあります。その結果、現在の私たちは、project の最初の iteration から real data を導入しようとするべきだと考えています。

この process には Jailer が有用な tool だと分かりました。

### すべての database change は database refactoring である

database に加える変更は、database が情報を保存する方法を変え、新しい保存方法を導入し、あるいは不要になった storage を取り除きます。しかし database change それ自体は、software の全体的な振る舞いを変えません。したがって、それらは refactoring の定義に合うものとして見ることができます。

> 観察可能な振る舞いを変えずに、理解しやすく、変更しやすくするために software の内部構造へ加える変更。

これを認識し、私たちは多くの database refactoring を集めて文書化しました。そのような catalog を書くことで、以前うまく使った step に従えるため、これらの変更を正しく行いやすくなります。

database refactoring の大きな違いのひとつは、同時に行う必要がある3種類の変更を含むことです。

- database schema を変更する。
- database 内の data を migrate する。
- database access code を変更する。

したがって database refactoring を説明するときは、常に変更の3つの側面を説明し、他の refactoring を適用する前に3つすべてが適用されることを確実にしなければなりません。

code refactoring と同じように、database refactoring は非常に小さいものです。非常に小さな変更の sequence をつなげるという概念は、database でも code とほぼ同じです。変更が3次元であることは、小さな変更にとどめる重要性をさらに高めます。

Introduce New Column のような多くの database refactoring は、system にアクセスするすべての code を更新しなくても実行できます。code が新しい schema を知らずに使っているなら、その column は使われないだけです。しかし、多くの変更はこの性質を持ちません。私たちはそれらを destructive change と呼びます。destructive change は、破壊の度合いに応じて、もう少し注意が必要です。

小さな destructive change の例は Make Column Non Nullable です。これは nullable column を not nullable に変えます。これは destructive です。既存 code がその値を設定しない場合に error になるからです。既存 data に null がある場合にも問題が起きます。

既存 null の問題は、多少別の問題を代償に、null を持つ行へ default data を割り当てることで避けられます。application code が割り当てを行わない、または null を割り当てる問題に対しては、2つの選択肢があります。ひとつは column に default value を設定することです。

```sql
ALTER TABLE customer
  MODIFY last_usage_date DEFAULT sysdate;
UPDATE customer
  SET last_usage_date =
    (SELECT MAX(order_date) FROM order
      WHERE order.customer_id = customer.customer_id)
  WHERE last_usage_date IS NULL;

UPDATE customer
  SET last_usage_date = last_updated_date
  WHERE last_usage_date IS NULL;

ALTER TABLE customer
  MODIFY last_usage_date NOT NULL;
```

割り当てがない問題を扱うもうひとつの方法は、refactoring の一部として application code を変更することです。database を update するすべての code に自信を持って到達できるなら、私たちはこの選択肢を好みます。database が単一 application だけに使われている場合は通常簡単ですが、shared database では難しくなります。

より複雑な case は Split Table です。特に、その table への access が application code の広い範囲に散らばっている場合です。この場合、その変更が近づいていることを全員に知らせ、準備してもらうことが重要です。iteration の開始時のような比較的静かな時点を待つのが賢明なこともあります。

destructive change は、database access が system の少数の module を通じて channel されているなら、ずっと簡単です。database access code を見つけて更新しやすくなるからです。

全体として重要なのは、自分が行う変更の種類に適した procedure を選ぶことです。迷った場合は、変更を容易にする方向へ寄せるようにしてください。私たちの経験では、多くの人が想像するよりも痛い目を見る頻度はずっと少なく、system 全体の強い configuration control があれば、最悪の場合に revert することも難しくありません。

development 中に DDL、DML、data migration を含む database change を扱うことは、data team に最も多くの context を提供し、deployment 中に data team が文脈なしで全変更を batch migration することを避けます。

### transition phase

destructive database refactoring があり、access code を簡単には変更できないときに直面する困難については、すでに触れました。shared database の場合、そこには多くの application や report が使っているかもしれないため、これらの問題はいっそう厄介になります。この状況では、Rename Table のようなものに対して、ずっと慎重でなければなりません。この危険から身を守るために、私たちは transition phase を使います。

transition phase とは、database が古い access pattern と新しい access pattern の両方を同時に support する期間です。これにより、古い system は自分たちのペースで新しい structure へ migrate する時間を得ます。

```sql
ALTER TABLE customer RENAME to client;

CREATE VIEW customer AS
SELECT id, first_name, last_name FROM client;
```

Rename Table の例では、developer は `customer` table を `client` に rename し、既存 application が使える `customer` という名前の `view` を作る script を作ります。この Parallel Change は、新旧の access を支えます。複雑さは増すので、downstream system が migrate する時間を得たら取り除くことが重要です。組織によっては数か月で済みますが、別の組織では何年もかかることがあります。

view は transition phase を可能にする技法のひとつです。Rename Column のような場合には database trigger もよく使います。

### refactoring を自動化する

refactoring が application code でよく知られるようになってから、多くの language で automated refactoring へのよい support が見られるようになりました。これは、さまざまな step を人間が誤る余地なく素早く実行することで、refactoring を単純化し高速化します。同様の自動化は database にもあります。Liquibase や Active Record Migrations のような framework は、database refactoring を適用する DSL を提供し、database migration を標準的な方法で適用できるようにします。

しかし、この種の standardized refactoring は database ではそれほどよく機能しません。data migration や legacy data を扱う規則は、team 固有の context に大きく依存するからです。そのため私たちは、database refactoring を migration script として書き、それらをどう適用するかを自動化する tool に焦点を当てることを好みます。

これまで示してきたように、各 script は schema change 用の SQL DDL と data migration 用の DML を組み合わせて書き、その結果を version-controlled repository 内の folder に置きます。私たちの自動化は、これらの変更を手作業で適用しないことを保証します。変更は automation tooling によってのみ適用されます。そうすることで refactoring の順序を保ち、database metadata を更新します。

refactoring は任意の database instance に適用でき、latest master に追いつかせることも、任意の以前の version にすることもできます。tooling は database 内の metadata information を使って現在 version を見つけ、その version と目標 version の間にある各 refactoring を適用します。この approach は development instance、test instance、production database の更新に使えます。

production database の更新は test database と違いません。同じ script set を別の data に対して実行します。私たちは frequent release を好みます。update が小さく保たれ、より速く終わり、発生した問題にも対処しやすくなるからです。これらの update を行う最も簡単な方法は、update 適用中に production database を停止することです。多くの状況ではこれでうまくいきます。

application を live のまま保ちながら行わなければならない場合も可能ですが、そこで使う技法を説明するには別の記事が必要です。

これまでのところ、この技法は驚くほどうまく機能しています。すべての database change を小さく単純な変更の sequence に分解することで、かなり大きな production data の変更でも、自分たちを困らせずに行えました。

forward change の自動化に加え、各 refactoring の reverse change を自動化することも考えられます。そうすれば、database への変更を同じように自動化された方法で back out できます。私たちは、これを常に試すほど cost effective で有益だとはまだ感じておらず、需要もそれほどありませんでした。しかし基本原理は同じです。全体として私たちは、database access section が古い version と新しい version の両方で動くように migration を書くことを好みます。

これにより、将来の必要に備えて database を更新し、それを live にし、しばらく production で動かしたうえで、問題なく安定したことを確認してから、新しい data structure を使う update だけを push できます。

現在では、database migration の適用を自動化する tool が数多くあります。Flyway、Liquibase、MyBatis migrations、DBDeploy などです。Flyway で migration を適用すると、次のようになります。

```text
psadalag:flyway-4 $ ./flyway migrate
Flyway 4.0.3 by Boxfuse
Database: jdbc:oracle:thin:@localhost:1521:xe (Oracle 11.2)
Successfully validated 9 migrations (execution time 00:00.021s)
Creating Metadata table: "JEN_DEV"."schema_version"
Current version of schema "JEN_DEV": << Empty Schema >>
Migrating schema "JEN_DEV" to version 0 - base version
Migrating schema "JEN_DEV" to version 1 - asset
Migrating schema "JEN_DEV" to version 2 - asset type
Migrating schema "JEN_DEV" to version 3 - asset parameters
Migrating schema "JEN_DEV" to version 4 - inventory
Migrating schema "JEN_DEV" to version 5 - split inventory
Migrating schema "JEN_DEV" to version 6 - equipment type
Migrating schema "JEN_DEV" to version 7 - add insurance value to equipment type
Migrating schema "JEN_DEV" to version 8 - data location equipment type
Successfully applied 9 migrations to schema "JEN_DEV" (execution time 00:00.394s).
psadalag:flyway-4 $
```

### 開発者は必要に応じて自分の database を更新できる

上で説明したように、変更を mainline へ統合する最初の step は、自分の作業中に起きた変更を pull することです。これは integration step で不可欠なだけでなく、作業が終わる前にも役立つことがよくあります。同僚が話していた変更の impact を評価できるからです。どちらの場合も、mainline から変更を簡単に pull し、自分の local database に適用できることが重要です。

まず mainline から local workspace に変更を pull します。多くの場合これは単純ですが、ときには作業中に同僚が migration を mainline へ push していることがあります。sequence number `8` の migration を書いていた場合、migrations folder に同じ number の別 migration が現れます。migration tool を実行すると、それが検出されるはずです。

```text
psadalag:flyway-4 $ ./flyway migrate
Flyway 4.0.3 by Boxfuse
Database: jdbc:oracle:thin:@localhost:1521:xe (Oracle 11.2)
ERROR: Found more than one migration with version 8
Offenders:
-> /Users/psadalag/flyway-4/sql/V8__data_location_equipment_type.sql (SQL)
-> /Users/psadalag/flyway-4/sql/V8__introduce_fuel_type.sql (SQL)
psadalag:flyway-4 $
```

clash があることが分かったら、最初の step は単純です。自分の migration を `9` に renumber し、新しい mainline migration の上に適用されるようにします。renumber したら、migration 間に conflict がないことを test する必要があります。そのために database を clean out し、新しい `8` と自分の renumber した `9` を含むすべての migration を、blank database copy に適用します。

```text
psadalag:flyway-4 $ mv sql/V8__introduce_fuel_type.sql sql/V9__introduce_fuel_type.sql
psadalag:flyway-4 $ ./flyway clean
Flyway 4.0.3 by Boxfuse

Database: jdbc:oracle:thin:@localhost:1521:xe (Oracle 11.2)
Successfully cleaned schema "JEN_DEV" (execution time 00:00.031s)
psadalag:flyway-4 $ ./flyway migrate
Flyway 4.0.3 by Boxfuse
Database: jdbc:oracle:thin:@localhost:1521:xe (Oracle 11.2)
Successfully validated 10 migrations (execution time 00:00.013s)
Creating Metadata table: "JEN_DEV"."schema_version"
Current version of schema "JEN_DEV": << Empty Schema >>
Migrating schema "JEN_DEV" to version 0 - base version
Migrating schema "JEN_DEV" to version 1 - asset
Migrating schema "JEN_DEV" to version 2 - asset type
Migrating schema "JEN_DEV" to version 3 - asset parameters
Migrating schema "JEN_DEV" to version 4 - inventory
Migrating schema "JEN_DEV" to version 5 - split inventory
Migrating schema "JEN_DEV" to version 6 - equipment type
Migrating schema "JEN_DEV" to version 7 - add insurance value to equipment type
Migrating schema "JEN_DEV" to version 8 - data location equipment type
Migrating schema "JEN_DEV" to version 9 - introduce fuel type
Successfully applied 10 migrations to schema "JEN_DEV" (execution time 00:00.435s).
psadalag:flyway-4 $
```

通常これは問題なく動きますが、ときには conflict が見つかります。たとえば、別の developer が、こちらが変更しようとしている table を rename しているかもしれません。その場合、conflict をどう解決するかを考える必要があります。ここでも migration が小さいことが、conflict を見つけて扱いやすくします。

最後に、database change が統合されたら、mainline から得た migration が自分の test を壊していないか確認するために、application test suite を再実行する必要があります。

この procedure により、network connection がなくても短期間は独立して作業し、その後都合のよいときに integration できます。この integration をいつ、どれくらい頻繁に行うかは完全に自分たち次第です。ただし、mainline に push する前に同期されていることを確実にしなければなりません。

### すべての database access code を明確に分離する

database refactoring の影響を理解するには、database が application からどう使われているかを見られることが重要です。SQL が code base のあちこちに無秩序に散らばっていると、これは非常に難しくなります。そのため、database がどこでどう使われているかを示す、明確な database access layer を持つことが重要です。これには、P ofEAA の data source architectural pattern のいずれかに従うことを提案します。

明確な database layer には、価値ある副次的利点もいくつかあります。developer が database を操作するために SQL knowledge を必要とする領域を最小化します。SQL に特に熟練していない developer にとって、これは作業を楽にします。DBA にとっては、database がどう使われているかを見るための code の明確な section が得られます。これは index の準備、database optimization、SQL をよりよい性能にするよう reformulate できるかを見ることに役立ちます。

これにより DBA は、database がどう使われているかをよりよく理解できます。

### 頻繁に release する

この記事の最初の版を10年以上前に書いたとき、software を頻繁に production へ release すべきだという考えにはほとんど support がありませんでした。それ以来、internet giant の台頭は、rapid な release sequence が成功する digital strategy の重要な部分であることを示しました。

すべての変更が migration として capture されていれば、新しい変更を test environment や production environment へ簡単に deploy できます。ここで論じている evolutionary database design は、frequent release を可能にするうえで重要な部分であり、実際に使われる software からの feedback によって得られる学びからも利益を得ます。

### variation

どの実践群もそうであるように、これらは具体的な状況に応じて変えるべきです。私たちが遭遇した variation のいくつかを示します。

### 複数 version

単純な project は、単一の code line、したがって単一の database version だけで存続できます。より複雑な project では、AB testing や Canary Releases を行う rolling deployment のために複数 version を support する必要があり、project database の複数の種類が必要になります。各 release は独自の test data や、特定 feature の test や bug fix のための変更を必要とするかもしれません。

これは production にある code の複数 version を管理するのと変わりません。ただし、database が application の複数 release を support しなければならないというひねりがあります。

私たちが有用だと分かった別の方法は、database 用に単一 repository を持ち、他のすべての application version がその database repository に依存することです。この方法を使う場合、code のすべての version が同じ database version で動くことを保証しなければなりません。したがって、database は production で live になっているすべての以前の application release と backward compatible であることを強制されます。

### application と一緒に変更を出荷する

いくつかの project では、product への変更を数千の end customer へ ship しなければならないことがありました。この種の project では、すべての database change を application と一緒に package し、application が startup 時に Flyway やその類似 framework を使って database を upgrade できるようにするほうがよいです。customer がどの version から upgrade しているか分からないからです。

### 複数 application が同じ database を使う

多くの enterprise では、多くの application が同じ database を使うことになります。これは Shared Database integration pattern です。この状況では、ひとつの application が database に変更を加えると、他の application を壊す可能性がかなり高くなります。これに対処するには、database を dependent application すべてが使う別の code repository として抽出するほうがよいです。

この共通 database repository は automated behavior test を持つべきです。cross application dependency が test され、dependent application が影響を受けたら build が fail するようにします。これは、共有 software component が独自の code repository を持つことと変わりません。software component は自分自身の振る舞いの view について test されるだけでなく、Consumer-Driven Contracts を使って downstream application と結んでいる contract についても test されます。

### NoSQL database

この記事では relational database に焦点を当ててきました。理由のひとつは、最初の版をそう書いたからであり、もうひとつは、今でもそれが最も一般的だと感じているからです。しかし、私たちは最近増えてきた NoSQL database にもある程度なじんでいます。これらを evolutionary に扱う方法を十分に議論するには別の記事が必要ですが、表面的な概観を試みます。

NoSQL database は、その多くが「schemaless」であるため、evolutionary な扱いがずっと簡単だと主張します。しかし schemaless であることは、schema について心配しなくてよいという意味ではありません。database にアクセスする code によって暗黙に示される implicit schema が依然としてあります。その schema も、source code repository で管理される data migration と同じ技法を使って管理しなければなりません。

storage schema がないことは、異なる version に対して multiple read strategy を support するという別の技法を可能にします。これは database evolution の管理を簡単にするかもしれませんが、それでも気にする必要があるものです。

### DBA の大軍は不要である

ここで説明した技法を使うことは大変な作業のように聞こえるかもしれませんが、実際には大量の人員を必要としません。多くの project で、30人ほどの developer と、QA、analyst、management を含めて100人近い team size を経験しました。ある1日には、100ほどのさまざまな schema copy が人々の workstation 上にあることもありました。

それでも、この活動全体に必要だったのは、1人の full-time DBA と、process や workflow の仕組みを理解し、part-time の支援や backup を行う数人の developer だけでした。

小規模 project では、それすら不要です。私たちは十数人ほどの小規模 project でもこれらの技法を使ってきましたが、そうした project では full-time DBA は必要ありません。代わりに、DB issue に関心を持つ数人の developer が part-time で DBA task を扱い、必要であれば design や architecture decision のために DBA を巻き込みます。

これを可能にするのは automation です。すべての task を自動化しようと決意すれば、ずっと少ない人数で多くの作業を扱えます。DevOps と関連 tool、たとえば Puppet、Chef、Docker、Rocket、Vagrant の人気が高まっている現在では、なおさらです。

私たちはこの働き方を始めて以来、application code と同じくらい進化できる database に依存するようになりました。それにより release cycle を速め、software をより早く production へ届けられます。ここで説明した技法は、いまでは私たちの習慣的な働き方の一部です。しかし私たちの目標は、自分たちの方法を改善することだけではなく、その経験を software industry と共有することでもあります。

このような技法が採用されるのを見れば見るほど、software が人々の goal 達成を可能にし、私たち全員の生活を豊かにする進歩を生み出すのを見られるようになります。
