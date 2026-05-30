# Refactoring with Codemods to Automate API Changes

## 要約

Codemodは、API変更やリファクタリングを抽象構文木に対する変換として扱い、大きなコードベースへ一貫して適用するための手法です。単なる検索置換では扱いにくい呼び出し構造、JSX、import、条件式などを安全に変更できます。

この記事は、jscodeshiftによるJavaScript/Reactの例、JavaParserとOpenRewriteによるJavaの例、そしてcodemodを小さく分けて合成する考え方を通じて、破壊的API変更を利用者に届ける実践を説明します。

## 読むときの観点

- API変更は新しい実装だけでなく、利用者の移行手段まで含めて設計する。
- codemodは文字列置換ではなく、ASTやLSTを使ってコード構造を変換する。
- 自動化できる範囲とできない範囲を見極め、テスト、レビュー、TODOを組み合わせる。
- 大きな変換は小さな変換に分け、再利用と合成ができるようにする。

## 原文の翻訳

リファクタリングは、開発者がいつも行っていることです。コードを理解しやすく、保守しやすく、拡張しやすくします。IDEなら、単純なリファクタリングを数回のキー操作で扱えます。しかし、大規模なコードベースや分散したコードベース、とくに自分が完全には管理していないコードベース全体へ変更を適用する必要があると、話は難しくなります。そこでcodemodが役に立ちます。抽象構文木、つまりASTを使うことで、codemodは大規模なコード変更を精度高く、少ない労力で自動化できます。これは破壊的なAPI変更を扱うときに特に有効です。この記事では、古くなったfeature toggleの削除や複雑なReactコンポーネントのリファクタリングといった実践的な例を通じて、codemodがこうした課題にどう役立つかを見ていきます。また、codemodを大規模に使うときの落とし穴と、その避け方も扱います。

ライブラリ開発者として、lodashやReactのように、何十万もの開発者が毎日頼りにする人気のユーティリティを作ったとします。時間がたつと、最初の設計を超える使われ方が現れるかもしれません。そうなると、エッジケースを直すためにパラメータを追加したり、使いやすくするために関数シグネチャを変えたりして、APIを拡張する必要が出てきます。難しいのは、**利用者の作業を壊さずに破壊的変更を広げること**です。

ここでcodemodが登場します。codemodは大規模なコード変換を自動化する強力な道具であり、開発者が破壊的API変更を導入し、古いコードベースをリファクタリングし、少ない手作業でコードの健全性を保てるようにします。

この記事では、codemodとは何か、jscodeshift、hypermod.io、codemod.comのような作成ツールには何があるかを見ていきます。古くなったfeature toggleの掃除から、コンポーネント階層のリファクタリングまで、実例をたどります。また、複雑な変換を小さくテスト可能な部品に分ける方法も扱います。この考え方はcodemod compositionと呼ばれ、柔軟性と保守性を確保するのに役立ちます。

読み終えるころには、codemodが大規模コードベースを管理するための重要な道具になり得ることが分かるはずです。codemodは、難しいリファクタリング作業を扱いながら、コードをきれいで保守しやすい状態に保つ助けになります。

### APIにおける破壊的変更

先ほどのライブラリ開発者の話に戻りましょう。最初のリリース後に新しい使われ方が現れ、APIを拡張する必要が出てきます。たとえばパラメータを追加したり、関数シグネチャを変更したりして、より使いやすくしたい場合です。

単純な変更であれば、IDEの基本的な検索置換で十分かもしれません。より複雑な場合には、`sed`や`awk`のようなツールに頼ることもあるでしょう。しかし、ライブラリが広く使われていると、そうした変更の影響範囲は管理しにくくなります。その変更が利用者にどれほど広く影響するかを確信できませんし、更新の必要がない既存機能を壊すことは何より避けたいものです。

よくあるやり方は、破壊的変更を告知し、新しいバージョンをリリースし、利用者に自分のペースで移行してもらうことです。これはなじみのある流れですが、大きな転換ではうまくスケールしないことがよくあります。Reactがクラスコンポーネントからhooksを使う関数コンポーネントへ移行した例を考えてみてください。大規模コードベースがこのパラダイムシフトを十分に取り入れるには何年もかかりました。チームが移行を終えるころには、次の破壊的変更がすでに近づいていることも珍しくありません。

ライブラリ開発者にとって、この状況は負担になります。移行していない利用者を支えるために複数の古いバージョンを保守するのは、費用も時間もかかります。利用者にとっても、頻繁な変更は信頼を損ねる危険があります。アップグレードをためらったり、より安定した代替を探し始めたりして、その循環が続いてしまいます。

では、利用者がこうした変更を自動的に管理できるよう支援できるとしたらどうでしょう。更新と一緒に、利用者のコードをリファクタリングするツールを提供できるとしたらどうでしょう。関数名を変え、パラメータの順序を更新し、未使用コードを削除する作業を、手作業なしで進められるとしたら。

