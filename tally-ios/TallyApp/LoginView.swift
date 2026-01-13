import SwiftUI
import Clerk
import os.log

private let logger = Logger(subsystem: "app.tally.ios", category: "Login")

struct LoginView: View {
  @Environment(\.clerk) private var clerk
  @EnvironmentObject private var state: AppState
  
  @State private var email = ""
  @State private var code = ""
  @State private var signIn: SignIn?
  @State private var signUp: SignUp?
  @State private var isLoading = false
  @State private var errorState: ErrorState?
  @State private var step: SignInStep = .email
  @State private var showSuccess = false
  @FocusState private var isEmailFocused: Bool
  @FocusState private var isCodeFocused: Bool

  private var publishableKey: String {
    (Bundle.main.object(forInfoDictionaryKey: "CLERK_PUBLISHABLE_KEY") as? String) ?? ""
  }
  
  // Brand colors matching the design system
  private let brandSlash = Color(red: 0.76, green: 0.35, blue: 0.25)
  private let brandInk = Color(red: 0.15, green: 0.14, blue: 0.13)
  private let successGreen = Color(red: 0.2, green: 0.6, blue: 0.35)
  private let errorRed = Color(red: 0.85, green: 0.25, blue: 0.2)
  
  enum SignInStep {
    case email
    case code
  }
  
  struct ErrorState: Equatable {
    let title: String
    let message: String
    let isRetryable: Bool
    
    static func network() -> ErrorState {
      ErrorState(
        title: "Connection Issue",
        message: "Please check your internet connection and try again.",
        isRetryable: true
      )
    }
    
    static func invalidEmail() -> ErrorState {
      ErrorState(
        title: "Invalid Email",
        message: "Please enter a valid email address.",
        isRetryable: false
      )
    }
    
    static func invalidCode() -> ErrorState {
      ErrorState(
        title: "Invalid Code",
        message: "The code you entered is incorrect. Please check your email and try again.",
        isRetryable: true
      )
    }
    
    static func codeExpired() -> ErrorState {
      ErrorState(
        title: "Code Expired",
        message: "Your verification code has expired. Tap below to request a new one.",
        isRetryable: true
      )
    }
    
    static func generic(_ message: String) -> ErrorState {
      ErrorState(
        title: "Something Went Wrong",
        message: message,
        isRetryable: true
      )
    }
  }

  var body: some View {
    NavigationStack {
      if publishableKey.isEmpty {
        configurationView
      } else if !clerk.isLoaded {
        VStack(spacing: 16) {
          ProgressView()
            .accessibilityIdentifier("loading-indicator")
          Text("Loading...")
            .foregroundStyle(.secondary)
        }
        .navigationTitle("Sign in")
      } else {
        mainLoginView
      }
    }
  }
  
  // MARK: - Configuration View (missing key)
  
  private var configurationView: some View {
    Form {
      Section("Clerk") {
        Text("Set CLERK_PUBLISHABLE_KEY in the iOS build settings to enable native sign-in.")
          .font(.footnote)
          .foregroundStyle(.secondary)
      }

      Section("API") {
        TextField("Convex HTTP base", text: $state.apiBase)
          .textInputAutocapitalization(.never)
          .autocorrectionDisabled()
      }
    }
    .navigationTitle("Welcome")
  }
  
  // MARK: - Main Login View
  
  private var mainLoginView: some View {
    ScrollView {
      VStack(spacing: 32) {
        Spacer(minLength: 40)
        
        // Logo and branding
        brandingSection
        
        // Main content based on step
        if step == .email {
          emailEntrySection
        } else {
          codeEntrySection
        }
        
        // Error display
        if let errorState {
          errorSection(errorState)
        }
        
        Spacer(minLength: 40)
      }
      .padding(.horizontal, 24)
    }
    .scrollDismissesKeyboard(.interactively)
    .navigationTitle("Sign in")
    .navigationBarTitleDisplayMode(.large)
  }
  
  // MARK: - Branding Section
  
