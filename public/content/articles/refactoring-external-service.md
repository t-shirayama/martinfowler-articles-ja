# Refactoring code that accesses external services

## 要約

外部サービスへアクセスするコードは、接続、外部サービスのデータ構造、ドメインロジック、調整役の責務が混ざりやすくなります。
この記事は、YouTube API から動画情報を取得する Ruby コードを題材に、テストを足場にしながら、connection object、gateway object、domain object へ段階的に責務を分けるリファクタリングを説明します。

最終的なコードは行数こそ増えますが、変更理由の異なるコードを別々の場所へ置けるようになります。
特に、外部 API の形式変更とドメイン計算の変更を切り離し、テストダブルを扱いやすくする考え方が重要です。

## 読むときの観点

- 外部サービス連携では、接続処理、外部データ構造、ドメインロジックを分けて読む。
- テストを入れるための seam を作る小さなステップが、後続の設計改善につながる点を見る。
- gateway と connection の役割の違いに注目する。
- リファクタリングは大きな作り替えではなく、小さな振る舞い保存の変換を積み重ねることだと捉える。

## 原文の翻訳

外部サービスを扱うコードを書くとき、私はそのアクセスコードを別のオブジェクトへ分けることに価値があると感じています。ここでは、固まってしまったコードを、この分離のよくあるパターンへどのようにリファクタリングするかを示します。

ソフトウェアシステムの特徴の 1 つは、それが単独では生きていないことです。役に立つことをするには、たいてい他のソフトウェア片と話す必要があります。それらは別の人々によって書かれており、その人々は私たちのことを知らず、私たちが書いているソフトウェアについても知らないし、気にもしません。

この種の外部 collaboration を行うソフトウェアを書くときには、良い modularity と encapsulation を適用するのが特に有用だと思います。私がよく見かけ、価値があると感じている共通パターンがあります。

この記事では、単純な例を取り上げ、私が求める種類の modularity を導入するリファクタリングを順に見ていきます。

### The starting code

このサンプルコードの仕事は、JSON ファイルから動画に関するデータを読み取り、YouTube から取得したデータでそれを enriched し、さらに簡単なデータを計算して、JSON として返すことです。

出発点のコードは次のとおりです。

class VideoService…

```ruby
def video_list
  @video_list = JSON.parse(File.read('videos.json'))
  ids = @video_list.map{|v| v['youtubeID']}
  client = GoogleAuthorizer.new(
    token_key: 'api-youtube',
    application_name: 'Gateway Youtube Example',
    application_version: '0.1'
    ).api_client
  youtube = client.discovered_api('youtube', 'v3')
  request = {
    api_method: youtube.videos.list,
    parameters: {
      id: ids.join(","),
      part: 'snippet, contentDetails, statistics',
    }
  }
  response = JSON.parse(client.execute!(request).body)
  ids.each do |id|
    video = @video_list.find{|v| id == v['youtubeID']}
    youtube_record = response['items'].find{|v| id == v['id']}
    video['views'] = youtube_record['statistics']['viewCount'].to_i
    days_available = Date.today - Date.parse(youtube_record['snippet']['publishedAt'])
    video['monthlyViews'] = video['views'] * 365.0 / days_available / 12
  end
  return JSON.dump(@video_list)
end
```

この例で使っている言語は Ruby です。

最初に言っておきたいのは、この例にはコードがそれほど多くないということです。コードベース全体がこの script だけなら、modularity についてそこまで心配する必要はありません。小さな例が必要なのですが、本物のシステムを見ようとすると読者の目が曇ってしまうでしょう。だから、このコードを、数万行規模のシステムにある典型的なコードだと想像してもらう必要があります。

YouTube API へのアクセスは `GoogleAuthorizer` object を介しています。この記事の目的では、これを外部 API として扱います。これは YouTube のような Google service へ接続する面倒な詳細を扱い、とりわけ authorization の問題を処理します。仕組みを知りたい場合は、Google APIs へのアクセスについて以前書いた記事を見てください。

このコードの何が問題なのでしょうか。すべてを理解できなくても、異なる concern が混ざっていることは見て取れるはずです。変更するには、YouTube API へのアクセス方法、YouTube がデータをどう構造化しているか、そしていくつかの domain logic を理解しなければなりません。

