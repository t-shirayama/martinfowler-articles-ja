# Domain-Oriented Observability

## 要約

Domain-Oriented Observability は、ログ、メトリクス、分析イベントといった観測可能性を、技術的な呼び出しの寄せ集めではなく、ドメイン上の出来事として扱う考え方です。
この記事では、その実装パターンとして Domain Probe を紹介し、ビジネスロジックを計測基盤の細部から切り離しながら、観測可能性をテストしやすくする方法を説明します。

重要なのは、観測可能性を後付けの技術的配管として扱うのではなく、ドメインコードが語る言葉に合わせて抽象化することです。
これにより、ログや分析イベントの価値を保ちながら、コードの読みやすさ、保守性、テスト容易性を損なわずに済みます。

## 読むときの観点

- 技術的な計測呼び出しと、ドメイン上の観測事項を分けて読む。
- Domain Probe が「何を観測したいか」と「どう記録するか」を切り離す点を見る。
- 観測可能性のテストが、実装詳細ではなくドメイン上の意図を検証できるようになる点に注目する。
- 実行コンテキストやメタデータを、ドメインコードへ漏らさず渡す設計上のトレードオフを考える。

## 原文の翻訳

現代のソフトウェアシステムは、microservices や cloud といった流れによって、より分散し、信頼性の低いインフラの上で動くようになっています。システムに observability を組み込むことは以前から必要でしたが、こうした傾向によって、これまで以上に重要になっています。

同時に DevOps の動きにより、本番環境を監視する人たちは、観測可能性を外側から後付けするだけでなく、稼働中のシステムにカスタムの instrumentation code を実際に追加できる立場にいることが増えています。

では、私たちが最も大事にしている business logic に対して、instrumentation の詳細でコードベースを詰まらせずに observability を加えるにはどうすればよいのでしょうか。また、その instrumentation が重要なら、正しく実装できていることをどうテストすればよいのでしょうか。この記事では、Domain-Oriented Observability という考え方と、Domain Probe という実装パターンを組み合わせることで、**ビジネスに焦点を当てた observability をコードベース内の第一級の概念として扱える**ことを示します。

### 何を観測するか

「Observability」は、低レベルの技術的メトリクスから、高レベルのビジネス KPI まで、広い範囲を持つ言葉です。技術寄りの端では、メモリや CPU 使用率、ネットワークやディスク I/O、スレッド数、garbage collection の停止時間などを追跡できます。反対側の端では、ビジネスやドメインのメトリクスとして、カート離脱率、セッション時間、支払い失敗率などを追跡するかもしれません。

こうした高レベルのメトリクスはシステムごとに固有であるため、たいていは手作りの instrumentation logic を必要とします。これは低レベルの技術的 instrumentation とは対照的です。低レベルのものはより汎用的で、起動時に監視エージェントを差し込む程度で、システムのコードベースを大きく変更せずに実現できることがよくあります。

また、高レベルでプロダクト寄りのメトリクスのほうが価値を持つことにも注意が必要です。定義上、それらはシステムが意図したビジネス目標に向かって機能しているかを、より直接的に反映するからです。

こうした価値あるメトリクスを追跡する instrumentation を追加することで、私たちは Domain-Oriented Observability を実現します。

### Observability の問題

Domain-Oriented Observability は価値がありますが、通常は手作りの instrumentation logic を必要とします。そのカスタム instrumentation は、システムの中核となる domain logic のすぐ横に置かれます。そこでは、明確で保守しやすいコードが極めて重要です。残念ながら、instrumentation code はノイズになりがちで、注意しなければ邪魔な混乱を生みます。

instrumentation code を導入するとどのような混乱が生じるのか、例を見てみましょう。架空の e-commerce システムにある、少し素朴な割引コード処理です。observability を加える前は次のようになっています。

```javascript
class ShoppingCart {
  applyDiscountCode(discountCode) {
    let discount;
    try {
      discount = this.discountService.lookupDiscount(discountCode);
    } catch (error) {
      return 0;
    }

    const amountDiscounted = discount.applyToCart(this);
    return amountDiscounted;
  }
}
```

ここには、はっきり表現された domain logic があります。割引コードに基づいて割引を引き、カートにその割引を適用します。最後に、割り引かれた金額を返します。割引を見つけられなければ、何もせず早めに抜けます。

カートへ割引を適用することは重要な機能なので、ここでは十分な observability が重要です。instrumentation を加えてみましょう。

```javascript
class ShoppingCart {
  applyDiscountCode(discountCode) {
    this.logger.log(`attempting to apply discount code: ${discountCode}`);
    let discount;
    try {
      discount = this.discountService.lookupDiscount(discountCode);
    } catch (error) {
      this.logger.error('discount lookup failed', error);
      this.metrics.increment('discount-lookup-failure', { code: discountCode });
      return 0;
    }

    this.metrics.increment('discount-lookup-success', { code: discountCode });

    const amountDiscounted = discount.applyToCart(this);
    this.logger.log(`Discount applied, of amount: ${amountDiscounted}`);
    this.analytics.track('Discount Code Applied', {
      code: discount.code,
      discount: discount.amount,
      amountDiscounted: amountDiscounted
    });

    return amountDiscounted;
  }
}
```

