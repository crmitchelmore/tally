package com.tally.core.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Secure token storage using EncryptedSharedPreferences.
 * Stores JWT tokens securely on device.
 */
class SecureTokenStorage(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        PREFS_FILE_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    /**
     * Store the JWT token securely.
     */
    fun saveToken(token: String) {
        sharedPreferences.edit()
            .putString(KEY_JWT_TOKEN, token)
            .apply()
    }

    /**
     * Retrieve the stored JWT token.
     */
    fun getToken(): String? {
        return sharedPreferences.getString(KEY_JWT_TOKEN, null)
    }

    /**
     * Check if a token is stored.
     */
    fun hasToken(): Boolean {
        return getToken() != null
    }

    /**
     * Clear the stored token (sign out).
     */
    fun clearToken() {
        sharedPreferences.edit()
            .remove(KEY_JWT_TOKEN)
            .apply()
    }

    /**
     * Clear all stored data.
     */
    fun clearAll() {
        sharedPreferences.edit()
            .clear()
            .apply()
    }

    companion object {
        private const val PREFS_FILE_NAME = "tally_secure_prefs"
        private const val KEY_JWT_TOKEN = "jwt_token"
    }
}
