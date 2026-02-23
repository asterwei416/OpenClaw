import json
import os
import requests
from datetime import datetime, timedelta

def get_calendar_events():
    client_id = '762797721491-kcumk3mhbbjdg2hejfskclrlspg3rigf.apps.googleusercontent.com'
    client_secret = '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'
    token_file = '/mnt/c/Users/trist/Desktop/Google_Antigravity/Side Project/OpenClaw/refresh_token.txt'
    
    with open(token_file, 'r') as f:
        refresh_token = f.read().strip()
        
    # 1. 獲取 Access Token
    res = requests.post('https://oauth2.googleapis.com/token', data={
        'client_id': client_id,
        'client_secret': client_secret,
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token'
    })
    access_token = res.json().get('access_token')
    
    # 2. 獲取行事曆行程 (未來 7 天)
    time_min = datetime.utcnow().isoformat() + 'Z'
    time_max = (datetime.utcnow() + timedelta(days=7)).isoformat() + 'Z'
    
    events_url = f'https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin={time_min}&timeMax={time_max}&singleEvents=true&orderBy=startTime'
    headers = {'Authorization': f'Bearer {access_token}'}
    
    res = requests.get(events_url, headers=headers)
    items = res.json().get('items', [])
    
    if not items:
        print('最近 7 天沒有行程。')
        return

    print('--- 【主公行程表 (未來 7 天)】 ---')
    for event in items:
        start = event['start'].get('dateTime', event['start'].get('date'))
        summary = event.get('summary', '無標題')
        print(f'[{start}] {summary}')

if __name__ == '__main__':
    get_calendar_events()