それがcodemodの出番です。ReactやNext.jsを含むいくつものライブラリは、バージョンアップの道筋をなめらかにするため、すでにcodemodを取り入れています。たとえばReactは、古いContext APIのような以前のAPIパターンから新しいパターンへ移行するためのcodemodを提供しています。

では、ここで話しているcodemodとは具体的に何でしょうか。

### Codemodとは何か

codemod、つまりcode modificationは、新しいAPI、構文、コーディング標準に合わせてコードを変換する自動スクリプトです。codemodは抽象構文木、つまりASTを操作して、コードベース全体に一貫した大規模変更を適用します。もともとはFacebookで開発され、Reactのような大きなプロジェクトのリファクタリング作業を管理する助けになりました。Facebookが成長するにつれて、コードベースの保守とAPI更新はますます難しくなり、codemodの開発につながりました。

さまざまなリポジトリにある何千ものファイルを手で更新するのは非効率で、ミスも起こりやすい作業です。その問題に取り組むため、コードを変換する自動スクリプトとしてcodemodという考え方が導入されました。

典型的な流れには、主に3つの手順があります。

1. コードをASTへパースし、コードの各部分を木構造として表す。
2. 関数名の変更やパラメータ変更のような変換を適用して、その木を修正する。
3. 修正後の木をソースコードへ書き戻す。

この方法を使うことで、codemodはコードベース内のすべてのファイルへ一貫して変更を適用し、人間のミスを減らします。深くネストした構造の変更や、非推奨API利用の削除のような複雑なリファクタリングも扱えます。

このプロセスを図示すると、典型的なcodemodは、ソースコードをASTにし、ASTを変換し、ソースコードへ戻す、という3段階になります。

コードを「理解」して自動変換を行うプログラムという考え方は、新しいものではありません。Extract Function、Rename Variable、Inline FunctionのようなリファクタリングをIDEで実行するときも同じです。IDEは基本的に、ソースコードをASTへパースし、定義済みの変換を木に適用して、その結果をファイルへ保存しています。

現代的なIDEでは、変更を正しく効率よく適用するために、水面下で多くの処理が行われます。たとえば、変更範囲を特定したり、変数名の衝突のような競合を解決したりします。Change Function Declarationのようなリファクタリングでは、完了前にパラメータ順序やデフォルト値を調整できるよう、入力を求めることもあります。

### JavaScriptコードベースでjscodeshiftを使う

JavaScriptプロジェクトでcodemodを動かす方法を理解するため、具体例を見てみましょう。JavaScriptコミュニティには、ソースコードをASTへ変換するパーサや、その木を別の形式へ変換するトランスパイラなど、この作業を可能にするツールがいくつもあります。TypeScriptが動く仕組みもこれに近いものです。加えて、リポジトリ全体へcodemodを自動適用するためのツールもあります。

codemodを書くための代表的なツールの1つが、Facebookが保守するjscodeshiftです。jscodeshiftはASTを操作する強力なAPIを提供し、codemod作成を簡単にします。開発者はコード内の特定パターンを検索し、変換を大規模に適用できます。

`jscodeshift`を使うと、プロジェクト全体にある非推奨API呼び出しを見つけ、新しい版へ置き換えられます。

手作業でcodemodを組み立てる典型的な流れを分解してみましょう。

### 古くなったFeature Toggleを掃除する

codemodの力を示すため、単純ですが実用的な例から始めます。未完成または実験的な機能のリリースを制御するため、コードベースでfeature toggleを使っているとします。その機能が本番で公開され、期待どおりに動くようになったら、次に行うべき自然な作業は、そのtoggleと関連ロジックを掃除することです。

たとえば、次のコードを考えます。

```js
const data = featureToggle('feature-new-product-list') ? { name: 'Product' } : undefined;
```

機能が完全にリリースされ、toggleが不要になったら、これは次のように単純化できます。

```js
const data = { name: 'Product' };
```

作業は、コードベース内の`featureToggle`の全インスタンスを見つけ、そのtoggleが`feature-new-product-list`を指しているかを確認し、その周囲の条件ロジックを削除することです。同時に、まだ開発中かもしれない`feature-search-result-refinement`のような他のfeature toggleは触らずに残す必要があります。codemodは、変更を選択的に適用するため、**コードの構造を理解する必要があります**。

### ASTを理解する

codemodを書く前に、このコード断片がASTでどのように見えるかを分解してみましょう。AST Explorerのようなツールを使うと、ソースコードとASTの対応を可視化できます。変更を適用する前に、自分が扱うノード種別を理解しておくと役立ちます。

