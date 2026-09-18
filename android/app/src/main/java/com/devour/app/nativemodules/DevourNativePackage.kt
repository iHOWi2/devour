package com.devour.app.nativemodules

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Registers Devour's native modules.
 *
 * BaseReactPackage is the current API: ReactPackage.createNativeModules is deprecated in React
 * Native 0.87, and this form instantiates modules lazily. Migrating to codegen TurboModule
 * specs is scheduled for Phase 4, when the native surface grows to processes and PTY.
 *
 * A module missing from either half of this file is a module JavaScript cannot see. The
 * TypeScript side treats that as "unavailable" and says so on screen (src/native/bridge.ts).
 */
class DevourNativePackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
      when (name) {
        DevourEnvironmentModule.NAME -> DevourEnvironmentModule(reactContext)
        DevourStorageModule.NAME -> DevourStorageModule(reactContext)
        DevourSecretsModule.NAME -> DevourSecretsModule(reactContext)
        DevourClipboardModule.NAME -> DevourClipboardModule(reactContext)
        else -> null
      }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
        info(DevourEnvironmentModule.NAME, DevourEnvironmentModule::class.java),
        info(DevourStorageModule.NAME, DevourStorageModule::class.java),
        info(DevourSecretsModule.NAME, DevourSecretsModule::class.java),
        info(DevourClipboardModule.NAME, DevourClipboardModule::class.java),
    )
  }

  private fun info(
      name: String,
      type: Class<out NativeModule>,
  ): Pair<String, ReactModuleInfo> =
      name to
          ReactModuleInfo(
              name = name,
              className = type.name,
              canOverrideExistingModule = false,
              needsEagerInit = false,
              isCxxModule = false,
              isTurboModule = false,
          )
}
