plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
  id("org.jetbrains.kotlin.plugin.serialization")
}

android {
  namespace = "app.tally"
  compileSdk = 34

  defaultConfig {
    applicationId = "app.tally"
    minSdk = 26
    targetSdk = 34
    versionCode = 1
    versionName = "0.1.0"

    buildConfigField(
      "String",
      "CLERK_PUBLISHABLE_KEY",
      "\"${System.getenv("CLERK_PUBLISHABLE_KEY") ?: ""}\""
    )
  }

  buildFeatures {
    compose = true
    buildConfig = true
  }

  composeOptions {
    kotlinCompilerExtensionVersion = "1.5.13"
  }

  kotlinOptions {
    jvmTarget = "17"
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

  debugImplementation("androidx.compose.ui:ui-tooling")
}
