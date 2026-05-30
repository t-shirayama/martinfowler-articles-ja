# Catastrophic Failover

## 要約

クラスタ構成の failover は信頼性を高めるための仕組みですが、特定のリクエストがサーバーをクラッシュさせる場合、そのリクエストが次々と別サーバーへ移され、障害を広げることがあります。

この記事の注意点は、failover は無制限に繰り返せばよいものではないということです。何度も failover したリクエストを移し続けないためのチェックや、異なる構成を混ぜることで同一障害の連鎖を減らす考え方が示されています。

## 読むときの観点

- failover は常に安全側に働くとは限らない。
- 問題のあるリクエストが障害を拡散させる可能性を見る。
- failover 回数を追跡し、移行を止める条件を考える。
- 同一構成のクラスタと、異種構成を混ぜたクラスタのトレードオフを見る。

## 原文の翻訳

現代的な application server でよく宣伝される機能のひとつは、cluster 内で failover を提供することです。Clustering はアプリケーションの信頼性を高めます。ある server が落ちても、顧客にサービスを提供する server が他にもあるからです。Failover はさらに信頼性を加えます。対話の途中で server が落ちた場合、cluster はその対話を別の server へ移せます。

しかし、これは問題になることがあります。

ある request が server を crash させることがあります。たとえば、server software の bug を偶然露出させるような request です。すると failover が動いたとき、その致命的な request が別の server へ移され、今度はその server も落としてしまいます。タイミングがぴったり合うと、最初の server が reboot したころには、その request を再び受け取る準備ができてしまいます。

念のために言うと、これは実話です。

したがって、server が繰り返し落ちるのを見たら、原因は errant transaction かもしれません。これを防ぐには、すでに何度か failover された request を移行しないよう確認するチェックが必要です。failover は良いものですが、**server farm にそれを何度もやらせたくはありません**。

Christopher Baus は、この問題は cluster にあえて異なる装置を使うべきだという示唆でもある、と指摘しました。Java application を動かしているなら、異なる app server、operating system、hardware を混ぜることを検討してください。もちろん混在構成は管理がより複雑になりますが、この問題が起きる可能性を大きく下げます。
