import Foundation
import TallyCore

final class AppTelemetryClient: TelemetryClient {
    private let posthogKey = Bundle.main.object(forInfoDictionaryKey: "PosthogApiKey") as? String ?? ""
    private let posthogHost = Bundle.main.object(forInfoDictionaryKey: "PosthogHost") as? String ?? "https://app.posthog.com"

    func capture(_ event: TelemetryEvent, properties: [String: String], context: TelemetryContext) async {
        guard !posthogKey.isEmpty else { return }
        let payload: [String: Any] = [
            "api_key": posthogKey,
            "event": event.rawValue,
            "distinct_id": context.userId ?? context.sessionId,
            "properties": [
                "platform": context.platform,
                "env": context.env,
                "app_version": context.appVersion ?? "",
                "build_number": context.buildNumber ?? "",
                "user_id": context.userId ?? "",
                "is_signed_in": context.isSignedIn,
                "session_id": context.sessionId,
                "trace_id": context.traceId,
                "span_id": context.spanId,
                "request_id": context.requestId
            ].merging(properties) { _, new in new }
        ]
        await sendPayload(payload)
    }

    func logWideEvent(_ event: TelemetryEvent, properties: [String: String], context: TelemetryContext) async {
        let payload: [String: Any] = [
            "type": "wide_event",
            "event": event.rawValue,
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "platform": context.platform,
            "env": context.env,
            "app_version": context.appVersion ?? "",
            "build_number": context.buildNumber ?? "",
            "user_id": context.userId ?? "",
            "is_signed_in": context.isSignedIn,
            "session_id": context.sessionId,
            "trace_id": context.traceId,
            "span_id": context.spanId,
            "request_id": context.requestId
        ].merging(properties) { _, new in new }
        if let data = try? JSONSerialization.data(withJSONObject: payload, options: []),
           let json = String(data: data, encoding: .utf8) {
            print(json)
        } else {
            print(payload)
        }
    }

    private func sendPayload(_ payload: [String: Any]) async {
        guard let url = URL(string: "\(posthogHost)/capture") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload, options: [])
        _ = try? await URLSession.shared.data(for: request)
    }
}
