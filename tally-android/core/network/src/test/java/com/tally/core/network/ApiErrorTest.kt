package com.tally.core.network

import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests for API error handling
 */
class ApiErrorTest {

    @Test
    fun `Unauthorized error requires reauth`() {
        val error = ApiError.Unauthorized()
        assertTrue(error.requiresReauth)
        assertFalse(error.isRecoverable)
        assertEquals("Please sign in again", error.userMessage)
    }

    @Test
    fun `Forbidden error does not require reauth`() {
        val error = ApiError.Forbidden()
        assertFalse(error.requiresReauth)
        assertFalse(error.isRecoverable)
        assertEquals("You don't have access to this", error.userMessage)
    }

    @Test
    fun `NotFound error is not recoverable`() {
        val error = ApiError.NotFound()
        assertFalse(error.isRecoverable)
        assertFalse(error.requiresReauth)
        assertEquals("Not found", error.userMessage)
    }

    @Test
    fun `BadRequest error contains details`() {
        val details = mapOf("name" to "Name is required")
        val error = ApiError.BadRequest(message = "Validation failed", details = details)
        
        assertFalse(error.isRecoverable)
        assertEquals("Validation failed", error.userMessage)
        assertEquals(details, error.details)
    }

    @Test
    fun `NetworkError is recoverable`() {
        val error = ApiError.NetworkError()
        assertTrue(error.isRecoverable)
        assertFalse(error.requiresReauth)
        assertEquals("No internet connection", error.userMessage)
    }

    @Test
    fun `RateLimited error is recoverable with retry info`() {
        val error = ApiError.RateLimited(retryAfterSeconds = 30)
        assertTrue(error.isRecoverable)
        assertEquals(30, error.retryAfterSeconds)
        assertEquals("Too many requests. Please wait a moment.", error.userMessage)
    }

    @Test
    fun `ServerError 500 is recoverable`() {
        val error = ApiError.ServerError(statusCode = 500)
        assertTrue(error.isRecoverable)
        assertEquals("Something went wrong. Please try again.", error.userMessage)
    }

    @Test
    fun `ServerError 503 is recoverable`() {
        val error = ApiError.ServerError(statusCode = 503)
        assertTrue(error.isRecoverable)
    }

    // ===== ApiResult Tests =====

    @Test
    fun `ApiResult Success returns data`() {
        val result: ApiResult<String> = ApiResult.Success("hello")
        
        assertTrue(result.isSuccess)
        assertFalse(result.isFailure)
        assertEquals("hello", result.getOrNull())
        assertNull(result.errorOrNull())
    }

    @Test
    fun `ApiResult Failure returns error`() {
        val error = ApiError.NotFound()
        val result: ApiResult<String> = ApiResult.Failure(error)
        
        assertFalse(result.isSuccess)
        assertTrue(result.isFailure)
        assertNull(result.getOrNull())
        assertEquals(error, result.errorOrNull())
    }

    @Test
    fun `ApiResult map transforms success value`() {
        val result: ApiResult<Int> = ApiResult.Success(5)
        val mapped = result.map { it * 2 }
        
        assertEquals(10, mapped.getOrNull())
    }

    @Test
    fun `ApiResult map preserves failure`() {
        val error = ApiError.NotFound()
        val result: ApiResult<Int> = ApiResult.Failure(error)
        val mapped = result.map { it * 2 }
        
        assertTrue(mapped.isFailure)
        assertEquals(error, mapped.errorOrNull())
    }

    @Test
    fun `ApiResult onSuccess executes for success`() {
        var executed = false
        val result: ApiResult<String> = ApiResult.Success("test")
        
        result.onSuccess { executed = true }
        
        assertTrue(executed)
    }

    @Test
    fun `ApiResult onSuccess does not execute for failure`() {
        var executed = false
        val result: ApiResult<String> = ApiResult.Failure(ApiError.NotFound())
        
        result.onSuccess { executed = true }
        
        assertFalse(executed)
    }

    @Test
    fun `ApiResult onFailure executes for failure`() {
        var executed = false
        val result: ApiResult<String> = ApiResult.Failure(ApiError.NotFound())
        
        result.onFailure { executed = true }
        
        assertTrue(executed)
    }

    @Test
    fun `ApiResult onFailure does not execute for success`() {
        var executed = false
        val result: ApiResult<String> = ApiResult.Success("test")
        
        result.onFailure { executed = true }
        
        assertFalse(executed)
    }
}
