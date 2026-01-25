// Geminiが理解できる関数の定義
export const nexusTools = [
  {
    functionDeclarations: [
      {
        name: "manage_service",
        description: "LaruBot、LaruVisona、flastalなどのサービスを再起動、停止、またはスケーリングします。",
        parameters: {
          type: "OBJECT",
          properties: {
            serviceName: { type: "STRING", description: "対象のサービス名 (larubot, laruvisona, flastal)" },
            action: { type: "STRING", enum: ["RESTART", "STOP", "SCALE_UP", "SCALE_DOWN"], description: "実行するアクション" }
          },
          required: ["serviceName", "action"]
        }
      },
      {
        name: "get_system_report",
        description: "現在の全システムの負荷状況やエラーログの要約を取得します。",
        parameters: { type: "OBJECT", properties: {} }
      }
    ]
  }
];