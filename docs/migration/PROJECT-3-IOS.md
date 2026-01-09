# PROJECT 3: Native iOS App (Swift/SwiftUI)

## Overview
**Goal**: Build a native iOS application with full feature parity to the web app.

**Duration**: 3-4 weeks  
**Priority**: HIGH  
**Dependencies**: Projects 1 and 2 must be 100% complete

---

## TODO List

> ⚠️ **IMPORTANT**: Do not check off any item until it has been **tested and verified working**. Run the verification steps for each task before marking complete.

### Task 3.1: Xcode Project Setup
- [ ] Create Xcode project
  - [ ] Open Xcode → New Project → iOS → App
  - [ ] Product Name: Tally
  - [ ] Interface: SwiftUI
  - [ ] Language: Swift
  - [ ] Verify: Project opens without errors
- [ ] Configure project structure
  - [ ] Create App/ folder with TallyApp.swift, ContentView.swift
  - [ ] Create Models/ folder
  - [ ] Create Views/ folder with subfolders (Dashboard, Challenge, Entry, Social, Auth)
  - [ ] Create ViewModels/ folder
  - [ ] Create Services/ folder
  - [ ] Create Components/ folder
  - [ ] Create Utilities/ folder
  - [ ] Create Resources/ folder
  - [ ] Verify: All folders created
- [ ] Add Swift Package dependencies
  - [ ] Add Alamofire: https://github.com/Alamofire/Alamofire
  - [ ] Add ConfettiSwiftUI: https://github.com/simibac/ConfettiSwiftUI
  - [ ] Add Clerk iOS SDK (when available) or custom auth
  - [ ] Verify: Packages resolve and compile
- [ ] Configure signing and provisioning
  - [ ] Set up Apple Developer Team
  - [ ] Configure bundle identifier
  - [ ] Verify: App runs on simulator
- [ ] **VERIFICATION**: Project setup complete
  - [ ] Build succeeds (Cmd+B)
  - [ ] App runs on iOS Simulator (Cmd+R)
  - [ ] All dependencies resolved

### Task 3.2: Data Models & API Service
- [ ] Create Challenge model
  - [ ] Create Models/Challenge.swift
  - [ ] Define TimeframeUnit enum
  - [ ] Define Challenge struct with Codable
  - [ ] Verify: Model compiles, test decoding JSON
- [ ] Create Entry model
  - [ ] Create Models/Entry.swift
  - [ ] Define FeelingType enum
  - [ ] Define EntrySet struct
  - [ ] Define Entry struct with Codable
  - [ ] Verify: Model compiles, test decoding JSON
- [ ] Create User model
  - [ ] Create Models/User.swift
  - [ ] Define User struct with Codable
  - [ ] Verify: Model compiles, test decoding JSON
- [ ] Create API service
  - [ ] Create Services/APIService.swift
  - [ ] Configure base URL (dev/prod)
  - [ ] Add auth token handling
  - [ ] Verify: Service initializes
- [ ] Implement user API methods
  - [ ] Add createOrGetUser method
  - [ ] Verify: User creation works against real API
- [ ] Implement challenges API methods
  - [ ] Add getChallenges method
  - [ ] Add createChallenge method
  - [ ] Add updateChallenge method
  - [ ] Verify: All challenge methods work
- [ ] Implement entries API methods
  - [ ] Add getEntries method
  - [ ] Add createEntry method
  - [ ] Add updateEntry method
  - [ ] Add deleteEntry method
  - [ ] Verify: All entry methods work
- [ ] Add error handling
  - [ ] Create APIError enum
  - [ ] Handle network errors
  - [ ] Handle decoding errors
  - [ ] Verify: Errors propagate correctly
- [ ] **VERIFICATION**: Data layer complete
  - [ ] All models compile
  - [ ] API service connects to Convex
  - [ ] CRUD operations work (test each one)
  - [ ] Errors handled gracefully

### Task 3.3: Authentication
- [ ] Create auth service
  - [ ] Create Services/AuthService.swift
  - [ ] Add @Published properties for state
  - [ ] Verify: Service initializes
- [ ] Implement GitHub OAuth
  - [ ] Configure OAuth flow
  - [ ] Handle callback URL
  - [ ] Verify: GitHub sign-in completes
- [ ] Implement email/password auth
  - [ ] Add signInWithEmail method
  - [ ] Add signUpWithEmail method
  - [ ] Verify: Email auth works
- [ ] Implement Keychain storage
  - [ ] Create Services/KeychainService.swift
  - [ ] Store auth token securely
  - [ ] Retrieve token on app launch
  - [ ] Verify: Token persists across launches