この構文木には、変数を表す`Identifier`、toggle名を表す`StringLiteral`、さらに抽象的な`CallExpression`や`ConditionalExpression`のようなノードが含まれます。

このAST表現では、変数`data`は`ConditionalExpression`を使って代入されています。式のtest部分は`featureToggle('feature-new-product-list')`を呼び出します。testが`true`を返すと、consequent分岐が`{ name: 'Product' }`を`data`へ代入します。`false`なら、alternate分岐が`undefined`を代入します。

入力と出力が明確な作業では、私はcodemodを実装する前にテストを書くことを好みます。まず、変えてはいけないものを誤って変えないためのnegative caseを定義し、次に実際の変換を行うreal caseを置きます。単純なシナリオから始めて実装し、その後、たとえばfeatureToggleがif文の中で呼ばれる場合のようなバリエーションを追加し、そのケースを実装して、すべてのテストが通ることを確認します。

このやり方は、普段TDDを実践していなくても、Test-Driven Developmentの考え方によく合っています。codemodを調整するときには、変換の入力と出力をコーディング前に正確に知っておくことで、安全性と効率が上がります。

jscodeshiftでは、codemodの振る舞いを検証するテストを書けます。

```js
const transform = require("../remove-feature-new-product-list");

defineInlineTest(
  transform,
  {},
  `
  const data = featureToggle('feature-new-product-list') ? { name: 'Product' } : undefined;
  `,
  `
  const data = { name: 'Product' };
  `,
  "delete the toggle feature-new-product-list in conditional operator"
);
```

jscodeshiftの`defineInlineTest`関数を使うと、入力、期待する出力、テスト意図を説明する文字列を定義できます。この時点で通常の`jest`コマンドでテストを実行すると、codemodはまだ書かれていないため失敗します。

対応するnegative caseでは、他のfeature toggleに対してコードが変わらないことを確認します。

```js
defineInlineTest(
  transform,
  {},
  `
  const data = featureToggle('feature-search-result-refinement') ? { name: 'Product' } : undefined;
  `,
  `
  const data = featureToggle('feature-search-result-refinement') ? { name: 'Product' } : undefined;
  `,
  "do not change other feature toggles"
);
```

### Codemodを書く

単純なtransform関数を定義するところから始めましょう。`transform.js`というファイルを作り、次のような構造にします。

```js
module.exports = function(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // manipulate the tree nodes here

  return root.toSource();
};
```

この関数はファイルを木として読み込み、jscodeshiftのAPIを使ってノードを問い合わせ、変更し、更新します。最後に、`.toSource()`でASTをソースコードへ戻します。

次に、変換手順の実装を始めます。

1. `featureToggle`のすべてのインスタンスを見つける。
2. 渡された引数が`'feature-new-product-list'`であることを確認する。
3. 条件式全体をconsequent部分へ置き換え、toggleを実質的に削除する。

`jscodeshift`を使うと、これは次のように実現できます。

```js
module.exports = function (fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Find ConditionalExpression where the test is featureToggle('feature-new-product-list')
  root
    .find(j.ConditionalExpression, {
      test: {
        callee: { name: "featureToggle" },
        arguments: [{ value: "feature-new-product-list" }],
      },
    })
    .forEach((path) => {
      // Replace the ConditionalExpression with the 'consequent'
      j(path).replaceWith(path.node.consequent);
    });

  return root.toSource();
};
```

このcodemodは、testで`featureToggle('feature-new-product-list')`を呼んでいる`ConditionalExpression`ノードを見つけます。そして条件式全体をconsequent、つまり`{ name: 'Product' }`へ置き換え、toggleロジックを削除して単純化されたコードを残します。

この例は、有用な変換を作って大きなコードベースに適用することがどれほど簡単かを示しています。手作業の労力を大きく減らせます。

現実の場面でcodemodを堅牢にするには、さらに多くのテストケースを書く必要があります。たとえば`if-else`文、`!featureToggle('feature-new-product-list')`のような論理式などのバリエーションを扱う必要があります。

codemodが準備できたら、作業中のコードベースのような対象コードベースで試せます。jscodeshiftには、codemodを適用して結果を報告するためのコマンドラインツールがあります。

```sh
$ jscodeshift -t transform-name src/
```

結果を検証したら、破壊的変更を導入している場合でも、すべての機能テストがまだ通り、壊れていないことを確認します。納得できたら、通常のワークフローの一部として変更をコミットし、pull requestを作成できます。

### Codemodはコード品質と保守性を高める

codemodは破壊的API変更の管理に役立つだけではありません。コード品質と保守性を大きく高めることもできます。コードベースが進化すると、古くなったfeature toggle、非推奨メソッド、密結合のコンポーネントなど、技術的負債が蓄積しがちです。こうした部分を手でリファクタリングするのは時間がかかり、ミスも起こりやすい作業です。

