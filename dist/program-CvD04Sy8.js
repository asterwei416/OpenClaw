import { C as setVerbose, O as isRich, k as theme, n as isTruthyEnvValue, p as defaultRuntime } from "./entry.js";
import "./auth-profiles-DIga80Wr.js";
import { n as replaceCliName, r as resolveCliName } from "./command-format-3xiXujG0.js";
import "./agent-scope-jm0ZdXwM.js";
import "./utils-PmTbZoD1.js";
import "./exec-BIMFe4XS.js";
import "./github-copilot-token-rP-6QdKv.js";
import "./pi-model-discovery-CsRo-xMp.js";
import { M as VERSION } from "./config-weiOHa8M.js";
import "./manifest-registry-tuAcHxrV.js";
import "./server-context-CM_E6wD5.js";
import "./errors-DdT2Dtkb.js";
import "./control-service-C0Y_s70h.js";
import "./tailscale-BUcKO8Rr.js";
import "./auth-viF_w60n.js";
import "./client-Cb1nog5C.js";
import "./call-D7AL3vYw.js";
import "./message-channel-CAFcg7mw.js";
import { t as formatDocsLink } from "./links-jGisPfXW.js";
import "./plugin-auto-enable-CpdCQwk9.js";
import "./plugins-TrKFfrLt.js";
import "./logging-fywhKCmE.js";
import "./accounts-B5QZU96b.js";
import "./loader-DX0InoAJ.js";
import "./progress-Dn3kWpaL.js";
import "./prompt-style-D5D7b3cX.js";
import "./note-CBiVaqG7.js";
import "./clack-prompter-BJuVh97L.js";
import "./onboard-channels-CwbpG2fS.js";
import "./archive-mFgwsll-.js";
import "./installs-C5cjVarj.js";
import "./manager-DvVzVDHD.js";
import "./paths-RvF0P6tQ.js";
import "./sqlite-B_L84oiu.js";
import "./routes-DcfnvWKo.js";
import "./pi-embedded-helpers-DwUhvGuM.js";
import "./deliver-DOYEKcdp.js";
import "./sandbox-CRdrs_Gg.js";
import "./channel-summary-By1mArPa.js";
import "./wsl-B8VT67wB.js";
import "./skills-DtwGIkTI.js";
import "./image-BHM5xgV-.js";
import "./redact-CDPAzwi8.js";
import "./tool-display-BMYWrp0L.js";
import "./restart-sentinel-DywisDen.js";
import "./channel-selection-BAwiO0li.js";
import "./commands-u69JbwPV.js";
import "./pairing-store-DMex6WWe.js";
import "./login-qr-DYVa_G7s.js";
import "./pairing-labels-C6I3dD-m.js";
import "./channels-status-issues-DRXQXvhY.js";
import { n as ensurePluginRegistryLoaded } from "./command-options-YDqjSpfz.js";
import { n as resolveCliChannelOptions } from "./channel-options-B5_o0Wb_.js";
import { c as getVerboseFlag, i as getCommandPath, u as hasHelpOrVersion } from "./register.subclis-DuQAUmQk.js";
import "./gateway-rpc-DMvN-OOc.js";
import "./deps-Ed23SGbm.js";
import "./daemon-runtime-SKaYGaNK.js";
import "./service-BoDHq_LN.js";
import "./systemd-DAgZTW06.js";
import "./service-audit-__5IBcxf.js";
import "./table-f0EgX-YI.js";
import "./widearea-dns-D4yoSNNw.js";
import "./audit-CujrC1p4.js";
import "./onboard-skills-94OExfmh.js";
import "./health-format-BIiaWjlE.js";
import "./update-runner-8XFxQglY.js";
import "./github-copilot-auth-jP1YSFW_.js";
import "./logging-BnUUuH3y.js";
import "./hooks-status-I3Y60zVN.js";
import "./status--PMzPUA7.js";
import "./skills-status-CWkBweWW.js";
import "./tui-BFO6Fq--.js";
import "./agent-Dnaf2rhw.js";
import "./node-service-BW_LhY5w.js";
import "./status.update-C6Ud1gNT.js";
import { t as forceFreePort } from "./ports-B27T1uRn.js";
import "./auth-health-BbgrAZxT.js";
import { i as hasEmittedCliBanner, n as emitCliBanner, o as registerProgramCommands, r as formatCliBannerLine, t as ensureConfigReady } from "./config-guard-CME9KK27.js";
import "./help-format-af1XWYxC.js";
import "./configure-D-eR13X8.js";
import "./systemd-linger-CTe0ZDxD.js";
import "./doctor-CIgC78Ch.js";
import { Command } from "commander";

//#region src/cli/program/context.ts
function createProgramContext() {
	const channelOptions = resolveCliChannelOptions();
	return {
		programVersion: VERSION,
		channelOptions,
		messageChannelOptions: channelOptions.join("|"),
		agentChannelOptions: ["last", ...channelOptions].join("|")
	};
}