- [ ] Sync user to Convex
  - [ ] Call API to create/get user after auth
  - [ ] Store Convex userId
  - [ ] Verify: User appears in Convex dashboard
- [ ] Create LoginView
  - [ ] Create Views/Auth/LoginView.swift
  - [ ] Add email/password fields
  - [ ] Add GitHub sign-in button
  - [ ] Add loading states
  - [ ] Add error display
  - [ ] Verify: Login flow works end-to-end
- [ ] Handle sign out
  - [ ] Clear auth state
  - [ ] Clear Keychain
  - [ ] Navigate to login
  - [ ] Verify: Sign out works completely
- [ ] **VERIFICATION**: Auth complete
  - [ ] Login screen displays
  - [ ] GitHub OAuth completes
  - [ ] Email/password works
  - [ ] User synced to Convex
  - [ ] Token persists after app restart
  - [ ] Sign out clears everything

### Task 3.4: Core UI Components
- [ ] Create CircularProgressView
  - [ ] Create Components/CircularProgressView.swift
  - [ ] Draw background circle
  - [ ] Draw progress arc with animation
  - [ ] Add customizable color and line width
  - [ ] Verify: Progress animates smoothly
- [ ] Create HeatmapCalendarView
  - [ ] Create Components/HeatmapCalendarView.swift
  - [ ] Generate date grid
  - [ ] Calculate intensity colors
  - [ ] Add tap handling for day selection
  - [ ] Verify: Calendar renders correct dates and colors
- [ ] Create TallyMarksView
  - [ ] Create Components/TallyMarksView.swift
  - [ ] Draw vertical lines
  - [ ] Draw diagonal strike-through for groups of 5
  - [ ] Verify: Tally marks display correctly
- [ ] Create ConfettiView
  - [ ] Create Components/ConfettiView.swift
  - [ ] Integrate ConfettiSwiftUI library
  - [ ] Configure colors and particle count
  - [ ] Verify: Confetti triggers on command
- [ ] Create ChallengeCardView
  - [ ] Create Views/Dashboard/ChallengeCardView.swift
  - [ ] Add header with icon and name
  - [ ] Add circular progress
  - [ ] Add count display
  - [ ] Add mini heatmap
  - [ ] Add tap gesture
  - [ ] Verify: Card displays all data correctly
- [ ] Create EmptyStateView
  - [ ] Create Components/EmptyStateView.swift
  - [ ] Add icon, title, subtitle
  - [ ] Add action button
  - [ ] Verify: Empty state displays
- [ ] Test dark mode support
  - [ ] Verify all components work in dark mode
  - [ ] Verify colors are readable
  - [ ] Verify: Dark mode looks good
- [ ] **VERIFICATION**: Components complete
  - [ ] CircularProgress animates 0→100%
  - [ ] Heatmap shows correct intensity
  - [ ] TallyMarks groups correctly
  - [ ] Confetti triggers
  - [ ] ChallengeCard shows all data
  - [ ] Dark mode works

### Task 3.5: Main Views
- [ ] Create DashboardView
  - [ ] Create Views/Dashboard/DashboardView.swift
  - [ ] Add header with user profile
  - [ ] Add overall stats section
  - [ ] Add personal records section
  - [ ] Add challenge grid
  - [ ] Add floating action button
  - [ ] Verify: Dashboard loads with real data
- [ ] Create OverallStatsView
  - [ ] Create Views/Dashboard/OverallStatsView.swift
  - [ ] Calculate total reps, today's progress
  - [ ] Calculate best streak, challenges ahead
  - [ ] Verify: Stats are accurate
- [ ] Create PersonalRecordsView
  - [ ] Create Views/Dashboard/PersonalRecordsView.swift
  - [ ] Calculate best day, longest streak
  - [ ] Calculate highest daily average
  - [ ] Verify: Records are accurate
- [ ] Create ChallengeDetailView
  - [ ] Create Views/Challenge/ChallengeDetailView.swift
  - [ ] Add large heatmap
  - [ ] Add line chart (actual vs pace)
  - [ ] Add stats grid
  - [ ] Add entry history list
  - [ ] Add settings button
  - [ ] Verify: All data displays correctly
- [ ] Create CreateChallengeView
  - [ ] Create Views/Challenge/CreateChallengeView.swift
  - [ ] Add name input
  - [ ] Add target number input
  - [ ] Add timeframe selector
  - [ ] Add color picker
  - [ ] Add icon picker
  - [ ] Add public toggle
  - [ ] Verify: Challenge creation works