ソフトウェアの達人たちは、よく「separation of concerns」について語ります。基本的には、異なる話題は別々のモジュールに置くべきだ、という意味です。私がそれを重視する主な理由は理解しやすさです。よくモジュール化されたプログラムでは、各モジュールは 1 つの話題についてのものであるべきです。そうすれば、理解する必要のないことを知らないままでいられます。YouTube のデータ形式が変わったとき、アクセスコードを組み替えるためにアプリケーションの domain logic を理解する必要があってはなりません。

たとえ YouTube から新しいデータを取り出し、それを domain logic で使う変更をしている場合でも、作業をその 2 つに分け、それぞれを個別に扱えるべきです。頭の中で回し続ける必要のあるコード行数を最小限にするためです。

私のリファクタリングの任務は、これらの concern を別々のモジュールへ切り出すことです。終わったとき、Video Service に残るべきコードは、これらの責務を調整するコードだけです。

### Putting the code under test

リファクタリングの最初のステップは常に同じです。うっかり何かを壊さないという自信が必要です。リファクタリングとは、振る舞いを保存する小さなステップを大量につなげることです。ステップを小さく保つことで、失敗する可能性を下げます。しかし私は、自分がどれほど単純な変更でも失敗し得ることをよく知っています。だから必要な自信を得るには、失敗を捕まえるテストが必要です。

しかし、このようなコードは素直にはテストできません。計算された monthly views フィールドを assert するテストを書ければよいでしょう。何かが間違えば、ここが不正な答えになるはずだからです。ところが問題は、ライブの YouTube データにアクセスしていることです。人々は動画を見るものなので、YouTube の view count フィールドは定期的に変わり、テストは非決定的に赤くなります。

そこで最初の作業は、この flakiness を取り除くことです。YouTube のように見えるが決定的な応答を返す object、つまり Test Double を導入すればできます。残念ながら、ここで Legacy Code Dilemma にぶつかります。

> Legacy Code Dilemma: コードを変更するとき、テストがあるべきである。テストを用意するには、しばしばコードを変更しなければならない。
>
> -- Michael Feathers

テストなしでこの変更を行わざるを得ないので、YouTube との interaction を、test double を導入できる seam の背後へ移すために、思いつく限りもっとも小さく単純な変更を行う必要があります。そこで最初のステップとして Extract Method を使い、YouTube との interaction を routine の残りから分けて、独自の method にします。

class VideoService…

```ruby
def video_list
  @video_list = JSON.parse(File.read('videos.json'))
  ids = @video_list.map{|v| v['youtubeID']}
  response = call_youtube ids
  ids.each do |id|
    video = @video_list.find{|v| id == v['youtubeID']}
    youtube_record = response['items'].find{|v| id == v['id']}
    video['views'] = youtube_record['statistics']['viewCount'].to_i
    days_available = Date.today - Date.parse(youtube_record['snippet']['publishedAt'])
    video['monthlyViews'] = video['views'] * 365.0 / days_available / 12
  end
  return JSON.dump(@video_list)
end

def call_youtube ids
  client = GoogleAuthorizer.new(
    token_key: 'api-youtube',
    application_name: 'Gateway Youtube Example',
    application_version: '0.1'
    ).api_client
  youtube = client.discovered_api('youtube', 'v3')
  request = {
    api_method: youtube.videos.list,
    parameters: {
      id: ids.join(","),
      part: 'snippet, contentDetails, statistics',
    }
  }
  return JSON.parse(client.execute!(request).body)
end
```

これにより 2 つのことが達成されます。第一に、Google API 操作コードが独自の method にうまく引き出され、ほかの種類のコードからおおむね隔離されます。これ自体に価値があります。第二に、より緊急なこととして、テスト用の振る舞いに差し替えるための seam ができます。Ruby 組み込みの minitest library を使えば、object の個別 method を簡単に stub できます。

```ruby
class VideoServiceTester < Minitest::Test
  def setup
    vs = VideoService.new
    vs.stub(:call_youtube, stub_call_youtube) do
      @videos = JSON.parse(vs.video_list)
      @µS  =  @videos.detect{|v| 'wgdBVIX9ifA' == v['youtubeID']}
      @evo =  @videos.detect{|v| 'ZIsgHs0w44Y' == v['youtubeID']}
    end
  end
  def stub_call_youtube
    JSON.parse(File.read('test/data/youtube-video-list.json'))
  end
  def test_microservices_monthly_json
    assert_in_delta 5880, @µS ['monthlyViews'], 1
    assert_in_delta   20, @evo['monthlyViews'], 1
  end
  # further tests as needed…
end
```

