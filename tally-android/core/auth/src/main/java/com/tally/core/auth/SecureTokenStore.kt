package com.tally.core.auth

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SecureTokenStore {
  private val context: Context = AppContextHolder.context

  private val preferences by lazy {
    val masterKey = MasterKey.Builder(context)
      .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
      .build()
    EncryptedSharedPreferences.create(
      context,
      "tally_secure_store",
      masterKey,
      EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
      EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
  }

  fun saveToken(token: String) {
    preferences.edit().putString(TOKEN_KEY, token).apply()
  }

  fun loadToken(): String? = preferences.getString(TOKEN_KEY, null)

  fun clearToken() {
    preferences.edit().remove(TOKEN_KEY).apply()
  }

  companion object {
    private const val TOKEN_KEY = "clerk.jwt"
  }
}

object AppContextHolder {
  lateinit var context: Context
  var userId: String? = null
}