- [ ] Create AddEntryView
  - [ ] Create Views/Entry/AddEntryView.swift
  - [ ] Add challenge selector (if multiple)
  - [ ] Add large number input
  - [ ] Add quick preset buttons (+1, +5, +10, +50)
  - [ ] Add date picker
  - [ ] Add optional note field
  - [ ] Add feeling selector
  - [ ] Add sets/reps entry option
  - [ ] Trigger confetti on save
  - [ ] Verify: Entry creation works with all options
- [ ] Create EditEntryView
  - [ ] Create Views/Entry/EditEntryView.swift
  - [ ] Populate with existing data
  - [ ] Allow updates
  - [ ] Allow deletion
  - [ ] Verify: Edit and delete work
- [ ] Create LeaderboardView
  - [ ] Create Views/Social/LeaderboardView.swift
  - [ ] Add time range selector (week/month/year/all)
  - [ ] Add global vs personal tabs
  - [ ] Display ranked list
  - [ ] Highlight current user
  - [ ] Verify: Leaderboard loads and filters
- [ ] Create CommunityView
  - [ ] Create Views/Social/CommunityView.swift
  - [ ] Display public challenges
  - [ ] Add search
  - [ ] Show challenge owner info
  - [ ] Add follow button
  - [ ] Verify: Community browse works
- [ ] Create ProfileView
  - [ ] Create Views/Auth/ProfileView.swift
  - [ ] Display user info
  - [ ] Add sign out button
  - [ ] Add settings options
  - [ ] Verify: Profile displays and sign out works
- [ ] Set up navigation
  - [ ] Configure NavigationStack
  - [ ] Add tab bar or navigation links
  - [ ] Handle deep linking
  - [ ] Verify: Navigation works throughout app
- [ ] **VERIFICATION**: All views complete
  - [ ] Dashboard shows data
  - [ ] Can create challenge
  - [ ] Can add entry
  - [ ] Can view challenge details
  - [ ] Can edit/delete entries
  - [ ] Leaderboard works
  - [ ] Community browse works
  - [ ] Profile and sign out work

### Task 3.6: Native Features
- [ ] Add haptic feedback
  - [ ] Create HapticManager utility
  - [ ] Add haptic to entry submit
  - [ ] Add haptic to challenge complete
  - [ ] Add haptic to button taps
  - [ ] Verify: Haptics fire on device
- [ ] Set up local notifications
  - [ ] Request notification permission
  - [ ] Schedule daily reminder
  - [ ] Handle notification tap
  - [ ] Verify: Notifications appear and open app
- [ ] Create home screen widget
  - [ ] Add Widget extension
  - [ ] Create TallyWidget
  - [ ] Display today's progress
  - [ ] Add tap action to open app
  - [ ] Verify: Widget displays on home screen
- [ ] Add pull-to-refresh
  - [ ] Add refresh gesture to dashboard
  - [ ] Reload data from API
  - [ ] Verify: Pull-to-refresh works
- [ ] Add accessibility
  - [ ] Add accessibility labels to components
  - [ ] Test with VoiceOver
  - [ ] Verify: App is accessible
- [ ] **VERIFICATION**: Native features complete
  - [ ] Haptics work on device
  - [ ] Notifications appear
  - [ ] Widget shows on home screen
  - [ ] Pull-to-refresh works
  - [ ] VoiceOver works

### Task 3.7: Testing & App Store
- [ ] Write unit tests
  - [ ] Test Challenge model
  - [ ] Test Entry model
  - [ ] Test stats calculations
  - [ ] Test API service methods
  - [ ] Verify: Tests pass (Cmd+U)
- [ ] Write UI tests
  - [ ] Test login flow
  - [ ] Test create challenge flow
  - [ ] Test add entry flow
  - [ ] Verify: UI tests pass
- [ ] Set up TestFlight
  - [ ] Archive app (Product → Archive)
  - [ ] Upload to App Store Connect
  - [ ] Add internal testers
  - [ ] Distribute beta
  - [ ] Verify: TestFlight build installable
- [ ] Prepare App Store listing
  - [ ] Write app description
  - [ ] Take screenshots (all device sizes)
  - [ ] Create app preview video (optional)
  - [ ] Set up keywords
  - [ ] Write privacy policy
  - [ ] Write support URL
  - [ ] Verify: All fields complete
- [ ] Submit for review
  - [ ] Select build
  - [ ] Complete app review information
  - [ ] Submit
  - [ ] Verify: Submission accepted
