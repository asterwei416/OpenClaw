import { o as createSubsystemLogger } from "./entry.js";
import "./auth-profiles-DIga80Wr.js";
import { c as resolveDefaultAgentId, s as resolveAgentWorkspaceDir } from "./agent-scope-jm0ZdXwM.js";
import "./utils-PmTbZoD1.js";
import "./exec-BIMFe4XS.js";
import "./github-copilot-token-rP-6QdKv.js";
import "./pi-model-discovery-CsRo-xMp.js";
import { r as loadConfig } from "./config-weiOHa8M.js";
import "./manifest-registry-tuAcHxrV.js";
import "./server-context-CM_E6wD5.js";
import "./errors-DdT2Dtkb.js";
import "./control-service-C0Y_s70h.js";
import "./client-Cb1nog5C.js";
import "./call-D7AL3vYw.js";
import "./message-channel-CAFcg7mw.js";
import "./links-jGisPfXW.js";
import "./plugins-TrKFfrLt.js";
import "./logging-fywhKCmE.js";
import "./accounts-B5QZU96b.js";
import { t as loadOpenClawPlugins } from "./loader-DX0InoAJ.js";
import "./progress-Dn3kWpaL.js";
import "./prompt-style-D5D7b3cX.js";
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

//#region src/plugins/cli.ts
const log = createSubsystemLogger("plugins");
function registerPluginCliCommands(program, cfg) {
	const config = cfg ?? loadConfig();
	const workspaceDir = resolveAgentWorkspaceDir(config, resolveDefaultAgentId(config));
	const logger = {
		info: (msg) => log.info(msg),
		warn: (msg) => log.warn(msg),
		error: (msg) => log.error(msg),
		debug: (msg) => log.debug(msg)
	};
	const registry = loadOpenClawPlugins({
		config,
		workspaceDir,
		logger
	});
	const existingCommands = new Set(program.commands.map((cmd) => cmd.name()));
	for (const entry of registry.cliRegistrars) {
		if (entry.commands.length > 0) {
			const overlaps = entry.commands.filter((command) => existingCommands.has(command));
			if (overlaps.length > 0) {
				log.debug(`plugin CLI register skipped (${entry.pluginId}): command already registered (${overlaps.join(", ")})`);
				continue;
			}
		}
		try {
			const result = entry.register({
				program,
				config,
				workspaceDir,
				logger
			});
			if (result && typeof result.then === "function") result.catch((err) => {
				log.warn(`plugin CLI register failed (${entry.pluginId}): ${String(err)}`);
			});
			for (const command of entry.commands) existingCommands.add(command);
		} catch (err) {
			log.warn(`plugin CLI register failed (${entry.pluginId}): ${String(err)}`);
		}
	}
}

//#endregion
export { registerPluginCliCommands };