YouTube 呼び出しを分けて stub することで、このテストは決定的に振る舞うようになります。少なくとも今日については、です。明日も動かすには、`Date.today` の呼び出しにも同じことをする必要があります。

```ruby
def setup
  Date.stub(:today, Date.new(2015, 2, 2)) do
    vs = VideoService.new
    vs.stub(:call_youtube, stub_call_youtube) do
      @videos = JSON.parse(vs.video_list)
      @µS  =  @videos.detect{|v| 'wgdBVIX9ifA' == v['youtubeID']}
      @evo =  @videos.detect{|v| 'ZIsgHs0w44Y' == v['youtubeID']}
    end
  end
end
```

### Separating the remote call into a connection object

コードを別々の関数へ置くことによる concern の分離は、第一段階の分離です。しかし concern が domain logic と外部データ提供者の扱いほど異なる場合、私は分離レベルを上げて別々の class にしたくなります。

Figure 1: 最初の状態では、video service class は 4 つの責務を含んでいます。

そこで最初のステップとして、新しい class を作り、Move Method を使います。

class VideoService…

```ruby
def call_youtube ids
  YoutubeConnection.new.list_videos ids
end
```

class YoutubeConnection…

```ruby
def list_videos ids
  client = GoogleAuthorizer.new(
    token_key: 'api-youtube',
    application_name: 'Gateway Youtube Example',
    application_version: '0.1'
    ).api_client
  youtube = client.discovered_api('youtube', 'v3')
  request = {
    api_method: youtube.videos.list,
    parameters: {
      id: ids.join(","),
      part: 'snippet, contentDetails, statistics',
    }
  }
  return JSON.parse(client.execute!(request).body)
end
```

これに合わせて、単に method を stub するのではなく、test double を返すよう stub を変更できます。

```ruby
def setup
  Date.stub(:today, Date.new(2015, 2, 2)) do
    YoutubeConnection.stub(:new, YoutubeConnectionStub.new) do
      @videos = JSON.parse(VideoService.new.video_list)
      @µS  =  @videos.detect{|v| 'wgdBVIX9ifA' == v['youtubeID']}
      @evo =  @videos.detect{|v| 'ZIsgHs0w44Y' == v['youtubeID']}
    end
  end
end

class YoutubeConnectionStub
  def list_videos ids
    JSON.parse(File.read('test/data/youtube-video-list.json'))
  end
end
```

このリファクタリングをするとき、新しくできた立派なテストが stub の向こう側で私が犯す間違いを捕まえてくれないことに注意しなければなりません。そのため、本番コードがまだ動くことを手で確認する必要があります。そして、聞かれる前に言っておくと、私はこの作業中に実際に間違えました。`list_videos` の引数を付け忘れたのです。私がたくさんテストする必要があるのには理由があります。

別 class にすることで得られる concern のより大きな分離は、テストのためのより良い seam も与えてくれます。stub する必要があるものを単一の object creation に包めます。これは、テスト中に同じ service object を複数回呼ぶ必要がある場合に特に便利です。

YouTube 呼び出しを connection object へ移したので、video service 上の method はもう持つ価値がなくなりました。そこで Inline Method を適用します。

class VideoService…

```ruby
def video_list
  @video_list = JSON.parse(File.read('videos.json'))
  ids = @video_list.map{|v| v['youtubeID']}
  response = YoutubeConnection.new.list_videos ids
  ids.each do |id|
    video = @video_list.find{|v| id == v['youtubeID']}
    youtube_record = response['items'].find{|v| id == v['id']}
    video['views'] = youtube_record['statistics']['viewCount'].to_i
    days_available = Date.today - Date.parse(youtube_record['snippet']['publishedAt'])
    video['monthlyViews'] = video['views'] * 365.0 / days_available / 12
  end
  return JSON.dump(@video_list)
end
```

stub が JSON 文字列を parse しなければならないのは気に入りません。全体として、connection object は Humble Object として保ちたいと思っています。そこに振る舞いがあってもテストされないからです。そのため、parse は caller 側へ引き出すことを好みます。

