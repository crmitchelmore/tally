# PROJECT 4: Native Android App (Kotlin/Jetpack Compose)

## Overview
**Goal**: Build a native Android application with full feature parity to the web and iOS apps.

**Duration**: 3-4 weeks  
**Priority**: HIGH  
**Dependencies**: Projects 1 and 2 must be 100% complete

---

## TODO List

> ⚠️ **IMPORTANT**: Do not check off any item until it has been **tested and verified working**. Run the verification steps for each task before marking complete.

### Task 4.1: Android Studio Setup
- [ ] Create Android Studio project
  - [ ] New Project → Empty Compose Activity
  - [ ] Name: Tally
  - [ ] Package: com.yourcompany.tally
  - [ ] Minimum SDK: API 26 (Android 8.0)
  - [ ] Build config: Kotlin DSL
  - [ ] Verify: Project opens without errors
- [ ] Configure project structure
  - [ ] Create di/ package for dependency injection
  - [ ] Create data/model/ package
  - [ ] Create data/remote/ package
  - [ ] Create data/local/ package
  - [ ] Create data/repository/ package
  - [ ] Create ui/ package with subpackages
  - [ ] Create util/ package
  - [ ] Verify: Package structure created
- [ ] Configure build.gradle.kts (app level)
  - [ ] Add Compose dependencies
  - [ ] Add Hilt dependencies
  - [ ] Add Retrofit dependencies
  - [ ] Add Room dependencies
  - [ ] Add DataStore dependencies
  - [ ] Add Kotlinx Serialization
  - [ ] Add Coil for images
  - [ ] Add Konfetti for confetti
  - [ ] Verify: Gradle sync succeeds
- [ ] Configure build.gradle.kts (project level)
  - [ ] Add Hilt plugin
  - [ ] Add Kotlin serialization plugin
  - [ ] Verify: Plugins applied
- [ ] Configure ProGuard rules
  - [ ] Add rules for Retrofit
  - [ ] Add rules for serialization
  - [ ] Verify: Release build succeeds
- [ ] **VERIFICATION**: Project setup complete
  - [ ] Gradle sync succeeds
  - [ ] Debug build completes (`./gradlew assembleDebug`)
  - [ ] App runs on emulator
  - [ ] No dependency conflicts

### Task 4.2: Data Layer
- [ ] Create Challenge model
  - [ ] Create data/model/Challenge.kt
  - [ ] Define TimeframeUnit enum with @SerialName
  - [ ] Define Challenge data class with @Serializable
  - [ ] Verify: Model compiles, test serialization
- [ ] Create Entry model
  - [ ] Create data/model/Entry.kt
  - [ ] Define FeelingType enum
  - [ ] Define EntrySet data class
  - [ ] Define Entry data class
  - [ ] Verify: Model compiles
- [ ] Create User model
  - [ ] Create data/model/User.kt
  - [ ] Define User data class
  - [ ] Verify: Model compiles
- [ ] Create API interface
  - [ ] Create data/remote/TallyApi.kt
  - [ ] Define all endpoints
  - [ ] Verify: Interface compiles
- [ ] Create request/response DTOs
  - [ ] Create data/remote/dto/ classes
  - [ ] Verify: DTOs compile
- [ ] Configure Retrofit
  - [ ] Create di/NetworkModule.kt
  - [ ] Configure OkHttp client
  - [ ] Add logging interceptor
  - [ ] Add auth interceptor
  - [ ] Verify: Network calls work
- [ ] Create Room database (for offline)
  - [ ] Create data/local/TallyDatabase.kt
  - [ ] Create DAOs for each entity
  - [ ] Verify: Database creates
- [ ] Create repositories
  - [ ] Create ChallengeRepository
  - [ ] Create EntryRepository
  - [ ] Create UserRepository
  - [ ] Implement caching strategy
  - [ ] Verify: Repos return data
- [ ] **VERIFICATION**: Data layer complete
  - [ ] All models compile
  - [ ] API calls succeed (test with log)
  - [ ] Room database creates tables
  - [ ] Repositories return data

### Task 4.3: Authentication
- [ ] Create AuthRepository
  - [ ] Create data/repository/AuthRepository.kt
  - [ ] Store auth token in EncryptedSharedPreferences
  - [ ] Verify: Token storage works
- [ ] Implement GitHub OAuth
  - [ ] Create OAuth activity/intent handler
  - [ ] Handle callback
  - [ ] Exchange code for token
  - [ ] Verify: GitHub auth flow works
- [ ] Implement email/password auth
  - [ ] Create sign in method
  - [ ] Create sign up method
  - [ ] Handle errors
  - [ ] Verify: Email auth works