リファクタリング作業を自動化することで、codemodはコードベースをきれいに保ち、古いパターンを取り除く助けになります。codemodを定期的に適用すれば、新しいコーディング標準を強制し、未使用コードを削除し、各ファイルを手で直さずにコードベースを現代化できます。

### Avatarコンポーネントをリファクタリングする

次に、より複雑な例を見てみましょう。デザインシステムに、`Tooltip`と強く結びついた`Avatar`コンポーネントがあるとします。利用者が`Avatar`へ`name` propを渡すたびに、Avatarは自動的にtooltipで包まれます。

現在の`Avatar`実装は、概念的には次のような形です。

```tsx
import { Tooltip } from "@design-system/tooltip";

const Avatar = ({ name, image }: AvatarProps) => {
  if (name) {
    return (
      <Tooltip content={name}>
        <img src={image} alt={name} />
      </Tooltip>
    );
  }

  return <img src={image} alt="" />;
};
```

目標は、`Tooltip`を`Avatar`コンポーネントから切り離し、開発者により大きな柔軟性を与えることです。開発者は、`Avatar`を`Tooltip`で包むかどうかを自分で決められるべきです。リファクタリング後の版では、`Avatar`は単に画像をレンダリングし、必要なら利用者が手動で`Tooltip`を適用します。

リファクタリング後の`Avatar`は次のようになります。

```tsx
const Avatar = ({ image }: AvatarProps) => {
  return <img src={image} alt="" />;
};
```

必要なら、利用者は`Avatar`を手動で`Tooltip`に包めます。

```tsx
import { Tooltip } from "@design-system/tooltip";
import { Avatar } from "@design-system/avatar";

const UserProfile = () => {
  return (
    <Tooltip content="Juntao Qiu">
      <Avatar image="/juntao.qiu.avatar.png" />
    </Tooltip>
  );
};
```

課題は、コードベース全体に何百ものAvatar利用箇所が散らばっている場合に生じます。それぞれを手でリファクタリングするのは非常に非効率です。そこで、この処理を自動化するためにcodemodを使えます。

AST Explorerのようなツールを使うと、コンポーネントを調べ、対象となる`Avatar`利用箇所を表すノードを確認できます。`name`と`image`の両方のpropを持つ`Avatar`コンポーネントは、抽象構文木へパースされます。

### Codemodを書く

この変換を小さな作業に分けてみましょう。

- コンポーネントツリー内の`Avatar`利用箇所を見つける。
- `name` propがあるか確認する。
- なければ何もしない。
- あれば、`Tooltip`ノードを作る。
- `name`を`Tooltip`へ追加する。
- `Avatar`から`name`を削除する。
- `Avatar`を`Tooltip`の子にする。
- 元の`Avatar`ノードを新しい`Tooltip`に置き換える。

まず、すべてのAvatarインスタンスを見つけます。ここでは一部のテストを省略しますが、先に比較テストを書くべきです。

```js
defineInlineTest(
  { default: transform, parser: "tsx" },
  {},
  `
  <Avatar name="Juntao Qiu" image="/juntao.qiu.avatar.png" />
  `,
  `
  <Tooltip content="Juntao Qiu">
    <Avatar image="/juntao.qiu.avatar.png" />
  </Tooltip>
  `,
  "wrap avatar with tooltip when name is provided"
);
```

`featureToggle`の例と同じように、`root.find`と検索条件を使って、すべてのAvatarノードを探せます。

```js
root
  .find(j.JSXElement, {
    openingElement: { name: { name: "Avatar" } },
  })
  .forEach((path) => {
    // now we can handle each Avatar instance
  });
```

次に、`name` propがあるかを調べます。

```js
root
  .find(j.JSXElement, {
    openingElement: { name: { name: "Avatar" } },
  })
  .forEach((path) => {
    const avatarNode = path.node;

    const nameAttr = avatarNode.openingElement.attributes.find(
      (attr) => attr.name.name === "name"
    );

    if (nameAttr) {
      const tooltipElement = createTooltipElement(
        nameAttr.value.value,
        avatarNode
      );
      j(path).replaceWith(tooltipElement);
    }
  });
```

`createTooltipElement`関数では、jscodeshift APIを使って新しいJSXノードを作ります。`Tooltip`へ`name` propを適用し、`Avatar`コンポーネントを子として持たせます。最後に`replaceWith`を呼び出し、現在の`path`を置き換えます。

Hypermodでは、左側にcodemod、右側上部に元のコード、右側下部に変換後の結果を表示しながら確認できます。

このcodemodは、`Avatar`のすべてのインスタンスを検索します。`name` propが見つかると、`Avatar`から`name` propを取り除き、`Avatar`を`Tooltip`で包み、`name` propを`Tooltip`へ渡します。