```ruby
def video_list
  @video_list = JSON.parse(File.read('videos.json'))
  ids = @video_list.map{|v| v['youtubeID']}
  response = JSON.parse(YoutubeConnection.new.list_videos(ids))
  ids.each do |id|
    video = @video_list.find{|v| id == v['youtubeID']}
    youtube_record = response['items'].find{|v| id == v['id']}
    video['views'] = youtube_record['statistics']['viewCount'].to_i
    days_available = Date.today - Date.parse(youtube_record['snippet']['publishedAt'])
    video['monthlyViews'] = video['views'] * 365.0 / days_available / 12
  end
  return JSON.dump(@video_list)
end
```

Figure 2: 最初の大きなステップでは、YouTube connection code を **connection object** へ分離します。

### Separating the youtube data structure into a Gateway

YouTube への基本的な connection が分離され、stub 可能になったので、YouTube のデータ構造を掘り進むコードに取り組めます。ここでの問題は、view count data を得るには結果の `"statistics"` 部分を見る必要があり、published date を得るには代わりに `"snippet"` section を掘る必要があることを、多くのコードが知っていなければならない点です。この種の掘り進みは remote source のデータではよくあります。データは彼らにとって意味のある形で整理されていて、私にとっての形ではありません。

これはまったく妥当な振る舞いです。彼らは私の必要を洞察できません。私自身、それを把握するだけでも十分に苦労しています。

これを考えるよい方法は、Eric Evans の Bounded Context の考え方です。YouTube は自分たちの context に従ってデータを整理します。一方、私は別の context に従って自分のデータを整理したいのです。2 つの bounded context を組み合わせるコードは、2 つの別々の語彙を混ぜるため込み入ります。私は、それらを Eric のいう anti-corruption layer、つまり両者を分ける明確な境界で分離する必要があります。

彼は anti-corruption layer を万里の長城になぞらえています。このような壁では、いくつかのものを通す gateway が必要です。ソフトウェアで言えば、gateway によって壁の向こう側へ手を伸ばし、YouTube bounded context から必要なデータを得られます。しかし gateway は、彼らの context ではなく、私の context で意味を持つ形で表現されるべきです。

この単純な例では、client が YouTube データ構造でそれがどう保存されているかを知らなくても、published date と view count を返せる gateway object を意味します。gateway object は、YouTube の context から私の context へ翻訳します。

connection から得た response で初期化する gateway object を作るところから始めます。

```ruby
def video_list
  @video_list = JSON.parse(File.read('videos.json'))
  ids = @video_list.map{|v| v['youtubeID']}
  youtube = YoutubeGateway.new(YoutubeConnection.new.list_videos(ids))
  ids.each do |id|
    video = @video_list.find{|v| id == v['youtubeID']}
    youtube_record = youtube.record(id)
    video['views'] = youtube_record['statistics']['viewCount'].to_i
    days_available = Date.today - Date.parse(youtube_record['snippet']['publishedAt'])
    video['monthlyViews'] = video['views'] * 365.0 / days_available / 12
  end
  return JSON.dump(@video_list)
end

class YoutubeGateway
  def initialize responseJson
    @data = JSON.parse(responseJson)
  end
  def record id
    @data['items'].find{|v| id == v['id']}
  end
end
```

この時点では、できるだけ単純な振る舞いを作りました。最終的に gateway の `record` method を使うつもりはなく、お茶を飲みに行かない限り 30 分も残らないだろうと思っています。

次に、views のための掘り進み logic を service から gateway へ移し、各 video record を表すための gateway item を作ります。

```ruby
def item id
  {
    'views' => record(id)['statistics']['viewCount'].to_i
  }
end
```

published date についても同じことをします。

```ruby
def item id
  {
    'views'     => record(id)['statistics']['viewCount'].to_i,
    'published' => Date.parse(record(id)['snippet']['publishedAt'])
  }
end
```

gateway 内で record を key で lookup して使っているので、その使い方を internal data structure によりよく反映したくなります。list を hash に置き換えればできます。

```ruby
class YoutubeGateway
  def initialize responseJson
    @data = JSON.parse(responseJson)['items']
      .map{|i| [ i['id'], i ] }
      .to_h
  end
  def item id
    {
      'views' =>  @data[id]['statistics']['viewCount'].to_i,
      'published' => Date.parse(@data[id]['snippet']['publishedAt'])
    }
  end
end
```

