package com.tally.core.network

/**
 * API error types with recovery information.
 */
sealed class ApiError : Exception() {
    
    /** HTTP 401 - Authentication required or session expired */
    data class Unauthorized(override val message: String = "Authentication required") : ApiError()
    
    /** HTTP 403 - Access denied to resource */
    data class Forbidden(override val message: String = "Access denied") : ApiError()
    
    /** HTTP 404 - Resource not found */
    data class NotFound(override val message: String = "Resource not found") : ApiError()
    
    /** HTTP 400 - Invalid request data */
    data class BadRequest(
        override val message: String = "Invalid request",
        val details: Map<String, String>? = null
    ) : ApiError()
    
    /** HTTP 409 - Conflict (e.g., duplicate entry) */
    data class Conflict(override val message: String = "Conflict") : ApiError()
    
    /** HTTP 429 - Rate limited */
    data class RateLimited(
        override val message: String = "Too many requests",
        val retryAfterSeconds: Int? = null
    ) : ApiError()
    
    /** HTTP 5xx - Server error */
    data class ServerError(
        override val message: String = "Server error",
        val statusCode: Int
    ) : ApiError()
    
    /** Network error - no connectivity or timeout */
    data class NetworkError(
        override val message: String = "Network error",
        override val cause: Throwable? = null
    ) : ApiError()
    
    /** Parse error - invalid response format */
    data class ParseError(
        override val message: String = "Failed to parse response",
        override val cause: Throwable? = null
    ) : ApiError()
    
    /** Unknown error */
    data class Unknown(
        override val message: String = "Unknown error",
        override val cause: Throwable? = null
    ) : ApiError()
    
    /**
     * Whether this error can be recovered by retrying.
     */
    val isRecoverable: Boolean
        get() = when (this) {
            is NetworkError -> true
            is RateLimited -> true
            is ServerError -> statusCode in 500..599
            else -> false
        }
    
    /**
     * Whether this error requires re-authentication.
     */
    val requiresReauth: Boolean
        get() = this is Unauthorized
    
    /**
     * User-friendly error message.
     */
    val userMessage: String
        get() = when (this) {
            is Unauthorized -> "Please sign in again"
            is Forbidden -> "You don't have access to this"
            is NotFound -> "Not found"
            is BadRequest -> message
            is Conflict -> "This already exists"
            is RateLimited -> "Too many requests. Please wait a moment."
            is ServerError -> "Something went wrong. Please try again."
            is NetworkError -> "No internet connection"
            is ParseError -> "Something went wrong"
            is Unknown -> "Something went wrong"
        }
}

/**
 * Result wrapper for API operations.
 */
sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Failure(val error: ApiError) : ApiResult<Nothing>()
    
    val isSuccess: Boolean get() = this is Success
    val isFailure: Boolean get() = this is Failure
    
    fun getOrNull(): T? = (this as? Success)?.data
    fun errorOrNull(): ApiError? = (this as? Failure)?.error
    
    inline fun <R> map(transform: (T) -> R): ApiResult<R> = when (this) {
        is Success -> Success(transform(data))
        is Failure -> this
    }
    
    inline fun onSuccess(action: (T) -> Unit): ApiResult<T> {
        if (this is Success) action(data)
        return this
    }
    
    inline fun onFailure(action: (ApiError) -> Unit): ApiResult<T> {
        if (this is Failure) action(error)
        return this
    }
}
