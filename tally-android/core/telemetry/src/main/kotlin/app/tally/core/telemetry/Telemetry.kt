/**
 * Telemetry wrapper for Android platform
 *
 * Provides:
 * - Wide event logging (canonical log lines per loggingsucks.com)
 * - PostHog event capture with canonical properties
 * - OTel trace context propagation (when OTel Android SDK is added)
 * - Tail-sampling for cost control
 *
 * Wide Event Pattern:
 * - One comprehensive event per request/action per service
 * - Include all context needed for debugging
 * - Tail-sampling: always keep errors/slow, sample healthy traffic
 */

package app.tally.core.telemetry

import android.util.Log
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlin.random.Random

// MARK: - Configuration

/**
 * Telemetry configuration
 */
object TelemetryConfig {
    /** PostHog API key (set from BuildConfig or at runtime) */
    var posthogKey: String? = null
    
    /** PostHog host URL */
    var posthogHost: String = "https://eu.i.posthog.com"
    
    /** Honeycomb API key (for future OTel integration) */
    var honeycombKey: String? = null
    
    /** Current environment */
    var environment: String = if (BuildConfig.DEBUG) "development" else "production"
    
    /** App version */
    var appVersion: String = "0.0.0"
    
    /** Build number */
    var buildNumber: String = "0"
    
    /** Sample rate for healthy events (5%) */
    const val HEALTHY_SAMPLE_RATE: Double = 0.05
    
    /** Threshold for slow operations (2s) */
    const val SLOW_OPERATION_THRESHOLD_MS: Long = 2000
}

// MARK: - Event Types

/**
 * Canonical event names per observability schema
 */
enum class TelemetryEvent(val eventName: String) {
    APP_OPENED("app_opened"),
    AUTH_SIGNED_IN("auth_signed_in"),
    AUTH_SIGNED_OUT("auth_signed_out"),
    CHALLENGE_CREATED("challenge_created"),
    CHALLENGE_UPDATED("challenge_updated"),
    CHALLENGE_ARCHIVED("challenge_archived"),
    ENTRY_CREATED("entry_created"),
    ENTRY_UPDATED("entry_updated"),
    ENTRY_DELETED("entry_deleted"),
    DATA_EXPORT_STARTED("data_export_started"),
    DATA_EXPORT_COMPLETED("data_export_completed"),
    DATA_IMPORT_STARTED("data_import_started"),
    DATA_IMPORT_COMPLETED("data_import_completed"),
    API_REQUEST("api_request")
}

/**
 * Outcome of an operation
 */
enum class TelemetryOutcome(val value: String) {
    SUCCESS("success"),
    ERROR("error")
}

// MARK: - Property Types

/**
 * Common properties included on every event
 */
@Serializable
data class CommonProperties(
    val platform: String = "android",
    val env: String = TelemetryConfig.environment,
    val appVersion: String = TelemetryConfig.appVersion,
    val buildNumber: String = TelemetryConfig.buildNumber,
    val userId: String? = null,
    val isSignedIn: Boolean = userId != null,
    val sessionId: String? = null,
    val traceId: String? = null,
    val spanId: String? = null,
    val requestId: String? = null
)

/**
 * Domain-specific properties
 */
@Serializable
data class DomainProperties(
    val challengeId: String? = null,
    val timeframeUnit: String? = null,
    val targetNumber: Int? = null,
    val entryId: String? = null,
    val entryCount: Int? = null,
    val hasNote: Boolean? = null,
    val hasSets: Boolean? = null,
    val feeling: String? = null
)

/**
 * Request-specific properties
 */
@Serializable
data class RequestProperties(
    val method: String? = null,
    val path: String? = null,
    val statusCode: Int? = null,
    val durationMs: Long? = null,
    val outcome: String? = null, // TelemetryOutcome.value
    val errorType: String? = null,
    val errorCode: String? = null,
    val errorMessage: String? = null,
    val errorRetriable: Boolean? = null
)

// MARK: - Wide Event

/**
 * Wide event envelope for structured logging
 */