- [ ] Create AuthViewModel
  - [ ] Create ui/auth/AuthViewModel.kt
  - [ ] Expose auth state via StateFlow
  - [ ] Verify: ViewModel updates state
- [ ] Sync user to Convex
  - [ ] Call API to create/get user
  - [ ] Store Convex userId
  - [ ] Verify: User appears in Convex
- [ ] Create LoginScreen
  - [ ] Create ui/auth/LoginScreen.kt
  - [ ] Add email/password fields
  - [ ] Add GitHub button
  - [ ] Add loading state
  - [ ] Add error display
  - [ ] Verify: Login screen works
- [ ] Handle sign out
  - [ ] Clear token
  - [ ] Clear local data
  - [ ] Navigate to login
  - [ ] Verify: Sign out works
- [ ] **VERIFICATION**: Auth complete
  - [ ] Login screen displays
  - [ ] GitHub OAuth works
  - [ ] Email auth works
  - [ ] User synced to Convex
  - [ ] Token persists after restart
  - [ ] Sign out clears everything

### Task 4.4: UI Components
- [ ] Set up theme
  - [ ] Create ui/theme/Color.kt
  - [ ] Create ui/theme/Type.kt
  - [ ] Create ui/theme/Theme.kt
  - [ ] Match web app colors
  - [ ] Verify: Theme applies correctly
- [ ] Create CircularProgress
  - [ ] Create ui/components/CircularProgress.kt
  - [ ] Draw with Canvas
  - [ ] Animate with animateFloatAsState
  - [ ] Verify: Progress animates smoothly
- [ ] Create HeatmapCalendar
  - [ ] Create ui/components/HeatmapCalendar.kt
  - [ ] Generate date grid with LazyVerticalGrid
  - [ ] Calculate intensity colors
  - [ ] Add click handling
  - [ ] Verify: Calendar renders correctly
- [ ] Create TallyMarks
  - [ ] Create ui/components/TallyMarks.kt
  - [ ] Draw marks with Canvas or Row
  - [ ] Group in sets of 5
  - [ ] Verify: Marks display correctly
- [ ] Create ConfettiOverlay
  - [ ] Create ui/components/ConfettiOverlay.kt
  - [ ] Use Konfetti library
  - [ ] Configure colors
  - [ ] Verify: Confetti triggers
- [ ] Create ChallengeCard
  - [ ] Create ui/dashboard/components/ChallengeCard.kt
  - [ ] Add header, progress, count, heatmap
  - [ ] Add click handling
  - [ ] Verify: Card displays data
- [ ] Create EmptyState
  - [ ] Create ui/components/EmptyState.kt
  - [ ] Add icon, title, subtitle, button
  - [ ] Verify: Empty state displays
- [ ] Test dark theme
  - [ ] Verify all components in dark mode
  - [ ] Verify: Dark mode looks good
- [ ] **VERIFICATION**: Components complete
  - [ ] CircularProgress animates
  - [ ] Heatmap shows intensity
  - [ ] TallyMarks groups correctly
  - [ ] Confetti triggers
  - [ ] ChallengeCard displays all data
  - [ ] Dark mode works

### Task 4.5: Main Screens
- [ ] Set up navigation
  - [ ] Create ui/navigation/TallyNavigation.kt
  - [ ] Define routes
  - [ ] Configure NavHost
  - [ ] Verify: Navigation compiles
- [ ] Create DashboardScreen
  - [ ] Create ui/dashboard/DashboardScreen.kt
  - [ ] Create DashboardViewModel.kt
  - [ ] Add header with profile
  - [ ] Add overall stats
  - [ ] Add challenge grid
  - [ ] Add FAB for add entry
  - [ ] Verify: Dashboard shows data
- [ ] Create OverallStats composable
  - [ ] Calculate totals
  - [ ] Display in cards
  - [ ] Verify: Stats accurate
- [ ] Create PersonalRecords composable
  - [ ] Calculate records
  - [ ] Display achievements
  - [ ] Verify: Records accurate
- [ ] Create ChallengeDetailScreen
  - [ ] Create ui/challenge/ChallengeDetailScreen.kt
  - [ ] Create ChallengeViewModel.kt
  - [ ] Add large heatmap
  - [ ] Add stats
  - [ ] Add entry list
  - [ ] Verify: Detail view works
- [ ] Create CreateChallengeScreen
  - [ ] Create ui/challenge/CreateChallengeScreen.kt
  - [ ] Add form fields
  - [ ] Add color picker
  - [ ] Add icon picker
  - [ ] Verify: Challenge creation works