割引を検索して適用する実際のビジネスロジックに加え、ここではさまざまな instrumentation system を呼び出すようになりました。開発者向けの診断ログを書き、本番システムを運用する人たちのためにメトリクスを記録し、プロダクトやマーケティングの人たちが使う analytics platform にイベントを発行しています。

残念ながら、observability を加えたことで、きれいだった domain logic は散らかってしまいました。`applyDiscountCode` メソッドの中で、その本来の目的である割引の検索と適用に関わるコードは、いまや4分の1程度しかありません。最初にあった明快な business logic は変わっておらず、簡潔なままですが、メソッドの大半を占める低レベルの instrumentation code の中に埋もれてしまいました。

さらに悪いことに、domain logic の真ん中にコード重複と magic string を持ち込んでしまっています。

要するに、instrumentation code は、このメソッドが実際に何をしているのかを読もうとする人にとって、大きな邪魔になっています。

### 混乱を片づける

実装をリファクタリングして、この混乱を片づけられるか見てみましょう。まず、低レベルの instrumentation logic を別メソッドへ抽出します。

```javascript
class ShoppingCart {
  applyDiscountCode(discountCode) {
    this._instrumentApplyingDiscountCode(discountCode);
    let discount;
    try {
      discount = this.discountService.lookupDiscount(discountCode);
    } catch (error) {
      this._instrumentDiscountCodeLookupFailed(discountCode, error);
      return 0;
    }

    this._instrumentDiscountCodeLookupSucceeded(discountCode);

    const amountDiscounted = discount.applyToCart(this);
    this._instrumentDiscountApplied(discount, amountDiscounted);
    return amountDiscounted;
  }

  _instrumentApplyingDiscountCode(discountCode) {
    this.logger.log(`attempting to apply discount code: ${discountCode}`);
  }

  _instrumentDiscountCodeLookupFailed(discountCode, error) {
    this.logger.error('discount lookup failed', error);
    this.metrics.increment('discount-lookup-failure', { code: discountCode });
  }

  _instrumentDiscountCodeLookupSucceeded(discountCode) {
    this.metrics.increment('discount-lookup-success', { code: discountCode });
  }

  _instrumentDiscountApplied(discount, amountDiscounted) {
    this.logger.log(`Discount applied, of amount: ${amountDiscounted}`);
    this.analytics.track('Discount Code Applied', {
      code: discount.code,
      discount: discount.amount,
      amountDiscounted: amountDiscounted
    });
  }
}
```

これはよい出発点です。instrumentation の詳細を焦点の定まったメソッドへ抽出したので、business logic 側には instrumentation point ごとの単純なメソッド呼び出しだけが残りました。各 instrumentation system の邪魔な詳細が `_instrument...` メソッドへ押し下げられたため、`applyDiscountCode` は読みやすく理解しやすくなっています。

しかし、`ShoppingCart` が instrumentation だけに集中した private method をいくつも持つようになったのは、どうも適切ではありません。それは本来 `ShoppingCart` の責務ではありません。あるクラスの主たる責務と関係のない機能のまとまりがクラス内にある場合、そこには新しいクラスが生まれようとしていることがよくあります。

その手がかりに従い、instrumentation メソッドをまとめて、独立した `DiscountInstrumentation` クラスへ移しましょう。

```javascript
class ShoppingCart {
  applyDiscountCode(discountCode) {
    this.instrumentation.applyingDiscountCode(discountCode);

    let discount;
    try {
      discount = this.discountService.lookupDiscount(discountCode);
    } catch (error) {
      this.instrumentation.discountCodeLookupFailed(discountCode, error);
      return 0;
    }

    this.instrumentation.discountCodeLookupSucceeded(discountCode);
    const amountDiscounted = discount.applyToCart(this);
    this.instrumentation.discountApplied(discount, amountDiscounted);
    return amountDiscounted;
  }
}
```

メソッドの中身は変えません。適切なコンストラクタを持つ専用クラスへ移すだけです。

```javascript
class DiscountInstrumentation {
  constructor({ logger, metrics, analytics }) {
    this.logger = logger;
    this.metrics = metrics;
    this.analytics = analytics;
  }

  applyingDiscountCode(discountCode) {
    this.logger.log(`attempting to apply discount code: ${discountCode}`);
  }

  discountCodeLookupFailed(discountCode, error) {
    this.logger.error('discount lookup failed', error);
    this.metrics.increment('discount-lookup-failure', { code: discountCode });
  }

  discountCodeLookupSucceeded(discountCode) {
    this.metrics.increment('discount-lookup-success', { code: discountCode });
  }

  discountApplied(discount, amountDiscounted) {
    this.logger.log(`Discount applied, of amount: ${amountDiscounted}`);
    this.analytics.track('Discount Code Applied', {
      code: discount.code,
      discount: discount.amount,
      amountDiscounted: amountDiscounted
    });
  }
}
```