  private var brandingSection: some View {
    VStack(spacing: 16) {
      // Animated logo
      ZStack {
        Circle()
          .fill(brandSlash.opacity(0.12))
          .frame(width: 100, height: 100)
        
        Circle()
          .fill(brandSlash.opacity(0.08))
          .frame(width: 120, height: 120)
        
        Image(systemName: "chart.line.uptrend.xyaxis")
          .font(.system(size: 44, weight: .medium))
          .foregroundStyle(brandSlash)
          .symbolEffect(.pulse, options: .repeating.speed(0.5), isActive: isLoading)
      }
      
      Text("Tally")
        .font(.system(size: 36, weight: .bold, design: .rounded))
        .foregroundStyle(brandInk)
      
      Text(step == .email ? "Track your progress, celebrate your wins" : "Almost there!")
        .font(.subheadline)
        .foregroundStyle(.secondary)
        .multilineTextAlignment(.center)
    }
  }
  
  // MARK: - Email Entry Section
  
  private var emailEntrySection: some View {
    VStack(spacing: 20) {
      VStack(alignment: .leading, spacing: 8) {
        Text("Email")
          .font(.subheadline.weight(.medium))
          .foregroundStyle(brandInk)
        
        TextField("you@example.com", text: $email)
          .font(.body)
          .padding(.horizontal, 16)
          .padding(.vertical, 14)
          .background(
            RoundedRectangle(cornerRadius: 12)
              .fill(Color(.systemBackground))
          )
          .overlay(
            RoundedRectangle(cornerRadius: 12)
              .stroke(isEmailFocused ? brandSlash : Color(.systemGray4), lineWidth: isEmailFocused ? 2 : 1)
          )
          .textInputAutocapitalization(.never)
          .autocorrectionDisabled()
          .keyboardType(.emailAddress)
          .textContentType(.emailAddress)
          .disabled(isLoading)
          .focused($isEmailFocused)
          .onSubmit { Task { await startSignIn() } }
      }
      
      // Continue button
      Button {
        Task { await startSignIn() }
      } label: {
        HStack(spacing: 10) {
          if isLoading {
            ProgressView()
              .tint(.white)
              .scaleEffect(0.9)
          } else {
            Text("Continue")
              .fontWeight(.semibold)
            Image(systemName: "arrow.right")
              .font(.body.weight(.semibold))
          }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
          RoundedRectangle(cornerRadius: 14)
            .fill(isValidEmail && !isLoading ? brandSlash : Color(.systemGray3))
        )
        .foregroundColor(.white)
      }
      .disabled(!isValidEmail || isLoading)
      .animation(.easeInOut(duration: 0.2), value: isValidEmail)
      .animation(.easeInOut(duration: 0.2), value: isLoading)
    }
    .onAppear {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
        isEmailFocused = true
      }
    }
  }
  
  // MARK: - Code Entry Section
  
  private var codeEntrySection: some View {
    VStack(spacing: 24) {
      // Email confirmation
      VStack(spacing: 8) {
        HStack(spacing: 8) {
          Image(systemName: "envelope.fill")
            .foregroundStyle(successGreen)
          Text("Code sent to")
            .foregroundStyle(.secondary)
        }
        .font(.subheadline)
        
        Text(email)
          .font(.body.weight(.medium))
          .foregroundStyle(brandInk)
      }
      .padding(.vertical, 16)
      .padding(.horizontal, 20)
      .background(
        RoundedRectangle(cornerRadius: 12)
          .fill(successGreen.opacity(0.1))
      )
      
      // Code input
      VStack(alignment: .leading, spacing: 8) {
        Text("Verification Code")
          .font(.subheadline.weight(.medium))
          .foregroundStyle(brandInk)
        
        TextField("Enter 6-digit code", text: $code)
          .font(.system(size: 24, weight: .semibold, design: .monospaced))
          .padding(.horizontal, 16)
          .padding(.vertical, 14)
          .background(
            RoundedRectangle(cornerRadius: 12)
              .fill(Color(.systemBackground))
          )
          .overlay(
            RoundedRectangle(cornerRadius: 12)
              .stroke(isCodeFocused ? brandSlash : Color(.systemGray4), lineWidth: isCodeFocused ? 2 : 1)
          )
          .keyboardType(.numberPad)
          .textContentType(.oneTimeCode)
          .multilineTextAlignment(.center)
          .disabled(isLoading)
          .focused($isCodeFocused)
          .onChange(of: code) { _, newValue in
            // Auto-submit when 6 digits entered
            if newValue.count == 6 {
              Task { await verifyCode() }
            }
          }
      }
      
      // Verify button
      Button {
        Task { await verifyCode() }
      } label: {
        HStack(spacing: 10) {
          if isLoading {
            ProgressView()
              .tint(.white)
              .scaleEffect(0.9)
          } else {
            Text("Verify")
              .fontWeight(.semibold)
            Image(systemName: "checkmark")
              .font(.body.weight(.semibold))
          }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
          RoundedRectangle(cornerRadius: 14)
            .fill(code.count >= 6 && !isLoading ? brandSlash : Color(.systemGray3))
        )
        .foregroundColor(.white)
      }
      .disabled(code.count < 6 || isLoading)
      
      // Secondary actions
      VStack(spacing: 12) {
        Button {
          Task { await resendCode() }
        } label: {
          Text("Didn't receive a code? Resend")
            .font(.subheadline)
            .foregroundStyle(brandSlash)
        }
        .disabled(isLoading)
        
        Button {
          withAnimation(.easeInOut(duration: 0.3)) {
            step = .email
            code = ""
            signIn = nil
            signUp = nil
            errorState = nil
          }
        } label: {
          HStack(spacing: 4) {
            Image(systemName: "arrow.left")
              .font(.caption)
            Text("Use a different email")
          }
          .font(.subheadline)
          .foregroundStyle(.secondary)
        }
        .disabled(isLoading)
      }
      .padding(.top, 8)
    }
    .onAppear {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
        isCodeFocused = true
      }
    }
  }
  
  // MARK: - Error Section
  
  private func errorSection(_ error: ErrorState) -> some View {
    VStack(spacing: 12) {
      HStack(spacing: 10) {
        Image(systemName: "exclamationmark.triangle.fill")
          .foregroundStyle(errorRed)
          .font(.title3)
        
        Text(error.title)
          .font(.subheadline.weight(.semibold))
          .foregroundStyle(brandInk)
      }
      
      Text(error.message)
        .font(.subheadline)
        .foregroundStyle(.secondary)
        .multilineTextAlignment(.center)
        .fixedSize(horizontal: false, vertical: true)
      
      if error.isRetryable {
        Button {
          withAnimation(.easeInOut(duration: 0.2)) {
            errorState = nil
          }
        } label: {
          Text("Dismiss")
            .font(.subheadline.weight(.medium))
            .foregroundStyle(brandSlash)
        }
        .padding(.top, 4)
      }
    }
    .padding(.vertical, 16)
    .padding(.horizontal, 20)
    .frame(maxWidth: .infinity)
    .background(
      RoundedRectangle(cornerRadius: 12)
        .fill(errorRed.opacity(0.08))
    )
    .overlay(
      RoundedRectangle(cornerRadius: 12)
        .stroke(errorRed.opacity(0.3), lineWidth: 1)
    )
    .transition(.asymmetric(
      insertion: .scale(scale: 0.95).combined(with: .opacity),
      removal: .opacity
    ))
  }
  
  // MARK: - Validation
  
  private var isValidEmail: Bool {
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return email.firstMatch(of: emailRegex) != nil
  }
  
  // MARK: - Actions
  
  private func startSignIn() async {
    guard isValidEmail else {
      withAnimation(.easeInOut(duration: 0.3)) {
        errorState = .invalidEmail()
      }
      return
    }
    
    logger.info("Starting sign-in for email: \(email, privacy: .private)")
    isLoading = true
    errorState = nil
    
    do {
      logger.debug("Calling SignIn.create with emailCode strategy")
      signIn = try await SignIn.create(strategy: .identifier(email, strategy: .emailCode()))
      
      if let si = signIn {
        logger.info("SignIn created - status: \(String(describing: si.status))")
      }
      
      withAnimation(.easeInOut(duration: 0.3)) {
        step = .code
      }
      logger.info("Moved to code entry step - email should be sent")
    } catch let clerkError as ClerkAPIError {
      logger.warning("SignIn failed, attempting SignUp: \(clerkError.localizedDescription)")
      await startSignUp()
    } catch {
      logger.error("SignIn.create failed: \(error.localizedDescription)")
      withAnimation(.easeInOut(duration: 0.3)) {
        errorState = parseError(error)
      }
    }
    
    isLoading = false
  }
  
  private func startSignUp() async {
    logger.info("Starting sign-up for email: \(email, privacy: .private)")
    
    do {
      let newSignUp = try await SignUp.create(strategy: .standard(emailAddress: email))
      logger.info("SignUp created - status: \(String(describing: newSignUp.status))")
      
      _ = try await newSignUp.prepareVerification(strategy: .emailCode)
      logger.info("Verification prepared - email should be sent")
      
      self.signUp = newSignUp
      withAnimation(.easeInOut(duration: 0.3)) {
        step = .code
      }
    } catch {
      logger.error("SignUp failed: \(error.localizedDescription)")
      withAnimation(.easeInOut(duration: 0.3)) {
        errorState = parseError(error)
      }
    }
  }
  
  private func verifyCode() async {
    logger.info("Verifying code")
    isLoading = true
    errorState = nil
    
    do {
      if let signIn {
        logger.debug("Calling attemptFirstFactor with code")
        let result = try await signIn.attemptFirstFactor(strategy: .emailCode(code: code))
        logger.info("attemptFirstFactor result - status: \(String(describing: result.status))")
        
        if result.status == .complete, let sessionId = result.createdSessionId {
          logger.info("Sign-in complete, activating session")
          try await clerk.setActive(sessionId: sessionId)
        } else {
          logger.warning("Sign-in not complete - status: \(String(describing: result.status))")
          withAnimation(.easeInOut(duration: 0.3)) {
            errorState = .generic("Verification incomplete. Please try again.")
          }
        }
      } else if let signUp {
        logger.debug("Calling attemptVerification for sign-up")
        let result = try await signUp.attemptVerification(strategy: .emailCode(code: code))
        logger.info("Sign-up verification result - status: \(String(describing: result.status))")
        
        if result.status == .complete, let sessionId = result.createdSessionId {
          logger.info("Sign-up complete, activating session")
          try await clerk.setActive(sessionId: sessionId)
        } else {
          logger.warning("Sign-up not complete - status: \(String(describing: result.status))")
          withAnimation(.easeInOut(duration: 0.3)) {
            errorState = .generic("Verification incomplete. Please try again.")
          }
        }
      } else {
        logger.error("verifyCode called but no signIn or signUp")
        withAnimation(.easeInOut(duration: 0.3)) {
          errorState = .generic("Something went wrong. Please start over.")
        }
      }
    } catch {
      logger.error("Verification failed: \(error.localizedDescription)")
      code = "" // Clear invalid code
      withAnimation(.easeInOut(duration: 0.3)) {
        errorState = parseCodeError(error)
      }
    }
    
    isLoading = false
  }
  
  private func resendCode() async {
    logger.info("Resending verification code")
    isLoading = true
    errorState = nil
    
    do {
      if let signIn {
        _ = try await signIn.prepareFirstFactor(strategy: .emailCode())
      } else if let signUp {
        _ = try await signUp.prepareVerification(strategy: .emailCode)
      }
      
      // Brief success feedback
      withAnimation(.easeInOut(duration: 0.3)) {
        // Could show a toast here
      }
    } catch {
      logger.error("Resend failed: \(error.localizedDescription)")
      withAnimation(.easeInOut(duration: 0.3)) {
        errorState = parseError(error)
      }
    }
    
    isLoading = false
  }
  
  // MARK: - Error Parsing
  
  private func parseError(_ error: Error) -> ErrorState {
    let message = error.localizedDescription.lowercased()
    
    if message.contains("network") || message.contains("connection") || message.contains("offline") {
      return .network()
    } else if message.contains("invalid") && message.contains("email") {
      return .invalidEmail()
    } else {
      return .generic(friendlyErrorMessage(error))
    }
  }
  
  private func parseCodeError(_ error: Error) -> ErrorState {
    let message = error.localizedDescription.lowercased()
    
    if message.contains("incorrect") || message.contains("invalid") || message.contains("wrong") {
      return .invalidCode()
    } else if message.contains("expired") {
      return .codeExpired()
    } else {
      return .generic(friendlyErrorMessage(error))
    }
  }
  
  private func friendlyErrorMessage(_ error: Error) -> String {
    let message = error.localizedDescription
    
    // Clean up common technical messages
    if message.contains("NSURLErrorDomain") || message.contains("couldn't be completed") {
      return "We couldn't connect to our servers. Please check your connection and try again."
    }
    
    // Truncate very long messages
    if message.count > 100 {
      return String(message.prefix(100)) + "..."
    }
    
    return message
  }
}
