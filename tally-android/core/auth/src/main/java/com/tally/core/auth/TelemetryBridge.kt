package com.tally.core.auth

object TelemetryBridge {
  var track: (event: String, properties: Map<String, Any?>) -> Unit = { _, _ -> }
}
