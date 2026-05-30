# Dependency Composition

## 要約

この記事は、フレームワーク中心の Dependency Injection に頼りすぎる代わりに、関数を第一に考え、部分適用で依存関係を渡す設計を紹介します。
TypeScript、Node.js、PostgreSQL を使った REST サービスを題材に、コントローラ、ドメインロジック、リポジトリ層をテスト駆動で少しずつ組み立てます。

中心にある考え方は、依存をクラスではなく関数の契約として扱い、モジュール間の型共有を最小限にして、偶発的な結合を避けることです。
構造的型付けを持つ TypeScript では、型をエクスポートしなくても契約を保てるため、モジュールを独立して進化させやすくなります。

## 読むときの観点

- Dependency Injection は目的ではなく、モジュールを疎に保つための手段として読む。
- 部分適用されたファクトリ関数が、依存関係を注入しながら実行用の関数を返す点に注目する。
- 同じ形の型をあえて共有しない判断が、どのように偶発的な結合を避けているかを見る。
- テストが、単なる検証ではなくモジュール境界を設計する道具として使われている点を追う。

## 原文の翻訳

フレームワークにもとづく従来型の Dependency Injection に不満を感じたことから、私は、部分適用を使ってモジュールにコンテキストを注入する合成戦略を採るようになりました。設計プロセスとしての Test-Driven Development と、クラスよりも関数を重視する姿勢を組み合わせると、モジュールを明確で、きれいで、意図しない結合からほぼ自由な状態に保てます。

### Origin Story

数年前、私のチームのメンバーから「Dependency Injection (DI) にはどのパターンを採用すべきでしょうか」と聞かれたことが始まりでした。そのチームのスタックは Node.js 上の TypeScript で、私にとってはあまり馴染みのないものでした。そこで、彼ら自身で考えてみるよう促しました。しかししばらくして、チームは事実上、決めないことに決めていたと知り、私はがっかりしました。モジュール同士をつなぐ方法が乱立していたのです。ある開発者はファクトリメソッドを使い、別の開発者はルートモジュールで手動の Dependency Injection を行い、また別の開発者はクラスコンストラクタにオブジェクトを渡していました。

結果は理想的とは言えませんでした。オブジェクト指向と関数型のパターンがごちゃ混ぜになり、それぞれ異なる組み立て方をされ、テストの方法もばらばらでした。あるモジュールはユニットテストできましたが、別のモジュールにはテストの入口がなく、単純なロジックを動かすにも HTTP を意識した複雑な足場が必要でした。もっとも重大だったのは、コードベースのある部分への変更が、無関係な領域の契約を壊すことがあった点です。名前空間をまたいで相互依存しているモジュールもあれば、サブドメインの区別がない平坦なモジュール群もありました。

後から振り返って、私は最初の判断について考え続けました。どの DI パターンを選ぶべきだったのか。最終的にたどり着いた結論は、**その問い自体が間違っていた**というものでした。

### Dependency injection is a means, not an end

振り返ると、私はチームに別の問いを促すべきでした。私たちのコードベースに望む性質は何か、それを実現するためにどのような手法を使うべきか、という問いです。私は次のことを主張すべきでした。

- 重複する型が多少増えても、偶発的な結合を最小限にした個別のモジュールにする。
- ビジネスロジックを、HTTP ハンドラや GraphQL resolver のような transport を扱うコードと混ぜない。
- ビジネスロジックのテストを transport に依存させず、複雑な足場を必要としないものにする。
- 型に新しいフィールドが追加されても壊れないテストにする。
- モジュールの外へ公開する型を少なくし、ディレクトリの外へ公開する型はさらに少なくする。

#### 補足: 「偶発的な結合」とは何か

開発者が coupling について話すとき、よくあるのは「loose」な coupling の長所を称えるか、「tight」な coupling の害を警告するかのどちらかです。そこでは文脈のニュアンスが抜け落ちがちです。文脈は、ある部品同士の関係が適切なのか、モデル化する価値のあるドメイン上の現実を反映しているのかを教えてくれます。この記事では、ドメインに必要な制約を強制するような大きな利点なしに、コードの脆さを増すモジュール間の関係を「偶発的な結合」と呼びます。

ここ数年、私は、採用した開発者をこうした性質へ導く方法に落ち着いてきました。私は Test-Driven Development (TDD) の背景を持っているので、自然にそこから始めます。TDD は漸進性を促しますが、私はさらに進めたかったため、モジュール合成に対してミニマルな「関数ファースト」のアプローチを採りました。これ以上プロセスを説明し続けるより、実演してみましょう。以下では、比較的単純なアーキテクチャの Web サービスを例にします。コントローラモジュールがドメインロジックを呼び、ドメインロジックが永続化層のリポジトリ関数を呼びます。

### The problem description

次のようなユーザーストーリーを想像してください。

RateMyMeal の登録ユーザーであり、どんな店があるか分からないレストラン利用予定者として、他の利用者の評価にもとづき、自分の地域でおすすめのレストランを順位付きで提示してほしい。

Acceptance Criteria:

- レストラン一覧は、もっともおすすめ度が高いものから低いものへ順位付けされる。
- 評価プロセスでは、次の評価レベルを扱う。
- excellent (2)
- above average (1)
- average (0)
- below average (-1)
- terrible (-2)
- 総合評価は、すべての個別評価の合計とする。
- 「trusted」とみなされるユーザーの評価には 4 倍の係数をかける。
- 返されるレストランの範囲を限定するため、ユーザーは都市を指定しなければならない。

### Building a solution

私は TypeScript、Node.js、PostgreSQL を使って REST サービスを構築することになりました。まず、解きたい問題の境界を定める walking skeleton として、かなり粗い統合テストを作ります。このテストでは、基盤となるインフラをできるだけ多く使います。stub を使うとすれば、ローカルで実行できないサードパーティのクラウドプロバイダや他のサービスに対してだけです。その場合でも server stub を使うので、実際の SDK やネットワーククライアントを使えます。これが手元の作業の acceptance test になり、焦点を保つ助けになります。堅牢に作るには時間がかかるため、ここでは基本機能を動かす happy path を 1 つだけ扱います。エッジケースは、より低コストな方法でテストします。この記事では、必要に応じて変更できる骨格だけのデータベース構造があるものとします。

テストは一般に `given/when/then` の構造を持ちます。すなわち、与えられた条件、参加するアクション、検証される結果です。私は、自分が解こうとしている問題に集中しやすくするため、`when/then` から始めて `given` を逆算するのを好みます。

「推薦エンドポイントを呼び出したとき、評価アルゴリズムにもとづく上位レストランのペイロードと OK レスポンスを期待する」。コードでは次のようになります。

test/e2e.integration.spec.ts…

```typescript
describe("the restaurants endpoint", () => {
  it("ranks by the recommendation heuristic", async () => {
    const response = await axios.get<ResponsePayload>(
      "http://localhost:3000/vancouverbc/restaurants/recommended",
      { timeout: 1000 },
    );
    expect(response.status).toEqual(200);
    const data = response.data;
    const returnRestaurants = data.restaurants.map(r => r.id);
    expect(returnRestaurants).toEqual(["cafegloucesterid", "burgerkingid"]);
  });
});

type ResponsePayload = {
  restaurants: { id: string; name: string }[];
};
```

ここで触れておきたい点がいくつかあります。

- `Axios` は、ここで使う HTTP クライアントライブラリです。Axios の `get` 関数には、レスポンスデータの期待構造を表す型引数 (`ResponsePayload`) を渡しています。コンパイラは `response.data` のすべての使用がその型に合うことを確認します。ただし、この確認はコンパイル時にしか行えないため、HTTP レスポンスボディが実際にその構造を持つことまでは保証できません。それは assertion で確認する必要があります。
- 返されたレストランのオブジェクト全体ではなく、id だけを確認しています。この小さな点は意図的です。オブジェクト全体の内容を確認すると、新しいフィールドを追加しただけでテストが壊れる脆いテストになります。コードの自然な進化を受け入れつつ、私が関心を持つ具体的な条件、つまりレストラン一覧の順序を検証するテストを書きたいのです。

`given` 条件がなければ、このテストにはあまり価値がないので、次にそれを追加します。

test/e2e.integration.spec.ts…

```typescript
describe("the restaurants endpoint", () => {
  let app: Server | undefined;
  let database: Database | undefined;

  const users = [
    { id: "u1", name: "User1", trusted: true },
    { id: "u2", name: "User2", trusted: false },
    { id: "u3", name: "User3", trusted: false },
  ];

  const restaurants = [
    { id: "cafegloucesterid", name: "Cafe Gloucester" },
    { id: "burgerkingid", name: "Burger King" },
  ];

  const ratingsByUser = [
    ["rating1", users[0], restaurants[0], "EXCELLENT"],
    ["rating2", users[1], restaurants[0], "TERRIBLE"],
    ["rating3", users[2], restaurants[0], "AVERAGE"],
    ["rating4", users[2], restaurants[1], "ABOVE_AVERAGE"],
  ];

  beforeEach(async () => {
    database = await DB.start();
    const client = database.getClient();

    await client.connect();
    try {
      // GIVEN
      // These functions don't exist yet, but I'll add them shortly
      for (const user of users) {
        await createUser(user, client);
      }
      for (const restaurant of restaurants) {
        await createRestaurant(restaurant, client);
      }
      for (const rating of ratingsByUser) {
        await createRatingByUserForRestaurant(rating, client);
      }
    } finally {
      await client.end();
    }
  });
});
```

`given` 条件は `beforeEach` 関数で実装しています。`beforeEach` によって、同じセットアップの足場を使うテストを追加しやすくなり、事前条件をテスト本体からきれいに独立させられます。`await` 呼び出しが多いことにも気づくでしょう。Node.js のようなリアクティブなプラットフォームでの経験から、私は本当に単純な関数を除き、非同期の契約を定義するようになりました。データベース呼び出しやファイル読み込みのように IO-bound になり得るものは非同期にすべきですし、同期実装は必要なら Promise で簡単に包めます。反対に、同期契約を選んでから非同期が必要だと分かると、ずっと厄介な問題になります。