これで責務はきれいに分かれました。`ShoppingCart` は割引の適用といったドメイン概念に完全に集中し、新しい `DiscountInstrumentation` クラスは、割引適用プロセスを instrumentation する詳細をすべてカプセル化しています。

### Domain Probe

`DiscountInstrumentation` は、私が Domain Probe と呼ぶパターンの例です。Domain Probe は、ドメインの意味に沿った高レベルの instrumentation API を提示し、Domain-Oriented Observability を実現するために必要な低レベルの instrumentation plumbing をカプセル化します。これにより、**domain logic に observability を加えながら、ドメインの言葉で話し続ける**ことができ、instrumentation 技術の細部に気を取られずに済みます。

前の例では、`ShoppingCart` はログエントリを書いたり analytics event を追跡したりする技術領域を直接扱わず、割引コードが適用される、割引コードの検索に失敗する、といった Domain Observation を `DiscountInstrumentation` probe に報告することで observability を実装していました。これは微妙な違いに見えるかもしれませんが、domain code を domain に集中させておくことは、コードベースの読みやすさ、保守性、拡張性を保つうえで大きな利益を生みます。

### Observability をテストする

instrumentation logic に十分なテストカバレッジがある例は、めったに見かけません。操作が失敗したときにエラーがログ出力されることや、conversion が発生したときに正しいフィールドを含む analytics event が発行されることを検証する自動テストは、あまり見ません。これは observability が歴史的にそれほど価値あるものと見なされてこなかったせいもあるでしょうが、低レベルの instrumentation code に対してよいテストを書くのが面倒だからでもあります。

### Instrumentation code のテストはつらい

説明のために、架空の e-commerce システムの別の部分にある instrumentation を見て、その instrumentation code の正しさを検証するテストをどう書くか考えてみましょう。

`ShoppingCart` には `addToCart` メソッドがあります。これは Domain Probe を使わず、さまざまな observability system へ直接呼び出す形で instrumentation されています。

```javascript
class ShoppingCart {
  addToCart(productId) {
    this.logger.log(`adding product '${productId}' to cart '${this.id}'`);

    const product = this.productService.lookupProduct(productId);

    this.products.push(product);
    this.recalculateTotals();
    this.analytics.track('Product Added To Cart', { sku: product.sku });
    this.metrics.gauge('shopping-cart-total', this.totalPrice);
    this.metrics.gauge('shopping-cart-size', this.products.length);
  }
}
```

この instrumentation logic をテストし始めると、次のようになります。

```javascript
const sinon = require('sinon');

describe('addToCart', () => {
  it('logs that a product is being added to the cart', () => {
    const spyLogger = {
      log: sinon.spy()
    };
    const shoppingCart = testableShoppingCart({
      logger: spyLogger
    });

    shoppingCart.addToCart('the-product-id');

    expect(spyLogger.log)
      .calledWith(`adding product 'the-product-id' to cart '${shoppingCart.id}'`);
  });
});
```

このテストでは、spy logger を接続したテスト用の shopping cart を用意しています。spy は、テスト対象がほかのオブジェクトとどうやり取りするかを検証するために使う test double の一種です。`testableShoppingCart` は、デフォルトでは偽の依存先を組み込んだ `ShoppingCart` のインスタンスを作る小さな helper function です。spy を置いたうえで `shoppingCart.addToCart(...)` を呼び出し、shopping cart が適切なメッセージをログ出力するために logger を使ったことを確認します。

このテストは、商品がカートへ追加されたときにログを出していることについて、ある程度の保証を与えます。しかし、ログの詳細にかなり強く結合しています。将来ログメッセージの形式を変えたら、よい理由もなくこのテストは壊れるでしょう。このテストが気にするべきなのは、何が正確にログ出力されたかではなく、正しい文脈データを使って何かがログ出力されたことです。

ログメッセージ形式の詳細への結合を弱めるために、完全一致ではなく正規表現で照合することもできます。しかし、それでは検証が少し不透明になります。さらに、堅牢な正規表現を作る努力は、たいてい時間の投資として見合いません。

しかも、これはログ出力のテストの単純な例にすぎません。例外のログ出力のようなより複雑なシナリオは、さらに面倒です。logging framework などの API は、mock したときに検証しやすい形にはなっていません。

次に、analytics integration を検証する別のテストを見てみましょう。

```javascript
const sinon = require('sinon');

describe('addToCart', () => {
  it('publishes analytics event', () => {
    const theProduct = genericProduct();
    const stubProductService = productServiceWhichAlwaysReturns(theProduct);

    const spyAnalytics = {
      track: sinon.spy()
    };

    const shoppingCart = testableShoppingCart({
      productService: stubProductService,
      analytics: spyAnalytics
    });

    shoppingCart.addToCart('some-product-id');
    expect(spyAnalytics.track).calledWith(
      'Product Added To Cart',
      { sku: theProduct.sku }
    );
  });
});
```

