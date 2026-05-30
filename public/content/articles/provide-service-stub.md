# Provide Service Stub

## 要約

Provide Service Stubは、service oriented architectureでserviceを提供するとき、clientがテストに使えるservice stubも一緒に提供するべきだという考え方です。stubは固定されたrequestに対して用意済みのresponseを返し、error conditionをsimulateでき、clientのmachine上で動かせる必要があります。

service stubを提供すると、clientは本物のserviceに接続しなくても開発やテストを進めやすくなります。その結果、serviceを使う負担が下がり、そのserviceが採用されやすくなります。

## 読むときの観点

- service提供者は、本体だけでなくclientのテスト体験も設計対象にする。
- stubはcanned response、error simulation、client側での実行可能性を備える。
- stubが本物のsystem behaviorを正しくまねる必要がある点に注意する。
- 使いやすいserviceは、統合先のclientに採用されやすくなる。

## 原文の翻訳

service oriented architectureのためにserviceを作る人にとって重要な考えがあります。serviceを作るときは、clientがそれに対してtestできるservice stubも一緒に作るべきです。

そのようなstubは、固定されたrequestの集合に対して用意済みのresponseを返せる必要があります。また、error conditionをsimulateでき、clientのmachine上で実行できる必要もあります。stubが本物のsystem behaviorを適切にまねていることも確認しなければなりません。

clientのためにstubを提供すれば、clientはあなたのserviceをずっと使いやすくなります。そしてもちろん、**使いやすいserviceは使われる可能性が高くなります**。
