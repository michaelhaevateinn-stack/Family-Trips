Family Trips v3.0 — Googleログイン・UID確認版

【GitHub Pagesへの反映】
このZIP内の4ファイルをGitHubのFamily-Tripsリポジトリのルートへアップロードし、既存のindex.html等を置き換えてください。

【今回できること】
Googleアカウントでログインして、メールアドレスとUIDを確認・コピーできます。
Firestore / Storage への読み書きはまだ実装していません。既存の旅行記録・表紙写真は従来通りブラウザ内に残ります。

【重要】
・旅行18件のJSONや家族写真をGitHubにアップロードしないでください。
・今の端末で「⚙ データ」→「1」を選び、必ずJSONバックアップを保管してください。
・FirebaseのFirestore/Storageルールは引き続き全アクセス拒否のままにしてください。
・本人と配偶者それぞれでログインし、UIDを確認したら、2人のUIDを使ってセキュリティルールを設定します。
・現時点でクラウド同期は動作しません。ルール設定後に同期版を作ります。
・GoogleログインがiOSのアプリ内ブラウザで動かない場合はSafariで直接開いてください。


v3.6.2: localStorage quota errors no longer block cloud sync when enabled. Cloud status must show saved before considering the change complete. No data is deleted.


v3.6.3 Firebase Only
- 旅行データのlocalStorageへの書き込みを廃止。Firestoreを唯一の永続保存先とする。
- 旧端末データは読取専用で維持。クラウドと異なる場合は自動上書きせず手動確認。
- 写真はFirebase Storage、家族設定はFirestore。
- 保存表示は非同期です。必ず「☁ 保存済み」を確認してから画面を閉じてください。
- 旧データの削除は行いません。データのJSONバックアップを推奨。
- 複数端末で同時編集すると後からの保存が上書きする可能性があります。


v3.6.4 起動時クラウド自動読込
- Googleログイン状態確認後、Firestoreから旅行一覧を読み込み、完了後に表示します。
- 読込失敗時は一覧を表示せず、編集を無効化します。再読込ボタンで再試行できます。
- ブラウザ内に旅行データを永続保存しません。既存Firebaseデータを削除しません。
- 初回クラウドが空の場合はJSONバックアップから移行してください。
- 本番Firebaseとの接続テストは未実施です。
