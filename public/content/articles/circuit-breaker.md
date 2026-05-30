# Circuit Breaker

## 要約

Circuit Breakerは、失敗しそうなリモート呼び出しを保護し、障害が連鎖して広がるのを防ぐパターンです。一定回数以上失敗したら回路を開き、その後の呼び出しを実際の処理へ送らず、すぐエラーとして返します。

このパターンは、タイムアウト待ちでリソースを使い尽くすことを避け、問題を抱えたサービスへの負荷を下げます。監視や運用操作、失敗時の代替処理と組み合わせて使うことが重要です。

## 読むときの観点

- リモート呼び出しは、メモリ内呼び出しと違って失敗や無応答が普通に起こる。
- `closed`、`open`、`half_open` の状態遷移を押さえる。
- しきい値、タイムアウト、失敗率、スレッドプールなど、実装上の調整点を見る。
- Circuit Breakerは障害を消すものではなく、障害の広がり方を制御する仕組みとして読む。

## 原文の翻訳

ソフトウェアシステムでは、別プロセスで動いているソフトウェアへリモート呼び出しを行うことがよくあります。おそらくそれは、ネットワーク越しの別マシン上で動いています。メモリ内呼び出しとリモート呼び出しの大きな違いのひとつは、リモート呼び出しは失敗したり、タイムアウト上限に達するまで応答なしに止まったりすることです。さらに悪いことに、応答しない供給側に多くの呼び出し元がいると、重要なリソースを使い果たし、複数システムにまたがる連鎖障害につながることがあります。Michael Nygardは優れた著書『Release It』で、この種の破滅的な連鎖を防ぐためのCircuit Breakerパターンを広めました。

Circuit Breakerの基本的な考え方はとても単純です。保護対象の関数呼び出しをCircuit Breakerオブジェクトで包み、そのオブジェクトが失敗を監視します。失敗が一定のしきい値に達すると、Circuit Breakerは作動し、その後のCircuit Breakerへの呼び出しは、保護対象の呼び出しをまったく行わずにエラーを返します。通常は、Circuit Breakerが作動したら何らかの監視アラートも出したいでしょう。

以下は、タイムアウトから守るRubyでの単純な例です。

保護対象の呼び出しであるブロック、つまりLambdaを使ってCircuit Breakerを設定します。

```ruby
cb = CircuitBreaker.new {|arg| @supplier.func arg}
```

Circuit Breakerはそのブロックを保存し、しきい値、タイムアウト、監視のためのさまざまなパラメータを初期化し、Circuit Breakerをclosed状態へリセットします。

```ruby
class CircuitBreaker
  attr_accessor :invocation_timeout, :failure_threshold, :monitor
  def initialize &block
    @circuit = block
    @invocation_timeout = 0.01
    @failure_threshold = 5
    @monitor = acquire_monitor
    reset
  end
end
```

Circuit Breakerを呼び出すと、回路がclosedなら内部のブロックを呼び出し、openならエラーを返します。

```ruby
# client code
aCircuitBreaker.call(5)
```

```ruby
class CircuitBreaker
  def call args
    case state
    when :closed
      begin
        do_call args
      rescue Timeout::Error
        record_failure
        raise $!
      end
    when :open then raise CircuitBreaker::Open
    else raise "Unreachable Code"
    end
  end

  def do_call args
    result = Timeout::timeout(@invocation_timeout) do
      @circuit.call args
    end
    reset
    return result
  end
end
```

タイムアウトが起きたら失敗カウンタを増やし、成功した呼び出しではカウンタをゼロに戻します。

```ruby
class CircuitBreaker
  def record_failure
    @failure_count += 1
    @monitor.alert(:open_circuit) if :open == state
  end

  def reset
    @failure_count = 0
    @monitor.alert :reset_circuit
  end
end
```

Circuit Breakerの状態は、失敗回数としきい値を比較して決めます。

```ruby
class CircuitBreaker
  def state
     (@failure_count >= @failure_threshold) ? :open : :closed
  end
end
```

この単純なCircuit Breakerは、回路がopenのときには保護対象の呼び出しを行わないようにします。しかし、再び正常になったときにリセットするには外部からの介入が必要です。これは建物の電気的なCircuit Breakerでは妥当な方法ですが、ソフトウェアのCircuit Breakerでは、内部の呼び出しが再び動くようになったかをCircuit Breaker自身に検出させることができます。適切な間隔の後に保護対象の呼び出しをもう一度試し、成功したらCircuit Breakerをリセットすることで、この自己リセット動作を実装できます。

この種のCircuit Breakerを作るには、リセットを試すためのしきい値を追加し、最後のエラー時刻を保持する変数を用意します。