ここまでで、codemodが非常に有用であり、特に手作業の更新が大きな負担になる大規模変更では、ワークフローも直感的であることが分かると思います。ただし、これがすべてではありません。次の節では、課題のいくつかに光を当て、望ましくない面にどう対処できるかを見ていきます。

### Codemodのよくある落とし穴を直す

経験豊かな開発者なら、happy pathは全体像のほんの一部にすぎないことを知っています。コードを自動的に扱う変換スクリプトを書くときには、考慮すべきシナリオが数多くあります。

開発者はさまざまなスタイルでコードを書きます。たとえば、別パッケージから来る別の`Avatar`コンポーネントがあるため、誰かが`Avatar`コンポーネントをimportしつつ別名を付けているかもしれません。

```tsx
import { Avatar as AKAvatar } from "@design-system/avatar";

const UserInfo = () => (
  <AKAvatar name="Juntao Qiu" image="/juntao.qiu.avatar.png" />
);
```

この場合、`Avatar`を単純にテキスト検索しても機能しません。別名を検出し、正しい名前を使って変換を適用する必要があります。

`Tooltip`のimportを扱う場合にも、別の例が出てきます。ファイルがすでに`Tooltip`をimportしていて、それに別名を使っているなら、codemodはその別名を検出し、適切に変更を適用しなければなりません。`Tooltip`という名前のコンポーネントが常に探しているものだと仮定することはできません。

feature toggleの例では、誰かが`if(featureToggle('feature-new-product-list'))`のように使っているかもしれません。あるいは、toggle関数の結果を変数に代入してから使っているかもしれません。

```js
const shouldEnableNewFeature = featureToggle('feature-new-product-list');

if (shouldEnableNewFeature) {
  //...
}
```

さらに、toggleを他の条件と組み合わせたり、論理否定を適用したりして、ロジックをより複雑にしている場合もあります。

```js
const shouldEnableNewFeature = featureToggle('feature-new-product-list');

if (!shouldEnableNewFeature && someOtherLogic) {
  //...
}
```

こうしたバリエーションがあると、すべてのエッジケースを予測するのは難しくなり、意図せず何かを壊すリスクが高まります。予測できるケースだけに頼るのでは不十分です。コードの意図しない部分を壊さないためには、**十分なテストが必要です**。

### Source Graphとテスト駆動Codemodを活用する

こうした複雑さに対処するには、codemodを他の技法と組み合わせて使うべきです。たとえば数年前、私はAtlassianでデザインシステムコンポーネントの書き換えプロジェクトに参加しました。この問題には、まずsource graphを検索することで対処しました。source graphには、内部コンポーネント利用の大部分が含まれていました。これにより、コンポーネントがどう使われているか、別名でimportされているか、特定のpublic propが頻繁に使われているかを理解できました。この探索段階のあと、主要なユースケースをカバーできるよう先にテストケースを書き、それからcodemodを開発しました。

アップグレードを自信を持って自動化できない場面では、呼び出し箇所にコメントやTODOを挿入しました。これにより、スクリプトを実行する開発者が特定のケースを手で扱えるようになります。通常、そうしたケースは少数にとどまったため、このやり方でもバージョンアップには十分役立ちました。

### 既存のコード標準化ツールを使う

見てきたように、扱うべきエッジケースはたくさんあります。外部依存のように、自分の管理下にないコードベースでは特にそうです。この複雑さは、codemodの利用には慎重な監督と結果レビューが必要であることを意味します。

しかし、コードベースに特定のコーディングスタイルを強制するlinterのような標準化ツールがあるなら、それを使ってエッジケースを減らせます。一貫した構造を強制することで、linterのようなツールはコードのバリエーションを狭め、変換を簡単にし、予期しない問題を減らします。

たとえば、ネストした条件演算子を避ける、default exportよりnamed exportを強制する、といったlintルールを使えます。こうしたルールはコードベースを整え、codemodをより予測可能で効果的にします。

さらに、複雑な変換を小さく扱いやすい変換へ分解すれば、個別の問題へより正確に対処できます。まもなく見るように、小さなcodemodを合成すると、複雑な変更を扱いやすくできます。

### 再利用可能なユーティリティを抽出する

よく考えられた戦略があっても、importがなければ追加する、特定位置へコメントを挿入する、prop名を変える、といった反復的な作業は残ります。この種の操作は、さまざまな変換で何度も出てきます。

時間をかけて、私たちはcodemod開発を効率化する一連のヘルパー関数を作りました。こうしたユーティリティにより、共通作業をより効率よく自動化できます。よい例は、小さなユーティリティを組み合わせて、より大きく複雑なtransformerを作る方法です。これは次の節で扱います。

### Codemod Composition

先ほど扱ったfeature toggle削除の例に戻りましょう。次のコード断片には、削除したい`feature-convert-new`というtoggleがあります。

