plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
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
  }

  buildFeatures {
    compose = true
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

  debugImplementation("androidx.compose.ui:ui-tooling")
}