私は、ユーザーやレストランの明示的な型を作ることを意図的に先送りしています。まだそれらがどう見えるか分からないからです。TypeScript の構造的型付けがあれば、定義の作成を後回しにしつつ、モジュール API が固まり始めるにつれて型安全性の恩恵を受けられます。後で見るように、これはモジュールを疎結合に保つための重要な手段です。

この時点では、テストの殻はありますが、テストの依存要素はまだありません。次の段階では、まずテストをコンパイルできるよう stub 関数を作り、その後それらの helper 関数を実装して、依存要素を肉付けします。これはかなりの作業ですが、文脈依存が強く、この記事の範囲外です。大まかには次のような作業になります。

- データベースのような依存サービスを起動する。私は通常、docker 化したサービスを testcontainers で動かしますが、ネットワーク fake やインメモリコンポーネントでも構いません。
- テストに必要なエンティティを事前に作る `create...` 関数を埋める。この例では SQL の `INSERT` です。
- サービス自体を起動する。この時点では単純な stub です。サービス初期化は composition の議論に関係するため、後でもう少し掘り下げます。

テスト依存要素の初期化方法に関心があるなら、結果は GitHub リポジトリで見ることができます。

先へ進む前に、テストを実行し、期待どおり失敗することを確認します。まだサービスの `start` を実装していないので、HTTP リクエスト時に connection refused エラーが返ることを期待します。それを確認したら、大きな統合テストはしばらく通らないので無効化し、コミットします。

### On to the controller

私は通常、外側から内側へ構築します。次のステップは、主要な HTTP 処理関数に取りかかることです。まず、コントローラのユニットテストを書きます。期待されるヘッダ付きで空の 200 レスポンスを返すことを確認するところから始めます。

test/restaurantRatings/controller.spec.ts…

```typescript
describe("the ratings controller", () => {
  it("provides a JSON response with ratings", async () => {
    const ratingsHandler: Handler = controller.createTopRatedHandler();
    const request = stubRequest();
    const response = stubResponse();

    await ratingsHandler(request, response, () => {});
    expect(response.statusCode).toEqual(200);
    expect(response.getHeader("content-type")).toEqual("application/json");
    expect(response.getSentBody()).toEqual({});
  });
});
```

私はここで、約束した高度に疎結合なモジュールにつながる小さな設計作業をすでに始めています。コードの大半は典型的なテストの足場ですが、強調されている関数呼び出しをよく見ると、少し変わっていると感じるかもしれません。

この小さな点が、**部分適用**、つまりコンテキスト付きの関数を返す関数への第一歩です。以降の段落で、それが合成アプローチの土台になる様子を示します。

次に、今回の unit under test である controller の stub を作り、テストが想定どおり動いていることを確認します。

src/restaurantRatings/controller.ts…

```typescript
export const createTopRatedHandler = () => {
  return async (request: Request, response: Response) => {};
};
```

テストは 200 を期待しますが、`status` の呼び出しがないため失敗します。stub に小さな修正を加えると通ります。

```typescript
export const createTopRatedHandler = () => {
  return async (request: Request, response: Response) => {
    response.status(200).contentType("application/json").send({});
  };
};
```

コミットし、期待するペイロードのテストを肉付けします。このアプリケーションのデータアクセスやアルゴリズム部分をどのように扱うかは、まだ正確には分かりません。しかし、このモジュールは HTTP プロトコルとドメインの間を翻訳するだけにして、委譲したいことは分かっています。また、その委譲先に何を求めるかも分かっています。具体的には、上位のレストランを、それが何であれどこから来るのであれ、ロードしてほしいのです。そこで、上位レストランを返す関数を持つ `dependencies` stub を作ります。これがファクトリ関数の引数になります。

```typescript
const dependenciesStub = {
  getTopRestaurants: (city: string) => {
    const restaurants = topRestaurants
      .filter(restaurants => restaurants.city == city)
      .flatMap(r => r.restaurants);
    return Promise.resolve(restaurants);
  },
};

const ratingsHandler: Handler =
  controller.createTopRatedHandler(dependenciesStub);
const request = stubRequest().withParams({ city: "vancouverbc" });
const response = stubResponse();

await ratingsHandler(request, response, () => {});
expect(response.statusCode).toEqual(200);
expect(response.getHeader("content-type")).toEqual("application/json");
const sent = response.getSentBody() as RestaurantResponseBody;
expect(sent.restaurants).toEqual([
  vancouverRestaurants[0],
  vancouverRestaurants[1],
]);
```

`getTopRestaurants` 関数がどのように実装されるかについて、情報がほとんどない状態でどう stub するのでしょうか。私は、dependencies stub の中で暗黙に作った契約について、クライアント側から見た基本的な姿を設計するだけの情報は持っています。それは、レストラン集合を非同期に返す、単純で束縛されていない関数です。この契約は、単純な static function、オブジェクトインスタンスのメソッド、あるいは上のテストのような stub によって満たされるかもしれません。このモジュールはそれを知りませんし、気にしませんし、知る必要もありません。仕事に必要な最小限だけを見せられています。

