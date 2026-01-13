package app.tally.observability

import android.content.Context
import android.os.Build
import android.util.Base64
import io.opentelemetry.api.OpenTelemetry
import io.opentelemetry.api.common.AttributeKey
import io.opentelemetry.api.common.Attributes
import io.opentelemetry.api.trace.Span
import io.opentelemetry.api.trace.SpanKind
import io.opentelemetry.api.trace.StatusCode
import io.opentelemetry.api.trace.Tracer
import io.opentelemetry.context.Context as OtelContext
import io.opentelemetry.exporter.otlp.http.trace.OtlpHttpSpanExporter
import io.opentelemetry.sdk.OpenTelemetrySdk
import io.opentelemetry.sdk.resources.Resource
import io.opentelemetry.sdk.trace.SdkTracerProvider
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor
import okhttp3.Interceptor
import okhttp3.Response

/** Grafana Cloud instance ID for OTLP auth */
private const val GRAFANA_CLOUD_INSTANCE_ID = "1491410"

/**
 * OpenTelemetry setup for exporting traces to Grafana Cloud.
 * 
 * Initialize early in Application.onCreate() with:
 * ```
 * TallyTelemetry.initialize(
 *   context = this,
 *   endpoint = BuildConfig.OTEL_EXPORTER_OTLP_ENDPOINT,
 *   token = BuildConfig.GRAFANA_CLOUD_OTLP_TOKEN,
 *   environment = if (BuildConfig.DEBUG) "development" else "production",
 *   version = "${BuildConfig.VERSION_NAME}+${BuildConfig.VERSION_CODE}"
 * )
 * ```
 */
object TallyTelemetry {
  private var openTelemetry: OpenTelemetry? = null
  private var isInitialized = false

  /**
   * Initialize OpenTelemetry with OTLP HTTP exporter to Grafana Cloud.
   * 
   * @param context Android application context
   * @param endpoint OTLP HTTP endpoint (e.g., "https://otlp-gateway-prod-gb-south-1.grafana.net/otlp")
   * @param token Raw Grafana Cloud OTLP token (will be combined with instance ID for Basic auth)
   * @param environment deployment environment (development/staging/production)
   * @param version app version for service.version attribute
   */
  @JvmStatic
  fun initialize(
    context: Context,
    endpoint: String,
    token: String,
    environment: String = "production",
    version: String? = null
  ) {
    if (isInitialized) return
    if (endpoint.isBlank() || token.isBlank()) {
      android.util.Log.w("TallyTelemetry", "Missing endpoint or token, skipping initialization")
      return
    }

    // Build Basic auth header: base64(instanceId:token)
    val credentials = "$GRAFANA_CLOUD_INSTANCE_ID:$token"
    val authHeader = Base64.encodeToString(credentials.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)

    // Build resource attributes per Grafana Cloud semantic conventions
    val resourceBuilder = Resource.builder()
      .put(AttributeKey.stringKey("service.name"), "tally-android")
      .put(AttributeKey.stringKey("service.namespace"), "tally")
      .put(AttributeKey.stringKey("deployment.environment"), environment)
      .put(AttributeKey.stringKey("telemetry.sdk.language"), "kotlin")
      .put(AttributeKey.stringKey("os.type"), "linux")
      .put(AttributeKey.stringKey("os.name"), "Android")
      .put(AttributeKey.stringKey("os.version"), Build.VERSION.RELEASE)
      .put(AttributeKey.stringKey("device.model.identifier"), Build.MODEL)
      .put(AttributeKey.stringKey("device.manufacturer"), Build.MANUFACTURER)

    if (version != null) {
      resourceBuilder.put(AttributeKey.stringKey("service.version"), version)
    }

    val resource = resourceBuilder.build()

    // Configure OTLP HTTP exporter with Grafana Cloud auth
    val tracesEndpoint = if (endpoint.endsWith("/")) {
      "${endpoint}v1/traces"
    } else {
      "$endpoint/v1/traces"
    }

    val spanExporter = OtlpHttpSpanExporter.builder()
      .setEndpoint(tracesEndpoint)
      .addHeader("Authorization", "Basic $authHeader")
      .build()

    val tracerProvider = SdkTracerProvider.builder()
      .addSpanProcessor(BatchSpanProcessor.builder(spanExporter).build())
      .setResource(resource)
      .build()

    openTelemetry = OpenTelemetrySdk.builder()
      .setTracerProvider(tracerProvider)
      .build()

    isInitialized = true
    android.util.Log.i("TallyTelemetry", "Initialized with endpoint: $endpoint")
  }

  /**
   * Get a tracer for creating spans.
   */
  @JvmStatic
  fun tracer(name: String = "tally-android"): Tracer {
    return openTelemetry?.getTracer(name, "1.0.0")
      ?: OpenTelemetry.noop().getTracer(name)
  }

  /**
   * Create and start a span for tracking an operation.
   */
  @JvmStatic
  fun startSpan(name: String, kind: SpanKind = SpanKind.INTERNAL): Span {
    return tracer().spanBuilder(name)
      .setSpanKind(kind)
      .startSpan()
  }

  /**
   * Convenience wrapper to trace a suspend operation.
   */
  @JvmStatic
  suspend fun <T> trace(
    name: String,
    kind: SpanKind = SpanKind.INTERNAL,
    attributes: Map<String, String> = emptyMap(),
    block: suspend () -> T
  ): T {
    val span = tracer().spanBuilder(name)
      .setSpanKind(kind)
      .startSpan()

    attributes.forEach { (key, value) ->
      span.setAttribute(key, value)
    }

    return try {
      val scope = span.makeCurrent()
      try {
        block()
      } finally {
        scope.close()
      }
    } catch (e: Exception) {
      span.setStatus(StatusCode.ERROR, e.message ?: "Unknown error")
      span.recordException(e)
      throw e
    } finally {
      span.end()
    }
  }

  /**
   * OkHttp interceptor for automatic HTTP span creation.
   * Add to your OkHttpClient:
   * ```
   * OkHttpClient.Builder()
   *   .addInterceptor(TallyTelemetry.okHttpInterceptor())
   *   .build()
   * ```
   */
  @JvmStatic
  fun okHttpInterceptor(): Interceptor = Interceptor { chain ->
    val request = chain.request()
    
    // Skip tracing for OTLP export requests
    if (request.url.host.contains("grafana.net")) {
      return@Interceptor chain.proceed(request)
    }

    val span = tracer().spanBuilder("HTTP ${request.method}")
      .setSpanKind(SpanKind.CLIENT)
      .setAttribute("http.method", request.method)
      .setAttribute("http.url", request.url.toString())
      .setAttribute("http.host", request.url.host)
      .startSpan()

    val scope = span.makeCurrent()
    try {
      val response = chain.proceed(request)
      span.setAttribute("http.status_code", response.code.toLong())
      if (response.code >= 400) {
        span.setStatus(StatusCode.ERROR, "HTTP ${response.code}")
      }
      response
    } catch (e: Exception) {
      span.setStatus(StatusCode.ERROR, e.message ?: "Unknown error")
      span.recordException(e)
      throw e
    } finally {
      scope.close()
      span.end()
    }
  }
}