```ts
import { featureToggle } from "./utils/featureToggle";

const convertOld = (input: string) => {
  return input.toLowerCase();
};

const convertNew = (input: string) => {
  return input.toUpperCase();
};

const result = featureToggle("feature-convert-new")
  ? convertNew("Hello, world")
  : convertOld("Hello, world");

console.log(result);
```

特定のtoggleを削除するcodemodはうまく動きます。codemod実行後、ソースは次のようになっていてほしいところです。

```ts
const convertNew = (input: string) => {
  return input.toUpperCase();
};

const result = convertNew("Hello, world");

console.log(result);
```

しかし、feature toggleロジックを削除するだけでなく、追加で扱うべき作業があります。

- 未使用になった`convertOld`関数を削除する。
- 未使用になった`featureToggle` importを掃除する。

もちろん、すべてを1回のパスで処理する大きなcodemodを書き、まとめてテストすることもできます。しかし、より保守しやすい方法は、codemodロジックをプロダクトコードのように扱うことです。通常の本番コードをリファクタリングするときと同じように、作業を小さく独立した部品へ分けます。

### 分解する

大きな変換を小さなcodemodへ分解し、それらを合成できます。この方法の利点は、各変換を個別にテストでき、互いに干渉せずにさまざまなケースをカバーできることです。さらに、別の目的のために再利用し、組み合わせることもできます。

たとえば、次のように分けられます。

- 特定のfeature toggleを削除する変換。
- 未使用importを掃除する別の変換。
- 未使用関数宣言を削除する変換。

これらを合成すると、変換のpipelineを作れます。

```ts
import { removeFeatureToggle } from "./remove-feature-toggle";
import { removeUnusedImport } from "./remove-unused-import";
import { removeUnusedFunction } from "./remove-unused-function";

import { createTransformer } from "./utils";

const removeFeatureConvertNew = removeFeatureToggle("feature-convert-new");

const transform = createTransformer([
  removeFeatureConvertNew,
  removeUnusedImport,
  removeUnusedFunction,
]);

export default transform;
```

このpipelineでは、変換は次のように働きます。

1. `feature-convert-new` toggleを削除する。
2. 未使用の`import`文を掃除する。
3. もう使われなくなった`convertOld`関数を削除する。

必要に応じて追加のcodemodを抽出し、望む結果に合わせてさまざまな順序で組み合わせることもできます。

### `createTransformer`関数

`createTransformer`関数の実装は比較的単純です。これは高階関数として、小さなtransform関数のリストを受け取り、そのリストを反復してroot ASTへ適用し、最後に変更後のASTをソースコードへ変換します。

```ts
import { API, Collection, FileInfo, JSCodeshift, Options } from "jscodeshift";

type TransformFunction = { (j: JSCodeshift, root: Collection): void };

const createTransformer =
  (transforms: TransformFunction[]) =>
  (fileInfo: FileInfo, api: API, options: Options) => {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);

    transforms.forEach((transform) => transform(j, root));
    return root.toSource(options.printOptions || { quote: "single" });
  };

export { createTransformer };
```

たとえば、feature toggle呼び出しを変数へ代入している式をインライン化するtransform関数を用意できます。そうすれば、後続のtransformでは、そのケースを心配しなくてよくなります。

```js
const shouldEnableNewFeature = featureToggle('feature-convert-new');

if (!shouldEnableNewFeature && someOtherLogic) {
  //...
}
```

これは次のようになります。

```js
if (!featureToggle('feature-convert-new') && someOtherLogic) {
  //...
}
```

時間がたつにつれ、再利用可能な小さなtransformのコレクションを作れるようになります。これは厄介なエッジケースを扱うプロセスを大きく楽にします。この方法は、デザインシステムコンポーネントを洗練する私たちの作業で非常に効果的でした。buttonコンポーネントのような1つのパッケージを変換し終えると、関数の先頭へコメントを追加する、非推奨propを削除する、すでに上部でパッケージがimportされているときに別名を作る、といった再利用可能なtransformがいくつか定義されていました。

これらの小さなtransformは、それぞれ独立してテストして使うことも、より複雑な変換のために組み合わせることもできます。そのため、後続の変換はかなり速くなります。結果として私たちの改善作業は効率化され、こうした汎用的なcodemodは、社内のReactコードベースだけでなく、外部のReactコードベースにも適用できるようになりました。

各transformが比較的独立しているため、他のtransformや複雑に合成されたtransformに影響を与えずに調整できます。たとえば、ノード探索の回数を減らすように実装し直して性能を改善する場合でも、十分なテストカバレッジがあれば、自信を持って安全に進められます。

### 他の言語におけるCodemod

ここまで見てきた例は、jscodeshiftを使うJavaScriptとJSXに焦点を当てていました。しかしcodemodは他の言語にも適用できます。たとえばJavaParserは、AST操作を使ってJavaコードをリファクタリングする同様の仕組みを提供します。