src/restaurantRatings/controller.ts…

```typescript
interface Restaurant {
  id: string;
  name: string;
}

interface Dependencies {
  getTopRestaurants(city: string): Promise<Restaurant[]>;
}

export const createTopRatedHandler = (dependencies: Dependencies) => {
  const { getTopRestaurants } = dependencies;
  return async (request: Request, response: Response) => {
    const city = request.params["city"];
    response.contentType("application/json");
    const restaurants = await getTopRestaurants(city);
    response.status(200).send({ restaurants });
  };
};
```

こうしたものを視覚化したい人のために言えば、ここまでの production code は、`getTopRatedRestaurants` interface を実装する何かを必要とする handler function として表せます。テストは、この関数と、必要な関数の stub を作ります。

この時点の `controller` モジュールはまだ脆いので、代替パスやエッジケースを扱うテストを充実させる必要があります。ただし、それはこの記事の範囲を少し超えます。より丁寧なテストと、その結果の controller module に興味があれば、どちらも GitHub リポジトリで見られます。

#### 補足: mock、stub、framework について

名前が示すように、`stubRequest()` と `stubResponse()` は Express の request 型と response 型の stub 版を作ります。リポジトリを見れば、私が自作の stub を生成していることが分かります。私が TypeScript で fake を生成するときに好んで使う道具は Jest です。多くの framework と同じように、Jest は mock、stub、spy について独自の見方を持っています。この記事では、その見方をテストに押しつけないよう、framework に依存しない形にしました。

### Digging into the domain

この段階では、controller はまだ存在しない関数を必要としています。次のステップは、`getTopRestaurants` 契約を満たせるモジュールを提供することです。そのプロセスは、大きくて不格好なユニットテストを書くところから始め、後で明瞭さのためにリファクタリングします。以前に確立した契約をどう実装するかを考え始めるのは、この時点になってからです。最初の acceptance criteria に戻り、モジュールを最小限に設計しようとします。

test/restaurantRatings/topRated.spec.ts…

```typescript
describe("The top rated restaurant list", () => {
  it("is calculated from our proprietary ratings algorithm", async () => {
    const ratings: RatingsByRestaurant[] = [
      {
        restaurantId: "restaurant1",
        ratings: [{ rating: "EXCELLENT" }],
      },
      {
        restaurantId: "restaurant2",
        ratings: [{ rating: "AVERAGE" }],
      },
    ];

    const findRatingsByRestaurantStub:
      (city: string) => Promise<RatingsByRestaurant[]> = (city: string) => {
        return Promise.resolve(ratings);
      };

    const calculateRatingForRestaurantStub:
      (ratings: RatingsByRestaurant) => number = ratings => {
        if (ratings.restaurantId === "restaurant1") {
          return 10;
        } else if (ratings.restaurantId == "restaurant2") {
          return 5;
        } else {
          throw new Error("Unknown restaurant");
        }
      };

    const dependencies = {
      findRatingsByRestaurant: findRatingsByRestaurantStub,
      calculateRatingForRestaurant: calculateRatingForRestaurantStub,
    };

    const getTopRated = topRated.create(dependencies);
    const topRestaurants = await getTopRated("vancouverbc");
    expect(topRestaurants[0].id).toEqual("restaurant1");
    expect(topRestaurants[1].id).toEqual("restaurant2");
  });
});
```

ここで多くの新しい概念をドメインに持ち込みました。1 つずつ見ていきます。

- レストランごとの評価集合を返す finder が必要です。まずはそれを stub します。
- acceptance criteria は総合評価を導くアルゴリズムを示していますが、ここではいったん無視し、この評価グループが何らかの方法で数値の総合評価を提供すると考えます。
- このモジュールが機能するには、レストランの評価を見つけることと、その評価集合から総合評価を作ることという 2 つの新しい概念に依存します。私は、ナイーブで予測可能な stub 実装を持つ 2 つの関数を含む、もう 1 つの `dependencies` interface を作ります。
- `RatingsByRestaurant` は、特定のレストランに対する評価の集合を表します。`RestaurantRating` はその中の単一の評価です。契約の意図を示すために、これらをテスト内で定義します。将来消えるかもしれませんし、production code に昇格するかもしれません。今は、自分がどこへ向かっているかを思い出すためのよい手がかりです。TypeScript のような構造的型付けの言語では型はとても安いので、このコストは低いものです。
- acceptance criteria によれば、`rating` は excellent (2)、above average (1)、average (0)、below average (-1)、terrible (-2) という 5 つの値で構成されます。これもテストモジュール内で捉え、production code へ引き上げるかどうかを「最後の責任ある瞬間」まで待ちます。

テストの基本構造ができたら、ミニマルな実装でコンパイルさせようとします。

src/restaurantRatings/topRated.ts…

```typescript
interface Dependencies {}

export const create = (dependencies: Dependencies) => {
  return async (city: string): Promise<Restaurant[]> => [];
};

interface Restaurant {
  id: string;
}

export const rating = {
  EXCELLENT: 2,
  ABOVE_AVERAGE: 1,
  AVERAGE: 0,
  BELOW_AVERAGE: -1,
  TERRIBLE: -2,
} as const;

export type Rating = keyof typeof rating;
```

