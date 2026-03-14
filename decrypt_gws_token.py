import os
import json
import base64
from cryptography.fernet import Fernet

def decrypt_token():
    try:
        home = os.path.expanduser("~")
        gws_dir = os.path.join(home, ".config", "gws")
        
        key_path = os.path.join(gws_dir, ".encryption_key")
        enc_path = os.path.join(gws_dir, "credentials.enc")
        
        if not os.path.exists(key_path) or not os.path.exists(enc_path):
            print("Required encryption files not found")
            return
            
        with open(key_path, "rb") as f:
            key = f.read().strip()
            
        with open(enc_path, "rb") as f:
            encrypted_data = f.read()
            
        cipher_suite = Fernet(key)
        decrypted_data = cipher_suite.decrypt(encrypted_data)
        data = json.loads(decrypted_data)
        
        print("-" * 50)
        print(f"CLIENT_ID: {data.get('client_id')}")
        print(f"CLIENT_SECRET: {data.get('client_secret')}")
        print(f"REFRESH_TOKEN: {data.get('refresh_token')}")
        print("-" * 50)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    decrypt_token()
