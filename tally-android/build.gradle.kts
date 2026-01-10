plugins {
    id("dev.nx.gradle.project-graph") version("0.1.10")
  id("com.android.application") version "8.6.1" apply false
  id("org.jetbrains.kotlin.android") version "2.3.0" apply false
  id("org.jetbrains.kotlin.plugin.compose") version "2.3.0" apply false
  id("org.jetbrains.kotlin.plugin.serialization") version "2.3.0" apply false
  id("io.sentry.android.gradle") version "5.5.0" apply false
}

allprojects {
    apply {
        plugin("dev.nx.gradle.project-graph")
    }
}