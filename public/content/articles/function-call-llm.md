# Function calling using LLMs

## 要約

LLMは自然言語を生成するだけでなく、外部システムと連携するエージェントの判断役として使えます。
Function callingは、LLMが関数を直接実行する仕組みではなく、実行すべき関数名と引数を構造化データとして返し、別のプログラムがそれを実行するための仕組みです。

この記事は、ショッピングエージェントを例に、関数スキーマ、システムプロンプト、アクションクラス、プロンプトインジェクション対策、MCPとの関係を説明します。
中心にあるのは、LLMの自由な言語理解を使いながらも、実行できる操作を明示的に制限し、安全に外部APIへ接続する設計です。

## 読むときの観点

- Function callingは、LLMに実行させる技術ではなく、LLMに「どの操作をどんな引数で呼ぶべきか」を選ばせる技術として読む。
- エージェントの実行可能範囲を、コード上の条件分岐やスキーマで明確に制限する。
- プロンプトインジェクションはSQLインジェクションに似た入力経由の攻撃として捉え、入力検査やガードレールを設計する。
- アクションクラスを、LLMの判断と実システムのAPI呼び出しを分離する境界として読む。
- MCPは固定された関数集合を動的に発見できるようにする一方で、複雑性と安全性のトレードオフを持つと見る。

## 原文の翻訳

LLMの主要な用途のひとつは、ユーザーの意図を解釈し、それについて推論し、それに応じて適切な行動を取るプログラム、つまりエージェントを可能にすることだ。

Function callingは、LLMが単純なテキスト生成を越えて、外部ツールや実世界のアプリケーションとやり取りできるようにする能力である。Function callingを使うと、LLMは自然言語の入力を分析し、ユーザーの意図を取り出し、呼び出す関数名と必要な引数を含む構造化された出力を生成できる。

ここで強調しておきたいのは、Function callingを使っても、**LLM自身が関数を実行するわけではない**という点だ。LLMは適切な関数を特定し、必要なパラメータを集め、それを構造化されたJSON形式で提供する。このJSON出力は、Pythonやほかのプログラミング言語の関数呼び出しへ簡単にデシリアライズでき、プログラムの実行環境の中で実行される。

これを具体的に見るために、ファッション商品を探して購入するユーザーを助けるShopping Agentを作ってみる。ユーザーの意図がはっきりしない場合、エージェントはニーズをよりよく理解するために確認質問を返す。

たとえば、ユーザーが「シャツを探しています」や「青いランニングシャツについて詳しく見せて」と言った場合、ショッピングエージェントは適切なAPIを呼び出す。キーワードで商品を検索する場合もあれば、特定商品の詳細を取得する場合もある。

### 典型的なエージェントの足場

このエージェントを作るための足場を書いてみよう。コード例はすべてPythonである。

```python
class ShoppingAgent:

    def run(self, user_message: str, conversation_history: List[dict]) -> str:
        if self.is_intent_malicious(user_message):
            return "Sorry! I cannot process this request."

        action = self.decide_next_action(user_message, conversation_history)
        return action.execute()

    def decide_next_action(self, user_message: str, conversation_history: List[dict]):
        pass

    def is_intent_malicious(self, message: str) -> bool:
        pass
```

ショッピングエージェントは、ユーザー入力と会話履歴に基づいて、事前に定義された行動候補の中からひとつを選び、それを実行して結果をユーザーへ返す。その後も、ユーザーの目的が達成されるまで会話を続ける。

エージェントが取り得る行動を見てみよう。

```python
class Search():
    keywords: List[str]

    def execute(self) -> str:
        # use SearchClient to fetch search results based on keywords
        pass

class GetProductDetails():
    product_id: str

    def execute(self) -> str:
        # use SearchClient to fetch details of a specific product based on product_id
        pass

class Clarify():
    question: str

    def execute(self) -> str:
        pass
```

### Unit tests

完全なコードを実装する前に、この機能を検証するユニットテストから始めよう。エージェントのロジックを肉付けしていく間に、期待どおりに振る舞うことを確認しやすくなる。

