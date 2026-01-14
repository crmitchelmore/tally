package app.tally.auth

import android.util.Log
import android.util.Patterns
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.clerk.api.Clerk
import com.clerk.api.network.serialization.errorMessage
import com.clerk.api.network.serialization.onFailure
import com.clerk.api.network.serialization.onSuccess
import com.clerk.api.signin.SignIn
import com.clerk.api.signin.attemptFirstFactor
import com.clerk.api.signup.SignUp
import com.clerk.api.signup.attemptVerification
import com.clerk.api.signup.prepareVerification
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

private const val TAG = "AuthViewModel"

/**
 * Unified authentication ViewModel handling sign-in and sign-up flows
 * with email code verification (passwordless).
 */
class AuthViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun updateEmail(email: String) {
        _uiState.update { it.copy(email = email, error = null) }
    }

    fun updateCode(code: String) {
        _uiState.update { it.copy(code = code, error = null) }
        // Auto-submit when 6 digits entered
        if (code.length == 6) {
            verifyCode()
        }
    }

    fun isValidEmail(): Boolean {
        return Patterns.EMAIL_ADDRESS.matcher(_uiState.value.email).matches()
    }

    fun startAuth() {
        val email = _uiState.value.email

        if (!isValidEmail()) {
            _uiState.update {
                it.copy(
                    error = AuthError(
                        title = "Invalid Email",
                        message = "Please enter a valid email address.",
                        isRetryable = false
                    )
                )
            }
            return
        }

        Log.i(TAG, "Starting auth for email: $email")
        _uiState.update { it.copy(isLoading = true, error = null) }

        viewModelScope.launch {
            // Try sign-in first
            SignIn.create(
                SignIn.CreateParams.Strategy.EmailCode(identifier = email)
            ).onSuccess { signIn ->
                Log.i(TAG, "SignIn created - status: ${signIn.status}")
                _uiState.update {
                    it.copy(
                        step = AuthStep.CODE,
                        isLoading = false
                    )
                }
            }.onFailure { error ->
                Log.w(TAG, "SignIn failed, trying SignUp: ${error.errorMessage}")
                // Try sign-up if sign-in fails (account doesn't exist)
                startSignUp(email)
            }
        }
    }

    private suspend fun startSignUp(email: String) {
        Log.i(TAG, "Starting sign-up for email: $email")

        SignUp.create(
            SignUp.CreateParams.Standard(emailAddress = email)
        ).onSuccess { signUp ->
            Log.i(TAG, "SignUp created - status: ${signUp.status}")
            // Prepare email verification
            signUp.prepareVerification(
                SignUp.PrepareVerificationParams.Strategy.EmailCode()
            ).onSuccess {
                Log.i(TAG, "Verification prepared - email should be sent")
                _uiState.update {
                    it.copy(
                        step = AuthStep.CODE,
                        isSignUp = true,
                        isLoading = false
                    )
                }
            }.onFailure { error ->
                Log.e(TAG, "prepareVerification failed: ${error.errorMessage}")
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = parseError(error.errorMessage)
                    )
                }
            }
        }.onFailure { error ->
            Log.e(TAG, "SignUp failed: ${error.errorMessage}")
            _uiState.update {
                it.copy(
                    isLoading = false,
                    error = parseError(error.errorMessage)
                )
            }
        }
    }

    fun verifyCode() {
        val code = _uiState.value.code
        val isSignUp = _uiState.value.isSignUp

        Log.i(TAG, "Verifying code")
        _uiState.update { it.copy(isLoading = true, error = null) }

        viewModelScope.launch {
            if (isSignUp) {
                verifySignUpCode(code)
            } else {
                verifySignInCode(code)
            }
        }
    }

    private suspend fun verifySignInCode(code: String) {
        val signIn = Clerk.signIn ?: run {
            _uiState.update {
                it.copy(
                    isLoading = false,
                    error = AuthError(
                        title = "Session Expired",
                        message = "Please start over.",
                        isRetryable = false
                    )
                )
            }
            return
        }

        signIn.attemptFirstFactor(
            SignIn.AttemptFirstFactorParams.EmailCode(code)
        ).onSuccess { result ->
            Log.i(TAG, "Sign-in verification result - status: ${result.status}")
            if (result.status == SignIn.Status.COMPLETE) {
                _uiState.update { it.copy(step = AuthStep.SUCCESS, isLoading = false) }
            } else {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = AuthError(
                            title = "Verification Incomplete",
                            message = "Please try again.",
                            isRetryable = true
                        )
                    )
                }
            }
        }.onFailure { error ->
            Log.e(TAG, "Sign-in verification failed: ${error.errorMessage}")
            _uiState.update {
                it.copy(
                    code = "", // Clear invalid code
                    isLoading = false,
                    error = parseCodeError(error.errorMessage)
                )
            }
        }
    }

    private suspend fun verifySignUpCode(code: String) {
        val signUp = Clerk.signUp ?: run {
            _uiState.update {
                it.copy(
                    isLoading = false,
                    error = AuthError(
                        title = "Session Expired",
                        message = "Please start over.",
                        isRetryable = false
                    )
                )
            }
            return
        }

        signUp.attemptVerification(
            SignUp.AttemptVerificationParams.EmailCode(code)
        ).onSuccess { result ->
            Log.i(TAG, "Sign-up verification result - status: ${result.status}")
            if (result.status == SignUp.Status.COMPLETE) {
                _uiState.update { it.copy(step = AuthStep.SUCCESS, isLoading = false) }
            } else {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = AuthError(
                            title = "Verification Incomplete",
                            message = "Please try again.",
                            isRetryable = true
                        )
                    )
                }
            }
        }.onFailure { error ->
            Log.e(TAG, "Sign-up verification failed: ${error.errorMessage}")
            _uiState.update {
                it.copy(
                    code = "", // Clear invalid code
                    isLoading = false,
                    error = parseCodeError(error.errorMessage)
                )
            }
        }
    }

    fun resendCode() {
        Log.i(TAG, "Resending verification code")
        _uiState.update { it.copy(isLoading = true, error = null) }

        viewModelScope.launch {
            val isSignUp = _uiState.value.isSignUp
            val email = _uiState.value.email

            if (isSignUp) {
                Clerk.signUp?.prepareVerification(
                    SignUp.PrepareVerificationParams.Strategy.EmailCode()
                )?.onSuccess {
                    _uiState.update { it.copy(isLoading = false) }
                }?.onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = parseError(error.errorMessage)
                        )
                    }
                }
            } else {
                // For sign-in, re-create the flow to resend code
                SignIn.create(
                    SignIn.CreateParams.Strategy.EmailCode(identifier = email)
                ).onSuccess {
                    Log.i(TAG, "Code resent successfully")
                    _uiState.update { it.copy(isLoading = false) }
                }.onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = parseError(error.errorMessage)
                        )
                    }
                }
            }
        }
    }

    fun goBack() {
        _uiState.update {
            AuthUiState(email = it.email) // Keep email, reset everything else
        }
    }

    fun dismissError() {
        _uiState.update { it.copy(error = null) }
    }

    private fun parseError(message: String): AuthError {
        val lowerMessage = message.lowercase()
        return when {
            lowerMessage.contains("network") || lowerMessage.contains("connection") ||
                lowerMessage.contains("offline") -> AuthError(
                title = "Connection Issue",
                message = "Please check your internet connection and try again.",
                isRetryable = true
            )
            lowerMessage.contains("invalid") && lowerMessage.contains("email") -> AuthError(
                title = "Invalid Email",
                message = "Please enter a valid email address.",
                isRetryable = false
            )
            else -> AuthError(
                title = "Something Went Wrong",
                message = friendlyErrorMessage(message),
                isRetryable = true
            )
        }
    }

    private fun parseCodeError(message: String): AuthError {
        val lowerMessage = message.lowercase()
        return when {
            lowerMessage.contains("incorrect") || lowerMessage.contains("invalid") ||
                lowerMessage.contains("wrong") -> AuthError(
                title = "Invalid Code",
                message = "The code you entered is incorrect. Please check your email and try again.",
                isRetryable = true
            )
            lowerMessage.contains("expired") -> AuthError(
                title = "Code Expired",
                message = "Your verification code has expired. Tap below to request a new one.",
                isRetryable = true
            )
            else -> AuthError(
                title = "Verification Failed",
                message = friendlyErrorMessage(message),
                isRetryable = true
            )
        }
    }

    private fun friendlyErrorMessage(message: String): String {
        return when {
            message.contains("couldn't be completed") ||
                message.contains("NSURLErrorDomain") -> 
                "We couldn't connect to our servers. Please check your connection and try again."
            message.length > 100 -> message.take(100) + "..."
            else -> message
        }
    }
}

enum class AuthStep {
    EMAIL,
    CODE,
    SUCCESS
}

data class AuthError(
    val title: String,
    val message: String,
    val isRetryable: Boolean
)

data class AuthUiState(
    val step: AuthStep = AuthStep.EMAIL,
    val email: String = "",
    val code: String = "",
    val isLoading: Boolean = false,
    val isSignUp: Boolean = false,
    val error: AuthError? = null
)
