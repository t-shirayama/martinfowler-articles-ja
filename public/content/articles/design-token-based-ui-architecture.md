# Design Token-Based UI Architecture

## 要約

Design tokenは、色、余白、フォント、`z-index`などの設計判断をデータとして表したものです。デザインと実装のあいだに共通の情報源を置くことで、複数チーム、複数アプリ、複数プラットフォームで一貫したUIを保ちやすくします。

この記事は、tokenを単に変数として並べるのではなく、option token、decision token、component tokenという層に分けて整理する考え方を説明している。また、tokenをGitで管理し、変換ツールとCI/CDで各技術向けの成果物を配布することで、デザイン変更を速く安全に反映できると述べている。

## 読むときの観点

- Design tokenを、CSS変数の別名ではなく「設計判断のデータ化」として捉える。
- option、decision、componentの層が、抽象度の違う判断をどう分離しているかを見る。
- すべてのtokenをアプリ開発者へ公開する必要があるかを考える。
- tokenの配布を手作業ではなく、検証、生成、テスト、公開、通知のパイプラインとして扱う。

## 原文の翻訳

以下は、原文の構成に沿って主要な主張を日本語でたどる抄訳です。

Design tokenは、デザイン上の基本的な判断をデータとして表すものであり、デザインシステムの土台になる。近年、Design Tokens Community Groupの仕様やツール群が整ってきたことで、UIデザインツール、token editor、コード生成ツール、ドキュメント生成ツールとの連携が現実的になってきた。

著者が紹介する例では、マイクロフロントエンドで複数チームが同じ画面上の異なる部分を担当していた。dialog、toast、navigationなどが重なり合うとき、各チームが任意の`z-index`値を使うと、値の意味が共有されず、問題の解決にチーム横断の調整が必要になる。そこで`modal`、`toast`、`navigation`のような名前つきのtokenを定義し、CSS変数やSCSS変数へ生成することで、使うべき値と意図を共有できる。

Design tokenの利点は、デザインと実装の両方に対するsingle source of truthになることだ。tokenファイルを入力にして、Web向けのCSS、Android向けのXML、iOS向けのコードなど、プラットフォーム固有の成果物を生成できる。ツールによっては、同じtokenからドキュメントも生成できる。

tokenはデザインツールそのものではなく、Gitリポジトリで管理するのが望ましい。FigmaなどのデザインツールとGitを同期できれば、デザイナーの変更をバージョン管理し、その後の検証、変換、公開を自動化できる。完全自動のtrunk-based pipelineでは、tokenの検証、生成、テスト、パッケージ公開、チーム通知を順に行う。必要に応じて、プレビュー環境と手動承認を挟むこともできる。

tokenを整理するうえで重要なのは層である。すべての判断が同じ粒度ではないため、**一般的な選択肢から、文脈上の意味、具体的なコンポーネント適用へと段階づける**。この記事では、option token、decision token、component tokenという名前を使う。

Option tokenは、使えるデザイン上の選択肢を定義する。たとえば青や灰色のカラーパレット、spacing scale、font familyなどである。これらはデザイナーにとって有用だが、アプリケーション開発者が日々直接選ぶには粒度が細かすぎることが多い。

Decision tokenは、選択肢をUI上の意味へ対応づける。たとえば、surface、disabled background、disabled text、default text、accent、text on accentのような名前を持つ。開発者にとっては、単なる`blue-900`よりも、`accent`のような意味を持つtokenの方が判断しやすい。

Component tokenは、decision tokenを具体的なUI部品へ結びつける。buttonのprimary背景、primaryテキスト、secondary背景、disabled背景などがその例である。コンポーネントという語は必ずしも技術的なReact componentなどを意味せず、HTMLの`button`要素に対する設計上の部品名としても使える。

大きなデザインシステムでは2層または3層の構成がよく使われる。3層は開発者体験をよくし、将来の変更にも強いが、token数と保守コストは増える。主要な設計判断がすでに安定しているプロジェクトでは、option tokenとdecision tokenの2層から始め、必要になったらcomponent tokenを加える選択も現実的である。

tokenのscopeも重要である。option tokenはデザイナーには役立つが、アプリ開発者へ公開すると生成ファイルが大きくなり、不要な選択肢を増やしてしまう。Style Dictionaryなどでは、ファイル名や`public`フラグで公開対象を絞り、decision tokenやcomponent tokenだけを成果物に含められる。

Design tokenは、複数プラットフォーム、複数アプリ、大きなチーム、頻繁なデザイン変更がある環境で特に効果を発揮する。一方、小規模でデザイン変更も少ないプロジェクトでは、導入と自動化のコストが利点を上回ることがある。**tokenは一貫性と変更速度を買うためのアーキテクチャ判断**であり、どの規模でも必ず必要になるものではない。
