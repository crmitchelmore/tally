plugins {
  alias(libs.plugins.android.library)
  alias(libs.plugins.kotlin.android)
  alias(libs.plugins.kotlin.serialization)
  id("org.jetbrains.kotlin.kapt")
}

android {
  namespace = "com.tally.core.network"
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
  implementation(libs.coroutines.android)
  implementation(libs.okhttp)
  implementation(libs.okhttp.logging)
  implementation(libs.serialization.json)
  implementation(libs.room.runtime)
  implementation(libs.room.ktx)
  kapt(libs.room.compiler)
  implementation(libs.workmanager.runtime)
}
