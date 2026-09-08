package com.tally.app.utils

import android.content.Context
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.rules.ExternalResource
import com.tally.core.data.ChallengesManager

/** Reset only the test app's local data before its Activity starts. */
class FreshLocalDataRule(private val privacyChosen: Boolean = true) : ExternalResource() {
    override fun before() {
        ChallengesManager.resetInstance()
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        check(context.getSharedPreferences("tally_privacy", Context.MODE_PRIVATE).edit().clear()
            .putBoolean("chosen_v1", privacyChosen).commit())
        listOf("tally_challenges", "tally_entries", "tally_auth_prefs", "tally_settings").forEach { name ->
            check(context.getSharedPreferences(name, Context.MODE_PRIVATE).edit().clear().commit())
        }
    }
}