//#endregion
//#region src/cli/program/help.ts
const CLI_NAME = resolveCliName();
const EXAMPLES = [
	["openclaw channels login --verbose", "Link personal WhatsApp Web and show QR + connection logs."],
	["openclaw message send --target +15555550123 --message \"Hi\" --json", "Send via your web session and print JSON result."],
	["openclaw gateway --port 18789", "Run the WebSocket Gateway locally."],
	["openclaw --dev gateway", "Run a dev Gateway (isolated state/config) on ws://127.0.0.1:19001."],
	["openclaw gateway --force", "Kill anything bound to the default gateway port, then start it."],
	["openclaw gateway ...", "Gateway control via WebSocket."],
	["openclaw agent --to +15555550123 --message \"Run summary\" --deliver", "Talk directly to the agent using the Gateway; optionally send the WhatsApp reply."],
	["openclaw message send --channel telegram --target @mychat --message \"Hi\"", "Send via your Telegram bot."]
];
function configureProgramHelp(program, ctx) {
	program.name(CLI_NAME).description("").version(ctx.programVersion).option("--dev", "Dev profile: isolate state under ~/.openclaw-dev, default gateway port 19001, and shift derived ports (browser/canvas)").option("--profile <name>", "Use a named profile (isolates OPENCLAW_STATE_DIR/OPENCLAW_CONFIG_PATH under ~/.openclaw-<name>)");
	program.option("--no-color", "Disable ANSI colors", false);
	program.configureHelp({
		optionTerm: (option) => theme.option(option.flags),
		subcommandTerm: (cmd) => theme.command(cmd.name())
	});
	program.configureOutput({
		writeOut: (str) => {
			const colored = str.replace(/^Usage:/gm, theme.heading("Usage:")).replace(/^Options:/gm, theme.heading("Options:")).replace(/^Commands:/gm, theme.heading("Commands:"));
			process.stdout.write(colored);
		},
		writeErr: (str) => process.stderr.write(str),
		outputError: (str, write) => write(theme.error(str))
	});
	if (process.argv.includes("-V") || process.argv.includes("--version") || process.argv.includes("-v")) {
		console.log(ctx.programVersion);
		process.exit(0);
	}
	program.addHelpText("beforeAll", () => {
		if (hasEmittedCliBanner()) return "";
		const rich = isRich();
		return `\n${formatCliBannerLine(ctx.programVersion, { richTty: rich })}\n`;
	});
	const fmtExamples = EXAMPLES.map(([cmd, desc]) => `  ${theme.command(replaceCliName(cmd, CLI_NAME))}\n    ${theme.muted(desc)}`).join("\n");
	program.addHelpText("afterAll", ({ command }) => {
		if (command !== program) return "";
		const docs = formatDocsLink("/cli", "docs.openclaw.ai/cli");
		return `\n${theme.heading("Examples:")}\n${fmtExamples}\n\n${theme.muted("Docs:")} ${docs}\n`;
	});
}

//#endregion
//#region src/cli/program/preaction.ts
function setProcessTitleForCommand(actionCommand) {
	let current = actionCommand;
	while (current.parent && current.parent.parent) current = current.parent;
	const name = current.name();
	const cliName = resolveCliName();
	if (!name || name === cliName) return;
	process.title = `${cliName}-${name}`;
}
const PLUGIN_REQUIRED_COMMANDS = new Set([
	"message",
	"channels",
	"directory"
]);
function registerPreActionHooks(program, programVersion) {
	program.hook("preAction", async (_thisCommand, actionCommand) => {
		setProcessTitleForCommand(actionCommand);
		const argv = process.argv;
		if (hasHelpOrVersion(argv)) return;
		const commandPath = getCommandPath(argv, 2);
		if (!(isTruthyEnvValue(process.env.OPENCLAW_HIDE_BANNER) || commandPath[0] === "update" || commandPath[0] === "completion" || commandPath[0] === "plugins" && commandPath[1] === "update")) emitCliBanner(programVersion);
		const verbose = getVerboseFlag(argv, { includeDebug: true });
		setVerbose(verbose);
		if (!verbose) process.env.NODE_NO_WARNINGS ??= "1";
		if (commandPath[0] === "doctor" || commandPath[0] === "completion") return;
		await ensureConfigReady({
			runtime: defaultRuntime,
			commandPath
		});
		if (PLUGIN_REQUIRED_COMMANDS.has(commandPath[0])) ensurePluginRegistryLoaded();
	});
}

//#endregion
//#region src/cli/program/build-program.ts
function buildProgram() {
	const program = new Command();
	const ctx = createProgramContext();
	const argv = process.argv;
	configureProgramHelp(program, ctx);
	registerPreActionHooks(program, ctx.programVersion);
	registerProgramCommands(program, ctx, argv);
	return program;
}

//#endregion
export { buildProgram };