```python
def test_next_action_is_search():
    agent = ShoppingAgent()
    action = agent.decide_next_action("I am looking for a laptop.", [])
    assert isinstance(action, Search)
    assert 'laptop' in action.keywords

def test_next_action_is_product_details(search_results):
    agent = ShoppingAgent()
    conversation_history = [
        {"role": "assistant", "content": f"Found: Nike dry fit T Shirt (ID: p1)"}
    ]
    action = agent.decide_next_action("Can you tell me more about the shirt?", conversation_history)
    assert isinstance(action, GetProductDetails)
    assert action.product_id == "p1"

def test_next_action_is_clarify():
    agent = ShoppingAgent()
    action = agent.decide_next_action("Something something", [])
    assert isinstance(action, Clarify)
```

次に、OpenAIのAPIとGPTモデルを使って`decide_next_action`関数を実装する。この関数は、ユーザー入力と会話履歴を受け取り、それをモデルへ送り、アクション種別と必要なパラメータを取り出す。

```python
def decide_next_action(self, user_message: str, conversation_history: List[dict]):
    response = self.client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            *conversation_history,
            {"role": "user", "content": user_message}
        ],
        tools=[
            {"type": "function", "function": SEARCH_SCHEMA},
            {"type": "function", "function": PRODUCT_DETAILS_SCHEMA},
            {"type": "function", "function": CLARIFY_SCHEMA}
        ]
    )
    tool_call = response.choices[0].message.tool_calls[0]
    function_args = eval(tool_call.function.arguments)

    if tool_call.function.name == "search_products":
        return Search(**function_args)
    elif tool_call.function.name == "get_product_details":
        return GetProductDetails(**function_args)
    elif tool_call.function.name == "clarify_request":
        return Clarify(**function_args)
```

ここでは、OpenAIのChat Completions APIを呼び出している。システムプロンプトは、今回でいえば`gpt-4-turbo-preview`であるLLMに、ユーザーのメッセージと会話履歴に基づいて適切なアクションを判断し、必要なパラメータを抽出するよう指示する。LLMは構造化されたJSON応答を返し、それを使って対応するアクションクラスをインスタンス化する。そのクラスが、`search`や`get_product_details`など必要なAPIを呼び出してアクションを実行する。

### System prompt

システムプロンプトをもう少し詳しく見てみよう。

```python
SYSTEM_PROMPT = """You are a shopping assistant. Use these functions:
1. search_products: When user wants to find products (e.g., "show me shirts")
2. get_product_details: When user asks about a specific product ID (e.g., "tell me about product p1")
3. clarify_request: When user's request is unclear"""
```

システムプロンプトでは、タスクに必要な文脈をLLMへ与える。ショッピングアシスタントとしての役割を定義し、期待する出力形式、つまり関数を指定し、ユーザーのリクエストが不明瞭な場合は確認するなどの制約や特別な指示も含める。

これは例として十分な、基本的なプロンプトである。しかし実際のアプリケーションでは、LLMを導くためのより洗練された方法を検討したくなるだろう。ユーザーメッセージと対応するアクションをひとつ組にして示すOne-shot promptingや、複数のシナリオを例示するFew-shot promptingは、モデル応答の正確性と信頼性を大きく高められる。

Chat Completions API呼び出しの次の部分では、LLMが呼び出せる関数を定義し、その構造と目的を指定している。

```python
tools=[
    {"type": "function", "function": SEARCH_SCHEMA},
    {"type": "function", "function": PRODUCT_DETAILS_SCHEMA},
    {"type": "function", "function": CLARIFY_SCHEMA}
]
```

各エントリは、LLMが呼び出せる関数を表し、OpenAI API仕様に沿って期待されるパラメータと用途を詳しく示す。

それぞれの関数スキーマを詳しく見てみよう。

```python
SEARCH_SCHEMA = {
    "name": "search_products",
    "description": "Search for products using keywords",
    "parameters": {
        "type": "object",
        "properties": {
            "keywords": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Keywords to search for"
            }
        },
        "required": ["keywords"]
    }
}

PRODUCT_DETAILS_SCHEMA = {
    "name": "get_product_details",
    "description": "Get detailed information about a specific product",
    "parameters": {
        "type": "object",
        "properties": {
            "product_id": {
                "type": "string",
                "description": "Product ID to get details for"
            }
        },
        "required": ["product_id"]
    }
}

CLARIFY_SCHEMA = {
    "name": "clarify_request",
    "description": "Ask user for clarification when request is unclear",
    "parameters": {
        "type": "object",
        "properties": {
            "question": {
                "type": "string",
                "description": "Question to ask user for clarification"
            }
        },
        "required": ["question"]
    }
}
```

