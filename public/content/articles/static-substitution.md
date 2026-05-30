# Static Substitution

## 要約

Static Substitutionは、staticな変数やメソッドに閉じ込められた依存を、テスト時に差し替えられる形へ近づけるためのリファクタリングです。static初期化とstaticメソッドだけで構成されたサービスは、実装の差し替えが難しく、Service Stubを使ったテストを妨げます。

この記事では、staticなデータをインスタンスデータへ移し、staticメソッドをシングルトンへの委譲に変えたうえで、唯一のインスタンスを差し替えるメソッドを追加する手順を示します。ただし、シングルトン自体にも初期化や依存の問題が残るため、あくまで有用な第一歩として扱うべきだと述べています。

## 読むときの観点

- staticな依存が、テスト時の置き換えをどのように妨げるかを見る。
- 「staticをシングルトンへ置き換える」ことは最終解ではなく、差し替え可能性への中間手段として読む。
- static initializerで実サービスを作ってしまう問題に注意する。
- SingletonやRegistryを使うなら、インスタンスだけでなく初期化も置き換えられるかを確認する。

## 原文の翻訳

開発チームが自分たちの仕事について話しているのを聞いていると、よく出てくる共通の話題があります。それは、staticに保持されたものを嫌がる、ということです。典型的には、共通サービスやコンポーネントが、static initializerを持つstatic変数に保持されています。staticの大きな問題のひとつは、多くの言語では、ポリモーフィズムを使ってある実装を別の実装へ置き換えられないことです。これは私たちにかなり響きます。私たちはテストの大ファンであり、うまくテストするには、サービスをService Stubで置き換えられることが重要だからです。

この種のstaticの例を示します。

```java
public class AddressBook {
  private static String connectionString, username, password;

  static {
    Properties props = getProperties();
    connectionString =(String) props.get("db.connectionString");
    password = (String) props.get("db.password");
    username = (String) props.get("db.username");
  }

  public static Person findByLastName(String s) {
    String query =
      "SELECT lastname, firstname FROM PEOPLE where lastname = ?";
    Connection conn = null;
    PreparedStatement st = null;
    ResultSet rs = null;
    try {
      conn = DriverManager.getConnection(connectionString,
                                         username,
                                         password);
      st = conn.prepareStatement(query);
      st.setString(1, s);
      rs = st.executeQuery();
      rs.next();
      Person result = new Person (rs.getString(2), rs.getString(1));
      return result;
    } catch (Exception e) {
      throw new RuntimeException(e);
    } finally {
      cleanUp(conn, st, rs);
    }
  }
}
```

ここにあるのは、static initializerで初期化される一連の設定情報と、データベースに対してクエリを実行するstaticメソッドです。

この形でも簡単な変更はできます。propertiesファイルを変えれば、このプログラムが接続するデータベースを簡単に変えられます。しかしテストでは、そもそもデータベースに接続したくないかもしれません。単純なstubなら、決め打ちのデータを返すだけで済みます。

単純な置き換えを可能にするには、少しリファクタリングが必要です。最初のステップは、staticをシングルトンに変えることです。

```java
public class AddressBook {

    private static AddressBook soleInstance = new AddressBook();

    private String connectionString, username, password;

    public AddressBook() {
        Properties props = getProperties();
        connectionString =(String) props.get("db.connectionString");
        password = (String) props.get("db.password");
        username = (String) props.get("db.username");
    }

    public static Person findByLastName(String s) {
        return  soleInstance.findByLastNameImpl(s);
    }

    public Person findByLastNameImpl(String s) {
        String query = "SELECT lastname, firstname FROM PEOPLE where lastname = ?";
        Connection conn = null;
        PreparedStatement st = null;
        ResultSet rs = null;
        try {
            conn = DriverManager.getConnection(connectionString, username, password);
            st = conn.prepareStatement(query);
            st.setString(1, s);
            rs = st.executeQuery();
            rs.next();
            Person result = new Person (rs.getString(2), rs.getString(1));
            return result;
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            cleanUp(conn, st, rs);
        }
    }
}
```

これはかなり素直なリファクタリングです。

- 古いクラス上のstaticデータをすべてインスタンスデータに変える。
- staticな初期化コードをコンストラクタへ移す。
- publicメソッドをすべて取り上げ、その本体をインスタンス側へ移し、staticメソッドは単純な委譲だけを残す。

このリファクタリングはカタログには入れていません。おそらく Replace Statics With Singleton と呼ぶべきかもしれません。

この時点では何も変わっていませんが、置き換えを支援する方向への一歩にはなっています。次のステップは、唯一のインスタンスを読み込むメソッドを導入することです。

```java
public static void loadInstance(AddressBook arg) {
    soleInstance = arg;
}
```

これで、テストなどの目的で置き換えを行う準備ができます。テストケースでは、`setUp`メソッドに`AddressBook.loadInstance(new StubAddressBook());`という適切な呼び出しを追加できます。stubがAddressBookをサブクラス化しているかぎり、実物ではなくstubを相手にテストできるようになります。

これで話が終わるわけではありません。特にこのコードでは、たとえ使わなくても実サービスのインスタンスを作らなければなりません。唯一のインスタンスがstatic initializerで初期化されるからです。これはサービスアクセスコードへの依存を強制し、それ自体が痛みを生むことがあります。これに対処するには、そのような初期化をstatic initializerから取り出し、それ自体も置き換え可能な別のinitializerクラスへ移す必要があります。とはいえ、少なくともこれは有用な第一歩になります。

この話は、シングルトンが蓄えてしまう問題も浮かび上がらせます。特に、シングルトン、あるいはRegistryのようなものを使うなら、**簡単に置き換えられることと、初期化も簡単に置き換えられること**を確かめてください。

Michael Feathersの新しい本『Working Effectively With Legacy Code』を入手したところです。彼は、こうした種類の問題の多くについて、より多く、よりうまく語っています。