- [ ] Create AddEntrySheet
  - [ ] Create ui/entry/AddEntrySheet.kt
  - [ ] Use ModalBottomSheet
  - [ ] Add number input
  - [ ] Add presets
  - [ ] Add date picker
  - [ ] Add feeling selector
  - [ ] Trigger confetti
  - [ ] Verify: Entry creation works
- [ ] Create EditEntryDialog
  - [ ] Create ui/entry/EditEntryDialog.kt
  - [ ] Allow updates and deletion
  - [ ] Verify: Edit/delete work
- [ ] Create LeaderboardScreen
  - [ ] Create ui/social/LeaderboardScreen.kt
  - [ ] Add time range tabs
  - [ ] Display ranked list
  - [ ] Verify: Leaderboard works
- [ ] Create CommunityScreen
  - [ ] Create ui/social/CommunityScreen.kt
  - [ ] Display public challenges
  - [ ] Add search
  - [ ] Add follow button
  - [ ] Verify: Community works
- [ ] Create ProfileScreen
  - [ ] Create ui/auth/ProfileScreen.kt
  - [ ] Show user info
  - [ ] Add sign out
  - [ ] Verify: Profile works
- [ ] **VERIFICATION**: All screens complete
  - [ ] Dashboard loads data
  - [ ] Can create challenge
  - [ ] Can add entry
  - [ ] Can view details
  - [ ] Can edit/delete
  - [ ] Leaderboard works
  - [ ] Community works
  - [ ] Profile and sign out work

### Task 4.6: Native Features
- [ ] Add haptic feedback
  - [ ] Create util/HapticUtils.kt
  - [ ] Add haptic to entry submit
  - [ ] Add haptic to button presses
  - [ ] Verify: Haptics fire on device
- [ ] Set up notifications
  - [ ] Add NotificationManager setup
  - [ ] Create notification channel
  - [ ] Schedule daily reminder with WorkManager
  - [ ] Handle notification tap
  - [ ] Verify: Notifications appear
- [ ] Create home screen widget
  - [ ] Add Glance dependency
  - [ ] Create TallyWidget
  - [ ] Display today's progress
  - [ ] Add click action
  - [ ] Verify: Widget shows on home screen
- [ ] Add pull-to-refresh
  - [ ] Use SwipeRefresh composable
  - [ ] Reload data on refresh
  - [ ] Verify: Pull-to-refresh works
- [ ] Add accessibility
  - [ ] Add contentDescription to components
  - [ ] Test with TalkBack
  - [ ] Verify: App is accessible
- [ ] **VERIFICATION**: Native features complete
  - [ ] Haptics work
  - [ ] Notifications appear
  - [ ] Widget shows on home screen
  - [ ] Pull-to-refresh works
  - [ ] TalkBack works

### Task 4.7: Testing & Play Store
- [ ] Write unit tests
  - [ ] Test Challenge model
  - [ ] Test Entry model
  - [ ] Test stats calculations
  - [ ] Test ViewModels
  - [ ] Verify: Tests pass (`./gradlew test`)
- [ ] Write UI tests
  - [ ] Test login flow
  - [ ] Test create challenge
  - [ ] Test add entry
  - [ ] Verify: UI tests pass
- [ ] Set up internal testing
  - [ ] Generate signed APK/AAB
  - [ ] Upload to Play Console
  - [ ] Create internal testing track
  - [ ] Add testers
  - [ ] Verify: Internal build installable
- [ ] Prepare Play Store listing
  - [ ] Write short and full description
  - [ ] Take screenshots (phone, tablet)
  - [ ] Create feature graphic
  - [ ] Add video (optional)
  - [ ] Write privacy policy URL
  - [ ] Set content rating
  - [ ] Verify: All fields complete
- [ ] Submit for review
  - [ ] Complete app content questionnaire
  - [ ] Submit release
  - [ ] Verify: Submission accepted
- [ ] **VERIFICATION**: Play Store ready
  - [ ] Unit tests pass
  - [ ] UI tests pass
  - [ ] Internal track published
  - [ ] Play Store listing complete
  - [ ] Submission accepted

---

## Project 4 Completion Checklist

**Do not check these until ALL sub-tasks above are complete and verified:**

- [ ] Android Studio project builds
- [ ] All data models and API working
- [ ] Authentication fully functional
- [ ] All UI components built
- [ ] All screens implemented
- [ ] Navigation works throughout
- [ ] Native features (haptics, notifications, widget)
- [ ] Unit tests passing
- [ ] UI tests passing
- [ ] Internal testing track published
- [ ] Play Store submission completed
- [ ] Dark mode supported
- [ ] Accessibility supported

---

## Code Examples

