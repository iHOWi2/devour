package com.devour.app.nativemodules

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule

/**
 * Puts text on the system clipboard.
 *
 * A model answer that cannot leave the app is an answer the user has to retype, so copying
 * is part of a chat working at all. React Native removed `Clipboard` from core and the
 * community package would be a dependency for one Android call, which Kotlin already owns.
 *
 * `ClipboardManager` is a window-system service and has to be touched on the main thread;
 * Android 13 and later show their own copy confirmation, so this module shows nothing.
 */
@ReactModule(name = "DevourClipboard")
class DevourClipboardModule(private val reactAppContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactAppContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun setString(text: String, promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        val manager =
            reactAppContext.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                ?: throw IllegalStateException("This device exposes no clipboard service")

        manager.setPrimaryClip(ClipData.newPlainText(LABEL, text))
        promise.resolve(true)
      } catch (error: Exception) {
        promise.reject(ERROR_FAILED, error.message, error)
      }
    }
  }

  companion object {
    const val NAME: String = "DevourClipboard"

    private const val LABEL: String = "devour"
    private const val ERROR_FAILED: String = "devour_clipboard_failed"
  }
}