@Serializable
data class WideEvent(
    val type: String = "wide_event",
    val event: String,
    val timestamp: String,
    val common: CommonProperties,
    val domain: DomainProperties? = null,
    val request: RequestProperties? = null
) {
    /**
     * Flattened map for PostHog properties
     */
    fun flattenedProperties(): Map<String, Any?> = buildMap {
        put("type", type)
        put("event", event)
        put("timestamp", timestamp)
        put("platform", common.platform)
        put("env", common.env)
        put("app_version", common.appVersion)
        put("build_number", common.buildNumber)
        put("is_signed_in", common.isSignedIn)
        
        common.userId?.let { put("user_id", it) }
        common.sessionId?.let { put("session_id", it) }
        common.traceId?.let { put("trace_id", it) }
        common.spanId?.let { put("span_id", it) }
        common.requestId?.let { put("request_id", it) }
        
        // Domain properties
        domain?.let { d ->
            d.challengeId?.let { put("challenge_id", it) }
            d.timeframeUnit?.let { put("timeframe_unit", it) }
            d.targetNumber?.let { put("target_number", it) }
            d.entryId?.let { put("entry_id", it) }
            d.entryCount?.let { put("entry_count", it) }
            d.hasNote?.let { put("has_note", it) }
            d.hasSets?.let { put("has_sets", it) }
            d.feeling?.let { put("feeling", it) }
        }
        
        // Request properties
        request?.let { r ->
            r.method?.let { put("method", it) }
            r.path?.let { put("path", it) }
            r.statusCode?.let { put("status_code", it) }
            r.durationMs?.let { put("duration_ms", it) }
            r.outcome?.let { put("outcome", it) }
            r.errorType?.let { put("error_type", it) }
            r.errorCode?.let { put("error_code", it) }
            r.errorMessage?.let { put("error_message", it) }
            r.errorRetriable?.let { put("error_retriable", it) }
        }
    }
}

// MARK: - Telemetry Service

/**
 * Main telemetry service for Android
 */
object Telemetry {
    private const val TAG = "Telemetry"
    
    private val json = Json {
        prettyPrint = false
        encodeDefaults = true
        ignoreUnknownKeys = true
    }
    
    // PostHog client will be initialized when SDK is added
    // private var posthog: PostHog? = null
    
    /**
     * Initialize telemetry with configuration
     */
    fun initialize(
        posthogKey: String? = null,
        honeycombKey: String? = null,
        appVersion: String,
        buildNumber: String,
        environment: String? = null
    ) {
        TelemetryConfig.posthogKey = posthogKey
        TelemetryConfig.honeycombKey = honeycombKey
        TelemetryConfig.appVersion = appVersion
        TelemetryConfig.buildNumber = buildNumber
        environment?.let { TelemetryConfig.environment = it }
        
        // Initialize PostHog when SDK is added
        // if (posthogKey != null) {
        //     posthog = PostHog.with(context)
        // }
    }
    
    // MARK: - Sampling
    
    /**
     * Tail-sampling decision: always keep errors/slow, sample healthy traffic
     */
    fun shouldSample(event: WideEvent): Boolean {
        // Always keep errors
        if (event.request?.outcome == TelemetryOutcome.ERROR.value) return true
        event.request?.statusCode?.let { if (it >= 400) return true }
        if (event.request?.errorType != null) return true
        
        // Always keep slow operations
        event.request?.durationMs?.let {
            if (it > TelemetryConfig.SLOW_OPERATION_THRESHOLD_MS) return true
        }
        
        // Random sample healthy traffic
        return Random.nextDouble() < TelemetryConfig.HEALTHY_SAMPLE_RATE
    }
    
    // MARK: - Logging
    
    /**
     * Log a wide event (structured JSON to logcat + PostHog)
     */
    fun logWideEvent(event: WideEvent) {
        if (!shouldSample(event)) return
        
        // Structured JSON log
        val jsonString = json.encodeToString(event)
        Log.i(TAG, jsonString)
        
        // PostHog capture (when SDK is added)
        // posthog?.capture(event.event, event.flattenedProperties())
    }
    
