package com.tally.app.utils

import android.content.Context
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.rules.ExternalResource

/** Reset only the test app's local data before its Activity starts. */
class FreshLocalDataRule : ExternalResource() {
    override fun before() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        listOf("tally_challenges", "tally_auth_prefs", "tally_settings").forEach { name ->
            check(context.getSharedPreferences(name, Context.MODE_PRIVATE).edit().clear().commit())
        }
    }
}
