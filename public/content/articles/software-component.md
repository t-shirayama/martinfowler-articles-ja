# Software Component

## 要約

Software Component は、単に再利用できるコード片ではなく、独立して置き換えたりアップグレードしたりできるものとして捉えられます。
Fowler は現在の component を、主に library と service という2つの形で見ています。

library では利用者が更新タイミングを選べること、service では提供側が独自のタイミングで更新しても既存の client contract を保つことが重要です。
component は module の一種ですが、独立置換という性質を追加で持つものです。

## 読むときの観点

- component を技術ではなく、利用者がソフトウェアとどう関わりたいかの問題として読む。
- library と service の違いを、プロセス境界と更新権限の違いとして見る。
- service が component であるためには、他 service との同期アップグレードを求めないことが重要。
- module と component の関係を整理する。

## 原文の翻訳

ソフトウェア開発を、苦労してコードを作り込むものから、component を単純に組み合わせて強力なシステムを構築するものへ変えるという考えは、私がこの職業に入ったときから目標であり続けています。それは時折かいま見えるものの、決して本当に達成されてはいません。もっとも、多くの技術が産業的再利用というにんじんをぶら下げてきました。

software component について話すとき、しばしば最も難しい段階は、それが何であるかを話すことです。私が今でもいちばん気に入っている定義は、次のものです。

> Components は技術ではありません。技術の人々には、これを理解するのが難しいようです。Components は、顧客がソフトウェアとどう関わりたいかについてのものです。顧客は、ソフトウェアを少しずつ買えるようにしたいし、ステレオをアップグレードできるのと同じようにアップグレードできるようにしたいのです。新しい部品が古い部品と滑らかに動作し、メーカーの都合ではなく自分たちの都合に合わせてアップグレードできるようにしたいのです。さまざまなメーカーの部品を自由に組み合わせられるようにしたいのです。これはとても妥当な要求です。ただ、満たすのが難しいだけです。
>
> -- Ralph Johnson

私はこれを、software components とは、独立して置き換え可能で、独立してアップグレード可能なものだ、と要約しています。

私は現在の component を、library と service という2つの姿で現れるものとして見ています。library は、runtime に process へ link され、client process の一部になる code から成ります。例としては、Java の jar、C# の assembly、Ruby の gem、JavaScript の module があります。適切な component であるためには、library の利用者が supplier library をいつアップグレードするか、あるいはアップグレードするかどうかの判断を保持しているべきです。したがって、私が6か月古い library の version を使うことを選ぶなら、それは私の判断です。

service は、それ自身の process の中に存在する component です。client は、RPC、HTTP を使った RESTful call、messaging など、何らかの interprocess communication mechanism を通じてそれと話します。この文脈での service は、EvansClassification における Service Object とは別のものです。service は client と調整せずに、自分自身の時間割でアップグレードしてよい場合があります。しかし、そのためには既存の client contract を保たなければなりません。そうすれば、client は service の利用をいつアップグレードするかを選べます。service が component であるためには、**ある service のアップグレードを別の service のアップグレードと調整する必要が決してあってはいけません**。

私は component を module の特定の形だと考えています。私は module を、ソフトウェアシステムの分割であり、その明確に定義された一部だけを理解すればシステムを変更できるようにするもの、と定義しています。module とは、その明確に定義された部分です。component は module の一形態であり、独立置換という追加の性質を持ちます。
