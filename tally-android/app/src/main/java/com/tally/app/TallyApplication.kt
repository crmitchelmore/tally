package com.tally.app

import android.app.Application
import com.clerk.api.Clerk

class TallyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Clerk.initialize(
            context = this,
            publishableKey = BuildConfig.CLERK_PUBLISHABLE_KEY
        )
    }
}