これによって、LLMが呼び出せる各関数とそのパラメータを定義する。たとえばsearch関数の`keywords`や、`get_product_details`の`product_id`である。また、関数を正しく実行するために、どのパラメータが必須かも指定する。

さらに`description`フィールドは、関数名だけでは目的が自明でない場合に、LLMが関数の意図を理解するための追加文脈を提供する。

主要な部品がそろったので、`ShoppingAgent`クラスの`run`関数を完全に実装してみよう。この関数は、ユーザー入力を受け取り、OpenAIのFunction callingを使って次のアクションを決め、対応するAPI呼び出しを実行し、ユーザーへ応答を返すという一連の流れを扱う。

エージェントの完全な実装は次のようになる。

```python
class ShoppingAgent:
    def __init__(self):
        self.client = OpenAI()

    def run(self, user_message: str, conversation_history: List[dict] = None) -> str:
        if self.is_intent_malicious(user_message):
            return "Sorry! I cannot process this request."

        try:
            action = self.decide_next_action(user_message, conversation_history or [])
            return action.execute()
        except Exception as e:
            return f"Sorry, I encountered an error: {str(e)}"

    def decide_next_action(self, user_message: str, conversation_history: List[dict]):
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *conversation_history,
                {"role": "user", "content": user_message}
            ],
            tools=[
                {"type": "function", "function": SEARCH_SCHEMA},
                {"type": "function", "function": PRODUCT_DETAILS_SCHEMA},
                {"type": "function", "function": CLARIFY_SCHEMA}
            ]
        )
        tool_call = response.choices[0].message.tool_calls[0]
        function_args = eval(tool_call.function.arguments)

        if tool_call.function.name == "search_products":
            return Search(**function_args)
        elif tool_call.function.name == "get_product_details":
            return GetProductDetails(**function_args)
        elif tool_call.function.name == "clarify_request":
            return Clarify(**function_args)

    def is_intent_malicious(self, message: str) -> bool:
        pass
```

### エージェントのアクション空間を制限する

上のコードブロックで示したように、明示的な条件分岐を使ってエージェントのアクション空間を制限することが不可欠だ。`eval`を使って関数を動的に呼び出すのは便利に見えるかもしれないが、プロンプトインジェクションによって認可されていないコード実行につながるなど、重大なセキュリティリスクを生む。潜在的な攻撃からシステムを守るためには、**エージェントが呼び出せる関数を常に厳密に制御する**必要がある。

### プロンプトインジェクションに対するガードレール

自然言語でユーザーと会話し、Function callingでバックグラウンドのアクションを実行するユーザー向けエージェントを作るときは、敵対的な振る舞いを予想しておくことが重要だ。ユーザーは安全策を迂回し、意図しないアクションをエージェントに取らせようとするかもしれない。これはSQLインジェクションに似ているが、言語を通じて行われる。

よくある攻撃経路は、エージェントにシステムプロンプトを明かすよう促すことだ。攻撃者は、エージェントがどのように指示されているかを知ると、その知識を使って、未承認の返金や機密顧客データの露出などのアクションを実行させようとする可能性がある。

エージェントのアクション空間を制限することは堅実な第一歩だが、それだけでは十分ではない。

防御を高めるには、ユーザー入力をサニタイズし、悪意ある意図を検出して防ぐことが不可欠である。これは次の組み合わせで取り組める。

- 正規表現や入力denylistなど、既知の悪意あるパターンをフィルタする従来型の技術。
- 操作、インジェクション試行、プロンプト悪用の兆候を別のモデルでふるいにかけるLLMベースの検証。

悪意ある可能性のある入力を検出する、denylistベースの簡単なガード実装は次のようになる。

```python
def is_intent_malicious(self, message: str) -> bool:
    suspicious_patterns = [
        "ignore previous instructions",
        "ignore above instructions",
        "disregard previous",
        "forget above",
        "system prompt",
        "new role",
        "act as",
        "ignore all previous commands"
    ]
    message_lower = message.lower()
    return any(pattern in message_lower for pattern in suspicious_patterns)
```

これは基本的な例だが、正規表現マッチ、文脈チェック、あるいはより微妙な検出のためのLLMベースのフィルタと組み合わせて拡張できる。

現実のシナリオでエージェントの安全性と完全性を保つには、堅牢なプロンプトインジェクションのガードレールを構築することが欠かせない。

