package app.tally.auth

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

class AuthTokenStore(context: Context) {
  private val prefs = EncryptedSharedPreferences.create(
    "tally_secure",
    MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC),
    context,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
  )

  fun getConvexJwt(): String? = prefs.getString(KEY_CONVEX_JWT, null)

  fun setConvexJwt(jwt: String?) {
    prefs.edit().apply {
      if (jwt == null) remove(KEY_CONVEX_JWT) else putString(KEY_CONVEX_JWT, jwt)
    }.apply()
  }

  private companion object {
    const val KEY_CONVEX_JWT = "convex_jwt"
  }
}
