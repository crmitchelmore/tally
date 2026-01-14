package app.tally.observability

import android.util.Log
import io.sentry.Breadcrumb
import io.sentry.Sentry
import io.sentry.SentryLevel
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock
import app.tally.BuildConfig

/**
 * Log level for structured logging
 */
enum class LogLevel(val priority: Int, val value: String) {
    DEBUG(0, "debug"),
    INFO(1, "info"),
    WARN(2, "warn"),
    ERROR(3, "error")
}

/**
 * Context for structured log entries
 */
data class LogContext(
    // Correlation
    val traceId: String? = null,
    val spanId: String? = null,
    val requestId: String? = null,

    // User context (privacy: use hashed IDs only)
    val userId: String? = null,

    // Operation context
    val operation: String? = null,
    val durationMs: Long? = null,

    // Error context
    val error: Throwable? = null,

    // Custom attributes
    val extras: Map<String, Any> = emptyMap()
) {
    /**
     * Create a copy with additional extras
     */
    fun withExtras(vararg pairs: Pair<String, Any>): LogContext {
        return copy(extras = extras + pairs.toMap())
    }
}

/**
 * Structured logger for Android with Sentry integration
 *
 * Provides wide-event / canonical log lines that include correlation IDs,
 * structured context, and integrate with Sentry for error tracking.
 *
 * Usage:
 * ```kotlin
 * import app.tally.observability.TallyLogger
 * import app.tally.observability.LogContext
 *
 * // Simple log
 * TallyLogger.info("User signed in", LogContext(userId = "u_abc123"))
 *
 * // Wide event (canonical log line)
 * TallyLogger.info("api.request.completed", LogContext(
 *     operation = "createChallenge",
 *     durationMs = 150L,
 *     userId = "u_abc123",
 *     extras = mapOf("statusCode" to 200)
 * ))
 *
 * // Error with context
 * TallyLogger.error("Failed to create entry", LogContext(
 *     error = ex,
 *     userId = "u_abc123",
 *     extras = mapOf("challengeId" to "ch_xyz")
 * ))
 * ```
 */
object TallyLogger {
    private const val TAG = "Tally"
    private const val SERVICE = "tally-android"
    private const val PLATFORM = "android"

    private val lock = ReentrantLock()

    @Volatile
    private var minLevel: LogLevel = if (BuildConfig.DEBUG) LogLevel.DEBUG else LogLevel.INFO

    private val isoDateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    /**
     * Set minimum log level
     */
    fun setMinLevel(level: LogLevel) {
        lock.withLock { minLevel = level }
    }

    /**
     * Create a child logger with preset context
     */
    fun child(context: LogContext): ChildLogger {
        return ChildLogger(context)
    }

    // MARK: - Log Methods

    fun debug(message: String, context: LogContext = LogContext()) {
        log(LogLevel.DEBUG, message, context)
    }

    fun info(message: String, context: LogContext = LogContext()) {
        log(LogLevel.INFO, message, context)
    }

    fun warn(message: String, context: LogContext = LogContext()) {
        log(LogLevel.WARN, message, context)
    }

    fun error(message: String, context: LogContext = LogContext()) {
        log(LogLevel.ERROR, message, context)
    }

    // MARK: - Core Logging

    private fun log(level: LogLevel, message: String, context: LogContext) {
        val currentMinLevel = lock.withLock { minLevel }
        if (level.priority < currentMinLevel.priority) return

        val entry = buildLogEntry(level, message, context)

        // Output to Android Log
        when (level) {
            LogLevel.DEBUG -> Log.d(TAG, entry)
            LogLevel.INFO -> Log.i(TAG, entry)
            LogLevel.WARN -> Log.w(TAG, entry)
            LogLevel.ERROR -> Log.e(TAG, entry)
        }

        // Add as Sentry breadcrumb
        val breadcrumb = Breadcrumb().apply {
            this.message = message
            this.category = "log"
            this.level = sentryLevel(level)
            contextToMap(context).forEach { (key, value) ->
                setData(key, value.toString())
            }
        }
        Sentry.addBreadcrumb(breadcrumb)

        // Report errors to Sentry
        if (level == LogLevel.ERROR) {
            context.error?.let { error ->
                Sentry.configureScope { scope ->
                    contextToMap(context).forEach { (key, value) ->
                        scope.setExtra(key, value.toString())
                    }
                }
                Sentry.captureException(error)
            } ?: run {
                Sentry.captureMessage(message)
            }
        }
    }

    private fun buildLogEntry(level: LogLevel, message: String, context: LogContext): String {
        val json = JSONObject().apply {
            put("timestamp", isoDateFormat.format(Date()))
            put("level", level.value)
            put("message", message)
            put("service", SERVICE)
            put("platform", PLATFORM)
            put("environment", if (BuildConfig.DEBUG) "development" else "production")
            put("version", "${BuildConfig.VERSION_NAME}+${BuildConfig.VERSION_CODE}")

            // Add context
            val contextJson = JSONObject()
            contextToMap(context).forEach { (key, value) ->
                contextJson.put(key, value)
            }
            put("context", contextJson)
        }

        return json.toString()
    }

    private fun contextToMap(context: LogContext): Map<String, Any> {
        val map = context.extras.toMutableMap()

        context.traceId?.let { map["traceId"] = it }
        context.spanId?.let { map["spanId"] = it }
        context.requestId?.let { map["requestId"] = it }
        context.userId?.let { map["userId"] = it }
        context.operation?.let { map["operation"] = it }
        context.durationMs?.let { map["duration_ms"] = it }
        context.error?.let { map["errorMessage"] = it.message ?: it.toString() }

        // Remove PII fields
        val piiFields = listOf("email", "password", "token", "secret", "apiKey")
        piiFields.forEach { map.remove(it) }

        return map
    }

    private fun sentryLevel(level: LogLevel): SentryLevel {
        return when (level) {
            LogLevel.DEBUG -> SentryLevel.DEBUG
            LogLevel.INFO -> SentryLevel.INFO
            LogLevel.WARN -> SentryLevel.WARNING
            LogLevel.ERROR -> SentryLevel.ERROR
        }
    }
}

/**
 * Child logger with preset context
 */
class ChildLogger(private val baseContext: LogContext) {

    fun debug(message: String, context: LogContext = LogContext()) {
        TallyLogger.debug(message, mergeContext(context))
    }

    fun info(message: String, context: LogContext = LogContext()) {
        TallyLogger.info(message, mergeContext(context))
    }

    fun warn(message: String, context: LogContext = LogContext()) {
        TallyLogger.warn(message, mergeContext(context))
    }

    fun error(message: String, context: LogContext = LogContext()) {
        TallyLogger.error(message, mergeContext(context))
    }

    private fun mergeContext(context: LogContext): LogContext {
        return LogContext(
            traceId = context.traceId ?: baseContext.traceId,
            spanId = context.spanId ?: baseContext.spanId,
            requestId = context.requestId ?: baseContext.requestId,
            userId = context.userId ?: baseContext.userId,
            operation = context.operation ?: baseContext.operation,
            durationMs = context.durationMs ?: baseContext.durationMs,
            error = context.error ?: baseContext.error,
            extras = baseContext.extras + context.extras
        )
    }
}