- [ ] **VERIFICATION**: App Store ready
  - [ ] Unit tests pass (>70% coverage)
  - [ ] UI tests pass
  - [ ] TestFlight build works
  - [ ] App Store listing complete
  - [ ] Submission accepted

---

## Project 3 Completion Checklist

**Do not check these until ALL sub-tasks above are complete and verified:**

- [ ] Xcode project builds without errors
- [ ] All data models implemented and tested
- [ ] API service connects to Convex backend
- [ ] Authentication fully functional
- [ ] All UI components built
- [ ] All views implemented with navigation
- [ ] Native features working (haptics, notifications, widget)
- [ ] Unit tests passing (>70% coverage)
- [ ] UI tests passing
- [ ] TestFlight distributed to testers
- [ ] App Store submission completed
- [ ] Dark mode fully supported
- [ ] Accessibility supported

---

## Code Examples

### Challenge Model
```swift
import Foundation

enum TimeframeUnit: String, Codable {
    case year, month, custom
}

struct Challenge: Identifiable, Codable {
    let _id: String
    let userId: String
    let name: String
    let targetNumber: Int
    let year: Int
    let color: String
    let icon: String
    let timeframeUnit: TimeframeUnit
    let startDate: String?
    let endDate: String?
    let isPublic: Bool
    let archived: Bool
    let createdAt: Double
    
    var id: String { _id }
}
```

### API Service
```swift
import Foundation
import Alamofire

@MainActor
class APIService: ObservableObject {
    static let shared = APIService()
    
    private let baseURL: String
    private var authToken: String?
    
    private init() {
        #if DEBUG
        baseURL = "https://dev-xxx.convex.site"
        #else
        baseURL = "https://prod-xxx.convex.site"
        #endif
    }
    
    func setAuthToken(_ token: String) {
        self.authToken = token
    }
    
    private var headers: HTTPHeaders {
        var headers: HTTPHeaders = ["Content-Type": "application/json"]
        if let token = authToken {
            headers["Authorization"] = "Bearer \(token)"
        }
        return headers
    }
    
    func getChallenges(userId: String) async throws -> [Challenge] {
        return try await AF.request(
            "\(baseURL)/api/challenges",
            parameters: ["userId": userId],
            headers: headers
        ).serializingDecodable([Challenge].self).value
    }
    
    func createEntry(_ request: CreateEntryRequest) async throws -> String {
        let response = try await AF.request(
            "\(baseURL)/api/entries",
            method: .post,
            parameters: request,
            encoder: JSONParameterEncoder.default,
            headers: headers
        ).serializingDecodable([String: String].self).value
        
        guard let id = response["id"] else {
            throw APIError.invalidResponse
        }
        return id
    }
}

enum APIError: Error {
    case invalidResponse
    case networkError(Error)
}
```

### CircularProgressView
```swift
import SwiftUI

struct CircularProgressView: View {
    let progress: Double
    let color: Color
    let lineWidth: CGFloat
    
    init(progress: Double, color: Color, lineWidth: CGFloat = 12) {
        self.progress = min(max(progress, 0), 1)
        self.color = color
        self.lineWidth = lineWidth
    }
    
    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.2), lineWidth: lineWidth)
            
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    color,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.spring(response: 0.6), value: progress)
        }
    }
}
```

### HapticManager
```swift
import UIKit

class HapticManager {
    static let shared = HapticManager()
    
    private init() {}
    
    func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.impactOccurred()
    }
    
    func notification(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(type)
    }
    
    func selection() {
        let generator = UISelectionFeedbackGenerator()
        generator.selectionChanged()
    }
}

// Usage:
// HapticManager.shared.impact(.medium)
// HapticManager.shared.notification(.success)
```

---

## Testing Commands

```bash
# Run all tests in Xcode
Cmd+U

# Run specific test file
# Right-click on test file → Run

# Build for testing
xcodebuild -scheme Tally -destination 'platform=iOS Simulator,name=iPhone 15' test

# Archive for distribution
xcodebuild -scheme Tally -archivePath build/Tally.xcarchive archive
```

---

## Troubleshooting

### Common Issues

**Package resolution fails**
- File → Packages → Reset Package Caches
- Delete DerivedData folder

**Simulator not starting**
- Xcode → Settings → Platforms → Download simulator

**API calls failing**
- Check base URL configuration
- Verify auth token is set
- Check network permissions in Info.plist

**App rejected from App Store**
- Review App Store guidelines
- Check privacy manifest
- Ensure all required permissions have usage descriptions
