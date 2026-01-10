plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
  id("org.jetbrains.kotlin.plugin.compose")
  id("org.jetbrains.kotlin.plugin.serialization")
  id("io.sentry.android.gradle")
}

configurations.configureEach {
  resolutionStrategy {
    force("androidx.browser:browser:1.8.0")
  }
}

kotlin {
  compilerOptions {
    jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
  }
}

android {
  namespace = "app.tally"
  compileSdk = 35

  defaultConfig {
    applicationId = "app.tally"
    minSdk = 26
    targetSdk = 35
    versionCode = 1
    versionName = "0.1.0"

    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

    buildConfigField(
      "String",
      "CLERK_PUBLISHABLE_KEY",
      "\"${System.getenv("CLERK_PUBLISHABLE_KEY") ?: ""}\""
    )

    buildConfigField(
      "String",
      "TALLY_API_BASE_URL",
      "\"${System.getenv("TALLY_API_BASE_URL") ?: "https://bright-jackal-396.convex.site"}\""
    )

    buildConfigField(
      "String",
      "LAUNCHDARKLY_MOBILE_KEY",
      "\"${System.getenv("LAUNCHDARKLY_MOBILE_KEY") ?: ""}\""
    )

    buildConfigField(
      "String",
      "SENTRY_DSN",
      "\"${System.getenv("SENTRY_DSN") ?: ""}\""
    )
  }

  buildFeatures {
    compose = true
    buildConfig = true
  }

  packaging {
    resources {
      excludes += "META-INF/versions/9/OSGI-INF/MANIFEST.MF"
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

}

// Sentry configuration for ProGuard mapping uploads
sentry {
  org.set("tally-lz")
  projectName.set("android")
  
  // Enable auto-upload of ProGuard mappings only if auth token is available
  autoUploadProguardMapping.set(System.getenv("SENTRY_AUTH_TOKEN")?.isNotBlank() == true)
  
  // Enable source context for better stack traces
  includeSourceContext.set(true)
  
  // Disable debug logging
  debug.set(false)
  
  // Auto-install Sentry integrations
  autoInstallation {
    enabled.set(true)
    sentryVersion.set("8.8.0")
  }
  
  // Enable tracing instrumentation
  tracingInstrumentation {
    enabled.set(true)
    features.set(setOf(
      io.sentry.android.gradle.extensions.InstrumentationFeature.DATABASE,
      io.sentry.android.gradle.extensions.InstrumentationFeature.FILE_IO,
      io.sentry.android.gradle.extensions.InstrumentationFeature.OKHTTP,
      io.sentry.android.gradle.extensions.InstrumentationFeature.COMPOSE
    ))
  }
}

dependencies {
  val composeBom = platform("androidx.compose:compose-bom:2024.10.00")
  implementation(composeBom)

  implementation("androidx.core:core-ktx:1.13.1")
  implementation("androidx.activity:activity-compose:1.9.3")

  implementation("androidx.compose.ui:ui")
  implementation("androidx.compose.material3:material3")
  implementation("androidx.compose.ui:ui-tooling-preview")

  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
  implementation("com.squareup.okhttp3:okhttp:4.12.0")
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")

  implementation("com.clerk:clerk-android-api:0.1.30")
  implementation("androidx.lifecycle:lifecycle-runtime-compose:2.9.2")
  implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.9.2")
  implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.9.2")
  implementation("androidx.security:security-crypto:1.0.0")

  // LaunchDarkly
  implementation("com.launchdarkly:launchdarkly-android-client-sdk:5.4.0")

  debugImplementation("androidx.compose.ui:ui-tooling")

  // Unit test dependencies
  testImplementation("junit:junit:4.13.2")
  testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
  testImplementation("io.mockk:mockk:1.13.9")

  // Android instrumented test dependencies
  androidTestImplementation(composeBom)
  androidTestImplementation("androidx.test.ext:junit:1.2.1")
  androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
  androidTestImplementation("androidx.compose.ui:ui-test-junit4")
  debugImplementation("androidx.compose.ui:ui-test-manifest")
}
