plugins {
  alias(libs.plugins.android.library)
  alias(libs.plugins.kotlin.android)
  alias(libs.plugins.kotlin.serialization)
}

android {
  namespace = "com.tally.core.auth"
  compileSdk = libs.versions.compileSdk.get().toInt()

  defaultConfig {
    minSdk = libs.versions.minSdk.get().toInt()
  }

  buildFeatures {
    buildConfig = false
  }

  kotlin {
    jvmToolchain(17)
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
}

dependencies {
  implementation(libs.androidx.security.crypto)
  implementation(libs.coroutines.android)
  implementation(libs.clerk.android.api)
  implementation(project(":core:network"))
}