Figure 4: データ処理を **gateway object** へ分離します。

ここまでで、私がやりたかった重要な分離はできました。YouTube connection object は YouTube への呼び出しを扱い、データ構造を返し、それを YouTube gateway object へ渡します。service code は、異なるサービス内でデータがどう保存されているかではなく、私がそのデータをどう見たいかに集中できるようになりました。

class VideoService…

```ruby
def video_list
  @video_list = JSON.parse(File.read('videos.json'))
  ids = @video_list.map{|v| v['youtubeID']}
  youtube = YoutubeGateway.new(YoutubeConnection.new.list_videos(ids))
  ids.each do |id|
    video = @video_list.find{|v| id == v['youtubeID']}
    video['views'] = youtube.item(id)['views']
    days_available = Date.today - youtube.item(id)['published']
    video['monthlyViews'] = video['views'] * 365.0 / days_available / 12
  end
  return JSON.dump(@video_list)
end
```

### Separating the domain logic into a Domain Object

YouTube との interaction はすべて別々の object に分けられましたが、video service はまだ domain logic、つまり monthly views の計算と、ローカルに保存されたデータとサービス内データの関係を choreograph するコードを混ぜています。video の domain object を導入すれば、それを分けられます。

最初のステップは、video data の hash を単純に object で包むことです。

class Video…

```ruby
def initialize aHash
  @data = aHash
end
def [] key
  @data[key]
end
def []= key, value
  @data[key] = value
end
def to_h
  @data
end
```

class VideoService…

```ruby
def video_list
  @video_list = JSON.parse(File.read('videos.json')).map{|h| Video.new(h)}
  ids = @video_list.map{|v| v['youtubeID']}
  youtube = YoutubeGateway.new(YoutubeConnection.new.list_videos(ids))
  ids.each do |id|
    video = @video_list.find{|v| id == v['youtubeID']}
    video['views'] = youtube.item(id)['views']
    days_available = Date.today - youtube.item(id)['published']
    video['monthlyViews'] = video['views'] * 365.0 / days_available / 12
  end
  return JSON.dump(@video_list.map{|v| v.to_h})
end
```

計算 logic を新しい video object へ移すには、まず move しやすい形に整える必要があります。video domain object と YouTube gateway item を引数に取る単一 method として、video service 上にまとめます。その最初のステップとして、gateway item に Extract Variable を適用します。

```ruby
def video_list
  @video_list = JSON.parse(File.read('videos.json')).map{|h| Video.new(h)}
  ids = @video_list.map{|v| v['youtubeID']}
  youtube = YoutubeGateway.new(YoutubeConnection.new.list_videos(ids))
  ids.each do |id|
    video = @video_list.find{|v| id == v['youtubeID']}
    youtube_item = youtube.item(id)
    video['views'] = youtube_item['views']
    days_available = Date.today - youtube_item['published']
    video['monthlyViews'] = video['views'] * 365.0 / days_available / 12
  end
  return JSON.dump(@video_list.map{|v| v.to_h})
end
```

そうすれば、計算 logic を独自 method へ簡単に抽出できます。

```ruby
def enrich_video video, youtube_item
  video['views'] = youtube_item['views']
  days_available = Date.today - youtube_item['published']
  video['monthlyViews'] = video['views'] * 365.0 / days_available / 12
end
```

その後は、Move Method を適用して video へ移すのは簡単です。

```ruby
class Video
  def enrich_with_youtube youtube_item
    @data['views'] = youtube_item['views']
    days_available = Date.today - youtube_item['published']
    @data['monthlyViews'] = @data['views'] * 365.0 / days_available / 12
  end
end
```

これができたら、video の hash を更新する accessor を取り除けます。

今や適切な object があるので、service method 内の ids に関する choreography を単純にできます。まず `youtube_item` に Inline Temp を適用し、次に enumeration index への参照を video object の method call に置き換えます。

```ruby
def video_list
  @video_list = JSON.parse(File.read('videos.json')).map{|h| Video.new(h)}
  ids = @video_list.map{|v| v['youtubeID']}
  youtube = YoutubeGateway.new(YoutubeConnection.new.list_videos(ids))
  ids.each do |id|
    video = @video_list.find{|v| id == v['youtubeID']}
    video.enrich_with_youtube(youtube.item(video.youtube_id))
  end
  return JSON.dump(@video_list.map{|v| v.to_h})
end

class Video
  def youtube_id
    @data['youtubeID']
  end
end
```