```ruby
class ResetCircuitBreaker
  def initialize &block
    @circuit = block
    @invocation_timeout = 0.01
    @failure_threshold = 5
    @monitor = BreakerMonitor.new
    @reset_timeout = 0.1
    reset
  end

  def reset
    @failure_count = 0
    @last_failure_time = nil
    @monitor.alert :reset_circuit
  end
end
```

ここで3つ目の状態、half openが現れます。これは、問題が直ったかどうかを見るために、試しに本物の呼び出しを行う準備ができているという意味です。

```ruby
class ResetCircuitBreaker
  def state
    case
    when (@failure_count >= @failure_threshold) &&
        (Time.now - @last_failure_time) > @reset_timeout
      :half_open
    when (@failure_count >= @failure_threshold)
      :open
    else
      :closed
    end
  end
end
```

half-open状態で呼び出されると、試行呼び出しが行われます。成功すればCircuit Breakerはリセットされ、失敗すればタイムアウトが再開されます。

```ruby
class ResetCircuitBreaker
  def call args
    case state
    when :closed, :half_open
      begin
        do_call args
      rescue Timeout::Error
        record_failure
        raise $!
      end
    when :open
      raise CircuitBreaker::Open
    else
      raise "Unreachable"
    end
  end

  def record_failure
    @failure_count += 1
    @last_failure_time = Time.now
    @monitor.alert(:open_circuit) if :open == state
  end
end
```

この例は説明のための単純なものです。実際にはCircuit Breakerは、もっと多くの機能とパラメータ化を提供します。保護対象の呼び出しが投げうる、ネットワーク接続失敗のようなさまざまなエラーから守ることがよくあります。すべてのエラーで回路を開くべきではありません。通常の失敗を表し、通常のロジックの一部として扱うべきものもあります。

大量のトラフィックがあると、最初のタイムアウトを待つ多数の呼び出しによって問題が起こりえます。リモート呼び出しは遅いことが多いので、futureやpromiseを使って、各呼び出しを別スレッドに置き、結果が戻ったときに処理するのはよい考えであることが多いです。これらのスレッドをスレッドプールから取り出すようにすれば、スレッドプールが使い尽くされたときに回路を開くようにできます。

この例では、成功した呼び出しでリセットされるカウンタという、Circuit Breakerを作動させる単純な方法を示しました。より洗練された方法では、エラーの頻度を見て、たとえば失敗率が50%になったら作動させるかもしれません。エラーの種類ごとに異なるしきい値を持たせることもできます。たとえば、タイムアウトのしきい値は10、接続失敗のしきい値は3にする、といった具合です。

ここで示したのは同期呼び出しのためのCircuit Breakerですが、Circuit Breakerは非同期通信にも有用です。ここでよく使われる手法は、すべてのリクエストをキューに置き、供給側が自分の速度で消費するというものです。これはサーバーの過負荷を避けるうえで有用です。この場合、キューがいっぱいになったときに回路が開きます。

Circuit Breakerは、それ自体で、失敗しそうな処理に結びつけられているリソースを減らす助けになります。クライアント側ではタイムアウト待ちを避けられ、開いた回路は苦しんでいるサーバーへ負荷をかけることを避けます。ここではCircuit Breakerの一般的な用途であるリモート呼び出しについて話していますが、システムの一部を他の部分の失敗から守りたいどんな状況でも使えます。

Circuit Breakerは監視のための価値ある場所です。Circuit Breakerの状態変化はすべてログに記録されるべきであり、より深い監視のために状態の詳細を明らかにすべきです。Circuit Breakerの振る舞いは、環境のより深い問題についてのよい警告源になることがよくあります。運用担当者はCircuit Breakerを作動させたりリセットしたりできるべきです。

Circuit Breaker自体には価値がありますが、それを使うクライアントはCircuit Breakerの失敗に反応する必要があります。どんなリモート呼び出しでもそうであるように、失敗した場合に何をするかを考えなければなりません。実行中の操作を失敗させるのか、それとも実行できる回避策があるのか。クレジットカード認証なら後で処理するためにキューへ置けるかもしれませんし、何らかのデータ取得に失敗した場合は、表示に十分な古いデータを見せることで緩和できるかもしれません。

### 参考文献

Netflixの技術ブログには、多数のサービスを持つシステムの信頼性を高めるための有用な情報が多くあります。同社のDependency Commandは、Circuit Breakerとスレッドプール制限の使い方について述べています。

Netflixは、分散システムのレイテンシとフォールトトレランスを扱う洗練されたツールであるHystrixをオープンソース化しました。そこには、スレッドプール制限を備えたCircuit Breakerパターンの実装が含まれています。

Ruby、Java、Grails Plugin、C#、AspectJ、Scalaにも、Circuit Breakerパターンのオープンソース実装があります。