このテストは少し込み入っています。`productService.lookupProduct(...)` から shopping cart に返される product を制御する必要があるからです。そのため、特定の product を常に返すよう仕込んだ stub product service を注入します。前のテストで spy `logger` を注入したのと同じように、ここでは spy `analytics` も注入します。

準備ができたら `shoppingCart.addToCart(...)` を呼び、最後に analytics instrumentation が期待したパラメータでイベント作成を求められたことを検証します。

このテストにはおおむね満足できます。product を indirect input として cart に渡す準備は少し面倒ですが、analytics event にその product の SKU が含まれることへの信頼を得るためのトレードオフとしては受け入れられます。

ただし、このテストが event の正確な形式に結合しているのは少し残念です。上の logging test と同じく、このテストは observability がどう実現されているかの詳細ではなく、正しいデータを使って実現されていることだけを気にしてほしいところです。

そのテストを書き終えると、さらに別の instrumentation logic、つまり `shopping-cart-total` と `shopping-cart-size` の metric gauge もテストしたくなった場合、これとよく似たテストを2つか3つ追加しなければならないことに気が重くなります。各テストは、そのテストの焦点ではないにもかかわらず、同じ面倒な依存先設定を繰り返す必要があります。

この作業に直面した開発者の中には、歯を食いしばって既存のテストをコピー&ペーストし、必要なところだけ変えて先へ進む人もいるでしょう。実際には、多くの開発者が最初のテストで十分だと判断し、instrumentation logic に後からバグが入り込むリスクを受け入れてしまいます。壊れた instrumentation はすぐには気づかれないことも多いので、そのバグはしばらく見逃されるかもしれません。

### Domain Probe は、より明確で焦点の合ったテストを可能にする

Domain Probe パターンを使うとテストの状況がどう改善するか見てみましょう。Domain Probe を使うようリファクタリングした `ShoppingCart` は次のようになります。

```javascript
class ShoppingCart {
  addToCart(productId) {
    this.instrumentation.addingProductToCart({
      productId: productId,
      cart: this
    });

    const product = this.productService.lookupProduct(productId);

    this.products.push(product);
    this.recalculateTotals();
    this.instrumentation.addedProductToCart({
      product: product,
      cart: this
    });
  }
}
```

`addToCart` の instrumentation に対するテストは次のようになります。

```javascript
const sinon = require('sinon');

describe('addToCart', () => {
  it('instruments adding a product to the cart', () => {
    const spyInstrumentation = createSpyInstrumentation();
    const shoppingCart = testableShoppingCart({
      instrumentation: spyInstrumentation
    });

    shoppingCart.addToCart('the-product-id');

    expect(spyInstrumentation.addingProductToCart).calledWith({
      productId: 'the-product-id',
      cart: shoppingCart
    });
  });

  it('instruments a product being successfully added to the cart', () => {
    const theProduct = genericProduct();
    const stubProductService = productServiceWhichAlwaysReturns(theProduct);

    const spyInstrumentation = createSpyInstrumentation();

    const shoppingCart = testableShoppingCart({
      productService: stubProductService,
      instrumentation: spyInstrumentation
    });

    shoppingCart.addToCart('some-product-id');
    expect(spyInstrumentation.addedProductToCart).calledWith({
      product: theProduct,
      cart: shoppingCart
    });
  });

  function createSpyInstrumentation() {
    return {
      addingProductToCart: sinon.spy(),
      addedProductToCart: sinon.spy()
    };
  }
});
```

Domain Probe を導入したことで、抽象度が少し上がり、コードとテストはいくらか読みやすく、壊れにくくなりました。私たちは依然として instrumentation が正しく実装されていることをテストしています。実際、テストは observability の要求を完全に検証しています。しかし、テストの期待値は instrumentation の実装詳細を含む必要がなくなり、適切な文脈が渡されることだけを含めればよくなりました。

このテストは、observability を追加するうえでの essential complexity を捉えつつ、accidental complexity を過度に持ち込まずに済んでいます。

とはいえ、低レベルで泥臭い instrumentation の詳細が正しく実装されているかも検証しておくのが賢明です。instrumentation に正しい情報を含め忘れることは高くつく間違いになり得ます。`ShoppingCartInstrumentation` Domain Probe はこうした詳細の実装に責任を持つので、そのクラスのテストこそが、詳細が正しいことを検証する自然な場所です。

```javascript
const sinon = require('sinon');

describe('ShoppingCartInstrumentation', () => {
  describe('addingProductToCart', () => {
    it('logs the correct message', () => {
      const spyLogger = {
        log: sinon.spy()
      };
      const instrumentation = testableInstrumentation({
        logger: spyLogger
      });
      const fakeCart = {
        id: 'the-cart-id'
      };
      instrumentation.addingProductToCart({
        cart: fakeCart,
        productId: 'the-product-id'
      });

      expect(spyLogger.log)
        .calledWith("adding product 'the-product-id' to cart 'the-cart-id'");
    });
  });

  describe('addedProductToCart', () => {
    it('publishes the correct analytics event', () => {
      const spyAnalytics = {
        track: sinon.spy()
      };
      const instrumentation = testableInstrumentation({
        analytics: spyAnalytics
      });

      const fakeCart = {};
      const fakeProduct = {
        sku: 'the-product-sku'
      };
      instrumentation.addedProductToCart({
        cart: fakeCart,
        product: fakeProduct
      });

      expect(spyAnalytics.track).calledWith(
        'Product Added To Cart',
        { sku: 'the-product-sku' }
      );
    });

    it('updates shopping-cart-total gauge', () => {
      // ...etc
    });

    it('updates shopping-cart-size gauge', () => {
      // ...etc
    });
  });
});
```

