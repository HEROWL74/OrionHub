# OrionHub (OrionEngine Launcher)

OrionEngineの導入とプロジェクト作成を簡略化するための専用ランチャーです。  
エンジンのダウンロードから新規プロジェクト作成までを一元化し、開発開始までの手間を大幅に削減することを目的としています。

* **Orion Hub**: プロジェクトイメージ<img width="1431" height="1059" alt="スクリーンショット 2026-03-03 091602" src="https://github.com/user-attachments/assets/f691ddb5-e6c6-41cc-ba0f-dfd7228fe8d3" />

## 🎯 解決した課題

従来、ゲームエンジンのセットアップには
- 環境構築
- エンジン配置
- プロジェクト作成

など複数の手順が必要でした。

OrionHubではこれらを統合し、
**誰でも短時間で開発を開始できる環境を提供**しています。

## 📊 成果

![image](https://github.com/user-attachments/assets/e29d1a3e-c89e-4a3b-a697-89e368f7c149)

14名のテスターに対して検証を行い、
エンジンダウンロードから新規プロジェクト作成までの時間を測定した結果：

👉 平均 2〜3分で環境構築に成功

従来の手動セットアップと比較して、大幅な時間短縮を実現しました。

## ✨ 主な機能

- エンジンバージョンの管理・インストール
- 新規プロジェクト作成機能
- プロジェクト一覧管理
- ルートディレクトリ設定

## 📦 ダウンロード

最新のリリースはこちら：
https://github.com/HEROWL74/OrionHub/releases/latest
OrionEngine本体のリポジトリはこちら:
https://github.com/HEROWL74/OrionEngine

### セットアップ手順

① **インストーラーの実行** 上記のReleasesから `OrionHub-Setup-1.0.0.exe` をダウンロードし、実行してください。インストール完了後、Hubが自動的に起動します。

② **ルートフォルダの設定** Hub上部にある **[Select Orion Root Folder]** ボタンをクリックし、エンジンやプロジェクトを保存する基準フォルダ（例：`C:\Users\(ユーザー名)\OrionProject`）を選択してください。

③ **エンジンのインストール** **[Available Engine Versions]** セクションに表示されているバージョン（例：v0.0.0）をクリックします。ステータスが `(Installed)` になれば準備完了です。（※そのままエンジンバージョンがSelect Engineに自動で追加されるため、Project名を入力するだけでプロジェクトが作成できます。）

④ **新規プロジェクトの作成** **[Create New Project]** セクションで以下を入力・選択し、**[Create Project]** をクリックしてください。

画面下の **[Your Projects]** にプロジェクトが表示されれば、全てのセットアップが完了です。
