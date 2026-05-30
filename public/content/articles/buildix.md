# Buildix

## 要約

Buildix は、Continuous Integration 環境を素早く用意するために、CI サーバー、ソースコード管理、課題管理、wiki などをまとめた開発サーバーです。Thoughtworks のプロジェクトで試され、その後無料で利用できるようになりました。

この記事の背景には、良い開発環境を構成して統合する作業が、見た目以上に手間のかかる仕事だという認識があります。Buildix は、その初期構築の負担を減らすためのパッケージとして紹介されています。

## 読むときの観点

- CI を始めるには、CI サーバーだけでなく周辺ツールの統合が必要になる。
- 開発サーバー構築の繰り返し作業を減らす狙いを見る。
- 当時のツール構成として Subversion、Cruise Control、Trac が挙げられている。
- 現代のツール選定ではなく、開発環境を標準化する考え方として読む。

## 原文の翻訳

私は Continuous Integration の利点について何度も話してきました。そのような環境を動かすには、continuous integration server と source code control system が必要です。プロジェクトを円滑に進めるには、バグ追跡などのための issue tracker や、さまざまなプロジェクト知識を記録する wiki もあるとよいでしょう。

これらすべてを整え、互いに統合された良い環境を作るのは、思っているより難しい仕事です。新しいプロジェクトでは、build server をこうしたもの込みで立ち上げるために、どうしても1週間ほどあれこれ作業することになっていました。以前にも触れましたが、私たちのロンドンオフィスにはとても優秀な deployment team が育っており、その副業のひとつが build server をまとめることでした。

それはいくつかの Thoughtworks プロジェクトで試され、今では誰でも使えるようになりました。Buildix は完全な development server であり、ThoughtWorkers というかなり要求の厳しい集団によって現場でテストされ、無料で利用できます。

無料である理由は、私たちの deployment wizard たち、Chris Read、Julian Simpson、Tom Sulston が、open-source software の集合を統合したものだからです。冷蔵庫で見つけた魔法の粉も少し使ったようです。

このサーバーは、OS として Knoppix、つまり Debian Linux ディストリビューションを使います。live CD なので、試してみたいだけなら CD drive からそのまま起動できます。他の live CD と同じように、簡単に hard drive へインストールでき、完全なサーバーとして使えるようになります。VMWare Image もあります。

箱の中には Subversion、Cruise Control、Trac が入っています。必要であれば、Windows shares を提供する Samba、DNS、DHCP も動くように設定されています。

背景をもう少し知りたい場合は、Chris と Julian の blog posts を見るとよいでしょう。
