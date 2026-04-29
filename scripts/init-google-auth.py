#!/usr/bin/env python3
"""
init-google-auth.py
每次容器啟動時執行，將 GEMINI_API_KEY 環境變數同步到所有 agent 的 auth-profiles.json。
只更新 google:default profile，保留其他 provider 的 credentials（如 minimax-portal）。
同時確保 thinkingDefault 設為 "off"，避免 gemini-2.5-flash 自動開啟推理模式產生額外費用。
"""
import json
import os
import sys

key = os.environ.get("GEMINI_API_KEY", "").strip()

if not key:
    print("[init-google-auth] WARNING: GEMINI_API_KEY not set, skipping Google auth init.")
    sys.exit(0)

base = "/root/.openclaw"
agent_dirs = [
    os.path.join(base, "agents", "kung-pang-you", "agent"),
    os.path.join(base, "agents", "kung-mei-ling", "agent"),
]

def update_auth_file(path: str, key: str) -> None:
    """更新指定 auth-profiles.json 中的 google:default key，保留其他所有設定。"""
    # 確保目錄存在
    os.makedirs(os.path.dirname(path), exist_ok=True)

    # 讀取現有內容（如果存在）
    data: dict = {}
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError):
            data = {}

    # 只更新 google:default，保留其他 profile
    profiles = data.setdefault("profiles", {})
    existing = profiles.get("google:default", {})
    existing.update({
        "type": "api_key",
        "provider": "google",
        "key": key,
    })
    profiles["google:default"] = existing

    # 更新 lastGood
    data.setdefault("lastGood", {})["google"] = "google:default"

    with open(path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"[init-google-auth] Updated: {path}")

# 更新主目錄
main_path = os.path.join(base, "auth-profiles.json")
update_auth_file(main_path, key)

# 更新每個 agent 目錄
for agent_dir in agent_dirs:
    agent_path = os.path.join(agent_dir, "auth-profiles.json")
    update_auth_file(agent_path, key)

print(f"[init-google-auth] Done. Key prefix: {key[:10]}...")

# ── 關閉 Thinking 模式 ──────────────────────────────────────────────────────
# gemini-2.5-flash 支援推理，OpenClaw 會自動套用 "low" thinking。
# 日常 LINE 對話不需要推理，強制設為 "off" 以節省 token 費用。
openclaw_json_path = os.path.join(base, "openclaw.json")
if os.path.exists(openclaw_json_path):
    try:
        with open(openclaw_json_path, "r") as f:
            cfg = json.load(f)
        cfg.setdefault("agents", {}).setdefault("defaults", {})["thinkingDefault"] = "off"
        with open(openclaw_json_path, "w") as f:
            json.dump(cfg, f, indent=2)
        print("[init-google-auth] thinkingDefault set to 'off'")
    except Exception as e:
        print(f"[init-google-auth] WARNING: failed to set thinkingDefault: {e}")
