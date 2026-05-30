# Story Test

## 要約

Story Testは、User Storyの一部として届けられるソフトウェアを説明し、検証するためのbusiness-facing testです。ストーリーを詳しくする段階で受け入れ条件として作られ、回帰テスト群や要件からシステムのふるまいへの追跡可能性にもつながります。

一方で、ストーリーごとにstory testを増やし続けると、重複した大きなテスト群になりやすく、変更時の保守が重くなります。特にbroad-stackなstory testは実行時間が長く、Test Pyramidに反しやすい点が問題になります。

## 読むときの観点

- Story Testを、User Storyの受け入れ条件としてのテストと捉える。
- 要件、テスト、実行結果としてのシステムのふるまいがどう結びつくかを見る。
- ストーリーごとにテストを追加する単純な流れが、重複と保守負荷を生む点に注目する。
- broad-stack testを増やしすぎることが、Test Pyramidとどう衝突するかを押さえる。

## 原文の翻訳

Story testは、UserStoryの一部として届けられるソフトウェアを説明し、検証するために使われるBusinessFacingTestです。ストーリーを詳しくするとき、チームはそのストーリーの受け入れ条件として働く複数のstory testを作ります。story testは、ソフトウェアの回帰テスト群へ組み込むことができ、要件、つまりuser storyからテストへ、さらに実行を通じてシステムのふるまいへと追跡できるようにします。story testは通常、BroadStackTestです。

User storyが人気なのは、単純なワークフローを提供するからです。各ストーリーが、story test suiteに新しいテストを追加します。しかしstory testはしばしば問題を引き起こします。story testを定期的に追加していくと、テストの大きな集合ができ、そこにはかなりの重複が含まれがちです。プロジェクトの後のイテレーションでふるまいを変える必要が出たとき、テスト内の重複を更新するには、**つらいほど多くの時間**がかかることがあります。

さらに、broad-stackなstory testは実行に長い時間がかかります。そのため、それを大量に持つことはTestPyramidに反します。結果として、多くの人は、ごく少数のUserJourneyTestと、business-facingなComponentTestを組み合わせて使うことを勧めています。
