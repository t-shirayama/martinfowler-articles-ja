# Touch File

## 要約

`make`のようなビルドでは、出力ファイルと入力ファイルの更新時刻を比較して、作業が必要かどうかを判断します。
しかし、テスト実行や生成コードのように、出力が分かりにくい作業もあります。

そのような場合に、空のファイルを時刻マーカーとして使うのがTouch Fileです。
内容には意味を持たせず、更新時刻だけを使って、作業を再実行する必要があるかを判断します。

## 読むときの観点

- ビルドの不要な再実行を避けるには、出力の更新時刻を考える。
- 出力がファイルツリー全体のように大きい場合、空のマーカーファイルが役に立つ。
- Touch Fileは`make`では自然な慣用句だが、`ant`でも有用な場合がある。
- 依存関係は、明示的に必要な場所に置く。

## 原文の翻訳

`make`を使ってビルドを行うとき、作業が必要かどうかは、出力ファイルと入力ファイルの更新日時を比較して判断します。コンパイルのような場合、たとえば`a.out`が`foo.c`に依存するなら、これはうまく働きます。しかし、出力が見えにくい場合もあります。

一例はテストの実行です。そこでは何が出力なのでしょうか。1つの出力はテストレポートです。テストレポートのターゲットは、レポートファイルの日付を、実行ファイルやテストデータファイルの日付と比較できます。そうすれば、何かが変わったときにだけテストを実行できます。

多くの場合、出力ファイルには有用な情報が含まれています。しかし、ターゲットを実行する必要があるかを判断する目的では、実際には出力ファイルの内容はどうでもよく、日付だけが重要です。その結果、`make`スクリプトでは、時刻マーカーとしてだけ使われる空ファイルがよく使われます。私はこれを「Touch File」と呼んでいます。通常、Unixの`touch`コマンドで操作されるだけだからです。`touch`はファイルの更新時刻を更新するだけです。

Touch Fileは、複数のファイルにまたがって日付を比較しようとするときによく役立ちます。出力がファイルツリー全体である場合、ツリー全体をたどって更新時刻を見るより、Touch Fileを更新する方が速いことがあります。

Touch Fileは`make`では一般的で自然な慣用句ですが、`ant`ではそれほど一般的ではありません。それでも、しばしば有用です。この数日、HibernateのHQL Domain Specific Languageがどのように実装されているかを調べていて、特にそのことを感じました。HQLの中心には3つのAntlrパーサがあります。その文法は3つの文法ファイルで定義されています。これらの文法ファイルのどれかが変わると、パーサのソースコードを再生成する必要があります。

そのための`ant`ソースは次のようなものです。

```xml
<target name="init.antlr"
        depends="init"
        description="Check ANTLR dependencies.">
  <uptodate property="antlr.isUpToDate"
            targetfile="${dir.out.antlr-package}/.antlr_run">
    <srcfiles dir="${dir.grammar}" includes="*.g"/>
  </uptodate>
</target>
<target name="antlr"
        depends="init.antlr"
        unless="antlr.isUpToDate"
        description="Generate ANTLR parsers.">
  <taskdef name="antlrtask"
           classname="org.apache.tools.ant.taskdefs.optional.ANTLR">
    <classpath>
      <fileset dir="${dir.lib}">
        <include name="ant-antlr-*.jar"/>
        <include name="antlr-*.jar"/>
      </fileset>
    </classpath>
  </taskdef>
  <mkdir dir="${dir.out.antlr-package}" />
  <antlrtask target="${dir.grammar}/hql.g"
             outputdirectory="${dir.out.antlr-package}" />
  <antlrtask target="${dir.grammar}/hql-sql.g"
             outputdirectory="${dir.out.antlr-package}" />
  <antlrtask target="${dir.grammar}/sql-gen.g"
             outputdirectory="${dir.out.antlr-package}" />
  <touch file="${dir.out.antlr-package}/.antlr_run"/>
</target>
```

`init.antlr`タスクは、特定の`.antlr_run`ファイルに基づいて`antlr.isUpToDate`プロパティを設定しています。このプロパティが真なら、主要な`antlr`タスクは実行されません。`antlr`タスクの最後では、空の`.antlr_run`ファイルに`touch`しています。

Hibernateのメインビルドでは、このタスクが使われます。その結果、パーサのソースファイルは必要な場合にだけ生成されます。どうしてもファイルの再生成を強制したい場合には、別のターゲットがあります。

```xml
<target name="antlr.regen"
        depends="init,cleanantlr,antlr"
        description="Regenerate all ANTLR generated code." />

<target name="cleanantlr"
        depends="init"
        description="Clean up the generated ANTLR parsers.">
  <delete dir="${dir.out.antlr-package}"/>
</target>
```

このターゲットが目的を達成しているのは、`cleanAntlr`タスクへの依存を述べているからです。`init.antlr`への依存は示していません。その依存はすでに`antlr`タスクの中に含まれているからです。**Touch Fileは、内容ではなく更新時刻だけが必要な場面で、依存関係を軽く表現する道具**になります。