### JavaコードベースでJavaParserを使う

JavaParserは、破壊的API変更や大規模なJavaコードベースのリファクタリングを、構造化され自動化された方法で行うのに役立ちます。

`FeatureToggleExample.java`に次のようなコードがあるとします。このコードは`feature-convert-new` toggleをチェックし、それに応じて分岐します。

```java
public class FeatureToggleExample {
    public void execute() {
        if (FeatureToggle.isEnabled("feature-convert-new")) {
          newFeature();
        } else {
          oldFeature();
        }
    }

    void newFeature() {
        System.out.println("New Feature Enabled");
    }

    void oldFeature() {
        System.out.println("Old Feature");
    }
}
```

`FeatureToggle.isEnabled`をチェックしている`if`文を見つけ、対応するtrue分岐で置き換えるvisitorを定義できます。これは、JavaScriptでfeature toggle codemodを扱った方法と似ています。

```java
// Visitor to remove feature toggles
class FeatureToggleVisitor extends VoidVisitorAdapter<Void> {
    @Override
    public void visit(IfStmt ifStmt, Void arg) {
        super.visit(ifStmt, arg);
        if (ifStmt.getCondition().isMethodCallExpr()) {
            MethodCallExpr methodCall = ifStmt.getCondition().asMethodCallExpr();
            if (methodCall.getNameAsString().equals("isEnabled") &&
                methodCall.getScope().isPresent() &&
                methodCall.getScope().get().toString().equals("FeatureToggle")) {

                BlockStmt thenBlock = ifStmt.getThenStmt().asBlockStmt();
                ifStmt.replace(thenBlock);
            }
        }
    }
}
```

このコードは、JavaParserを使ったvisitor patternを定義し、ASTをたどって操作します。`FeatureToggleVisitor`は、`FeatureToggle.isEnabled()`を呼んでいる`if`文を探し、`if`文全体をtrue分岐で置き換えます。

未使用メソッドを見つけて削除するvisitorも定義できます。

```java
class UnusedMethodRemover extends VoidVisitorAdapter<Void> {
    private Set<String> calledMethods = new HashSet<>();
    private List<MethodDeclaration> methodsToRemove = new ArrayList<>();

    // Collect all called methods
    @Override
    public void visit(MethodCallExpr n, Void arg) {
        super.visit(n, arg);
        calledMethods.add(n.getNameAsString());
    }

    // Collect methods to remove if not called
    @Override
    public void visit(MethodDeclaration n, Void arg) {
        super.visit(n, arg);
        String methodName = n.getNameAsString();
        if (!calledMethods.contains(methodName) && !methodName.equals("main")) {
            methodsToRemove.add(n);
        }
    }

    // After visiting, remove the unused methods
    public void removeUnusedMethods() {
        for (MethodDeclaration method : methodsToRemove) {
            method.remove();
        }
    }
}
```

このコードは、未使用メソッドを検出して削除する`UnusedMethodRemover`というvisitorを定義します。呼び出されたすべてのメソッドを`calledMethods`セットに記録し、各メソッド宣言を調べます。メソッドが呼ばれておらず、`main`でもなければ、削除対象リストに追加します。すべてのメソッドが処理されたあと、未使用メソッドをASTから削除します。

### Java Visitorを合成する

これらのvisitorをつなぎ合わせ、次のようにコードベースへ適用できます。