### Challenge Model
```kotlin
package com.yourcompany.tally.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class TimeframeUnit {
    @SerialName("year") YEAR,
    @SerialName("month") MONTH,
    @SerialName("custom") CUSTOM
}

@Serializable
data class Challenge(
    @SerialName("_id") val id: String,
    val userId: String,
    val name: String,
    val targetNumber: Int,
    val year: Int,
    val color: String,
    val icon: String,
    val timeframeUnit: TimeframeUnit,
    val startDate: String? = null,
    val endDate: String? = null,
    val isPublic: Boolean,
    val archived: Boolean,
    val createdAt: Long
)
```

### API Interface
```kotlin
package com.yourcompany.tally.data.remote

import com.yourcompany.tally.data.model.*
import retrofit2.http.*

interface TallyApi {
    @POST("api/auth/user")
    suspend fun createOrGetUser(@Body request: CreateUserRequest): CreateUserResponse
    
    @GET("api/challenges")
    suspend fun getChallenges(@Query("userId") userId: String): List<Challenge>
    
    @POST("api/challenges")
    suspend fun createChallenge(@Body request: CreateChallengeRequest): CreateChallengeResponse
    
    @GET("api/entries")
    suspend fun getEntries(@Query("challengeId") challengeId: String): List<Entry>
    
    @POST("api/entries")
    suspend fun createEntry(@Body request: CreateEntryRequest): CreateEntryResponse
    
    @DELETE("api/entries")
    suspend fun deleteEntry(@Query("id") entryId: String): DeleteResponse
}
```

### Network Module (Hilt)
```kotlin
package com.yourcompany.tally.di

import com.yourcompany.tally.data.remote.TallyApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    private const val BASE_URL = "https://your-deployment.convex.site/"
    
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .addHeader("Content-Type", "application/json")
                    // Add auth token here
                    .build()
                chain.proceed(request)
            }
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        val json = Json { ignoreUnknownKeys = true }
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }
    
    @Provides
    @Singleton
    fun provideTallyApi(retrofit: Retrofit): TallyApi {
        return retrofit.create(TallyApi::class.java)
    }
}
```

### CircularProgress Composable
```kotlin
package com.yourcompany.tally.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun CircularProgress(
    progress: Float,
    color: Color,
    modifier: Modifier = Modifier,
    strokeWidth: Dp = 12.dp
) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = spring(dampingRatio = 0.8f),
        label = "progress"
    )
    
    Canvas(modifier = modifier) {
        val stroke = strokeWidth.toPx()
        val diameter = size.minDimension - stroke
        val topLeft = Offset((size.width - diameter) / 2, (size.height - diameter) / 2)
        
        // Background circle
        drawArc(
            color = color.copy(alpha = 0.2f),
            startAngle = 0f,
            sweepAngle = 360f,
            useCenter = false,
            topLeft = topLeft,
            size = Size(diameter, diameter),
            style = Stroke(width = stroke, cap = StrokeCap.Round)
        )
        
        // Progress arc
        drawArc(
            color = color,
            startAngle = -90f,
            sweepAngle = 360f * animatedProgress,
            useCenter = false,
            topLeft = topLeft,
            size = Size(diameter, diameter),
            style = Stroke(width = stroke, cap = StrokeCap.Round)
        )
    }
}
```

### HapticUtils
```kotlin
package com.yourcompany.tally.util

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.HapticFeedbackConstants
import android.view.View

object HapticUtils {
    
    fun performClick(view: View) {
        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
    }
    
    fun performSuccess(context: Context) {
        val vibrator = getVibrator(context)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator?.vibrate(
                VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK)
            )
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(50)
        }
    }
    
    fun performHeavy(context: Context) {
        val vibrator = getVibrator(context)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator?.vibrate(
                VibrationEffect.createPredefined(VibrationEffect.EFFECT_HEAVY_CLICK)
            )
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(100)
        }
    }
    
    private fun getVibrator(context: Context): Vibrator? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }
}
```

---

## Build Commands

```bash
# Sync Gradle
./gradlew --refresh-dependencies

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Run unit tests
./gradlew test

# Run UI tests (requires emulator/device)
./gradlew connectedAndroidTest

# Generate signed bundle for Play Store
./gradlew bundleRelease
```

---

## Troubleshooting

### Common Issues

**Gradle sync fails**
- File → Invalidate Caches / Restart
- Delete .gradle and build folders
- Check for version conflicts

**Compose preview not showing**
- Build project first
- Check for compilation errors

**API calls failing**
- Check BASE_URL in NetworkModule
- Verify auth token is set
- Check logcat for network errors

**App crashes on launch**
- Check for missing Hilt annotations
- Verify Application class has @HiltAndroidApp
- Check MainActivity has @AndroidEntryPoint