ここでもテストは少し焦点を絞りやすくなります。以前の `ShoppingCart` テストのように、mock した `productService` 経由で間接的に注入する手間をかけず、`product` を直接渡せます。

`ShoppingCartInstrumentation` のテストは、そのクラスがサードパーティの instrumentation library をどう使うかに焦点を当てているため、`before` block で依存先の spy をあらかじめ配線しておくことで、テストを少し簡潔にできます。

```javascript
const sinon = require('sinon');

describe('ShoppingCartInstrumentation', () => {
  let instrumentation, spyLogger, spyAnalytics, spyMetrics;

  before(() => {
    spyLogger = { log: sinon.spy() };
    spyAnalytics = { track: sinon.spy() };
    spyMetrics = { gauge: sinon.spy() };
    instrumentation = new ShoppingCartInstrumentation({
      logger: spyLogger,
      analytics: spyAnalytics,
      metrics: spyMetrics
    });
  });

  describe('addingProductToCart', () => {
    it('logs the correct message', () => {
      const fakeCart = {
        id: 'the-cart-id'
      };

      instrumentation.addingProductToCart({
        cart: fakeCart,
        productId: 'the-product-id'
      });

      expect(spyLogger.log)
        .calledWith("adding product 'the-product-id' to cart 'the-cart-id'");
    });
  });

  describe('addedProductToCart', () => {
    it('publishes the correct analytics event', () => {
      const fakeCart = {};
      const fakeProduct = {
        sku: 'the-product-sku'
      };
      instrumentation.addedProductToCart({
        cart: fakeCart,
        product: fakeProduct
      });

      expect(spyAnalytics.track).calledWith(
        'Product Added To Cart',
        { sku: 'the-product-sku' }
      );
    });

    it('updates shopping-cart-total gauge', () => {
      const fakeCart = {
        totalPrice: 123.45
      };
      const fakeProduct = {};
      instrumentation.addedProductToCart({
        cart: fakeCart,
        product: fakeProduct
      });

      expect(spyMetrics.gauge).calledWith(
        'shopping-cart-total',
        123.45
      );
    });

    it('updates shopping-cart-size gauge', () => {
      // ...etc
    });
  });
});
```

テストはとても明確で、焦点が合ったものになりました。各テストは、高レベルの Domain Observation の一部として、低レベルの technical instrumentation の特定部分が正しく呼び出されることを検証しています。このテストは、Domain Probe の意図、つまり各種 instrumentation system の退屈な技術的詳細に対して domain-specific な抽象を提示するという意図を捉えています。

### 実行コンテキストを含める

instrumentation event には、常に contextual metadata が必要です。つまり、観測された event の周辺にあるより広い文脈を理解するための情報です。

### Metadata の種類

Web service でよく見られる metadata のひとつは request identifier です。これは distributed tracing、つまりひとつの論理操作を構成する分散呼び出しを結びつけるために使われます。この種の識別子は correlation identifier、あるいは trace identifier や span identifier と呼ばれることもあります。

request-specific な metadata としてもうひとつ一般的なのは user identifier です。どのユーザーが request を行っているのか、場合によっては「principal」、つまり外部システムが誰の代理として request を行っているのかを記録します。feature flag metadata を記録するシステムもあります。この request がどの実験用「bucket」に入れられているか、あるいはすべての flag の生の状態を記録する情報です。

こうした metadata は、web analytics を使ってユーザー行動と機能変更を相関させるときに重要です。

event がシステムの変更とどう相関しているかを理解するうえで役立つ、より技術的な metadata もあります。software version、process や thread identifier、server hostname などです。

instrumentation event を相関させるうえであまりに明らかで、言及するまでもないほど重要な metadata もあります。event が発生した時刻を示す timestamp です。

### Metadata を注入する

こうした contextual metadata を Domain Probe に渡すのは、少し面倒です。Domain Observation の呼び出しは通常 domain code から行われますが、domain code は request ID や feature flag configuration のような技術的詳細を直接知らないほうが望ましいはずです。こうした技術的詳細は domain code の関心事ではありません。では、domain code をその詳細で汚染せずに、Domain Probe が必要とする技術的詳細を確実に持たせるにはどうすればよいのでしょうか。

ここにあるのは典型的な Dependency Injection の状況です。Domain Probe の transitive dependency を domain class へ引きずり込むことなく、正しく構成された Domain Probe dependency を domain class に注入する必要があります。利用可能な dependency injection pattern のメニューから、好みの解法を選べます。