ここでも、依存関係を渡して関数を返す、部分適用された関数ファクトリのパターンを使います。もちろんテストは失敗しますが、期待した形で失敗するのを見ることで、テストが妥当だという自信が増します。

実装対象のモジュールを作り始めるとき、production code に昇格すべきドメインオブジェクトをいくつか見つけます。特に、直接の依存要素は module under test に移します。直接の依存でないものは、テストコードに残します。

また、先回りした動きとして、`Rating` 型を production code に抽出します。これは普遍的で明示的なドメイン概念なので、そうしてもよいと感じました。値は acceptance criteria で明確に呼び出されており、そこから生まれる結合は偶発的である可能性が低いと判断したのです。

production code に定義または移動した型を、モジュールから export していないことに注目してください。これは意図的な選択で、後でもう少し詳しく話します。今のところは、他のモジュールをこれらの型に束縛させてよいか、つまり望ましくない結合を生むかどうかを、まだ決めていないのです。

次に、`getTopRated.ts` モジュールの実装を仕上げます。

```typescript
interface Dependencies {
  findRatingsByRestaurant: (city: string) => Promise<RatingsByRestaurant[]>;
  calculateRatingForRestaurant: (ratings: RatingsByRestaurant) => number;
}

interface OverallRating {
  restaurantId: string;
  rating: number;
}

export const create = (dependencies: Dependencies) => {
  const calculateRatings = (
    ratingsByRestaurant: RatingsByRestaurant[],
    calculateRatingForRestaurant: (ratings: RatingsByRestaurant) => number,
  ): OverallRating[] =>
    ratingsByRestaurant.map(ratings => ({
      restaurantId: ratings.restaurantId,
      rating: calculateRatingForRestaurant(ratings),
    }));

  const getTopRestaurants = async (city: string): Promise<Restaurant[]> => {
    const { findRatingsByRestaurant, calculateRatingForRestaurant } =
      dependencies;
    const ratingsByRestaurant = await findRatingsByRestaurant(city);
    const overallRatings = calculateRatings(
      ratingsByRestaurant,
      calculateRatingForRestaurant,
    );
    return sortByOverallRating(overallRatings).map(r => ({ id: r.restaurantId }));
  };

  const sortByOverallRating = (overallRatings: OverallRating[]) =>
    overallRatings.sort((a, b) => b.rating - a.rating);

  return getTopRestaurants;
};
```

これで次のことを行いました。

- ユニットテストでモデル化した `Dependencies` 型を埋めた。
- ドメイン概念を捉えるために `OverallRating` 型を導入した。restaurant id と number のタプルでも構いませんが、前に述べたように型は安く、追加される明瞭さは小さなコストを十分に正当化します。
- テストから、`topRated` モジュールの直接の依存になった型をいくつか抽出した。
- ファクトリが返す主要関数の単純なロジックを完成させた。

この実装がひとまず完成すると、主要なドメイン関数のテストと controller のテストが通ります。両者は完全に切り離されています。切り離されすぎているので、一緒に動くことを自分で確かめたくなります。ユニットを合成し、より大きな全体へ進むときです。

#### 補足: なぜ「本物の」TypeScript enum を使わないのか

TypeScript enum を使う代わりに、私は `as const` キーワード付きの const object を作り、`topRated.spec.ts` で見たように `keyof typeof` で生成された型を export します。数年前、TypeScript enum の制約に不満を持っていたとき、ある開発者がこのパターンを教えてくれました。Java 出身の私にとって、Java の enum がクラスであり、契約や振る舞いを持てる点はいつもありがたいものでした。TypeScript enum は単なる数値または文字列値であり、振る舞いを追加できません。このやり方なら、関数を含む任意の値を enum 風に定義できます。もちろん罠がないわけではありません。たとえば、型がオブジェクトから派生するのであって、その逆ではないため、enum 風の値を一貫して定義しないと、かなり奇妙な union になることがあります。それでも、enum のような strategy pattern を作れるなら払ってよい代償だと考えています。

### Beginning to wire it up

この時点で、判断が必要になります。比較的単純なものを作っているなら、モジュール統合ではテスト駆動アプローチを省くことを選ぶかもしれません。しかし今回は、2 つの理由から TDD の道を続けます。

- モジュール間の統合設計に集中したい。そのためにテストを書くのはよい道具です。
- 最初の acceptance test を検証に使えるようになるまで、まだいくつものモジュールを実装しなければなりません。そこまで統合を待つと、前提が間違っていた場合に多くのものをほどくことになるかもしれません。

最初の acceptance test が岩で、ユニットテストが小石だとすれば、この最初の integration test は握りこぶし大の石です。controller からドメイン関数の最初の層までの呼び出し経路を動かし、その先には test double を置く、やや大きめのテストです。少なくとも出発点はそうです。進むにつれて、アーキテクチャの後続層も統合していくかもしれません。また、テストの有用性が失われたり邪魔になったりしたら、捨てることもあります。

