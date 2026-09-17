package com.devour.app.nativemodules

import android.content.Context
import android.content.SharedPreferences
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import java.security.GeneralSecurityException
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Values that must not sit in a readable file - the model API key is the first one.
 *
 * The bytes are encrypted with AES/GCM under a key generated inside the Android keystore. That
 * key never leaves the keystore and is not extractable, so the stored blob is useless when
 * copied off the device. Only the ciphertext and its nonce are kept, in the app's private
 * preferences.
 *
 * GCM is authenticated encryption: a tampered blob fails to decrypt instead of returning
 * altered bytes. A fresh nonce per write is mandatory for GCM, so the cipher generates it and
 * it is stored alongside the ciphertext.
 *
 * Unlike the document store this module does its work on the calling thread. `@ReactMethod`
 * calls already arrive off the main thread, a secret is read once per launch and written only
 * when the user saves one, and `commit()` rather than `apply()` means a caller that was told
 * the key was stored can rely on it being on disk.
 */
@ReactModule(name = "DevourSecrets")
class DevourSecretsModule(private val reactAppContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactAppContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun readSecret(key: String, promise: Promise) {
    try {
      val stored = preferences().getString(entry(key), null)

      if (stored == null) {
        promise.resolve(null)
        return
      }

      promise.resolve(decrypt(stored, key))
    } catch (error: IllegalArgumentException) {
      promise.reject(ERROR_KEY, error.message, error)
    } catch (error: Exception) {
      promise.reject(ERROR_FAILED, error.message, error)
    }
  }

  @ReactMethod
  fun writeSecret(key: String, value: String, promise: Promise) {
    try {
      val name = entry(key)
      val cipher = Cipher.getInstance(TRANSFORMATION)
      cipher.init(Cipher.ENCRYPT_MODE, secretKey())

      val ciphertext = cipher.doFinal(value.toByteArray(Charsets.UTF_8))
      val blob = "${encode(cipher.iv)}$SEPARATOR${encode(ciphertext)}"

      if (!preferences().edit().putString(name, blob).commit()) {
        throw GeneralSecurityException("The secret could not be written")
      }

      promise.resolve(true)
    } catch (error: IllegalArgumentException) {
      promise.reject(ERROR_KEY, error.message, error)
    } catch (error: Exception) {
      promise.reject(ERROR_FAILED, error.message, error)
    }
  }

  @ReactMethod
  fun deleteSecret(key: String, promise: Promise) {
    try {
      preferences().edit().remove(entry(key)).commit()
      promise.resolve(true)
    } catch (error: IllegalArgumentException) {
      promise.reject(ERROR_KEY, error.message, error)
    } catch (error: Exception) {
      promise.reject(ERROR_FAILED, error.message, error)
    }
  }

  /**
   * A blob that will not decrypt is a secret that no longer exists: the keystore key is gone or
   * was replaced (a restored backup, a reset lock screen), and no retry can bring the plaintext
   * back. The unusable entry is dropped and the caller is told there is nothing stored, which
   * is the truth it can act on - ask for the key again.
   */
  private fun decrypt(blob: String, key: String): String? {
    val parts = blob.split(SEPARATOR)

    try {
      if (parts.size != 2) {
        throw GeneralSecurityException("The stored secret is not iv:ciphertext")
      }

      val cipher = Cipher.getInstance(TRANSFORMATION)
      cipher.init(
          Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(TAG_BITS, decode(parts[0])))

      return String(cipher.doFinal(decode(parts[1])), Charsets.UTF_8)
    } catch (error: Exception) {
      Log.w(NAME, "Dropping a secret that cannot be decrypted", error)
      preferences().edit().remove(entry(key)).commit()

      return null
    }
  }

  private fun secretKey(): SecretKey {
    val keystore = KeyStore.getInstance(KEYSTORE).apply { load(null) }
    val existing =
        try {
          keystore.getKey(ALIAS, null)
        } catch (error: GeneralSecurityException) {
          // The entry is there but unusable. Leaving it would mean no secret could ever be
          // stored again, so it is replaced; whatever it encrypted is gone either way.
          Log.w(NAME, "Replacing an unusable keystore entry", error)
          keystore.deleteEntry(ALIAS)
          null
        }

    if (existing is SecretKey) {
      return existing
    }

    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE)
    generator.init(
        KeyGenParameterSpec.Builder(
                ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(KEY_BITS)
            .build())

    return generator.generateKey()
  }

  private fun preferences(): SharedPreferences =
      reactAppContext.getSharedPreferences(STORE, Context.MODE_PRIVATE)

  private fun entry(key: String): String {
    if (!KEY_PATTERN.matches(key)) {
      throw IllegalArgumentException(
          "\"$key\" is not a secret name: letters, digits, dot, dash or underscore")
    }

    return key
  }

  private fun encode(bytes: ByteArray): String = Base64.encodeToString(bytes, Base64.NO_WRAP)

  private fun decode(value: String): ByteArray = Base64.decode(value, Base64.NO_WRAP)

  companion object {
    const val NAME: String = "DevourSecrets"

    private const val KEYSTORE: String = "AndroidKeyStore"
    private const val ALIAS: String = "devour.secrets.v1"
    private const val STORE: String = "devour.secrets"
    private const val TRANSFORMATION: String = "AES/GCM/NoPadding"
    private const val SEPARATOR: String = ":"
    private const val KEY_BITS: Int = 256
    private const val TAG_BITS: Int = 128
    private const val ERROR_KEY: String = "devour_secrets_invalid_key"
    private const val ERROR_FAILED: String = "devour_secrets_failed"
    private val KEY_PATTERN: Regex = Regex("^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")
  }
}
