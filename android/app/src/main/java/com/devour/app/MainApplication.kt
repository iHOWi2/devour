package com.devour.app

import android.app.Application
import com.devour.app.nativemodules.DevourNativePackage
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost by lazy {
    getDefaultReactHost(
        context = applicationContext,
        packageList =
            PackageList(this).packages.apply {
              // Devour's own native layer. Autolinking only covers node_modules packages.
              add(DevourNativePackage())
            },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
