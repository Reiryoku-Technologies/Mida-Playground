import { MidaPlugin } from "@reiryoku/mida";

// The constant name "plugin" is required, do not change it.
export const plugin: MidaPlugin = new MidaPlugin({
    name: "MidaPluginTemplate", // Your plugin name.
    description: "A Mida plugin template.", // Your plugin description.
    version: "1.0.0", // Your plugin version.

    install (): void {
        // Silence is golden.
    },
});
