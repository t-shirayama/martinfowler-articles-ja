# Errant Architectures

## 要約

この記事の元ページは、Dr. Dobb's / Software Development magazine 側で公開されていた「Errant Architectures」です。
今回確認できた公開情報では、martinfowler.com のタグページにある要約から、これは『Patterns of Enterprise Application Architecture』第7章「Distribution Strategies」を雑誌向けに再構成した記事であり、First Law of Distributed Object Design を含むことがわかります。

このページでは、元記事本文を翻訳したものではなく、到達可能だった Martin Fowler サイト上の公開要約だけを日本語化しています。
見えない本文の内容は補っていません。

## 対応範囲

元URL `http://www.ddj.com/showArticle.jhtml?articleID=184414966` は到達できませんでした。
そのため、martinfowler.com の application architecture タグページに掲載されている公開要約のみを翻訳対象にしています。
本文全体、章構成、具体例、語調の詳細は確認できていないため、ここでは確認できた公開要約の範囲を翻訳しています。

## 読むときの観点

- これは本文翻訳ではなく、公開要約の翻訳であることを前提に読む。
- Distribution Strategies と First Law of Distributed Object Design への入口として位置づける。
- 分散設計を魅力的な図や構成だけで判断せず、実装者が負う複雑さを考える。

## 原文の翻訳

Software Development magazine は、私の本『Patterns of Enterprise Application Architecture』の第7章「Distribution Strategies」を、同誌の記事として翻案しました。
おそらく彼らが気に入ったのは、その語り口と、**First Law of Distributed Object Design** が含まれていたからだと思います。