### Action classes

ここで実際のアクションが起こる。アクションクラスは、LLMの意思決定と実システムの操作との間の入り口として働く。会話に基づいてLLMが解釈したユーザー要求を、マイクロサービスやほかの内部システムの適切なAPI呼び出しへ変換し、具体的なアクションにする。

```python
class Search:
    def __init__(self, keywords: List[str]):
        self.keywords = keywords
        self.client = SearchClient()

    def execute(self) -> str:
        results = self.client.search(self.keywords)
        if not results:
            return "No products found"
        products = [f"{p['name']} (ID: {p['id']})" for p in results]
        return f"Found: {', '.join(products)}"

class GetProductDetails:
    def __init__(self, product_id: str):
        self.product_id = product_id
        self.client = SearchClient()

    def execute(self) -> str:
        product = self.client.get_product_details(self.product_id)
        if not product:
            return f"Product {self.product_id} not found"
        return f"{product['name']}: price: ${product['price']} - {product['description']}"

class Clarify:
    def __init__(self, question: str):
        self.question = question

    def execute(self) -> str:
        return self.question
```

この実装では、会話履歴はユーザーインターフェースのセッション状態に保存され、各呼び出しで`run`関数へ渡される。これによって、ショッピングエージェントは過去のやり取りの文脈を保持し、会話全体を通じてより情報に基づいた判断ができる。

たとえば、ユーザーが特定の商品について詳細を求める場合、LLMは直近の検索結果表示メッセージから`product_id`を取り出せる。これにより、文脈を踏まえたなめらかな体験になる。

### ボイラープレートを減らすためのリファクタリング

この実装で冗長なボイラープレートコードの大きな部分は、LLM向けの詳細な関数仕様を定義しているところにある。これと同じ情報は、アクションクラスの具体的な実装にもすでに存在しているため、重複していると言える。

幸い、`instructor`のようなライブラリは、PydanticオブジェクトをOpenAIスキーマに従うJSONへ自動的にシリアライズする関数を提供し、この重複を減らす助けになる。これにより、重複が減り、ボイラープレートコードが少なくなり、保守性も向上する。

`instructor`を使って、この実装をどのように単純化できるかを見てみよう。主な変更は、アクションクラスをPydanticオブジェクトとして定義することだ。

```python
from typing import List, Union
from pydantic import BaseModel, Field
from instructor import OpenAISchema
from neo.clients import SearchClient

class BaseAction(BaseModel):
    def execute(self) -> str:
        pass

class Search(BaseAction):
    keywords: List[str]

    def execute(self) -> str:
        results = SearchClient().search(self.keywords)
        if not results:
            return "Sorry I couldn't find any products for your search."
        products = [f"{p['name']} (ID: {p['id']})" for p in results]
        return f"Here are the products I found: {', '.join(products)}"

class GetProductDetails(BaseAction):
    product_id: str

    def execute(self) -> str:
        product = SearchClient().get_product_details(self.product_id)
        if not product:
            return f"Product {self.product_id} not found"

        return f"{product['name']}: price: ${product['price']} - {product['description']}"

class Clarify(BaseAction):
    question: str

    def execute(self) -> str:
        return self.question

class NextActionResponse(OpenAISchema):
    next_action: Union[Search, GetProductDetails, Clarify] = Field(
        description="The next action for agent to take.")
```

エージェント実装は`NextActionResponse`を使う形に更新される。`next_action`フィールドは、Search、GetProductDetails、Clarifyのいずれかのアクションクラスのインスタンスである。`instructor`ライブラリの`from_response`メソッドは、LLMの応答を`NextActionResponse`オブジェクトへデシリアライズする処理を単純にし、ボイラープレートをさらに減らす。

```python
class ShoppingAgent:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def run(self, user_message: str, conversation_history: List[dict] = None) -> str:
        if self.is_intent_malicious(user_message):
            return "Sorry! I cannot process this request."
        try:
            action = self.decide_next_action(user_message, conversation_history or [])
            return action.execute()
        except Exception as e:
            return f"Sorry, I encountered an error: {str(e)}"

    def decide_next_action(self, user_message: str, conversation_history: List[dict]):
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *conversation_history,
                {"role": "user", "content": user_message}
            ],
            tools=[{
                "type": "function",
                "function": NextActionResponse.openai_schema
            }],
            tool_choice={"type": "function", "function": {"name": NextActionResponse.openai_schema["name"]}},
        )
        return NextActionResponse.from_response(response).next_action

    def is_intent_malicious(self, message: str) -> bool:
        suspicious_patterns = [
            "ignore previous instructions",
            "ignore above instructions",
            "disregard previous",
            "forget above",
            "system prompt",
            "new role",
            "act as",
            "ignore all previous commands"
        ]
        message_lower = message.lower()
        return any(pattern in message_lower for pattern in suspicious_patterns)
```

