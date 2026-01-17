package com.tally.app

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.tally.core.auth.SecureTokenStore
import com.tally.core.auth.AuthEnvironment
import com.tally.core.network.ApiClient
import com.tally.core.network.ApiConfig
import com.tally.core.network.ApiRepository

class SyncWorker(
  appContext: Context,
  params: WorkerParameters
) : CoroutineWorker(appContext, params) {
  override suspend fun doWork(): Result {
    val token = SecureTokenStore().loadToken()
    if (token.isNullOrBlank()) return Result.retry()
    val repository = ApiRepository(
      context = applicationContext,
      apiClient = ApiClient(ApiConfig(AuthEnvironment.convexDeployment())),
      tokenProvider = { token }
    )
    return repository.syncQueue()
      .fold(
        onSuccess = { Result.success() },
        onFailure = { Result.retry() }
      )
  }
}