これにより、enumeration で object を直接使えるようになります。

```ruby
def video_list
  @video_list = JSON.parse(File.read('videos.json')).map{|h| Video.new(h)}
  ids = @video_list.map{|v| v.youtube_id}
  youtube = YoutubeGateway.new(YoutubeConnection.new.list_videos(ids))
  @video_list.each {|v| v.enrich_with_youtube(youtube.item(v.youtube_id))}
  return JSON.dump(@video_list.map{|v| v.to_h})
end
```

そして video から hash 用の accessor を取り除きます。

video object の内部 hash を field に置き換えることもできますが、そうする価値はないと思います。主に hash からロードされ、最終出力も JSON 化された hash だからです。Embedded Document は domain object の形としてまったく妥当です。

### Musings on the final objects

Figure 5: このリファクタリングを通じて作られた object と、その依存関係。

最終的な主要コードは次のようになります。

```ruby
class VideoService
  def video_list
    @video_list = JSON.parse(File.read('videos.json')).map{|h| Video.new(h)}
    ids = @video_list.map{|v| v.youtube_id}
    youtube = YoutubeGateway.new(YoutubeConnection.new.list_videos(ids))
    @video_list.each {|v| v.enrich_with_youtube(youtube.item(v.youtube_id))}
    return JSON.dump(@video_list.map{|v| v.to_h})
  end
end

class YoutubeConnection
  def list_videos ids
    client = GoogleAuthorizer.new(
      token_key: 'api-youtube',
      application_name: 'Gateway Youtube Example',
      application_version: '0.1'
      ).api_client
    youtube = client.discovered_api('youtube', 'v3')
    request = {
      api_method: youtube.videos.list,
      parameters: {
        id: ids.join(","),
        part: 'snippet, contentDetails, statistics',
      }
    }
    return client.execute!(request).body
  end
end

class YoutubeGateway
  def initialize responseJson
    @data = JSON.parse(responseJson)['items']
      .map{|i| [ i['id'], i ] }
      .to_h
  end
  def item id
    {
      'views' =>  @data[id]['statistics']['viewCount'].to_i,
      'published' => Date.parse(@data[id]['snippet']['publishedAt'])
    }
  end
end

class Video
  def initialize aHash
    @data = aHash
  end
  def to_h
    @data
  end
  def youtube_id
    @data['youtubeID']
  end
  def enrich_with_youtube youtube_item
    @data['views'] = youtube_item['views']
    days_available = Date.today - youtube_item['published']
    @data['monthlyViews'] = @data['views'] * 365.0 / days_available / 12
  end
end
```

では、私は何を達成したのでしょうか。リファクタリングはしばしばコードサイズを減らしますが、この場合は 26 行から 54 行へ、ほぼ倍になっています。他の条件が同じなら、コードは少ない方がよいものです。しかしここでは、concern を分けることで得られるよりよい modularity は、たいていサイズ増加に見合うと思います。教育用の、つまり toy example の大きさが、ポイントを見えにくくするのもこういうところです。

26 行のコードは理解するのに大した量ではありません。しかし、このスタイルで書かれた 2600 行について話しているなら、modularity はコードサイズ増加に十分見合います。そして通常、大きなコードベースでこの種のことを行う場合、重複を取り除いてコードサイズを減らす機会がより多く見つかるため、その増加はもっと小さくなります。

最終的に、ここでは 4 種類の object、つまり coordinator、domain object、gateway、connection で終わっていることに気づくでしょう。これは責務のよくある配置ですが、依存関係の置き方には、場合によって妥当な variation があります。責務と依存関係の最良の配置は、個別の必要性によって異なります。頻繁に変更されるコードは、めったに変更されないコード、あるいは単に異なる理由で変更されるコードから分けるべきです。

広く再利用されるコードは、特定のケースだけで使われるコードに依存すべきではありません。こうした driver は状況ごとに異なり、依存関係のパターンを左右します。

よくある変更の 1 つは、domain object と gateway の依存方向を反転し、gateway を Mapper にすることです。これにより、domain object は自分がどう populate されるかから独立できます。その代償として、mapper は domain object を知り、その内部にある程度アクセスする必要があります。domain object が多くの context で使われるなら、この配置には価値があります。