### このパターンは従来のルールエンジンを置き換えられるか

Rules enginesは長いあいだエンタープライズソフトウェアアーキテクチャで力を持ってきたが、実際には、その約束どおりに機能しないことが多い。Martin Fowlerが15年以上前に述べたルールエンジンについての観察は、今でも当てはまる。

> ルールエンジンの中心的な売り文句は、しばしば、ビジネス担当者自身がルールを指定でき、プログラマーを巻き込まずにルールを作れるようになる、というものだ。よくあることだが、これはもっともらしく聞こえるものの、実際にはめったにうまくいかない。

ルールエンジンの中核的な問題は、時間が経つにつれて複雑性が増すところにある。ルールの数が増えるほど、ルール同士の意図しない相互作用のリスクも高まる。個々のルールを独立して定義することは、ドラッグアンドドロップツールなどを使えば単純で扱いやすく見えるかもしれない。しかし実世界のシナリオでルールを一緒に実行すると、問題が表面化する。ルール同士の相互作用は組み合わせ爆発を起こし、これらのシステムはテスト、予測、保守がますます難しくなる。

LLMベースのシステムは、魅力的な代替案を提供する。意思決定の完全な透明性や決定性はまだ提供できないが、ユーザーの意図や文脈について、従来の静的なルール集合にはできない方法で推論できる。硬直したルール連鎖の代わりに、言語理解によって駆動される文脈対応で適応的な振る舞いが得られる。

また、ビジネスユーザーやドメイン専門家にとっては、自然言語のプロンプトでルールを表現するほうが、最終的に追いにくいコードを生成するルールエンジンを使うよりも、直感的で取り組みやすいかもしれない。

現実的な進め方は、LLMによる推論と、重要な判断を実行するための明示的な手動ゲートを組み合わせることだろう。柔軟性、制御、安全性のバランスを取るのである。

### Function callingとTool calling

これらの言葉はよく同じ意味で使われるが、「Tool calling」のほうがより一般的で現代的な用語である。これは、LLMが外部世界とやり取りするために使える、より広い能力の集合を指す。たとえば、カスタム関数を呼ぶだけでなく、LLMはコードを実行するcode interpreterや、アップロードされたファイルや接続されたデータベースからデータへアクセスするretrieval mechanismのような組み込みツールを提供することもある。

### Function callingとMCPの関係

Model Context Protocol (MCP)は、Anthropicが提案したオープンプロトコルであり、LLMベースのアプリケーションが外部世界とどのようにやり取りするかを構造化する標準的な方法として注目を集めている。いまでは多くのSaaSプロバイダーが、このプロトコルを使って自分たちのサービスをLLM Agentへ公開している。

MCPは、主に3つのコンポーネントからなるクライアントサーバーアーキテクチャを定義する。

- MCP Server: HTTP経由で呼び出せるデータソースや各種ツール、つまり関数を公開するサーバー。
- MCP Client: アプリケーションとMCP Serverの間の通信を管理するクライアント。
- MCP Host: MCP Serverが提供するデータやツールを使ってタスクを達成するLLMベースのアプリケーション。たとえば、ユーザーの買い物リクエストを満たすShoppingAgentである。MCP HostはMCP Clientを通じてこれらの機能へアクセスする。

MCPが扱う中核的な問題は、柔軟性と動的なツール発見である。上のShoppingAgentの例では、利用可能なツール集合は、エージェントが呼び出せる3つの関数、つまり`search_products`、`get_product_details`、`clarify`にハードコードされていることに気づくだろう。これは、エージェントが新しい種類のリクエストへ適応したり、規模を広げたりする能力を制限する一方で、悪意ある利用に対して守りやすくもしている。

MCPを使うと、エージェントは実行時にMCP Serverへ問い合わせ、利用可能なツールを発見できる。そのうえで、ユーザーの問い合わせに基づいて、適切なツールを動的に選んで呼び出せる。

