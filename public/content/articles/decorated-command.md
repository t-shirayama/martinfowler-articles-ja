# Decorated Command

## 要約

Decorated Command は、Command に Decorator パターンを適用して、トランザクションやセキュリティのような付加的な振る舞いを動的に組み合わせる方法です。

Command Oriented Interface では、すべてをコマンドの `execute` メソッド中心に構成するため、この方法が扱いやすくなります。ただし、Aspect Oriented Programming 全体をこれだけで説明できるわけではありません。

## 読むときの観点

- ドメイン上のコマンド本体と、横断的な振る舞いを分けて考える。
- Decorator によって、トランザクションやセキュリティを後から組み合わせられる点を見る。
- AOP 的な見方では advice に近いが、対象が `Execute` に限られる制約を意識する。
- より柔軟な AOP ツールとの違いを押さえる。

## 原文の翻訳

これはとても一般的なパターンであり、とても単純なものでもあります。実際には、Command に Decorator パターンを適用しただけです。私はこれが Command Oriented Interface と一緒に多く使われているのを見てきました。Interceptor と呼ばれることもありますし、Aspect Oriented Programming の一形態として語られることもあります。

まず、何らかのコマンドから始めます。たいていは、後から追加機能が必要になるかもしれない基本的な機能です。たとえば `PayInvoice` のような、ドメイン指向のコマンドかもしれません。この種のコマンドには、何らかの `execute` メソッドがあります。

```csharp
// psuedo C#
class PayInvoiceCommand : Command ...
void Execute() {
  // do interesting domain logic
}
```

これをトランザクションの中で実行したいとしましょう。適切なトランザクション用 Decorator でコマンドを装飾できます。

```csharp
// pseudo C#
class TransactionalDecorator : CommandDecorator ...
  void Execute() {
    Transaction t = TransactionManager.beginTransaction();
    try {
      Component.Execute();
      t.commit();
    } catch (Exception) {
      t.rollback();
    }
  }
```

同じ方法でセキュリティチェックもできます。

```csharp
// pseduo C#
class SecurityDecorator : CommandDecorator ...
  void Execute() {
    if (passesSecurityCheck())
      Component.Execute();
  }
```

これらのクラスがあれば、必要な振る舞いを得るために簡単に組み合わせられます。

```csharp
//psuedo C#
  // Transaction Invoice Payment
  Command c = new TransactionalDecorator(new PayInvoiceCommand(invoice));
  c.Execute();
  //Transactional and secure payment
  Command c = new SecurityDecorator(
                  new TransactionalDecorator(
                      new PayInvoiceCommand(invoice)));
  c.Execute();
```

実際、このように振る舞いを動的に追加できることは、Command Oriented Interface の大きな利点のひとつです。

最近は、多くのものが aspect oriented という旗印のもとで、この種のことをしています。いずれもう少し掘り下げて、このパターン以上のものがそこにあるのか見てみたいと思っています。

これは aspect っぽいものですが、Aspect Oriented Programming はこれだけではありません。aspect の用語で言えば、Decorator はドメインコマンドの `Execute` メソッドに advice を提供します。しかしこれを行うには、すべてをコマンド中心に構成する必要があります。advice を適用できるのが `Execute` メソッドだけだからです。AspectJ のような、より柔軟な AOP ツールでは、任意のメソッド、さらにはフィールドアクセスのような別のものにも advice を適用できます。
