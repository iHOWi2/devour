package com.devour.app.nativemodules

import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.StatFs
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule

/**
 * Reports facts about the device and about the local runtime host.
 *
 * This is the first slice of the native layer described in docs/ARCHITECTURE.md. It reads real
 * Android APIs only - nothing here is a placeholder. Runtime host detection is the `probe`
 * half of the RuntimeHost contract; command execution arrives in Phase 4.
 */
@ReactModule(name = "DevourEnvironment")
class DevourEnvironmentModule(private val reactAppContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactAppContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun getEnvironment(promise: Promise) {
    try {
      promise.resolve(readEnvironment())
    } catch (error: Exception) {
      promise.reject(ERROR_UNAVAILABLE, error.message, error)
    }
  }

  private fun readEnvironment(): WritableMap {
    val filesDir = reactAppContext.filesDir
    val stats = StatFs(filesDir.absolutePath)

    return Arguments.createMap().apply {
      putInt("sdkInt", Build.VERSION.SDK_INT)
      putString("release", Build.VERSION.RELEASE)
      putString("manufacturer", Build.MANUFACTURER)
      putString("model", Build.MODEL)
      putString("abi", Build.SUPPORTED_ABIS.firstOrNull() ?: "unknown")
      putInt("cpuCount", Runtime.getRuntime().availableProcessors())
      putString("filesDir", filesDir.absolutePath)
      putDouble("freeBytes", stats.availableBytes.toDouble())
      putDouble("totalBytes", stats.totalBytes.toDouble())
      putMap("runtimeHost", readRuntimeHost())
    }
  }

  private fun readRuntimeHost(): WritableMap {
    val packageInfo = findPackage(TERMUX_PACKAGE)

    return Arguments.createMap().apply {
      putString("id", RUNTIME_HOST_ID)
      putString("packageName", TERMUX_PACKAGE)
      putBoolean("installed", packageInfo != null)
      putString("versionName", packageInfo?.versionName)
    }
  }

  private fun findPackage(packageName: String): PackageInfo? =
      try {
        reactAppContext.packageManager.getPackageInfo(packageName, 0)
      } catch (error: PackageManager.NameNotFoundException) {
        null
      }

  companion object {
    const val NAME: String = "DevourEnvironment"

    private const val RUNTIME_HOST_ID: String = "termux"
    private const val TERMUX_PACKAGE: String = "com.termux"
    private const val ERROR_UNAVAILABLE: String = "devour_environment_unavailable"
  }
}
