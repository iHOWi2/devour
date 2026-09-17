package com.devour.app.nativemodules

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import java.io.File
import java.io.IOException
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.RejectedExecutionException

/**
 * Small JSON documents in the application's private files directory.
 *
 * Kotlin owns the filesystem (docs/ARCHITECTURE.md), so the conversation and the provider
 * settings are written here rather than through a JavaScript storage dependency. This is what
 * lets a conversation survive process death, which Phase 2 requires.
 *
 * Two decisions worth knowing about:
 * - Writes go to a temporary file and are then renamed. A rename inside one directory is a
 *   single filesystem operation, so a process killed mid-write leaves the previous document
 *   intact instead of a half-written one that no parser can read.
 * - All file work happens on one background thread. `@ReactMethod` calls arrive on a thread
 *   shared with every other native module, and serialising the work also means two writes to
 *   the same document cannot interleave.
 */
@ReactModule(name = "DevourStorage")
class DevourStorageModule(private val reactAppContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactAppContext) {

  private val io: ExecutorService = Executors.newSingleThreadExecutor()

  override fun getName(): String = NAME

  override fun invalidate() {
    io.shutdown()
    super.invalidate()
  }

  @ReactMethod
  fun readDocument(name: String, promise: Promise) {
    submit(promise) {
      val file = resolve(name)

      if (file.exists()) file.readText() else null
    }
  }

  @ReactMethod
  fun writeDocument(name: String, contents: String, promise: Promise) {
    submit(promise) {
      val file = resolve(name)
      val directory = file.parentFile

      if (directory != null && !directory.exists() && !directory.mkdirs()) {
        throw IOException("Could not create ${directory.absolutePath}")
      }

      val temporary = File("${file.absolutePath}.tmp")
      temporary.writeText(contents)

      if (!temporary.renameTo(file)) {
        temporary.delete()
        throw IOException("Could not replace ${file.absolutePath}")
      }

      true
    }
  }

  @ReactMethod
  fun deleteDocument(name: String, promise: Promise) {
    submit(promise) {
      val file = resolve(name)

      // A document that is not there is the state the caller asked for.
      if (file.exists() && !file.delete()) {
        throw IOException("Could not delete ${file.absolutePath}")
      }

      true
    }
  }

  /**
   * Documents live in one directory and are named, not addressed: a name that is not a plain
   * lowercase file name is refused, so nothing outside that directory can be reached.
   */
  private fun resolve(name: String): File {
    if (!NAME_PATTERN.matches(name)) {
      throw IllegalArgumentException(
          "\"$name\" is not a document name: lowercase letters, digits, dot, dash, underscore")
    }

    return File(File(reactAppContext.filesDir, DIRECTORY), name)
  }

  private fun submit(promise: Promise, work: () -> Any?) {
    try {
      io.execute {
        try {
          promise.resolve(work())
        } catch (error: IllegalArgumentException) {
          promise.reject(ERROR_NAME, error.message, error)
        } catch (error: Exception) {
          promise.reject(ERROR_IO, error.message, error)
        }
      }
    } catch (error: RejectedExecutionException) {
      // The module was invalidated while a call was in flight: say so rather than crash.
      promise.reject(ERROR_IO, "The document store is closed", error)
    }
  }

  companion object {
    const val NAME: String = "DevourStorage"

    private const val DIRECTORY: String = "documents"
    private const val ERROR_NAME: String = "devour_storage_invalid_name"
    private const val ERROR_IO: String = "devour_storage_io_failed"
    private val NAME_PATTERN: Regex = Regex("^[a-z0-9][a-z0-9._-]{0,63}$")
  }
}
