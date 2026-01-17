import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
  alias(libs.plugins.android.application)
  alias(libs.plugins.kotlin.android)
  alias(libs.plugins.kotlin.serialization)
  id("org.jetbrains.kotlin.kapt")
}

android {
  namespace = "com.tally.app"
  compileSdk = libs.versions.compileSdk.get().toInt()

  defaultConfig {
    applicationId = "com.tally.app"
    minSdk = libs.versions.minSdk.get().toInt()
    targetSdk = libs.versions.targetSdk.get().toInt()
    versionCode = 1
    versionName = "0.1.0"

    val isCI = System.getenv("CI")?.toBoolean() == true
    val clerkPublishableKey = project.findProperty("TALLY_CLERK_PUBLISHABLE_KEY") as String?
    if (clerkPublishableKey.isNullOrEmpty() && !isCI) {
      throw GradleException("Missing TALLY_CLERK_PUBLISHABLE_KEY in gradle.properties")
    }
    val keyValue = clerkPublishableKey ?: "pk_test_placeholder_for_ci"
    buildConfigField("String", "CLERK_PUBLISHABLE_KEY", "\"${keyValue}\"")

    val convexDeployment = project.findProperty("TALLY_CONVEX_DEPLOYMENT") as String?
    if (convexDeployment.isNullOrEmpty() && !isCI) {
      throw GradleException("Missing TALLY_CONVEX_DEPLOYMENT in gradle.properties")
    }
    val deploymentValue = convexDeployment ?: "dev"
    buildConfigField("String", "CONVEX_DEPLOYMENT", "\"${deploymentValue}\"")

    val posthogKey = project.findProperty("TALLY_POSTHOG_API_KEY") as String?
    val posthogHost = project.findProperty("TALLY_POSTHOG_HOST") as String?
    val posthogKeyValue = posthogKey ?: "phc_placeholder"
    val posthogHostValue = posthogHost ?: "https://app.posthog.com"
    buildConfigField("String", "POSTHOG_API_KEY", "\"${posthogKeyValue}\"")
    buildConfigField("String", "POSTHOG_HOST", "\"${posthogHostValue}\"")

    val telemetryEnv = project.findProperty("TALLY_TELEMETRY_ENV") as String?
    val telemetryEnvValue = telemetryEnv ?: (if (isCI) "preview" else "development")
    buildConfigField("String", "TELEMETRY_ENV", "\"${telemetryEnvValue}\"")
  }

  buildFeatures {
    compose = true
    buildConfig = true
  }

  composeOptions {
    kotlinCompilerExtensionVersion = "1.5.14"
  }

  kotlin {
    jvmToolchain(17)
    compilerOptions { jvmTarget.set(JvmTarget.JVM_17) }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
}

dependencies {
  implementation(platform(libs.compose.bom))
  implementation(libs.androidx.activity.compose)
  implementation(libs.androidx.lifecycle.runtime)
  implementation(libs.androidx.lifecycle.viewmodel.compose)
  implementation(libs.compose.ui)
  implementation(libs.compose.ui.tooling.preview)
  implementation(libs.material3)
  implementation(libs.coroutines.android)
  implementation(libs.clerk.android.api)
  implementation(libs.workmanager.runtime)
  implementation("com.posthog.android:posthog-android:2.0.5")

  implementation(project(":core:auth"))
  implementation(project(":core:network"))
  implementation(project(":core:design"))

  debugImplementation(libs.compose.ui.tooling)
}