先ほどの shopping cart の割引コード例を取り上げ、いくつかの代替案を見てみましょう。思い出すために、instrumentation 済み `ShoppingCart` の `applyDiscountCode` 実装は次のところまで来ていました。

```javascript
class ShoppingCart {
  applyDiscountCode(discountCode) {
    this.instrumentation.applyingDiscountCode(discountCode);
    let discount;
    try {
      discount = this.discountService.lookupDiscount(discountCode);
    } catch (error) {
      this.instrumentation.discountCodeLookupFailed(discountCode, error);
      return 0;
    }

    this.instrumentation.discountCodeLookupSucceeded(discountCode);

    const amountDiscounted = discount.applyToCart(this);
    this.instrumentation.discountApplied(discount, amountDiscounted);
    return amountDiscounted;
  }
}
```

ここでの問いは、`this.instrumentation`、つまり私たちの Domain Probe が `ShoppingCart` クラス内でどう設定されるのかです。単純にコンストラクタへ渡すこともできます。

```javascript
class ShoppingCart {
  constructor({ instrumentation, discountService }) {
    this.instrumentation = instrumentation;
    this.discountService = discountService;
  }
}
```

あるいは、Domain Probe が追加の contextual metadata をどう取得するかをより細かく制御したいなら、何らかの instrumentation factory を渡すこともできます。

```javascript
constructor({ createInstrumentation, discountService }) {
  this.createInstrumentation = createInstrumentation;
  this.discountService = discountService;
}
```

この factory function を使って、必要になったときに Domain Probe のインスタンスを作れます。

```javascript
applyDiscountCode(discountCode) {
  const instrumentation = this.createInstrumentation();

  instrumentation.applyDiscountCode(discountCode);
  let discount;
  try {
    discount = this.discountService.lookupDiscount(discountCode);
  } catch (error) {
    instrumentation.discountCodeLookupFailed(discountCode, error);
    return 0;
  }

  instrumentation.discountCodeLookupSucceeded(discountCode);

  const amountDiscounted = discount.applyToCart(this);
  instrumentation.discountApplied(discount, amountDiscounted);
  return amountDiscounted;
}
```

一見すると、このような factory function の導入は不要な間接化を増やしているように見えます。しかし、Domain Probe をどう作成し、contextual information をどう設定するかについて、より柔軟性を得られます。たとえば、discount code を instrumentation に含める方法を見てみましょう。既存の実装では、各 instrumentation call に `discountCode` を parameter として渡しています。しかし、`applyDiscountCode` の1回の呼び出しの中では、その `discountCode` は一定です。

そこで、Domain Probe を作るときに1回だけ渡してはどうでしょうか。

```javascript
applyDiscountCode(discountCode) {
  const instrumentation = this.createInstrumentation({ discountCode });

  instrumentation.applyDiscountCode(discountCode);

  let discount;
  try {
    discount = this.discountService.lookupDiscount(discountCode);
  } catch (error) {
    instrumentation.discountCodeLookupFailed(discountCode, error);
    return 0;
  }

  instrumentation.discountCodeLookupSucceeded(discountCode);
  const amountDiscounted = discount.applyToCart(this);
  instrumentation.discountApplied(discount, amountDiscounted);
  return amountDiscounted;
}
```

こちらのほうがよくなりました。context を Domain Probe へ一度渡せるので、同じ情報を何度も渡さずに済みます。

### Instrumentation context を集める

少し引いて見ると、ここで私たちがしているのは、より対象を絞った Domain Probe、つまりこの特定の文脈で Domain Observation を記録するよう設定された Domain Probe を作っているのだと言えます。

この考えをさらに進めれば、Domain Probe が instrumentation record に含める必要のある request identifier のような技術的 context へアクセスできるようにしつつ、その技術的詳細を `ShoppingCart` domain class にまったく見せずに済ませられます。新しい Observation Context クラスを作る方法のスケッチを示します。

```javascript
class ObservationContext {
  constructor({ requestContext, standardParams }) {
    this.requestContext = requestContext;
    this.standardParams = standardParams;
  }

  createShoppingCartInstrumentation(extraParams) {
    const paramsFromContext = {
      requestId: this.requestContext.requestId
    };

    const mergedParams = {
      ...this.standardParams,
      ...paramsFromContext,
      ...extraParams
    };
    return new ShoppingCartInstrumentation(mergedParams);
  }
}
```

`ObservationContext` は、Domain Observation を記録するために `ShoppingCartInstrumentation` が必要とする context の断片を集める場所として働きます。固定的な標準 parameter は `ObservationContext` の constructor で指定されます。request identifier のような、より動的な parameter は、`createShoppingCartInstrumentation` method の中で Domain Probe が要求された時点に `ObservationContext` が埋めます。

同じ時点で、呼び出し側は `extraParams` parameter を通じて `createShoppingCartInstrumentation` に追加 context を渡すこともできます。この3種類の contextual parameter がひとつに merge され、`ShoppingCartInstrumentation` のインスタンスを作るために使われます。

