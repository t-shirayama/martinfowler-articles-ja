# Seal

## 要約

Sealとは、methodやclassをsubclassがoverrideできないようにすることです。C#では`sealed`、Javaでは`final`を使いますが、言語によってdefaultでsealedかどうかは異なります。

Fowlerは、override可能性を厳しく制限するDirectingAttitudeと、拡張側の柔軟性を重んじるEnablingAttitudeの対立としてこの論点を見ています。自身は多くの場合と同様にenabler寄りだと述べています。

## 読むときの観点

- sealを単なる言語機能ではなく、API設計上の態度として読む。
- defaultでoverride可能かどうかは、言語の設計哲学にも関わる。
- 安全性を優先する姿勢と柔軟性を優先する姿勢の違いを見る。

## 原文の翻訳

methodやclassをsealすると、subclassがそれをoverrideできなくなります。

C#では`sealed`キーワードを使い、Javaでは`final`キーワードを使います。C#やC++のような言語は、methodをdefaultでsealedと見なします。`virtual`キーワードでunsealします。一方、Javaなどの言語では、methodはdefaultでunsealedのままです。

sealがよい考えかどうかについては、かなりの論争があります。DirectingAttitudeを持つ人たちは、どのclassやfeatureをoverride可能にするかについて非常に慎重で、extenderがoverrideしてよいものを、安全だと考える範囲に閉じ込めます。EnablingAttitudeを持つ人たちは、extenderが何をする必要に迫られるかは予測できないので、その柔軟性を奪うべきではないと考えます。extenderは好きなものをoverrideできますが、注意深く行う責任を負います。

多くのことと同じく、私はどちらかといえば**enablerである方に傾いています**。