初期実装後、このテストが検証するのは、route を正しく配線したかどうか程度です。しかしすぐに、ドメイン層への呼び出しや、レスポンスが期待どおり encode されているかも検証するようになります。

test/restaurantRatings/controller.integration.spec.ts…

```typescript
describe("the controller top rated handler", () => {
  it("delegates to the domain top rated logic", async () => {
    const returnedRestaurants = [
      { id: "r1", name: "restaurant1" },
      { id: "r2", name: "restaurant2" },
    ];

    const topRated = () => Promise.resolve(returnedRestaurants);

    const app = express();
    ratingsSubdomain.init(
      app,
      productionFactories.replaceFactoriesForTest({
        topRatedCreate: () => topRated,
      }),
    );

    const response = await request(app).get(
      "/vancouverbc/restaurants/recommended",
    );
    expect(response.status).toEqual(200);
    const payload = response.body as RatedRestaurants;
    expect(payload.restaurants[0].id).toEqual("r1");
    expect(payload.restaurants[1].id).toEqual("r2");
  });
});
```

これらのテストは、Web framework に大きく依存するため、少し見苦しくなることがあります。ここで私が下した 2 つ目の判断があります。Jest や Sinon.js のような framework を使い、module stubbing や spy によって、`topRated` module のような到達しにくい依存要素に hook を差し込むこともできます。API にそれらを公開したいわけではないので、テスト framework の技巧を使うことが正当化される場合もあります。しかしこの場合、より通常の入口を提供することにしました。`init()` 関数で override できる factory function の任意の集合です。これにより、開発プロセスで必要な入口が得られます。進んでいくうちにその hook が不要だと判断したら、取り除けばよいのです。

次に、モジュールを組み立てるコードを書きます。

src/restaurantRatings/index.ts…

```typescript
export const init = (
  express: Express,
  factories: Factories = productionFactories,
) => {
  const topRatedDependencies = {
    findRatingsByRestaurant: () => {
      throw "NYI";
    },
    calculateRatingForRestaurant: () => {
      throw "NYI";
    },
  };
  const getTopRestaurants = factories.topRatedCreate(topRatedDependencies);
  const handler = factories.handlerCreate({ getTopRestaurants });
  express.get("/:city/restaurants/recommended", handler);
};

interface Factories {
  topRatedCreate: typeof topRated.create;
  handlerCreate: typeof createTopRatedHandler;
  replaceFactoriesForTest: (replacements: Partial<Factories>) => Factories;
}
```

ときには、あるモジュールの依存契約は定義済みでも、その契約を満たすものがまだないことがあります。それでまったく構いません。上の `topRatedHandlerDependencies` object のように、例外を投げる実装を inline で定義すればよいのです。acceptance test は失敗しますが、この段階ではそれが期待どおりです。

### Finding and fixing a problem

注意深い読者は、`topRatedHandler` を構築する時点で compile error が出ることに気づくでしょう。2 つの定義が衝突しているからです。

- `controller.ts` が理解している restaurant の表現。
- `topRated.ts` で定義され、`getTopRestaurants` が返す restaurant。

理由は単純です。`topRated.ts` の `Restaurant` 型に、まだ `name` フィールドを追加していないのです。ここには trade-off があります。モジュールごとに別々の型を置く代わりに、restaurant を表す単一の型があれば、`name` は 1 回追加すれば済み、両方のモジュールが追加変更なしでコンパイルされます。それでも私は、余分な定型コードが生じるとしても型を分けたままにします。アプリケーションの層ごとに異なる型を保つことで、それらの層を不要に結合してしまう可能性が下がるからです。これはあまり DRY ではありません。しかし私は、**モジュール契約をできるだけ独立させるために、多少の反復を受け入れる**ことがよくあります。

```typescript
interface Restaurant {
  id: string;
  name: string;
}

const toRestaurant = (r: OverallRating) => ({
  id: r.restaurantId,
  // TODO: I put in a dummy value to start and make sure our contract is being met
  name: "",
});
```

この非常に素朴な解決でコードは再びコンパイルされ、今取り組んでいるモジュールの作業を続けられます。まもなく、`name` フィールドが正しく map されることを確認するテストを追加します。テストが通ったので、次のステップとして restaurant mapping のより恒久的な解決へ進みます。

#### 補足: `this` is a drag

誰から聞いたのかはもう思い出せませんが、JavaScript の利用者は「I love this!」とは決して言わない、なぜなら `this` が何なのか分からないからだ、という話を聞いたことがあります。JavaScript runtime で関数を composition の主な手段として使うときの癖の 1 つは、依存要素がより従来的なオブジェクト指向で設計されていると、消える `this` 問題に噛まれることがある点です。現代の TypeScript では、自分自身の `this` を持たない arrow function を使うことで避けられます。そのため、TypeScript compiler は、あたかも `this` を持っているかのように使うことを防ぎます。メソッドと `this` を使うサードパーティに依存しているなら、そのメソッドを呼ぶ軽い wrapper function を作るか、明示的に bind する必要があります。

### Reaching out to the repository layer