このモデルは、LLMアプリケーションを固定されたツール集合から切り離し、モジュール性、拡張性、動的な能力拡張を可能にする。これは、複雑で進化し続けるエージェントシステムでは特に価値がある。

MCPは追加の複雑性を持ち込むが、その複雑性に見合うアプリケーションやエージェントもある。たとえば、LLMベースのIDEやコード生成ツールは、やり取りできる最新APIを常に把握している必要がある。理論上は、幅広いツールへアクセスでき、さまざまなユーザー要求を扱える汎用エージェントも想像できる。これは、買い物関連タスクに限定された今回の例とは違う。

ショッピングアプリケーション向けの簡単なMCPサーバーがどのようになるかを見てみよう。`GET /tools`エンドポイントに注目してほしい。これは、サーバーが公開しているすべての関数、つまりツールの一覧を返す。

```python
TOOL_REGISTRY = {
    "search_products": SEARCH_SCHEMA,
    "get_product_details": PRODUCT_DETAILS_SCHEMA,
    "clarify": CLARIFY_SCHEMA
}

@app.route("/tools", methods=["GET"])
def get_tools():
    return jsonify(list(TOOL_REGISTRY.values()))

@app.route("/invoke/search_products", methods=["POST"])
def search_products():
    data = request.json
    keywords = data.get("keywords")
    search_results = SearchClient().search(keywords)
    return jsonify({"response": f"Here are the products I found: {', '.join(search_results)}"})

@app.route("/invoke/get_product_details", methods=["POST"])
def get_product_details():
    data = request.json
    product_id = data.get("product_id")
    product_details = SearchClient().get_product_details(product_id)
    return jsonify({"response": f"{product_details['name']}: price: ${product_details['price']} - {product_details['description']}"})

@app.route("/invoke/clarify", methods=["POST"])
def clarify():
    data = request.json
    question = data.get("question")
    return jsonify({"response": question})

if __name__ == "__main__":
    app.run(port=8000)
```

対応するMCPクライアントは次のようになる。これは、MCP HostであるShoppingAgentとサーバーとの通信を扱う。

```python
class MCPClient:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip("/")

    def get_tools(self):
        response = requests.get(f"{self.base_url}/tools")
        response.raise_for_status()
        return response.json()

    def invoke(self, tool_name, arguments):
        url = f"{self.base_url}/invoke/{tool_name}"
        response = requests.post(url, json=arguments)
        response.raise_for_status()
        return response.json()
```

次に、ShoppingAgent、つまりMCP Hostをリファクタリングし、最初にMCPサーバーから利用可能なツール一覧を取得してから、MCPクライアントを使って適切な関数を呼び出すようにする。

```python
class ShoppingAgent:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.mcp_client = MCPClient(os.getenv("MCP_SERVER_URL"))
        self.tool_schemas = self.mcp_client.get_tools()

    def run(self, user_message: str, conversation_history: List[dict] = None) -> str:
        if self.is_intent_malicious(user_message):
            return "Sorry! I cannot process this request."

        try:
            tool_call = self.decide_next_action(user_message, conversation_history or [])
            result = self.mcp_client.invoke(tool_call["name"], tool_call["arguments"])
            return str(result["response"])
        except Exception as e:
            return f"Sorry, I encountered an error: {str(e)}"

    def decide_next_action(self, user_message: str, conversation_history: List[dict]):
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *conversation_history,
                {"role": "user", "content": user_message}
            ],
            tools=[{"type": "function", "function": tool} for tool in self.tool_schemas],
            tool_choice="auto"
        )
        tool_call = response.choices[0].message.tool_call
        return {
            "name": tool_call.function.name,
            "arguments": tool_call.function.arguments.model_dump()
        }

    def is_intent_malicious(self, message: str) -> bool:
        pass
```

### Conclusion

Function callingは、LLMの刺激的で強力な能力であり、新しいユーザー体験と高度なエージェント型システムの開発への扉を開く。しかし同時に、特にユーザー入力が最終的に機密性の高い関数やAPIを起動できる場合、新しいリスクも持ち込む。慎重にガードレールを設計し、適切な安全策を入れれば、こうしたリスクの多くは効果的に緩和できる。

Function callingは、まず低リスクの操作で有効にし、安全機構が成熟するにつれて、より重要な操作へ段階的に広げていくのが賢明である。