関数型プログラミングの用語で言えば、ここで行っているのは本質的に、部分適用された Domain Observation を作ることです。Domain Observation を構成する field は、`ObservationContext` を構築するときに一部適用され、`ObservationContext` に `ShoppingCartInstrumentation` のインスタンスを求めるときにさらにいくつか適用されます。

最後に残りの field は、実際に Domain Observation を記録するために `ShoppingCartInstrumentation` の method を呼ぶときに適用されます。関数型スタイルで作業しているなら、文字どおり partial application を使って Domain Probe を実装するかもしれません。しかしこの文脈では、Factory pattern のようなオブジェクト指向の同等物を使っています。

この partial application approach の大きな利点は、Domain Observation を記録する domain object が、その event に入るすべての field を知る必要がないことです。前の例では、request identifier が instrumentation に含まれることを保証しつつ、`ShoppingCart` domain class をその退屈な技術的 metadata から幸せに無知なままにしておけます。

また、instrumentation system のすべての client が標準 field を一貫して含めることに頼るのではなく、中央集権的で一貫した方法でそれらを適用できます。

### Domain Probe の粒度

Domain Probe を設計するとき、それぞれの object をどれくらい細かくするかを選ぶ必要があります。先ほどの割引コードの例のように、多くの contextual information が事前適用された、高度に特化した object をたくさん作ることもできます。あるいは、Domain Observation を記録するたびに利用者がより多くの context を渡す、少数の汎用 object を作ることもできます。

ここでのトレードオフは、事前適用される context が少ない、特化度の低い Domain Probe を使う場合に observability call site がより冗長になることと、context が事前適用された特化 object をたくさん作る場合により多くの「observability plumbing」を渡し回すこととの間にあります。

ここには明確な正解や誤りはありません。どのチームも、自分たちの codebase の中で独自のスタイル上の好みを表現します。より関数型に寄ったチームなら、部分適用された Domain Probe の層へ寄るかもしれません。より「enterprise Java」的なスタイルを持つチームなら、instrumentation context の大半を method parameter として渡す、少数の大きな汎用 Domain Probe を好むかもしれません。

ただし、どちらのチームも partial application の考え方を使い、request identifier のような metadata を、その技術的詳細に関心を持たない Domain Probe client から隠すべきです。

### 代替実装

この記事で述べてきた Domain Probe パターンは、codebase に Domain-Oriented Observability を追加する方法のひとつにすぎません。ここでは、いくつかの代替アプローチに簡単に触れます。

### Event-based observability

これまでの例では、Shopping Cart domain object が Domain Probe を直接呼び出し、その Domain Probe が低レベルの instrumentation system を呼び出していました。

一部のチームは、Domain Observability API により event-oriented な設計を好みます。domain object が直接 method call を行う代わりに、Domain Observation event、ここでは Announcement と呼ぶものを発行し、関心のある observer に進行状況を知らせます。

先ほどの `ShoppingCart` の例なら、次のようになります。

```javascript
class ShoppingCart {
  constructor({ observationAnnouncer, discountService }) {
    this.observationAnnouncer = observationAnnouncer;
    this.discountService = discountService;
  }

  applyDiscountCode(discountCode) {
    this.observationAnnouncer.announce(
      new ApplyingDiscountCode(discountCode)
    );
    let discount;
    try {
      discount = this.discountService.lookupDiscount(discountCode);
    } catch (error) {
      this.observationAnnouncer.announce(
        new DiscountCodeLookupFailed(discountCode, error)
      );
      return 0;
    }

    this.observationAnnouncer.announce(
      new DiscountCodeLookupSucceeded(discountCode)
    );

    const amountDiscounted = discount.applyToCart(this);

    this.observationAnnouncer.announce(
      new DiscountApplied(discountCode)
    );

    return amountDiscounted;
  }
}
```

instrumentation したい domain observation ごとに、対応する Announcement class を持ちます。関連する domain event が起こると、domain logic は discount code や割引額といった関連する contextual information を持つ Announcement を作り、`observationAnnouncer` service を通じて publish します。そして、特定の announcement に反応して instrumentation system を呼び出す Monitor を作ることで、これらの announcement を適切な instrumentation system に接続できます。

logging system に記録したい announcement を扱うために特化した Monitor class は、次のようになります。

```javascript
class LoggingMonitor {
  constructor({ logger }) {
    this.logger = logger;
  }

  handleAnnouncement(announcement) {
    switch (announcement.constructor) {
      case ApplyingDiscountCode:
        this.logger.log(
          `attempting to apply discount code: ${announcement.discountCode}`
        );
        return;
      case DiscountCodeLookupFailed:
        this.logger.error(
          'discount lookup failed',
          announcement.error
        );
        return;
      case DiscountApplied:
        this.logger.log(
          `Discount applied, of amount: ${announcement.amountDiscounted}`
        );
        return;
    }
  }
}
```

次は、metrics system で数を数える domain observation の announcement に特化した Monitor です。