```java
public class FeatureToggleRemoverWithCleanup {
    public static void main(String[] args) {
        try {
            String filePath = "src/test/java/com/example/Example.java";
            CompilationUnit cu = StaticJavaParser.parse(new FileInputStream(filePath));

            // Apply transformations
            FeatureToggleVisitor toggleVisitor = new FeatureToggleVisitor();
            cu.accept(toggleVisitor, null);

            UnusedMethodRemover remover = new UnusedMethodRemover();
            cu.accept(remover, null);
            remover.removeUnusedMethods();

            // Write the modified code back to the file
            try (FileOutputStream fos = new FileOutputStream(filePath)) {
                fos.write(cu.toString().getBytes());
            }

            System.out.println("Code transformation completed successfully.");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

各visitorは変換の単位であり、JavaParserのvisitor patternは、それらを合成しやすくします。

### OpenRewrite

Javaプロジェクトで人気のあるもう1つの選択肢がOpenRewriteです。OpenRewriteは、Lossless Semantic Trees、つまりLSTと呼ばれる別形式のソースコードツリーを使います。これはJavaParserやjscodeshiftのようなツールが使う従来のAST、抽象構文木よりも、より詳細な情報を提供します。ASTが構文構造に注目するのに対し、LSTは構文と意味の両方を捉えるため、より正確で高度な変換を可能にします。

OpenRewriteには、フレームワーク移行、セキュリティ修正、スタイル一貫性の維持といった作業のための、強力なオープンソースのリファクタリングrecipeエコシステムもあります。この組み込みrecipeライブラリにより、開発者はカスタムスクリプトを一から書かずに、標準化された変換を大規模コードベースへ適用でき、大きく時間を節約できます。

独自の変換が必要な開発者のために、OpenRewriteは自分のrecipeを作成して配布できるようにしています。そのため、非常に柔軟で拡張可能なツールです。Javaコミュニティで広く使われており、高度な能力とコミュニティ主導の取り組みによって、徐々に他の言語へも広がっています。

### OpenRewriteとJavaParserやjscodeshiftの違い

OpenRewriteとJavaParserやjscodeshiftのようなツールの重要な違いは、コード変換へのアプローチにあります。

- OpenRewriteのLossless Semantic Trees、LSTは、コードの構文的意味と意味論的意味の両方を捉え、より正確な変換を可能にします。
- JavaParserとjscodeshiftは従来型のASTに依存し、主に構文構造に焦点を当てます。強力ではありますが、コードが意味的にどう振る舞うかの微妙な点を常に捉えられるとは限りません。

さらにOpenRewriteは、コミュニティ主導のリファクタリングrecipeを多数提供しているため、よくある変換をカスタムcodemodなしで適用しやすくなります。

### Codemodのための他のツール

jscodeshiftとOpenRewriteは強力なツールですが、ニーズや作業しているエコシステムによっては、検討に値する他の選択肢もあります。

### Hypermod

Hypermodは、codemodを書くプロセスにAI支援を導入します。codemodロジックを手で作る代わりに、開発者は望む変換を自然言語で説明でき、Hypermodはjscodeshiftを使ってcodemodを生成します。これにより、AST操作に詳しくない開発者でもcodemod作成に入りやすくなります。

Hypermodに接続された任意のリポジトリに対して、codemodを合成し、テストし、デプロイできます。Hypermodはcodemodを実行し、提案された変更を含むpull requestを生成できます。そのため、codemodの開発からデプロイまでのプロセス全体がかなり効率化されます。

### Codemod.com

Codemod.comは、開発者がcodemodを共有し、見つけるためのコミュニティ主導プラットフォームです。一般的なリファクタリング作業や移行のために特定のcodemodが必要なら、既存のcodemodを検索できます。逆に、自分が作ったcodemodを公開し、開発者コミュニティの他の人を助けることもできます。

APIを移行していて、それを扱うcodemodが必要な場合、Codemod.comは多くの一般的な変換のための事前作成済みcodemodを提供することで時間を節約できます。一から書く必要を減らしてくれます。

### 結論

codemodは、コード変換を自動化する強力なツールです。API変更の管理、古いコードのリファクタリング、大規模コードベース全体での一貫性維持を、少ない手作業で進めやすくします。jscodeshift、Hypermod、OpenRewriteのようなツールを使うことで、開発者は小さな構文変更から大規模なコンポーネント書き換えまでを効率化し、コード品質と保守性を高められます。

ただし、codemodには大きな利点がある一方で、課題もあります。重要な懸念の1つは、特に多様なコードベースや公開されたコードベースでのエッジケース対応です。コーディングスタイルの違い、importの別名、予想外のパターンは、codemodが自動的には扱えない問題につながることがあります。正確性を確保するには、こうしたエッジケースに対して慎重な計画、徹底したテスト、場合によっては手作業の介入が必要です。

codemodの効果を最大化するには、複雑な変換を小さくテスト可能な手順へ分け、可能なところではコード標準化ツールを使うことが重要です。codemodは非常に効果的になり得ますが、その成功は、思慮深い設計と、より多様で複雑なコードベースで直面し得る制約の理解にかかっています。

### 謝辞

この記事を読みやすくするために寛大なレビューと貴重な提案をくださり、またこのような長文記事の場を提供してくださったMartin Fowlerに、心から感謝します。

この記事で説明したAvatarリファクタリングの元の著者であり、hypermod.ioのようなツールを通じた大規模リファクタリングの熱心な推進者であるDaniel Del Coreにも、特別な感謝を述べます。

数年前、codemodに関わる仕事を一緒にする機会を得たAtlassian Design SystemチームとThoughtworksの同僚にも感謝します。codemodの助けを借りて、広範なコードベースにわたってデザインシステムをスケールさせる方法を学んだ、私にとって形づくりの経験でした。

### 重要な改訂

2025年1月22日: 最終回を公開。

2025年1月15日: 第3回、よくある落とし穴の修正を公開。

2025年1月8日: 第2回、より複雑なcodemodを公開。

2025年1月7日: 第1回を「Codemods Improve Code Quality and Maintainability」まで公開。