`getTopRestaurants` 関数の構造がほぼ整い、restaurant name を取得する方法が必要になったので、`toRestaurant` 関数を埋め、残りの `Restaurant` データをロードします。このように関数駆動の開発スタイルを採用する以前なら、私はおそらく `Restaurant` object をロードするメソッドを持つ repository object interface や stub を作っていたでしょう。今の私の傾向は、必要な最小限だけを作ることです。つまり、実装について仮定しない、オブジェクトをロードするための関数定義です。実装への束縛は後で行えます。

test/restaurantRatings/topRated.spec.ts…

```typescript
const restaurantsById = new Map<string, any>([
  ["restaurant1", { restaurantId: "restaurant1", name: "Restaurant 1" }],
  ["restaurant2", { restaurantId: "restaurant2", name: "Restaurant 2" }],
]);

const getRestaurantByIdStub = (id: string) => {
  return restaurantsById.get(id);
};

const dependencies = {
  getRestaurantById: getRestaurantByIdStub,
  findRatingsByRestaurant: findRatingsByRestaurantStub,
  calculateRatingForRestaurant: calculateRatingForRestaurantStub,
};

const getTopRated = topRated.create(dependencies);
const topRestaurants = await getTopRated("vancouverbc");
expect(topRestaurants[0].name).toEqual("Restaurant 1");
expect(topRestaurants[1].name).toEqual("Restaurant 2");
```

ドメインレベルのテストで、私は次のものを導入しました。

- `Restaurant` 用の stub finder。
- その finder を dependencies に入れる項目。
- `Restaurant` object からロードされたものと name が一致することの検証。

データをロードする以前の関数と同様に、`getRestaurantById` は `Promise` に包まれた値を返します。実装方法を知らないふりをする小さなゲームを続けていますが、`Restaurant` は外部データソースから来ることを私は知っているので、非同期でロードしたいはずです。これにより mapping code は少し複雑になります。

src/restaurantRatings/topRated.ts…

```typescript
const getTopRestaurants = async (city: string): Promise<Restaurant[]> => {
  const {
    findRatingsByRestaurant,
    calculateRatingForRestaurant,
    getRestaurantById,
  } = dependencies;

  const toRestaurant = async (r: OverallRating) => {
    const restaurant = await getRestaurantById(r.restaurantId);
    return {
      id: r.restaurantId,
      name: restaurant.name,
    };
  };

  const ratingsByRestaurant = await findRatingsByRestaurant(city);
  const overallRatings = calculateRatings(
    ratingsByRestaurant,
    calculateRatingForRestaurant,
  );

  return Promise.all(
    sortByOverallRating(overallRatings).map(r => toRestaurant(r)),
  );
};
```

複雑さは、`toRestaurant` が非同期であることから来ています。呼び出し側では `Promise.all()` で簡単に扱えます。

それぞれのリクエストをブロックしたくはありません。IO-bound なロードが直列に走ると、ユーザーリクエスト全体が遅くなるからです。しかし、すべての lookup が完了するまでは待つ必要があります。幸い、Promise ライブラリは `Promise.all` を提供しており、Promise の集合を、集合を含む 1 つの Promise に畳み込めます。

この変更により、restaurant lookup のリクエストは並行に発行されます。top 10 list なら同時リクエスト数が少ないので問題ありません。ある程度の規模のアプリケーションなら、おそらく database join で `name` フィールドをロードするよう service call を再構成し、余分な呼び出しをなくします。それができない場合、たとえば外部 API を問い合わせる場合なら、手で batch 化するか、Tiny Async Pool のようなサードパーティライブラリが提供する async pool を使って並行性を管理するでしょう。

ここでも、全体がコンパイルされるよう assembly module を dummy implementation で更新し、残っている契約を満たすコードに着手します。

### The last mile: implementing domain layer dependencies

controller と主要な domain module の workflow が整ったので、依存要素、すなわち database access layer と weighted rating algorithm を実装する時です。

これにより、handler、topRated、index.ts、calculateRatingsForRestaurants、groupedByRestaurant、findById といった高水準の関数と依存関係が現れます。テストでは、calculateRatingForRestaurantStub、findRatingsByRestaurantStub、getRestaurantByIdStub などの stub を使う形になります。図が煩雑になるため、テストコードがすべての要素を作っていることは図では示していません。

これらのモジュールを実装するプロセスは、同じパターンに従います。

- 基本設計と、必要なら `Dependencies` 型を導くテストを実装する。
- モジュールの基本的な論理フローを作り、テストを通す。
- モジュールの依存要素を実装する。
- 繰り返す。

すでにプロセスを示したので、全体をもう一度歩くことはしません。モジュールが end-to-end で動くコードはリポジトリにあります。最終実装のいくつかの側面には補足が必要です。

この時点では、ratings algorithm も、部分適用された関数として実装された別のファクトリで提供されると予想するかもしれません。今回は、代わりに pure function として書くことにしました。

src/restaurantRatings/ratingsAlgorithm.ts…

