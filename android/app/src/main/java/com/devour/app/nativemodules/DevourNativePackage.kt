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
 */
class DevourNativePackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
      when (name) {
        DevourEnvironmentModule.NAME -> DevourEnvironmentModule(reactContext)
        else -> null
      }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider {
    mapOf(
        DevourEnvironmentModule.NAME to
            ReactModuleInfo(
                name = DevourEnvironmentModule.NAME,
                className = DevourEnvironmentModule::class.java.name,
                canOverrideExistingModule = false,
                needsEagerInit = false,
                isCxxModule = false,
                isTurboModule = false,
            ),
    )
  }
}
