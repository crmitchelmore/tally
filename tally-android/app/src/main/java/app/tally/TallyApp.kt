package app.tally

import android.app.Application
import com.clerk.api.Clerk

class TallyApp : Application() {
  override fun onCreate() {
    super.onCreate()

    val pk = BuildConfig.CLERK_PUBLISHABLE_KEY
    if (pk.isNotBlank()) {
      Clerk.initialize(this, publishableKey = pk)
    }
  }
}
