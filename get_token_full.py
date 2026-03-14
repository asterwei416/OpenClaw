import json
import subprocess

def get_token():
    try:
        # 執行匯出指令
        result = subprocess.run(
            ['gws', 'auth', 'export', '--plain', '--no-prompt', '--json', '--plain-only'],
            capture_output=True,
            text=True,
            check=True,
            shell=True
        )

        
        # 找到 JSON 的起始位置
        output = result.stdout
        json_start = output.find('{')
        if json_start == -1:
            print("Could not find JSON in output")
            return
            
        json_str = output[json_start:]
        data = json.loads(json_str)
        
        print("-" * 50)
        print(f"CLIENT_ID: {data.get('client_id')}")
        print(f"CLIENT_SECRET: {data.get('client_secret')}")
        print(f"REFRESH_TOKEN: {data.get('refresh_token')}")
        print("-" * 50)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_token()
