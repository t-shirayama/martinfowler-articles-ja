# Aliasing Bug

## 要約

Aliasing Bugは、同じメモリ上のオブジェクトを複数の参照から扱うことで、意図しない変更が別の場所にも現れるバグです。参照を共有すること自体は悪いことではなく、共有された変更を期待する場面もあります。

この記事の中心は、参照として共有したいものと、値として扱いたいものを区別することです。Value Objectでは共有された更新を避けるため、不変にすることが有効だと述べています。

## 読むときの観点

- 同じオブジェクトを指す複数の参照が、いつ便利で、いつ危険になるかを見る。
- 日付の例では、代入がコピーではなく同じオブジェクトへの参照を共有している点に注目する。
- Reference ObjectとValue Objectの違いを、変更の共有を期待するかどうかで考える。
- 不変性は多くのバグを避けやすくするが、変更が必要な場面では複雑さも増やしうる。

## 原文の翻訳

Aliasingは、同じメモリ位置が複数の参照からアクセスされるときに起こります。多くの場合これはよいことですが、しばしば予期しない形で起こり、分かりにくいバグにつながります。

このバグの簡単な例を示します。

```java
Date retirementDate = new Date(Date.parse("Tue 1 Nov 2016"));

// this means we need a retirement party
Date partyDate = retirementDate;

// but that date is a Tuesday, let's party on the weekend
partyDate.setDate(5);

assertEquals(new Date(Date.parse("Sat 5 Nov 2016")), retirementDate);
// oops, now I have to work three more days :-(
```

ここで起きているのは、代入したときに、`partyDate`変数が`retirementDate`と同じオブジェクトへの参照を持つようになる、ということです。その後、`setDate`でそのオブジェクトの内部を変更すると、両方の変数が更新されます。どちらも同じものを参照しているからです。

この例ではaliasingは問題ですが、別の文脈では、まさに期待どおりの振る舞いでもあります。

```java
Person me = new Person("Martin");
me.setPhoneNumber("1234");
Person articleAuthor = me;
me.setPhoneNumber("999");
assertEquals("999", articleAuthor.getPhoneNumber());
```

このようにrecordを共有したいことはよくあります。そしてそれが変われば、すべての参照から見える値も変わります。だからこそ、意図的に共有するReference Objectと、この種の共有更新を望まないValue Objectを分けて考えることが有用です。Value Objectで共有更新を避けるよい方法は、**Value Objectを不変にする**ことです。

Evans ClassificationにはEntityという概念があり、私はそれをReference Objectの一般的な形だと見ています。

もちろん、関数型言語はすべてを不変にすることを好みます。そのため、変更を共有したい場合には、それを規則ではなく例外として扱う必要があります。不変性は便利な性質であり、いくつもの種類のバグを作りにくくしてくれます。しかし、物事が本当に変化する必要があるときには、不変性は複雑さを持ち込むことがあります。つまり、決してただで手に入る昼食ではありません。
