import { MidaPlaygroundPlugin } from "#MidaPlayground";

export default new MidaPlaygroundPlugin({
    id: "mida-playground",
    name: "Mida Playground",
    description: "A Mida plugin to practice and backtest operations in global financial markets.",
    version: require("!/package.json").version,
});
