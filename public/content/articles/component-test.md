# Component Test

## 要約

Component Test は、テストで実行するソフトウェアの範囲を、テスト対象システムの一部分に限定するテストです。できるだけ多くの部分をまとめて実行する Broad Stack Test と対比されます。

Component Test は Broad Stack Test よりも書きやすく、保守しやすく、速く実行できることが多い一方で、コンポーネント間の相互作用に潜むバグを見逃す可能性があります。そのため、テストピラミッドの考え方に従い、多数の Component Test と少数の Broad Stack Test を組み合わせるのがよいとされます。

## 読むときの観点

- Component Test と Broad Stack Test の違いを、絶対的な分類ではなく範囲の違いとして捉える。
- 内部コードインターフェースや Test Double を使うことで、テスト対象をどう隔離しているかを見る。
- Component Test の多さだけでは相互作用の不具合を拾いきれないため、Broad Stack Test との組み合わせを考える。

## 原文の翻訳

Component Test とは、実行するソフトウェアの範囲を、テスト対象システムの一部分に限定するテストである。これは、合理的な範囲でできるだけ多くのシステムを実行しようとする Broad Stack Test と対比される。

Broad Stack Test と Component Test の違いは、絶対的な違いというより程度の違いである。Component Test は、コンポーネントをどのように定義するかによって、大きくも小さくもなりうる。

違いの本質は、Component Test が、テストの範囲外にあるシステムの部分を意図的に無視することにある。これは通常、xUnit 系のテストツールのような道具を使って内部のコードインターフェースからシステムを操作したり、Test Double を使ってテスト対象コードを他のコンポーネントから隔離したりすることで行われる。

Component Test は通常、Broad Stack Test よりも書きやすく、保守しやすい。また、コードベースの一部だけを実行するため、実行も速い。

理論上、優れた Component Test のカバレッジを持つシステムにはバグがないはずである。しかし実際には、バグはコンポーネント間の相互作用に潜みやすい。したがって、Test Pyramid を使い、**大量の Component Test と少量の Broad Stack Test を組み合わせる**のがよい。