別の変更として、connection を呼び出すコードを coordinator から gateway へ移すことも考えられます。これにより coordinator は単純になりますが、gateway は少し複雑になります。これがよい考えかどうかは、coordinator が複雑になりすぎているか、あるいは多くの coordinator が同じ gateway を使い、connection の設定コードが重複しているかに依存します。

connection の振る舞いの一部を caller へ移す可能性も高いと思います。特に caller が gateway object ならそうです。gateway は自分が必要とするデータを知っているので、呼び出しの parameters に含める parts の list を提供すべきです。ただしこれは、`list_videos` を呼ぶ client が他にも現れたときに初めて問題になるので、その日まで待つでしょう。

どのような詳細になるにせよ、関与する object の役割に対して一貫した命名方針を持つことが重要だと感じています。コードに pattern 名を入れるべきではないという人の声を聞くことがありますが、私は同意しません。pattern 名は、さまざまな要素が果たす役割を伝えるのに役立つことがよくあります。その機会を避けるのはもったいないことです。チーム内では、コードに共通パターンが現れるはずで、命名はそれを反映すべきです。

私は P of EAA で Gateway pattern という名前を作ったことに従って、「gateway」を使っています。ここでは、外部システムへの生の link を示すために「connection」を使いました。今後の文章でもこの慣例を使うつもりです。この命名規約は普遍的ではありませんし、私の命名規約を使ってくれれば私の自尊心は心地よく膨らむでしょうが、重要なのはどの命名規約を使うべきかではありません。何らかの規約を選ぶことです。

このように method を object 群へ分けると、テストへの影響について自然な疑問が出ます。元の video service method には unit test がありました。では、新しくできた 3 つの class にテストを書くべきでしょうか。私の傾向としては、既存テストが十分に振る舞いを覆っているなら、すぐに追加する必要はありません。

振る舞いを追加するにつれて、テストも追加すべきです。そして、その振る舞いが新しい object に追加されるなら、新しいテストはそこに焦点を当てます。時間がたてば、現在 video service を対象にしている一部のテストが場違いに見え、移動すべきになるかもしれません。しかし、それは将来のことであり、将来扱えばよいことです。

テストで特に見張っておきたいのは、YouTube connection に対して入れた stub の使い方です。このような stub はとても簡単に手に負えなくなり、単純な production code の変更が多くのテスト更新につながって、実際に変更を遅くすることがあります。ここでの本質は、test code の重複に注意を払い、production code の重複と同じくらい真剣に対処することです。

test double の組織化について考えると、自然に service object の組み立てという広い問いへつながります。単一の service object から、3 つの service object と domain entity へ振る舞いを分けたので、service object をどのように instantiate し、configure し、assemble するべきかという自然な問いが生まれます。現在、video service は dependents を直接作っていますが、大きなシステムではこれはすぐに手に負えなくなります。

この複雑さを扱うには、Service Locator や Dependency Injection のような技法を使うのが一般的です。ここではそれについては話しませんが、続編の記事の題材になるかもしれません。

この例では object を使っています。大きな理由は、私が functional style より object-oriented style にはるかに慣れているからです。しかし、基本的な責務分割は同じになるだろうと思います。ただし境界は class や method ではなく、function、あるいは namespace によって設定されるでしょう。その他の詳細も変わります。video object は data structure になり、それを enrich することは in-place 変更ではなく、新しい data structure の作成になるでしょう。

functional style でこれを見るのは、面白い記事になるでしょう。

リファクタリングとは、小さな振る舞い保存の変換を連続して行う、コード変更の特定の方法です。単にコードを動かすことではありません。

最後に、リファクタリングについて重要な一般論をもう一度強調したいと思います。リファクタリングという言葉は、コードベースのどんな再構成にも使うべき言葉ではありません。これは、一連のとても小さな振る舞い保存の変更を適用するアプローチを具体的に意味します。ここでは、しばらく後で取り除くと分かっているコードを、振る舞いを保つ小さなステップを取るためだけに、意図的に導入した例をいくつか見ました。

ここでの要点は、**小さなステップを取ることで、壊さずに済み、デバッグを避けられるため、結果として速く進める**ということです。多くの人はこれを直感に反すると感じます。Kent Beck がどのようにリファクタリングするかを初めて見せてくれたとき、私もそう感じました。しかし私はすぐに、それがどれほど効果的かを発見しました。