```javascript
class MetricsMonitor {
  constructor({ metrics }) {
    this.metrics = metrics;
  }

  handleAnnouncement(announcement) {
    switch (announcement.constructor) {
      case DiscountCodeLookupFailed:
        this.metrics.increment(
          'discount-lookup-failure',
          { code: announcement.discountCode }
        );
        return;
      case DiscountCodeLookupSucceeded:
        this.metrics.increment(
          'discount-lookup-success',
          { code: announcement.discountCode }
        );
        return;
    }
  }
}
```

これらの Monitor class はそれぞれ、中央の `EventAnnouncer` に登録されます。これは `ShoppingCart` domain object が announcement を送っているのと同じ event announcer です。これらの Monitor class は、先ほど Domain Probe が行っていたのと同じ仕事をしています。ただし、その実装の置き場所を組み替えただけです。

この event-oriented approach はより decoupled なので、instrumentation の詳細を、instrumentation system ごとに特化した Monitor class へ分割することも可能になりました。複数の instrumentation 技術の厄介な実装詳細を単一の Domain Probe class が引き受ける必要がなくなります。

### Aspect-Oriented Programming

ここまで説明した Domain-Oriented Observability を適用する技法は、低レベルの instrumentation call を domain code から取り除けます。しかし domain logic の中には、依然としてある程度の Domain Observability code が散在します。低レベルの instrumentation library を直接呼び出すよりはきれいで読みやすいものの、それでもそこに存在します。

domain code から observability のノイズを完全に取り除きたいなら、Aspect-Oriented Programming、つまり AOP に頼ることも考えられます。AOP は observability のような横断的関心事を、主要なコードフローから抽出しようとするパラダイムです。AOP framework は、source code に直接表現されていない logic を注入することで、program の振る舞いを変えます。

その振る舞いがどのように注入されるかは、一種の meta-programming によって制御します。source code に metadata を annotation として付け、その横断的 logic をどこに注入し、どう振る舞わせるかを制御するのです。

この記事で扱ってきた observability behavior は、AOP が対象にしようとする横断的関心事そのものです。実際、logging を codebase に追加することは、AOP を紹介するときの典型例と言ってよいほどです。もしあなたの codebase がすでに何らかの aspect-oriented meta-programming を活用しているなら、AOP 技法で Domain-Oriented Observability を実現できるか検討する価値はあります。

しかし、まだ AOP を使っていないなら、ここでは慎重になることを勧めます。抽象的にはとても優雅なアプローチに見えても、細部ではそうならないことがあるからです。

根本的な問題は、AOP が source code の粒度で働く一方、Domain Observability の粒度は code の粒度と正確には一致しないことです。一方では、domain code のすべての method call の前後で observability を行い、すべての parameter と return value を追跡したいわけではありません。

他方では、conditional statement の両側で observability が欲しいことがあります。たとえば、ログインしたユーザーが admin かどうかです。また、観測している domain event が起きる時点では直接手に入らないかもしれない追加の contextual information を observation に含めたいこともあります。

AOP を使って Domain-Oriented Observability を実装するなら、この impedance mismatch を回避するために、難解な annotation で domain code を飾る必要が出てきます。そうなると、annotation code が、domain code から取り除きたかった直接の observability call と同じくらい邪魔になりかねません。

この impedance mismatch 以外にも、meta-programming には一般的な欠点があり、DOO に使う場合にも同じように当てはまります。observability の実装はやや「魔法」のようになり、理解しにくくなることがあります。AOP で支えられた observability のテストも、Domain Probe に移す大きな利点として先に挙げた明確なテスト容易性とは対照的に、ずっと単純ではありません。

### Domain-Oriented Observability をいつ適用するか

これは有用なパターンです。では、どこに適用すべきでしょうか。私の推奨は、domain code、つまり技術的な配管ではなく business logic に焦点を当てたコードベースの領域へ observability を追加するときは、常に何らかの Domain-Oriented Observability 抽象を使うことです。Domain Probe のようなものを使えば、その domain code を instrumentation infrastructure の技術的詳細から decouple でき、observability のテストも現実的になります。

domain code の中に追加される observability は、通常 product-oriented で価値の高いものです。ここでは Domain-Oriented Observability の、より厳密なアプローチへ投資する価値があります。

従いやすい単純な規則は、domain class が instrumentation system への直接参照を持ってはならない、というものです。持つべきなのは、それらの system の技術的詳細を抽象化する Domain-Oriented Observability class だけです。

### 既存コードベースへ後付けする

こうしたパターンを既存の codebase、たとえばこれまで observability が ad hoc にしか実装されてこなかった codebase へどう導入するのか、疑問に思うかもしれません。ここでの私の助言は、test automation を導入するときの助言と同じです。ほかの理由ですでに作業している codebase の領域だけを後付けしてください。すべてを一度に移行する専用作業を割り当てるべきではありません。

このようにすれば、頻繁に変更され、ビジネスにとって価値が高い可能性の高い code の「hot spot」が、より observable で、よりテストしやすくなることを確実にできます。逆に、codebase の「休眠」している領域に力を投じることを避けられます。
