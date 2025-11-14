/**
 * @module Platform
 * 
 * This module defines the mode constants of the application.
 */
const Platform = Object.freeze({
  /** Constants **/
  modes: {
    PANEL: "PANEL",
    APP: "APP",
    WEB: "WEB"
  },

  /** Helper Methods **/
  getAllModes() {
    return Object.keys(this.modes);
  },

  getAppModes() {
    return Object.keys(this.modes).filter((mode) => mode !== "PANEL");
  },

  getPanelModes() {
    return Object.keys(this.modes).filter((mode) => mode == "PANEL");
  }

});

export default Platform;