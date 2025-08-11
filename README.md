# One-Question-a-Day (AWS Exam Agent)

## 1. アプリ概要
- 本アプリは、週1回の試験問題配信を行うサブスクリプション型Webアプリです。  
- React + TypeScript による SPA 構築
- AWS のサーバーレスサービスを活用し、コスト効率とスケーラビリティの両立を図る。

---

## 2. 開発方向
- 課題：
  - 物理サーバーや自前メールサーバー運用の負担、アクセス増加時のスケーリング対応
- 解決策：
  - AWS Lambda / DynamoDB / SES / CloudFront などマネージドサービスを組み合わせて自動化・拡張性確保
  - サーバー運用やスケーリング、メール配信のインフラ構築などは AWS サービスを活用することで手間を省き、低コストかつ短期間でスケーラブルなアプリケーションを構築
  - 将来的な機能拡張（新問題配信、履歴管理、ダッシュボードUI改善）を見据えた構成

---

## 3. 全体設計
### アーキテクチャ図

```mermaid

flowchart TD
  user[User -- Browser]
  cf[CloudFront CDN]
  s3[S3 -- Static Hosting / React + Vite + Tailwind SPA]
  api[Amazon API Gateway]
  lamA[Lambda: questionCurrent / list / subscribe / unsubscribe]
  ddb[(DynamoDB\nQuestions / Users)]
  evb[EventBridge -- Schedule]
  lamW[Lambda: sendWeekly]
  ses[Amazon SES -- Email]
  cogU[Cognito User Pool]
  cogI[Cognito Identity Pool]
  amp[AWS Amplify -- Auth library]

  user -->|GET SPA| cf
  cf --> s3

  user -.->|XHR / Fetch JSON| api
  api --> lamA --> ddb

  evb -->|weekly| lamW --> ses
  lamA --> ses

  %% Auth (dotted)
  user -. 認証 .-> cogU
  amp -. SDK .-> cogU
  cogU -. (optional) .-> cogI

```

### 主な機能要件
- **Cognito 認証**: Amplify 経由でログイン・ログアウト
- **問題配信API**: API Gateway + Lambda + DynamoDB
- **定期配信メール**: EventBridge でスケジュール → SES 送信
- **フロントエンドホスティング**: S3 + CloudFront
- **IaC管理**: AWS CDK によるスタック構築
- **自動デプロイ**: GitHub Actions + CLI スクリプト

---

## 4. 完成項目（検証済み）
- [☑️] Cognito 認証（新規登録 / ログイン / ログアウト）
- [☑️] DynamoDB 問題データ登録（Seed Lambda）
- [☑️] API Gateway 経由での問題取得（/question/current, /questions）
- [☑️] S3 + CloudFront による SPA 配信
- [☑️] CDK によるバックエンド一括デプロイ
- [☑️] フロントエンド自動アップロード & S3 へのファイル同期＋CloudFront キャッシュ無効化
- [☑️] CLI での DynamoDB データ確認スクリプト

---

## 5. 追加予定機能

- [ ] 退会API（unsubscribe）の最終テストとUI反映（成功・失敗メッセージ）
- [ ] SES の本番モード移行（Sandbox解除）／送信ドメイン・DKIM/DMARC 設定
- [ ] 定期配信の本運用：EventBridge ルール作成・失敗リトライ／DLQ 設計
- [ ] Questions 管理の管理画面（作成・更新・検索・タグ絞り込み）
- [ ] CloudWatch Dashboards／構造化ログ・メトリクス・アラーム整備
- [ ] API のバリデーション／レート制御（WAF/Throttle）
- [ ] CI/CD 拡充（PRごとのプレビュー、Infra/FEの差分デプロイ）
- [ ] インフラ強化（S3 設定見直し、CloudFront セキュリティヘッダ、最小権限 IAM）
- [ ] （将来）AppSync/GraphQL 構成の検証

---

## 検証手順例
1. **Cognito**: 新規登録 → ログイン → ログアウト
2. **練習問題API**: /question/current にアクセスし表示を確認
3. **DynamoDB**: CLI またはコンソールで最新データを確認
4. **フロントエンド**: CloudFront URL で最新UIが反映されているか確認
5. **メール送信**: SES 本番移行後、実際に受信できるか確認