```typescript
interface RestaurantRating {
  rating: Rating;
  ratedByUser: User;
}

interface User {
  id: string;
  isTrusted: boolean;
}

interface RatingsByRestaurant {
  restaurantId: string;
  ratings: RestaurantRating[];
}

export const calculateRatingForRestaurant = (
  ratings: RatingsByRestaurant,
): number => {
  const trustedMultiplier = (curr: RestaurantRating) =>
    curr.ratedByUser.isTrusted ? 4 : 1;
  return ratings.ratings.reduce((prev, curr) => {
    return prev + rating[curr.rating] * trustedMultiplier(curr);
  }, 0);
};
```

私は、この関数が常に単純で状態を持たない計算であるべきだと示すために、この選択をしました。もし、ユーザーごとに parameterize された data science model を背後に置くような、より複雑な実装へ進む道を残したかったなら、ここでも factory pattern を使っていたでしょう。正解か不正解がないこともよくあります。設計上の選択は、いわば trail を残し、ソフトウェアがどのように進化するかを私がどう予想しているかを示します。変わるべきではないと思う領域ではより堅いコードを作り、方向性に自信がない領域ではより柔軟性を残します。

私が「trail を残す」もう 1 つの例は、`ratingsAlgorithm.ts` に別の `RestaurantRating` 型を定義する判断です。この型は、`topRated.ts` に定義された `RestaurantRating` とまったく同じです。ここでは別の道もあり得ます。

- `topRated.ts` から `RestaurantRating` を export し、`ratingsAlgorithm.ts` で直接参照する。
- `RestaurantRating` を共通モジュールへ切り出す。共有定義は `types.ts` というモジュールに置かれることが多いですが、私は `domain.ts` のように、そこに含まれる型の種類を示す、より文脈を持った名前を好みます。

この場合、私はこれらの型が文字どおり同じだと確信していません。異なるフィールドを持つ同じドメインエンティティの別々の projection かもしれませんし、モジュール境界をまたいで共有し、より深い結合を招きたくありません。直感に反するように見えるかもしれませんが、これは正しい選択だと考えています。現時点ではエンティティを統合するのはとても安く、簡単です。もし分岐し始めるなら、そもそも統合すべきでない可能性が高いですし、一度束縛してから分離するのはかなり厄介です。

### If it looks like a duck

型を export しないことが多い理由を説明すると約束しました。ある型を別モジュールに提供したいのは、それが偶発的な結合を生まず、コードの進化能力を制限しないと確信できる場合だけです。幸い、TypeScript の構造的、つまり duck typing によって、モジュールを疎結合に保ちながら、型が共有されていなくてもコンパイル時に契約が守られていることを保証するのはとても簡単です。呼び出し側と呼び出される側の型が互換である限り、コードはコンパイルされます。

Java や C# のようなより堅い言語では、プロセスのもっと早い段階でいくつかの判断を迫られます。たとえば ratings algorithm を実装するとき、私は別のアプローチを取らざるを得ません。

- `RestaurantRating` 型を抽出し、アルゴリズムを含むモジュールと全体の top-rated workflow を含むモジュールの両方から使えるようにする。欠点は、他の関数もそれに bind でき、モジュール結合が増えることです。
- あるいは、2 つの異なる `RestaurantRating` 型を作り、それら 2 つの同一形状の型を変換する adapter function を用意する。これは悪くありませんが、コンパイラが本来知っていてほしいことを伝えるためだけに定型コードが増えます。
- アルゴリズムを完全に `topRated` モジュールに畳み込む。ただし、それではそのモジュールが望む以上の責務を持つことになります。

言語の硬さは、このアプローチでの trade-off をより高くつくものにすることがあります。Martin Fowler は 2004 年の dependency injection と service locator pattern の記事で、構造的型や first-order function がない Java で依存の結合を減らすために role interface を使う話をしています。私が Java で作業していたなら、このアプローチを間違いなく検討します。

私は、このプロジェクトを他のいくつかの強い型付け言語へ移植し、このパターンが他の文脈でどれほどうまく当てはまるかを見たいと思っています。これまで Kotlin と Go へ移植した限りでは、このパターンは適用できる兆しがありますが、いくつかの調整が必要です。また、最良の結果を生む調整をよりよく理解するためには、それぞれの言語へ複数回移植する必要があるかもしれないとも考えています。私が行った選択や結果についての感触は、それぞれのリポジトリに記録されています。

### In summary

依存契約をクラスではなく関数で満たし、モジュール間のコード共有を最小限にし、テストを通じて設計を進めることで、高度に分離され、進化しやすく、それでも型安全なモジュールで構成されたシステムを作れます。次のプロジェクトで同じような優先事項を持つなら、ここで示したアプローチの一部を採用することを検討してみてください。ただし、プロジェクトの基礎となるアプローチを選ぶことは、「best practice」を選ぶだけで済むほど単純ではありません。技術スタックの慣用句やチームのスキルなど、他の要因も考慮する必要があります。システムを組み立てる方法はたくさんあり、それぞれが複雑な trade-off を持っています。だからこそソフトウェアアーキテクチャはしばしば難しく、常に面白いのです。私はそれ以外であってほしいとは思いません。