    /**
     * Capture an event with minimal boilerplate
     */
    fun capture(
        event: TelemetryEvent,
        userId: String? = null,
        sessionId: String? = null,
        domain: DomainProperties? = null,
        request: RequestProperties? = null
    ) {
        val common = CommonProperties(
            userId = userId,
            isSignedIn = userId != null,
            sessionId = sessionId,
            requestId = generateRequestId()
        )
        val wideEvent = WideEvent(
            event = event.eventName,
            timestamp = java.time.Instant.now().toString(),
            common = common,
            domain = domain,
            request = request
        )
        logWideEvent(wideEvent)
    }
    
    // MARK: - Helpers
    
    /**
     * Generate a unique request ID
     */
    fun generateRequestId(): String {
        val timestamp = System.currentTimeMillis()
        val random = Random.nextInt(0, 1000000).toString(36)
        return "req_${timestamp}_$random"
    }
    
    // MARK: - Convenience Methods
    
    /**
     * Quick capture for app lifecycle events
     */
    fun appOpened(userId: String? = null) {
        capture(TelemetryEvent.APP_OPENED, userId = userId)
    }
    
    fun signedIn(userId: String) {
        capture(TelemetryEvent.AUTH_SIGNED_IN, userId = userId)
    }
    
    fun signedOut(userId: String? = null) {
        capture(TelemetryEvent.AUTH_SIGNED_OUT, userId = userId)
    }
}

// MARK: - Wide Event Builder

/**
 * Builder for accumulating context during an operation
 */
class WideEventBuilder(
    private val event: TelemetryEvent,
    private var userId: String? = null,
    private var sessionId: String? = null
) {
    private var domain = DomainProperties()
    private var request = RequestProperties()
    private val startTime = System.currentTimeMillis()
    
    fun withUser(userId: String?, sessionId: String? = null): WideEventBuilder {
        this.userId = userId
        this.sessionId = sessionId ?: this.sessionId
        return this
    }
    
    fun withChallenge(id: String, timeframe: String? = null, target: Int? = null): WideEventBuilder {
        domain = domain.copy(challengeId = id, timeframeUnit = timeframe, targetNumber = target)
        return this
    }
    
    fun withEntry(id: String, count: Int? = null, hasNote: Boolean? = null, feeling: String? = null): WideEventBuilder {
        domain = domain.copy(entryId = id, entryCount = count, hasNote = hasNote, feeling = feeling)
        return this
    }
    
    fun withRequest(method: String, path: String): WideEventBuilder {
        request = request.copy(method = method, path = path)
        return this
    }
    
    fun success(statusCode: Int = 200): WideEventBuilder {
        request = request.copy(statusCode = statusCode, outcome = TelemetryOutcome.SUCCESS.value)
        return this
    }
    
    fun error(
        throwable: Throwable,
        code: String? = null,
        retriable: Boolean = false,
        statusCode: Int = 500
    ): WideEventBuilder {
        request = request.copy(
            statusCode = statusCode,
            outcome = TelemetryOutcome.ERROR.value,
            errorType = throwable::class.simpleName,
            errorCode = code,
            errorMessage = throwable.message,
            errorRetriable = retriable
        )
        return this
    }
    
    /**
     * Emit the wide event
     */
    fun emit() {
        val durationMs = System.currentTimeMillis() - startTime
        request = request.copy(durationMs = durationMs)
        
        val common = CommonProperties(
            userId = userId,
            isSignedIn = userId != null,
            sessionId = sessionId,
            requestId = Telemetry.generateRequestId()
        )
        val wideEvent = WideEvent(
            event = event.eventName,
            timestamp = java.time.Instant.now().toString(),
            common = common,
            domain = domain,
            request = request
        )
        Telemetry.logWideEvent(wideEvent)
    }
}

// MARK: - Extension for fluent API

/**
 * Create a wide event builder for fluent API
 */
fun Telemetry.event(type: TelemetryEvent, userId: String? = null): WideEventBuilder {
    return WideEventBuilder(type, userId)
}
