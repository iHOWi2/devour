package com.devour.app

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /** Must match the component registered in index.js, which reads app.json. */
  override fun getMainComponentName(): String = "Devour"

  /**
   * [fabricEnabled] is read from gradle.properties (newArchEnabled), so the renderer choice stays
   * a build setting rather than something hard-coded in the activity.
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
